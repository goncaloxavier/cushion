<script lang="ts">
  import {stegaClean} from '@sanity/client/stega'
  import {
    createOverlayController,
    type OverlayMsg,
    type SanityNode,
    type SanityStegaNode,
  } from '@sanity/visual-editing'
  import {decodeSanityNodeData, encodeSanityNodeData} from '@sanity/visual-editing-csm'
  import {afterNavigate, invalidateAll} from '$app/navigation'
  import {onMount} from 'svelte'

  type Rect = {x: number; y: number; width: number; height: number}
  type RegisteredElement = {
    rect: Rect
    sanity: SanityNode | SanityStegaNode
    element: HTMLElement | SVGElement
  }
  type EditableSession = {
    id: string
    element: HTMLElement
    node: SanityNode
    original: string
    value: string
    onInput: () => void
    onBlur: () => void
    onKeydown: (event: KeyboardEvent) => void
  }
  type Appearance = Record<string, string | number | undefined>
  type Viewport = 'desktop' | 'tablet' | 'mobile'
  type ElementKind = 'text' | 'link' | 'button' | 'image' | 'video' | 'number'
  type SelectionIdentity = {documentId: string; path: string}

  let overlayHost: HTMLDivElement
  let hoveredId = $state<string>()
  let hoveredRect = $state<Rect | null>(null)
  let hoveredLabel = $state('Editar conteúdo')
  let hoveredInline = $state(false)
  let activeId = $state<string>()
  let activeRect = $state<Rect | null>(null)
  let activeLabel = $state('Texto')
  let activeInline = $state(false)
  let activeKind = $state<ElementKind>('text')
  let activeSelection = $state<SelectionIdentity>()
  let formatEnabled = $state(false)
  let canWrite = $state(false)
  let appearance = $state<Appearance>({})
  let viewport = $state<Viewport>('desktop')
  let toolbarLeft = $state(8)
  let toolbarTop = $state(8)
  let toolbarElement = $state<HTMLDivElement>()
  let overlayReady = $state(false)
  let editing: EditableSession | undefined
  let selectedElement: HTMLElement | SVGElement | undefined
  const elements = new Map<string, RegisteredElement>()
  const directIds = new WeakMap<HTMLElement | SVGElement, string>()
  let directId = 0

  const post = (message: Record<string, unknown>) =>
    window.parent.postMessage(message, window.location.origin)

  const currentRoute = () => `${window.location.pathname}${window.location.search}`

  afterNavigate(() => {
    post({type: 'df4y:site-editor:route-change', route: currentRoute()})
  })

  const normalizeRect = (rect: {x: number; y: number; w: number; h: number}): Rect => ({
    x: rect.x,
    y: rect.y,
    width: rect.w,
    height: rect.h,
  })

  const resolveNode = (value: SanityNode | SanityStegaNode) => {
    // The data-sanity DOM attribute (set by beginEditing) holds the encoded
    // string form, not the decoded object — `'id' in value` throws on a
    // string primitive, so the type has to be checked before that lookup.
    if (typeof value === 'object' && value !== null && 'id' in value) return value
    const decoded = decodeSanityNodeData(value)
    return decoded && 'id' in decoded ? decoded : undefined
  }

  const normalizeDocumentId = (value: string) => value.replace(/^drafts\./, '')

  const languagePath = (path: string) => /\.(pt|en|es)$/.test(path)

  const matchesSelection = (node: SanityNode | undefined, selection = activeSelection) =>
    Boolean(
      node &&
        selection &&
        normalizeDocumentId(node.id) === normalizeDocumentId(selection.documentId) &&
        node.path === selection.path,
    )

  const kindFor = (element: HTMLElement | SVGElement): ElementKind => {
    const explicitKind = element
      .closest<HTMLElement>('[data-df4y-editor-kind]')
      ?.dataset.df4yEditorKind
    if (['text', 'link', 'button', 'image', 'video', 'number'].includes(explicitKind || '')) {
      return explicitKind as ElementKind
    }
    if (element instanceof HTMLImageElement || element.closest('picture')) return 'image'
    if (element instanceof HTMLVideoElement || element.closest('video')) return 'video'
    if (element.closest('button')) return 'button'
    if (element.closest('a')) return 'link'
    return 'text'
  }

  const actionLabelFor = (kind: ElementKind) => {
    if (kind === 'link') return 'Ligação'
    if (kind === 'button') return 'Botão'
    if (kind === 'image') return 'Imagem'
    if (kind === 'video') return 'Vídeo'
    if (kind === 'number') return 'Valor'
    return 'Texto'
  }

  const hoverLabelFor = (
    element: HTMLElement | SVGElement,
    kind: ElementKind,
    inline: boolean,
  ) => {
    const explicitLabel = element
      .closest<HTMLElement>('[data-df4y-editor-label]')
      ?.dataset.df4yEditorLabel?.trim()
    if (!canWrite) {
      if (kind === 'image') return explicitLabel || 'Ver imagem'
      if (kind === 'video') return explicitLabel || 'Ver vídeo'
      return explicitLabel ? `Ver campo: ${explicitLabel}` : 'Ver campo'
    }
    if (inline) {
      if (kind === 'link') return 'Editar ligação'
      if (kind === 'button') return 'Editar botão'
      return 'Editar texto'
    }
    if (kind === 'image') return explicitLabel || 'Editar imagem'
    if (kind === 'video') return explicitLabel || 'Editar vídeo'
    if (explicitLabel) return `Editar campo: ${explicitLabel}`
    return 'Editar campo'
  }

  const labelFor = (node: SanityNode | undefined) => {
    const path = node?.path?.split('.').at(-1)?.replace(/\[.*$/, '')
    if (!path || ['pt', 'en', 'es', 'text'].includes(path)) return 'Texto'
    return path
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/^./, (character) => character.toUpperCase())
  }

  const canEditInline = (
    element: HTMLElement | SVGElement,
    node: SanityNode | undefined,
  ): element is HTMLElement => {
    if (!canWrite || !(element instanceof HTMLElement) || !node?.path) return false
    if (/(^|\.)article\.(pt|en|es)$/.test(node.path)) return false
    if (element.hasAttribute('data-df4y-editor-field')) return false
    if (
      ['AUDIO', 'CANVAS', 'IFRAME', 'IMG', 'INPUT', 'PICTURE', 'SELECT', 'SVG', 'TEXTAREA', 'VIDEO']
        .includes(element.tagName)
    ) return false
    if (element.closest('script, style, [contenteditable="false"]')) return false

    const structuralChildren = [...element.children].filter((child) => child.tagName !== 'BR')
    if (structuralChildren.length) return false
    return Boolean(stegaClean(element.textContent || '').trim())
  }

  const cleanEditableText = (element: HTMLElement) =>
    element.innerText.replace(/\r\n/g, '\n').replace(/\u00a0/g, ' ')

  const rectFor = (element: HTMLElement | SVGElement): Rect => {
    const rect = element.getBoundingClientRect()
    return {x: rect.x, y: rect.y, width: rect.width, height: rect.height}
  }

  const isVisibleRect = (rect: Rect) =>
    rect.width > 0 &&
    rect.height > 0 &&
    rect.x + rect.width > 0 &&
    rect.y + rect.height > 0 &&
    rect.x < window.innerWidth &&
    rect.y < window.innerHeight

  const hasRenderableRect = (rect: Rect) => rect.width > 0 && rect.height > 0

  const isRenderableElement = (
    element: HTMLElement | SVGElement | undefined,
  ): element is HTMLElement | SVGElement => {
    if (!element?.isConnected || element.getClientRects().length === 0) return false
    if (getComputedStyle(element).visibility === 'hidden') return false
    return hasRenderableRect(rectFor(element))
  }

  const isVisibleElement = (element: HTMLElement | SVGElement | undefined) =>
    Boolean(isRenderableElement(element) && isVisibleRect(rectFor(element)))

  const releaseEditing = (commit: boolean) => {
    const session = editing
    if (!session) return
    editing = undefined
    session.element.removeEventListener('input', session.onInput)
    session.element.removeEventListener('blur', session.onBlur)
    session.element.removeEventListener('keydown', session.onKeydown)
    session.element.removeAttribute('contenteditable')
    session.element.removeAttribute('spellcheck')
    session.element.classList.remove('df4y-inline-editing')

    if (!commit) {
      session.element.textContent = session.original
      session.value = session.original
    }

    post({
      type: commit ? 'df4y:site-editor:inline-commit' : 'df4y:site-editor:inline-cancel',
      documentId: session.node.id,
      documentType: session.node.type,
      path: session.node.path,
      value: session.value,
    })
  }

  const beginEditing = (id: string, element: HTMLElement, node: SanityNode) => {
    if (!canWrite) return
    if (editing?.id === id) return
    releaseEditing(true)

    const original = String(stegaClean(element.innerText || element.textContent || ''))
    const encodedNode = encodeSanityNodeData(node)
    if (encodedNode) {
      element.setAttribute('data-sanity', encodedNode)
    }
    element.textContent = original
    element.contentEditable = 'plaintext-only'
    element.spellcheck = true
    element.classList.add('df4y-inline-editing')

    const session: EditableSession = {
      id,
      element,
      node,
      original,
      value: original,
      onInput: () => undefined,
      onBlur: () => undefined,
      onKeydown: () => undefined,
    }

    session.onInput = () => {
      session.value = cleanEditableText(element)
      updateActiveRect()
      post({
        type: 'df4y:site-editor:inline-change',
        documentId: node.id,
        documentType: node.type,
        path: node.path,
        value: session.value,
      })
    }
    session.onBlur = () => {
      window.setTimeout(() => {
        if (overlayHost.contains(document.activeElement)) return
        releaseEditing(true)
      })
    }
    session.onKeydown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        releaseEditing(false)
        return
      }
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        releaseEditing(true)
      }
    }

    editing = session
    element.addEventListener('input', session.onInput)
    element.addEventListener('blur', session.onBlur)
    element.addEventListener('keydown', session.onKeydown)
    element.focus({preventScroll: true})

    const selection = window.getSelection()
    const range = document.createRange()
    range.selectNodeContents(element)
    range.collapse(false)
    selection?.removeAllRanges()
    selection?.addRange(range)
    updateActiveRect()
    post({
      type: 'df4y:site-editor:inline-start',
      documentId: node.id,
      documentType: node.type,
      path: node.path,
    })
  }

  const cssFontFamily: Record<string, string> = {
    'space-grotesk': "'Space Grotesk', Arial, sans-serif",
    inter: 'Inter, Arial, sans-serif',
    arial: 'Arial, sans-serif',
    georgia: 'Georgia, serif',
    'times-new-roman': "'Times New Roman', serif",
  }
  const cssWeight: Record<string, string> = {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  }
  const cssLineHeight: Record<string, string> = {
    compact: '1.2',
    normal: '1.5',
    relaxed: '1.8',
  }
  const cssColor: Record<string, string> = {
    text: 'var(--ink, #10231f)',
    muted: 'var(--muted, #49605a)',
    white: '#ffffff',
    green: 'var(--green, #2f8b69)',
    blue: 'var(--blue, #17657a)',
    yellow: 'var(--yellow, #d7bd35)',
  }

  const reconnectSelectedElement = () => {
    if (!activeSelection) return undefined

    if (isRenderableElement(selectedElement)) return selectedElement

    const candidates = new Map<HTMLElement | SVGElement, {
      id: string
      current: RegisteredElement
      node: SanityNode
    }>()

    for (const [id, current] of elements) {
      const node = resolveNode(current.sanity)
      if (!matchesSelection(node) || !node) continue
      candidates.set(current.element, {id, current, node})
    }

    for (const candidate of document.querySelectorAll('[data-sanity]')) {
      if (!(candidate instanceof HTMLElement) && !(candidate instanceof SVGElement)) continue
      if (overlayHost?.contains(candidate)) continue
      const sanity = candidate.getAttribute('data-sanity') as SanityStegaNode | null
      const node = sanity ? resolveNode(sanity) : undefined
      if (!sanity || !matchesSelection(node)) continue

      let id = directIds.get(candidate)
      if (!id) {
        directId += 1
        id = `direct-${directId}`
        directIds.set(candidate, id)
      }
      const current = {rect: rectFor(candidate), sanity, element: candidate}
      elements.set(id, current)
      candidates.set(candidate, {id, current, node: node!})
    }

    const next = [...candidates.values()]
      .filter(({current}) => isRenderableElement(current.element))
      .sort((left, right) =>
        Number(isVisibleElement(right.current.element)) -
        Number(isVisibleElement(left.current.element)),
      )[0]

    if (next) {
      activeId = next.id
      selectedElement = next.current.element
      activeLabel = labelFor(next.node)
      activeKind = kindFor(next.current.element)
      activeInline = canEditInline(next.current.element, next.node)
      return next.current.element
    }

    activeId = undefined
    selectedElement = undefined
    return undefined
  }

  const activeElement = () => {
    if (editing?.element?.isConnected) return editing.element
    if (isRenderableElement(selectedElement)) return selectedElement
    const registered = activeId ? elements.get(activeId)?.element : undefined
    return isRenderableElement(registered) ? registered : reconnectSelectedElement()
  }

  const updateToolbarPosition = () => {
    if (!activeRect) return
    const width = toolbarElement?.offsetWidth || 260
    const height = toolbarElement?.offsetHeight || 42
    toolbarLeft = Math.min(Math.max(8, activeRect.x), Math.max(8, window.innerWidth - width - 8))
    const above = activeRect.y - height - 8
    toolbarTop = above >= 8
      ? above
      : Math.min(window.innerHeight - height - 8, activeRect.y + activeRect.height + 8)
  }

  const updateActiveRect = () => {
    const element = editing?.element ?? activeElement()
    if (!element?.isConnected) {
      activeRect = null
      return
    }
    const rect = rectFor(element)
    activeRect = isVisibleRect(rect) ? rect : null
  }

  const syncRects = () => {
    if (hoveredId) {
      const element = elements.get(hoveredId)?.element
      if (element?.isConnected) {
        const rect = rectFor(element)
        hoveredRect = isVisibleRect(rect) ? rect : null
      } else {
        hoveredRect = null
      }
    }
    updateActiveRect()
  }

  const activateElement = (
    id: string,
    current: RegisteredElement,
    node: SanityNode,
    preserveSelection = false,
  ) => {
    activeId = id
    selectedElement = current.element
    if (!preserveSelection) activeSelection = {documentId: node.id, path: node.path}
    activeLabel = labelFor(node)
    activeKind = kindFor(current.element)
    activeInline = canEditInline(current.element, node)
    updateActiveRect()
    applyAppearance()
  }

  const selectElement = (id: string, current: RegisteredElement, node: SanityNode) => {
    if (matchesSelection(node) && selectedElement === current.element) {
      if (!editing && activeInline && current.element instanceof HTMLElement) {
        beginEditing(id, current.element, node)
      }
      return
    }
    activateElement(id, current, node)
    formatEnabled = false
    post({
      type: 'df4y:site-editor:select',
      documentId: node.id,
      documentType: node.type,
      path: node.path,
      inlineEditable: activeInline,
    })
    if (activeInline) beginEditing(id, current.element, node)
  }

  const directElementFor = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return undefined
    const element = target.closest('[data-sanity]')
    if (
      !element ||
      overlayHost.contains(element) ||
      (!(element instanceof HTMLElement) && !(element instanceof SVGElement))
    ) return undefined
    return element
  }

  const ensureDirectElement = (element: HTMLElement | SVGElement) => {
    for (const [id, current] of elements) {
      if (current.element === element) return {id, current, node: resolveNode(current.sanity)}
    }

    const sanity = element.getAttribute('data-sanity') as SanityStegaNode | null
    const node = sanity ? resolveNode(sanity) : undefined
    if (!sanity || !node?.path) return undefined
    let id = directIds.get(element)
    if (!id) {
      directId += 1
      id = `direct-${directId}`
      directIds.set(element, id)
    }
    const current = {rect: rectFor(element), sanity, element}
    elements.set(id, current)
    ensureFocusable(element, node)
    return {id, current, node}
  }

  // Most editable elements are discovered by the overlay controller purely by
  // scanning rendered text for stega markers (no data-sanity DOM attribute is
  // ever written for them), so this has to hook the same element/register and
  // element/update messages the controller already sends, not a DOM query.
  const ensureFocusable = (element: HTMLElement | SVGElement, node: SanityNode | undefined) => {
    if (!(element instanceof HTMLElement) || !node) return
    if (element.tabIndex < 0 && !element.hasAttribute('tabindex')) {
      element.setAttribute('tabindex', '0')
      element.dataset.df4yFocusable = 'true'
    }
    if (element.dataset.df4yFocusable !== 'true') return
    // The overlay controller's own MutationObserver watches every attribute
    // (not just data-sanity), so an unconditional setAttribute here would
    // re-trigger element/update on every registration, which calls back into
    // this function forever. Only write when the value actually changes.
    if (element.getAttribute('role') !== 'button') element.setAttribute('role', 'button')
    const label = hoverLabelFor(element, kindFor(element), canEditInline(element, node))
    if (element.getAttribute('aria-label') !== label) element.setAttribute('aria-label', label)
  }

  const clearActiveSelection = (notifyParent: boolean, commit = true) => {
    releaseEditing(commit)
    activeId = undefined
    selectedElement = undefined
    activeSelection = undefined
    activeRect = null
    activeInline = false
    formatEnabled = false
    appearance = {}
    if (notifyParent) post({type: 'df4y:site-editor:clear-selection'})
  }

  const applyAppearanceToElement = (
    element: HTMLElement,
    value: Appearance,
    targetViewport: Viewport,
  ) => {
    const sizeField =
      targetViewport === 'mobile'
        ? 'fontSizeMobile'
        : targetViewport === 'tablet'
          ? 'fontSizeTablet'
          : 'fontSize'
    const size = Number(value[sizeField] || value.fontSize || 0)
    const sizeProperty = `--cms-text-size-${targetViewport}`
    if (size >= 10 && size <= 120) element.style.setProperty(sizeProperty, `${size}px`)
    else element.style.removeProperty(sizeProperty)
    element.style.fontFamily = cssFontFamily[String(value.fontFamily || '')] || ''
    element.style.fontSize = size >= 10 && size <= 120 ? `${size}px` : ''
    element.style.fontWeight = cssWeight[String(value.fontWeight || '')] || ''
    element.style.fontStyle = value.fontStyle === 'italic' ? 'italic' : ''
    element.style.textAlign = ['left', 'center', 'right'].includes(String(value.textAlign || ''))
      ? String(value.textAlign)
      : ''
    element.style.lineHeight = cssLineHeight[String(value.lineHeight || '')] || ''
    const color = typeof value.color === 'string' ? value.color : ''
    element.style.color = cssColor[color] || (/^#[0-9a-f]{6}$/i.test(color) ? color : '')
  }

  const applyAppearance = () => {
    const element = activeElement()
    if (!(element instanceof HTMLElement)) return
    applyAppearanceToElement(element, appearance, viewport)
    updateActiveRect()
  }

  const patchPreview = (documentId: string, path: string, value: unknown) => {
    const normalizedId = normalizeDocumentId(documentId)
    const localizedValue =
      value && typeof value === 'object' && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : undefined
    const candidates = new Set<HTMLElement | SVGElement>()
    for (const current of elements.values()) candidates.add(current.element)
    for (const element of document.querySelectorAll<HTMLElement | SVGElement>('[data-sanity]')) {
      if (!overlayHost.contains(element)) candidates.add(element)
    }

    for (const element of candidates) {
      if (!element.isConnected) continue
      const direct = ensureDirectElement(element)
      const node = direct?.node
      if (!node || normalizeDocumentId(node.id) !== normalizedId) continue
      const exact = node.path === path
      const localized = localizedValue && node.path.startsWith(`${path}.`) && languagePath(node.path)
      if (!exact && !localized) continue

      if (element instanceof HTMLElement && localizedValue) {
        const language = localized ? node.path.split('.').at(-1) : 'pt'
        const textValue = language ? localizedValue[language] : undefined
        if (typeof textValue === 'string' && editing?.element !== element) {
          element.textContent = textValue
        }
        applyAppearanceToElement(element, localizedValue as Appearance, viewport)
      } else if (element instanceof HTMLElement && typeof value === 'string' && editing?.element !== element) {
        element.textContent = value
      }
    }
    syncRects()
  }

  const changeAppearance = (field: string, value: string | number | undefined) => {
    if (!canWrite) return
    appearance = {...appearance, [field]: value || undefined}
    applyAppearance()
    const current = activeId ? elements.get(activeId) : undefined
    const node = current ? resolveNode(current.sanity) : undefined
    if (!node) return
    post({
      type: 'df4y:site-editor:format-change',
      documentId: node.id,
      documentType: node.type,
      path: node.path,
      field,
      value: value || null,
    })
  }

  const openSettings = () => {
    const current = activeId ? elements.get(activeId) : undefined
    const node = current ? resolveNode(current.sanity) : undefined
    if (!node) return
    releaseEditing(true)
    post({
      type: 'df4y:site-editor:open-settings',
      documentId: node.id,
      documentType: node.type,
      path: node.path,
    })
  }

  const handleMessage = (message: OverlayMsg) => {
    if (message.type === 'overlay/setCursor') {
      message.element.style.cursor = message.cursor ?? 'pointer'
      return
    }
    if (message.type === 'element/register') {
      const current = {
        rect: normalizeRect(message.rect),
        sanity: message.sanity,
        element: message.element,
      }
      elements.set(message.id, current)
      const node = resolveNode(message.sanity)
      ensureFocusable(current.element, node)
      if (
        matchesSelection(node) &&
        (selectedElement === current.element || !isRenderableElement(selectedElement))
      ) activateElement(message.id, current, node!, true)
      return
    }
    if (message.type === 'element/update') {
      const current = elements.get(message.id)
      if (current) {
        elements.set(message.id, {
          ...current,
          rect: normalizeRect(message.rect),
          sanity: message.sanity,
        })
        const next = elements.get(message.id)
        const node = resolveNode(message.sanity)
        if (next) ensureFocusable(next.element, node)
        if (
          next &&
          matchesSelection(node) &&
          (selectedElement === next.element || !isRenderableElement(selectedElement))
        ) activateElement(message.id, next, node!, true)
      }
      return
    }
    if (message.type === 'element/updateRect') {
      const current = elements.get(message.id)
      if (current) {
        const rect = normalizeRect(message.rect)
        elements.set(message.id, {...current, rect})
        if (hoveredId === message.id) hoveredRect = rectFor(current.element)
        if (activeId === message.id) updateActiveRect()
      }
      return
    }
    if (message.type === 'element/unregister') {
      if (editing?.id === message.id) releaseEditing(true)
      const removed = elements.get(message.id)
      elements.delete(message.id)
      if (hoveredId === message.id) {
        hoveredId = undefined
        hoveredRect = null
      }
      if (activeId === message.id || selectedElement === removed?.element) {
        activeId = undefined
        selectedElement = undefined
        reconnectSelectedElement()
        updateActiveRect()
      }
      return
    }
    if (message.type === 'element/mouseenter') {
      const current = elements.get(message.id)
      if (!current) return
      const node = resolveNode(current.sanity)
      if (
        matchesSelection(node) &&
        selectedElement !== current.element &&
        !isVisibleElement(selectedElement)
      ) activateElement(message.id, current, node!, true)
      hoveredId = message.id
      hoveredRect = rectFor(current.element)
      const kind = kindFor(current.element)
      hoveredInline = canEditInline(current.element, node)
      hoveredLabel = hoverLabelFor(current.element, kind, hoveredInline)
      return
    }
    if (message.type === 'element/mouseleave' || message.type === 'overlay/blur') {
      hoveredId = undefined
      hoveredRect = null
      return
    }
    if (message.type === 'element/click') {
      const current = elements.get(message.id)
      const node = resolveNode(message.sanity)
      if (!current || !node) return
      selectElement(message.id, current, node)
    }
  }

  onMount(() => {
    const controller = createOverlayController({
      handler: handleMessage,
      overlayElement: overlayHost,
      inFrame: window.self !== window.top,
      inPopUp: false,
      optimisticActorReady: false,
    })
    let refreshPromise: Promise<void> | undefined
    let queuedRefresh = false
    const refreshPreview = () => {
      if (refreshPromise) {
        queuedRefresh = true
        return
      }
      const scrollX = window.scrollX
      const scrollY = window.scrollY
      refreshPromise = invalidateAll()
        .then(
          () =>
            new Promise<void>((resolve) =>
              window.requestAnimationFrame(() => {
                window.scrollTo(scrollX, scrollY)
                syncRects()
                post({
                  type: 'df4y:site-editor:preview-refreshed',
                  route: currentRoute(),
                })
                resolve()
              }),
            ),
        )
        .catch(() => {
          post({type: 'df4y:site-editor:preview-refresh-error'})
        })
        .finally(() => {
          refreshPromise = undefined
          if (queuedRefresh) {
            queuedRefresh = false
            refreshPreview()
          }
        })
    }
    const handleParentMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== window.parent) return
      if (event.data?.type === 'df4y:site-editor:permissions') {
        canWrite = event.data.canWrite === true
        if (!canWrite) {
          releaseEditing(false)
          activeInline = false
          hoveredInline = false
        }
        return
      }
      if (event.data?.type === 'df4y:site-editor:clear-selection') {
        clearActiveSelection(false)
        return
      }
      if (event.data?.type === 'df4y:site-editor:preview-patch') {
        patchPreview(
          String(event.data.documentId || ''),
          String(event.data.path || ''),
          event.data.value,
        )
        return
      }
      if (event.data?.type === 'df4y:site-editor:refresh-preview') {
        refreshPreview()
        return
      }
      if (event.data?.type !== 'df4y:site-editor:field-state') return
      if (
        !activeSelection ||
        normalizeDocumentId(String(event.data.documentId || '')) !==
          normalizeDocumentId(activeSelection.documentId) ||
        String(event.data.path || '') !== activeSelection.path
      ) return
      appearance = event.data.appearance ?? {}
      formatEnabled = event.data.formatEnabled === true
      viewport = ['desktop', 'tablet', 'mobile'].includes(event.data.viewport)
        ? event.data.viewport
        : 'desktop'
      const element = activeElement()
      if (
        !editing &&
        activeInline &&
        element instanceof HTMLElement &&
        typeof event.data.textValue === 'string'
      ) {
        element.textContent = event.data.textValue
      }
      applyAppearance()
    }
    let rectFrame = 0
    const scheduleRectSync = () => {
      if (rectFrame) return
      rectFrame = window.requestAnimationFrame(() => {
        rectFrame = 0
        syncRects()
      })
    }
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || editing || !activeSelection) return
      event.preventDefault()
      clearActiveSelection(true)
    }
    const handleDirectClick = (event: MouseEvent) => {
      const element = directElementFor(event.target)
      if (!element || editing?.element === element) return
      const direct = ensureDirectElement(element)
      if (!direct?.node) return
      event.preventDefault()
      event.stopPropagation()
      selectElement(direct.id, direct.current, direct.node)
    }
    const handleDirectPointerOver = (event: PointerEvent) => {
      const element = directElementFor(event.target)
      if (!element || (event.relatedTarget instanceof Node && element.contains(event.relatedTarget))) return
      const direct = ensureDirectElement(element)
      if (!direct?.node) return
      if (matchesSelection(direct.node)) {
        if (selectedElement !== element && !isVisibleElement(selectedElement)) {
          activateElement(direct.id, direct.current, direct.node, true)
        }
        return
      }
      hoveredId = direct.id
      hoveredRect = rectFor(element)
      const kind = kindFor(element)
      hoveredInline = canEditInline(element, direct.node)
      hoveredLabel = hoverLabelFor(element, kind, hoveredInline)
    }
    const handleDirectPointerOut = (event: PointerEvent) => {
      const element = directElementFor(event.target)
      if (!element || (event.relatedTarget instanceof Node && element.contains(event.relatedTarget))) return
      const id = directIds.get(element)
      if (!id || hoveredId !== id) return
      hoveredId = undefined
      hoveredRect = null
    }
    // Keyboard equivalent of the pointer-hover/click pair above, so the canvas is
    // operable without a mouse. Unlike directElementFor (used by click/pointer,
    // where the event target can be a descendant of the tagged element), the
    // focused element IS the exact element ensureFocusable put tabindex on, so
    // this looks it up directly — that also covers elements the overlay
    // controller registered itself, which never get a data-sanity DOM attribute
    // and so are invisible to directElementFor's [data-sanity] closest() walk.
    const focusableTarget = (target: EventTarget | null) =>
      target instanceof HTMLElement || target instanceof SVGElement ? target : undefined
    const handleDirectFocusIn = (event: FocusEvent) => {
      const element = focusableTarget(event.target)
      if (!element) return
      const direct = ensureDirectElement(element)
      if (!direct?.node) return
      if (matchesSelection(direct.node)) {
        if (selectedElement !== element && !isVisibleElement(selectedElement)) {
          activateElement(direct.id, direct.current, direct.node, true)
        }
        return
      }
      hoveredId = direct.id
      hoveredRect = rectFor(element)
      const kind = kindFor(element)
      hoveredInline = canEditInline(element, direct.node)
      hoveredLabel = hoverLabelFor(element, kind, hoveredInline)
    }
    const handleDirectFocusOut = (event: FocusEvent) => {
      const element = focusableTarget(event.target)
      if (!element) return
      const direct = ensureDirectElement(element)
      if (!direct || hoveredId !== direct.id) return
      hoveredId = undefined
      hoveredRect = null
    }
    const handleDirectKeydown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter' && event.key !== ' ') return
      const element = focusableTarget(event.target)
      if (!element || editing?.element === element) return
      const direct = ensureDirectElement(element)
      if (!direct?.node) return
      event.preventDefault()
      event.stopPropagation()
      selectElement(direct.id, direct.current, direct.node)
    }
    window.addEventListener('message', handleParentMessage)
    window.addEventListener('scroll', scheduleRectSync, true)
    window.addEventListener('resize', scheduleRectSync)
    window.addEventListener('keydown', handleEscape)
    document.addEventListener('click', handleDirectClick, true)
    document.addEventListener('pointerover', handleDirectPointerOver, true)
    document.addEventListener('pointerout', handleDirectPointerOut, true)
    document.addEventListener('focusin', handleDirectFocusIn, true)
    document.addEventListener('focusout', handleDirectFocusOut, true)
    document.addEventListener('keydown', handleDirectKeydown, true)
    const mutationObserver = new MutationObserver(scheduleRectSync)
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-sanity'],
    })
    overlayReady = true
    post({type: 'df4y:site-editor:ready', route: currentRoute()})
    return () => {
      releaseEditing(true)
      if (rectFrame) window.cancelAnimationFrame(rectFrame)
      mutationObserver.disconnect()
      window.removeEventListener('message', handleParentMessage)
      window.removeEventListener('scroll', scheduleRectSync, true)
      window.removeEventListener('resize', scheduleRectSync)
      window.removeEventListener('keydown', handleEscape)
      document.removeEventListener('click', handleDirectClick, true)
      document.removeEventListener('pointerover', handleDirectPointerOver, true)
      document.removeEventListener('pointerout', handleDirectPointerOut, true)
      document.removeEventListener('focusin', handleDirectFocusIn, true)
      document.removeEventListener('focusout', handleDirectFocusOut, true)
      document.removeEventListener('keydown', handleDirectKeydown, true)
      controller.destroy()
    }
  })

  $effect(() => {
    if (!activeRect) return
    formatEnabled
    appearance
    activeKind
    const frame = window.requestAnimationFrame(updateToolbarPosition)
    return () => window.cancelAnimationFrame(frame)
  })
</script>

<div class="site-editor-overlay" bind:this={overlayHost} data-ready={overlayReady}>
  {#if hoveredRect && hoveredId !== activeId}
    <div
      class="site-editor-outline is-hovered"
      class:is-inline={hoveredInline}
      style:left={`${hoveredRect.x}px`}
      style:top={`${hoveredRect.y}px`}
      style:width={`${hoveredRect.width}px`}
      style:height={`${hoveredRect.height}px`}
      aria-hidden="true"
    >
      <span>{hoveredLabel}</span>
    </div>
  {/if}

  {#if activeRect}
    <div
      class="site-editor-outline is-active"
      style:left={`${activeRect.x}px`}
      style:top={`${activeRect.y}px`}
      style:width={`${activeRect.width}px`}
      style:height={`${activeRect.height}px`}
      aria-hidden="true"
    ></div>

    <div
      class="site-editor-inline-toolbar"
      bind:this={toolbarElement}
      style:left={`${toolbarLeft}px`}
      style:top={`${toolbarTop}px`}
      aria-label={canWrite ? `Editar ${activeLabel}` : `Ver ${activeLabel}`}
    >
      <strong class="site-editor-inline-kind">{canWrite ? actionLabelFor(activeKind) : 'Leitura'}</strong>
      {#if canWrite && activeInline && formatEnabled}
        <select
          aria-label="Fonte"
          title="Fonte"
          value={String(appearance.fontFamily || '')}
          onchange={(event) => changeAppearance('fontFamily', event.currentTarget.value)}
        >
          <option value="">Fonte</option>
          <option value="space-grotesk">Space Grotesk</option>
          <option value="inter">Inter</option>
          <option value="arial">Arial</option>
          <option value="georgia">Georgia</option>
          <option value="times-new-roman">Times New Roman</option>
        </select>
        {@const sizeField = viewport === 'mobile' ? 'fontSizeMobile' : viewport === 'tablet' ? 'fontSizeTablet' : 'fontSize'}
        <label class="site-editor-inline-size" title="Tamanho do texto neste ecrã">
          <input
            type="number"
            min="10"
            max="120"
            inputmode="numeric"
            aria-label="Tamanho do texto neste ecrã"
            placeholder="Auto"
            value={String(appearance[sizeField] || '')}
            onchange={(event) => changeAppearance(sizeField, event.currentTarget.value ? Number(event.currentTarget.value) : undefined)}
          />
          <span>px</span>
        </label>
        <button
          type="button"
          class:is-active={['bold', '700'].includes(String(appearance.fontWeight || ''))}
          aria-label="Negrito"
          title="Negrito"
          onclick={() => changeAppearance('fontWeight', ['bold', '700'].includes(String(appearance.fontWeight || '')) ? undefined : 'bold')}
        >B</button>
        <button
          type="button"
          class:is-active={appearance.fontStyle === 'italic'}
          aria-label="Itálico"
          title="Itálico"
          onclick={() => changeAppearance('fontStyle', appearance.fontStyle === 'italic' ? undefined : 'italic')}
        ><i>I</i></button>
      {/if}
      <button type="button" class="site-editor-inline-more" onclick={openSettings} title="Abrir definições">
        <span>{canWrite ? 'Editar' : 'Ver'}</span>
      </button>
      <button
        type="button"
        class="site-editor-inline-close"
        onclick={() => clearActiveSelection(true)}
        aria-label="Fechar edição"
        title="Fechar edição"
      >×</button>
    </div>
  {/if}
</div>

<style>
  :global([data-df4y-focusable='true']:focus) {
    outline: none;
  }

  :global(.df4y-inline-editing) {
    min-width: 1ch;
    outline: 0;
    white-space: pre-wrap;
    cursor: text !important;
  }

  .site-editor-overlay {
    position: fixed;
    inset: 0;
    z-index: 2147483646;
    pointer-events: none;
  }

  .site-editor-outline {
    position: fixed;
    border: 1.5px solid #278d72;
    border-radius: 3px;
    box-shadow: 0 0 0 2px rgb(255 255 255 / 0.78);
    will-change: left, top, width, height;
  }

  .site-editor-outline.is-active {
    border-width: 2px;
    box-shadow: 0 0 0 2px rgb(255 255 255 / 0.9), 0 8px 24px rgb(4 57 50 / 0.14);
  }

  .site-editor-outline > span {
    position: absolute;
    top: -6px;
    right: 0;
    translate: 0 -100%;
    max-width: min(18rem, 80vw);
    padding: 0.38rem 0.58rem;
    overflow: hidden;
    color: #fff;
    background: #083f43;
    border: 1px solid rgb(255 255 255 / 22%);
    border-radius: 5px;
    box-shadow: 0 7px 20px rgb(5 33 29 / 18%);
    font: 750 0.68rem/1.2 Inter, system-ui, sans-serif;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .site-editor-inline-toolbar {
    position: fixed;
    display: flex;
    align-items: center;
    width: max-content;
    max-width: calc(100vw - 16px);
    min-height: 42px;
    gap: 4px;
    padding: 4px 5px;
    overflow: hidden;
    color: #10231f;
    background: rgb(255 255 255 / 0.98);
    border: 1px solid #b8cbc4;
    border-radius: 6px;
    box-shadow: 0 16px 42px rgb(8 44 38 / 0.22), 0 2px 8px rgb(8 44 38 / 0.1);
    pointer-events: auto;
  }

  .site-editor-inline-kind {
    max-width: 84px;
    min-height: 30px;
    padding: 0 9px;
    overflow: hidden;
    color: #0b544d;
    background: #e9f4f0;
    border-radius: 4px;
    font: 800 0.66rem/30px Inter, system-ui, sans-serif;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .site-editor-inline-toolbar button,
  .site-editor-inline-toolbar select,
  .site-editor-inline-toolbar input {
    height: 32px;
    color: #17332c;
    background: transparent;
    border: 0;
    border-radius: 4px;
    outline: 0;
    font: 700 0.74rem/1 Inter, system-ui, sans-serif;
  }

  .site-editor-inline-toolbar button {
    display: grid;
    width: 32px;
    place-items: center;
    cursor: pointer;
  }

  .site-editor-inline-toolbar button:hover,
  .site-editor-inline-toolbar button:focus-visible,
  .site-editor-inline-toolbar button.is-active {
    color: #0a4b4e;
    background: #e2f1eb;
  }

  .site-editor-inline-toolbar select {
    width: 118px;
    padding: 0 7px;
    cursor: pointer;
  }

  .site-editor-inline-toolbar select:focus-visible,
  .site-editor-inline-toolbar input:focus-visible {
    box-shadow: inset 0 0 0 2px #278d72;
  }

  .site-editor-inline-size {
    display: flex;
    align-items: center;
    height: 32px;
    color: #61716c;
    background: #f2f6f4;
    border-radius: 4px;
  }

  .site-editor-inline-size input {
    width: 49px;
    padding: 0 2px 0 7px;
  }

  .site-editor-inline-size span {
    padding-right: 6px;
    font: 700 0.65rem/1 Inter, system-ui, sans-serif;
  }

  .site-editor-inline-more {
    width: auto !important;
    min-width: 54px;
    padding: 0 9px !important;
    margin-left: 2px;
    color: #fff !important;
    background: #0a4b4e !important;
    border-radius: 4px !important;
  }

  .site-editor-inline-more:hover,
  .site-editor-inline-more:focus-visible {
    background: #126257 !important;
  }

  .site-editor-inline-close {
    color: #60736c !important;
    font-size: 1.12rem !important;
    font-weight: 450 !important;
  }

  .site-editor-inline-close:hover,
  .site-editor-inline-close:focus-visible {
    color: #8c3434 !important;
    background: #faeded !important;
  }

  @media (max-width: 560px) {
    .site-editor-inline-toolbar select {
      width: 88px;
    }
  }
</style>

import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {ArrowLeftIcon} from '@sanity/icons/ArrowLeft'
import {CloseIcon} from '@sanity/icons/Close'
import {CogIcon} from '@sanity/icons/Cog'
import {DesktopIcon} from '@sanity/icons/Desktop'
import {LaunchIcon} from '@sanity/icons/Launch'
import {MenuIcon} from '@sanity/icons/Menu'
import {MobileDeviceIcon} from '@sanity/icons/MobileDevice'
import {PublishIcon} from '@sanity/icons/Publish'
import {RedoIcon} from '@sanity/icons/Redo'
import {RefreshIcon} from '@sanity/icons/Refresh'
import {TabletDeviceIcon} from '@sanity/icons/TabletDevice'
import {UndoIcon} from '@sanity/icons/Undo'
import type {BuilderViewport} from '$lib/builder/types'
import {getEditorValue, normalizeEditorDocumentId, setEditorValue} from '../path'
import {textAppearanceFields} from '$lib/text-appearance'
import type {
  SiteEditorArea,
  SiteEditorDocument,
  SiteEditorDocumentType,
  SiteEditorManifest,
  SiteEditorNode,
  SiteEditorSaveState,
} from '../types'
import {createSiteEditorApi} from './api'
import {SiteEditorCanvas} from './SiteEditorCanvas'
import {SiteEditorInspector} from './SiteEditorInspector'
import {SiteEditorSidebar} from './SiteEditorSidebar'
import './siteEditor.css'

type Props = {
  csrfToken: string
  previewReady: boolean
  initialCanPublish: boolean
}

type Notice = {
  id: number
  tone: 'success' | 'warning' | 'error'
  title: string
  description?: string
}

type CreateState = {
  open: boolean
  documentType: SiteEditorDocumentType
  fixedType?: boolean
  title: string
  route: string
  busy: boolean
  error?: string
}

const snapshot = <T,>(value: T): T => structuredClone(value)

const initialCreateState: CreateState = {
  open: false,
  documentType: 'sitePage',
  title: '',
  route: '',
  busy: false,
}

const typeLabels: Record<Exclude<SiteEditorDocumentType, 'siteLanding'>, string> = {
  sitePage: 'Página livre',
  productCategory: 'Produto',
  storeCategory: 'Categoria da Loja',
  storeProduct: 'Produto da Loja',
  caseStudy: 'Caso de estudo',
  blogPost: 'Artigo do Blog',
}

const normalizePath = (path: string) => path.replace(/^\$\./, '').replace(/^\$/, '')

const editorRouteKey = (value: string) => {
  const url = new URL(value || '/', window.location.origin)
  url.searchParams.delete('lang')
  url.searchParams.delete('__builder')
  url.searchParams.delete('__editorRefresh')
  url.searchParams.sort()
  const pathname = url.pathname === '/' ? '/' : url.pathname.replace(/\/$/, '')
  return `${pathname}${url.search}`
}

const editorRoutePathname = (value: string) =>
  new URL(value || '/', window.location.origin).pathname.replace(/\/$/, '') || '/'

const contextualNodePriority = (node: SiteEditorNode) => {
  if (node.kind === 'page') return 0
  if (node.kind === 'flexiblePage') return 1
  return 2
}

const sectionKeyFromPath = (path: string) => /sections\[_key==["']([^"']+)["']\]/.exec(path)?.[1]

const localizedObjectPath = (path: string) =>
  /\.(pt|en|es)$/.test(path) ? path.replace(/\.(pt|en|es)$/, '') : undefined

const appearanceObjectPath = (path: string) => {
  const field = path.split('.').at(-1)
  return field && textAppearanceFields.includes(field as (typeof textAppearanceFields)[number])
    ? path.slice(0, -(field.length + 1))
    : undefined
}

const saveLabels: Record<SiteEditorSaveState, string> = {
  idle: 'Sem alterações',
  dirty: 'A guardar…',
  saving: 'A guardar…',
  saved: 'Guardado',
  error: 'Erro ao guardar',
  conflict: 'Conflito de edição',
}

export function SiteEditorApp({csrfToken, previewReady, initialCanPublish}: Props) {
  const api = useMemo(() => createSiteEditorApi(csrfToken), [csrfToken])
  const [manifest, setManifest] = useState<SiteEditorManifest>()
  const [area, setArea] = useState<SiteEditorArea>('pages')
  const [selectedNode, setSelectedNode] = useState<SiteEditorNode>()
  const selectedNodeRef = useRef<SiteEditorNode>()
  const [document, setDocument] = useState<SiteEditorDocument>()
  const documentRef = useRef<SiteEditorDocument>()
  const [selectedPath, setSelectedPath] = useState<string>()
  const [selectedSectionKey, setSelectedSectionKey] = useState<string>()
  const [viewport, setViewport] = useState<BuilderViewport>(() =>
    typeof window !== 'undefined' && window.matchMedia('(max-width: 660px)').matches
      ? 'mobile'
      : 'desktop',
  )
  const [saveState, setSaveState] = useState<SiteEditorSaveState>('idle')
  const [loading, setLoading] = useState(true)
  const [documentLoading, setDocumentLoading] = useState(false)
  const [loadError, setLoadError] = useState<string>()
  const [history, setHistory] = useState<SiteEditorDocument[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const historyIndexRef = useRef(-1)
  const [refreshToken, setRefreshToken] = useState(0)
  const [frame, setFrame] = useState<HTMLIFrameElement | null>(null)
  const previewRouteRef = useRef('/')
  const [notice, setNotice] = useState<Notice>()
  const [navigationOpen, setNavigationOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [inspectorMode, setInspectorMode] = useState<'focused' | 'all'>('all')
  const inlineEditing = useRef(false)
  const fieldStateRef = useRef<Record<string, unknown>>()
  const noticeId = useRef(0)
  const [createState, setCreateState] = useState<CreateState>(initialCreateState)
  const dirtyVersion = useRef(0)
  const saving = useRef<Promise<SiteEditorDocument> | null>(null)
  const canPublish = manifest?.capabilities.canPublish ?? initialCanPublish
  const canWrite = manifest?.capabilities.canWrite ?? false

  const clearCanvasSelection = useCallback(
    (closeSettings = true) => {
      inlineEditing.current = false
      fieldStateRef.current = undefined
      setSelectedPath(undefined)
      setSelectedSectionKey(undefined)
      if (closeSettings) setSettingsOpen(false)
      frame?.contentWindow?.postMessage(
        {type: 'df4y:site-editor:clear-selection'},
        window.location.origin,
      )
    },
    [frame],
  )

  const pushNotice = useCallback((value: Omit<Notice, 'id'>) => {
    const next = {...value, id: ++noticeId.current}
    setNotice(next)
    window.setTimeout(() => {
      setNotice((current) => (current?.id === next.id ? undefined : current))
    }, 4600)
  }, [])

  const replaceDocument = useCallback((next: SiteEditorDocument, record = true) => {
    const copy = snapshot(next)
    documentRef.current = copy
    setDocument(copy)
    dirtyVersion.current += 1
    if (record) {
      setHistory((current) => {
        const trimmed = current.slice(0, historyIndexRef.current + 1)
        const result = [...trimmed, snapshot(copy)]
        const bounded = result.length > 80 ? result.slice(-80) : result
        const nextIndex = bounded.length - 1
        historyIndexRef.current = nextIndex
        setHistoryIndex(nextIndex)
        return bounded
      })
    }
    setSaveState('dirty')
  }, [])

  const openDocument = useCallback(
    async (node: SiteEditorNode, path?: string) => {
      if (!node.documentId || !node.documentType) return
      selectedNodeRef.current = node
      setSelectedNode(node)
      setArea(node.area)
      const normalizedSelectedPath = path ? normalizePath(path) : undefined
      setSelectedPath(normalizedSelectedPath)
      setSelectedSectionKey(
        normalizedSelectedPath ? sectionKeyFromPath(normalizedSelectedPath) : undefined,
      )

      if (
        documentRef.current &&
        normalizeEditorDocumentId(documentRef.current._id) ===
          normalizeEditorDocumentId(node.documentId)
      ) {
        return
      }

      setDocumentLoading(true)
      try {
        const next = await api.document(node.documentId)
        const copy = snapshot(next)
        setDocument(copy)
        documentRef.current = copy
        setHistory([snapshot(copy)])
        setHistoryIndex(0)
        historyIndexRef.current = 0
        setSaveState('idle')
      } catch (error) {
        pushNotice({
          tone: 'error',
          title: 'Não foi possível abrir o conteúdo',
          description: error instanceof Error ? error.message : undefined,
        })
      } finally {
        setDocumentLoading(false)
      }
    },
    [api, pushNotice],
  )

  const loadManifest = useCallback(
    async (preferredDocumentId?: string) => {
      setLoadError(undefined)
      const next = await api.manifest()
      setManifest(next)
      const current = selectedNodeRef.current
      const target = preferredDocumentId
        ? next.nodes.find(
            (node) =>
              node.documentId &&
              normalizeEditorDocumentId(node.documentId) ===
                normalizeEditorDocumentId(preferredDocumentId),
          )
        : current
          ? next.nodes.find((node) => node.id === current.id)
          : next.nodes.find((node) => node.id === 'page-home')
      if (target) await openDocument(target)
      return target
    },
    [api, openDocument],
  )

  useEffect(() => {
    setLoading(true)
    loadManifest()
      .catch((error) =>
        setLoadError(error instanceof Error ? error.message : 'Não foi possível abrir o editor.'),
      )
      .finally(() => setLoading(false))
  }, [loadManifest])

  const saveNow = useCallback(async () => {
    const current = documentRef.current
    if (!current || !canWrite) {
      if (!canWrite) pushNotice({tone: 'warning', title: 'O editor está em modo de leitura'})
      throw new Error('Não existe acesso de escrita.')
    }
    if (saving.current) await saving.current

    const version = dirtyVersion.current
    const value = snapshot(documentRef.current!)
    setSaveState('saving')
    const request = api.save(value)
    saving.current = request
    try {
      const saved = await request
      const latest = documentRef.current
      if (
        latest &&
        normalizeEditorDocumentId(latest._id) === normalizeEditorDocumentId(saved._id)
      ) {
        const merged = {
          ...latest,
          _id: saved._id,
          _rev: saved._rev,
          _createdAt: saved._createdAt,
          _updatedAt: saved._updatedAt,
        }
        documentRef.current = merged
        setDocument(merged)
      }
      setSaveState(dirtyVersion.current === version ? 'saved' : 'dirty')
      setManifest((currentManifest) =>
        currentManifest
          ? (() => {
              const latestTitle =
                typeof latest?.title === 'string'
                  ? latest.title
                  : (latest?.title as {pt?: string} | undefined)?.pt
              const latestSlug = (latest?.slug as {current?: string} | undefined)?.current
              const storeCategories =
                latest?._type === 'storeCategory' && latestSlug && latestTitle
                  ? [
                      ...currentManifest.optionSources.storeCategories.filter(
                        (option) => option.value !== latestSlug,
                      ),
                      {label: latestTitle, value: latestSlug},
                    ].sort((left, right) => left.label.localeCompare(right.label, 'pt'))
                  : currentManifest.optionSources.storeCategories
              return {
                ...currentManifest,
                nodes: currentManifest.nodes.map((node) =>
                  node.documentId &&
                  normalizeEditorDocumentId(node.documentId) ===
                    normalizeEditorDocumentId(saved._id)
                    ? {
                        ...node,
                        title: latestTitle ?? node.title,
                        category:
                          typeof latest?.category === 'string' ? latest.category : node.category,
                        draft: true,
                        updatedAt: saved._updatedAt,
                      }
                    : node,
                ),
                optionSources: {
                  ...currentManifest.optionSources,
                  storeCategories,
                },
              }
            })()
          : currentManifest,
      )
      frame?.contentWindow?.postMessage(
        {
          type: 'df4y:site-editor:refresh-preview',
          documentId: saved._id,
          revision: saved._rev,
        },
        window.location.origin,
      )
      return saved
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível guardar.'
      const conflict = /conflito|alterado noutro|recarregue|revision/i.test(message)
      setSaveState(conflict ? 'conflict' : 'error')
      pushNotice({
        tone: conflict ? 'warning' : 'error',
        title: conflict ? 'Conflito de edição' : 'Não foi possível guardar',
        description: message,
      })
      throw error
    } finally {
      saving.current = null
    }
  }, [api, canWrite, frame, pushNotice])

  useEffect(() => {
    if (saveState !== 'dirty') return
    const timer = window.setTimeout(() => void saveNow().catch(() => undefined), 900)
    return () => window.clearTimeout(timer)
  }, [document, saveNow, saveState])

  const publish = useCallback(async () => {
    if (!canPublish || !documentRef.current) {
      pushNotice({tone: 'warning', title: 'Apenas administradores podem publicar'})
      return
    }
    try {
      const saved = saveState === 'dirty' ? await saveNow() : documentRef.current
      const published = await api.publish(saved)
      const copy = snapshot(published)
      documentRef.current = copy
      setDocument(copy)
      setHistory([snapshot(copy)])
      setHistoryIndex(0)
      historyIndexRef.current = 0
      setSaveState('saved')
      await loadManifest(published._id)
      setRefreshToken((token) => token + 1)
      pushNotice({tone: 'success', title: 'Alterações publicadas'})
    } catch (error) {
      pushNotice({
        tone: 'error',
        title: 'Não foi possível publicar',
        description: error instanceof Error ? error.message : undefined,
      })
    }
  }, [api, canPublish, loadManifest, pushNotice, saveNow, saveState])

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return
    const index = historyIndexRef.current - 1
    const next = snapshot(history[index])
    const latest = documentRef.current
    if (latest) {
      next._id = latest._id
      next._rev = latest._rev
      next._createdAt = latest._createdAt
      next._updatedAt = latest._updatedAt
    }
    historyIndexRef.current = index
    setHistoryIndex(index)
    documentRef.current = next
    setDocument(next)
    dirtyVersion.current += 1
    setSaveState('dirty')
  }, [history])

  const redo = useCallback(() => {
    if (historyIndexRef.current >= history.length - 1) return
    const index = historyIndexRef.current + 1
    const next = snapshot(history[index])
    const latest = documentRef.current
    if (latest) {
      next._id = latest._id
      next._rev = latest._rev
      next._createdAt = latest._createdAt
      next._updatedAt = latest._updatedAt
    }
    historyIndexRef.current = index
    setHistoryIndex(index)
    documentRef.current = next
    setDocument(next)
    dirtyVersion.current += 1
    setSaveState('dirty')
  }, [history])

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return
      if (event.key.toLowerCase() === 's') {
        event.preventDefault()
        void saveNow().catch(() => undefined)
      } else if (event.key.toLowerCase() === 'z' && event.shiftKey) {
        event.preventDefault()
        redo()
      } else if (event.key.toLowerCase() === 'z') {
        event.preventDefault()
        undo()
      }
    }
    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [redo, saveNow, undo])

  const updatePath = useCallback(
    (path: string, value: unknown, record = true) => {
      const current = documentRef.current
      if (!current) return
      const next = setEditorValue(current, path, value)
      const appearancePath = appearanceObjectPath(path)
      const patchPath = appearancePath ?? path
      const patchValue = appearancePath ? getEditorValue(next, appearancePath) : value
      frame?.contentWindow?.postMessage(
        {
          type: 'df4y:site-editor:preview-patch',
          documentId: next._id,
          path: patchPath,
          value: patchValue,
        },
        window.location.origin,
      )
      replaceDocument(next, record)
    },
    [frame, replaceDocument],
  )

  const targetForSelection = useCallback(
    (documentId: string, path: string) => {
      const id = normalizeEditorDocumentId(documentId)
      const nodes = manifest?.nodes ?? []
      return (
        nodes.find(
          (node) =>
            node.documentId &&
            normalizeEditorDocumentId(node.documentId) === id &&
            node.documentType !== 'siteLanding',
        ) ??
        nodes
          .filter(
            (node) =>
              node.documentType === 'siteLanding' &&
              node.rootPath &&
              (path === node.rootPath ||
                path.startsWith(`${node.rootPath}.`) ||
                path.startsWith(`${node.rootPath}[`)),
          )
          .sort((left, right) => (right.rootPath?.length ?? 0) - (left.rootPath?.length ?? 0))[0]
      )
    },
    [manifest?.nodes],
  )

  const nodeForPreviewRoute = useCallback(
    (route: string) => {
      const candidates = (manifest?.nodes ?? []).filter(
        (node) =>
          Boolean(node.route && node.documentId && node.documentType) &&
          node.kind !== 'global' &&
          node.kind !== 'collection',
      )
      const routeKey = editorRouteKey(route)
      const exact = candidates
        .filter((node) => editorRouteKey(node.route || '/') === routeKey)
        .sort((left, right) => contextualNodePriority(left) - contextualNodePriority(right))
      if (exact[0]) return exact[0]

      const pathname = editorRoutePathname(route)
      return candidates
        .filter((node) => editorRoutePathname(node.route || '/') === pathname)
        .sort((left, right) => contextualNodePriority(left) - contextualNodePriority(right))[0]
    },
    [manifest?.nodes],
  )

  const syncPreviewRoute = useCallback(
    async (route: string) => {
      if (!route) return
      previewRouteRef.current = route
      const current = selectedNodeRef.current
      if (current?.route && editorRouteKey(current.route) === editorRouteKey(route)) return

      const target = nodeForPreviewRoute(route)
      if (!target || target.id === current?.id) return
      clearCanvasSelection(false)
      setInspectorMode('all')
      await openDocument(target)
    },
    [clearCanvasSelection, nodeForPreviewRoute, openDocument],
  )

  const openContextSettings = useCallback(async () => {
    let route = previewRouteRef.current
    try {
      const current = frame?.contentWindow?.location
      if (current) route = `${current.pathname}${current.search}`
    } catch {
      // Route messages remain the source of truth if the frame cannot be inspected.
    }

    const current = selectedNodeRef.current
    const target =
      current?.route && editorRouteKey(current.route) === editorRouteKey(route)
        ? current
        : nodeForPreviewRoute(route)
    if (target && target.id !== current?.id) await openDocument(target)
    setInspectorMode('all')
    setSettingsOpen(true)
  }, [frame, nodeForPreviewRoute, openDocument])

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frame?.contentWindow) return
      if (!event.data || typeof event.data.type !== 'string') return
      if (!event.data.type.startsWith('df4y:site-editor:')) return

      if (event.data.type === 'df4y:site-editor:ready') {
        if (event.data.route) await syncPreviewRoute(String(event.data.route))
        if (fieldStateRef.current) {
          frame.contentWindow?.postMessage(fieldStateRef.current, window.location.origin)
        }
        return
      }

      if (event.data.type === 'df4y:site-editor:route-change') {
        await syncPreviewRoute(String(event.data.route || ''))
        return
      }

      if (event.data.type === 'df4y:site-editor:clear-selection') {
        clearCanvasSelection()
        return
      }

      const path = normalizePath(String(event.data.path || ''))
      const target = targetForSelection(String(event.data.documentId || ''), path)
      if (!target) return
      await openDocument(target, path)

      if (event.data.type === 'df4y:site-editor:select') {
        setInspectorMode('focused')
        if (!event.data.inlineEditable) setSettingsOpen(true)
        return
      }
      if (event.data.type === 'df4y:site-editor:open-settings') {
        setInspectorMode('focused')
        setSettingsOpen(true)
        return
      }
      if (event.data.type === 'df4y:site-editor:inline-start') {
        inlineEditing.current = true
        return
      }
      if (
        event.data.type === 'df4y:site-editor:inline-change' ||
        event.data.type === 'df4y:site-editor:inline-cancel'
      ) {
        updatePath(path, String(event.data.value ?? ''), false)
        if (event.data.type === 'df4y:site-editor:inline-cancel') inlineEditing.current = false
        return
      }
      if (event.data.type === 'df4y:site-editor:inline-commit') {
        updatePath(path, String(event.data.value ?? ''), true)
        inlineEditing.current = false
        window.setTimeout(() => void saveNow().catch(() => undefined))
        return
      }
      if (event.data.type === 'df4y:site-editor:format-change') {
        const basePath = localizedObjectPath(path)
        const field = String(event.data.field || '')
        if (
          !basePath ||
          !textAppearanceFields.includes(field as (typeof textAppearanceFields)[number])
        )
          return
        updatePath(`${basePath}.${field}`, event.data.value ?? null)
      }
    }
    const listener = (event: MessageEvent) => void handleMessage(event)
    window.addEventListener('message', listener)
    return () => window.removeEventListener('message', listener)
  }, [
    clearCanvasSelection,
    frame,
    openDocument,
    saveNow,
    syncPreviewRoute,
    targetForSelection,
    updatePath,
  ])

  useEffect(() => {
    if (!selectedPath) {
      fieldStateRef.current = undefined
      return
    }
    if (!frame?.contentWindow || !document) return
    const basePath = localizedObjectPath(selectedPath)
    const value = basePath ? getEditorValue<Record<string, unknown>>(document, basePath) : undefined
    const formatEnabled = Boolean(
      value &&
      typeof value === 'object' &&
      (value._type === 'localizedString' || value._type === 'localizedText' || 'pt' in value),
    )
    const appearance = formatEnabled
      ? Object.fromEntries(textAppearanceFields.map((field) => [field, value?.[field]]))
      : {}
    const selectedValue = getEditorValue(document, selectedPath)
    const message = {
      type: 'df4y:site-editor:field-state',
      documentId: document._id,
      path: selectedPath,
      appearance,
      formatEnabled,
      viewport,
      textValue: typeof selectedValue === 'string' ? selectedValue : undefined,
    }
    fieldStateRef.current = message
    frame.contentWindow.postMessage(message, window.location.origin)
  }, [document, frame, selectedPath, viewport])

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (settingsOpen) clearCanvasSelection()
      else if (navigationOpen) setNavigationOpen(false)
    }
    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [clearCanvasSelection, navigationOpen, settingsOpen])

  const openCreate = useCallback((documentType?: SiteEditorDocumentType) => {
    setCreateState({
      ...initialCreateState,
      open: true,
      documentType: documentType ?? (area === 'pages' ? 'sitePage' : 'productCategory'),
      fixedType: Boolean(documentType),
    })
  }, [area])

  const openCreatedDraft = (
    created: SiteEditorDocument,
    fallbackTitle: string,
    fallbackRoute: string,
  ) => {
    const id = normalizeEditorDocumentId(created._id)
    const titleValue = created.title as {pt?: string} | string | undefined
    const title = typeof titleValue === 'string' ? titleValue : titleValue?.pt || fallbackTitle
    const slug = (created.slug as {current?: string} | undefined)?.current
    const route =
      created._type === 'sitePage'
        ? String(created.route || fallbackRoute || '/')
        : created._type === 'storeCategory'
          ? '/loja'
          : `/${
              created._type === 'productCategory'
                ? 'produtos'
                : created._type === 'storeProduct'
                  ? 'loja'
                  : created._type === 'caseStudy'
                    ? 'casos-de-estudo'
                    : 'blog'
            }${slug ? `/${slug}` : ''}`
    const optimisticNode: SiteEditorNode = {
      id: `${created._type === 'sitePage' ? 'page' : 'document'}-${id}`,
      kind: created._type === 'sitePage' ? 'flexiblePage' : 'document',
      area: created._type === 'sitePage' ? 'pages' : 'content',
      title,
      route,
      documentId: id,
      documentType: created._type,
      draft: true,
      active: created.active as boolean | undefined,
    }
    const copy = snapshot(created)
    selectedNodeRef.current = optimisticNode
    setSelectedNode(optimisticNode)
    setArea(optimisticNode.area)
    setSelectedPath(undefined)
    setSelectedSectionKey(undefined)
    documentRef.current = copy
    setDocument(copy)
    setHistory([snapshot(copy)])
    setHistoryIndex(0)
    historyIndexRef.current = 0
    setSaveState('idle')
  }

  const createDocument = async () => {
    setCreateState((current) => ({...current, busy: true, error: undefined}))
    try {
      clearCanvasSelection(false)
      const created = await api.create(
        createState.documentType,
        createState.title,
        createState.route || undefined,
      )
      setCreateState(initialCreateState)
      let openedFromManifest = false
      try {
        const target = await loadManifest(created._id)
        openedFromManifest = Boolean(target)
      } catch (refreshError) {
        pushNotice({
          tone: 'warning',
          title: 'Conteúdo criado; a lista será atualizada em breve',
          description: refreshError instanceof Error ? refreshError.message : undefined,
        })
      }
      if (!openedFromManifest) {
        openCreatedDraft(created, createState.title, createState.route)
      }
      setRefreshToken((token) => token + 1)
      pushNotice({tone: 'success', title: 'Conteúdo criado como rascunho'})
    } catch (error) {
      setCreateState((current) => ({
        ...current,
        busy: false,
        error: error instanceof Error ? error.message : 'Não foi possível criar.',
      }))
    }
  }

  const deleteDocument = async () => {
    const current = documentRef.current
    if (!current || !window.confirm(`Eliminar “${selectedNode?.title || 'este conteúdo'}”?`)) return
    try {
      await api.delete(current._id)
      documentRef.current = undefined
      selectedNodeRef.current = undefined
      setDocument(undefined)
      setSelectedNode(undefined)
      await loadManifest()
      pushNotice({tone: 'success', title: 'Conteúdo eliminado'})
    } catch (error) {
      pushNotice({
        tone: 'error',
        title: 'Não foi possível eliminar',
        description: error instanceof Error ? error.message : undefined,
      })
    }
  }

  if (loading) {
    return (
      <div className="site-editor-boot">
        <span />
        <strong>A preparar o editor do site…</strong>
      </div>
    )
  }

  if (loadError || !manifest) {
    return (
      <div className="site-editor-fatal">
        <strong>Não foi possível abrir o editor</strong>
        <p>{loadError}</p>
        <button type="button" onClick={() => window.location.reload()}>
          <RefreshIcon /> Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <div className="site-editor-shell">
      <header className="site-editor-commandbar">
        <div className="site-editor-command-start">
          <a
            className="site-editor-backoffice-link"
            href="/painel/pedidos"
            aria-label="Voltar ao backoffice"
            title="Voltar ao backoffice"
          >
            <ArrowLeftIcon />
            <span>Backoffice</span>
          </a>
          <button
            type="button"
            className="site-editor-menu-button"
            onClick={() => setNavigationOpen(true)}
            aria-label="Abrir páginas e conteúdo"
            title="Páginas e conteúdo"
          >
            <MenuIcon />
          </button>
          <button
            type="button"
            className="site-editor-context"
            onClick={() => setNavigationOpen(true)}
          >
            <small>
              {selectedNode?.kind === 'global' ? 'Global' : selectedNode?.route || 'Editor do site'}
            </small>
            <strong>{selectedNode?.title || 'Selecione uma página'}</strong>
          </button>
        </div>

        <div className={`site-editor-top-save is-${saveState}`} aria-live="polite">
          <i /> <span>{saveLabels[saveState]}</span>
        </div>

        <div className="site-editor-command-actions">
          <div className="site-editor-viewport" aria-label="Tamanho da página">
            {(
              [
                ['desktop', DesktopIcon, 'Computador'],
                ['tablet', TabletDeviceIcon, 'Tablet'],
                ['mobile', MobileDeviceIcon, 'Telemóvel'],
              ] as const
            ).map(([value, Icon, label]) => (
              <button
                key={value}
                type="button"
                className={viewport === value ? 'is-active' : ''}
                aria-label={label}
                title={label}
                onClick={() => setViewport(value)}
              >
                <Icon />
              </button>
            ))}
          </div>
          <span className="site-editor-command-divider" aria-hidden="true" />
          <button
            type="button"
            onClick={undo}
            disabled={historyIndex <= 0}
            aria-label="Desfazer"
            title="Desfazer"
          >
            <UndoIcon />
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            aria-label="Refazer"
            title="Refazer"
          >
            <RedoIcon />
          </button>
          <button
            type="button"
            onClick={() => setRefreshToken((token) => token + 1)}
            aria-label="Atualizar página"
            title="Atualizar página"
          >
            <RefreshIcon />
          </button>
          <a
            href={`${selectedNode?.route || '/'}?lang=pt`}
            target="_blank"
            rel="noreferrer"
            aria-label="Abrir site"
            title="Abrir site"
          >
            <LaunchIcon />
          </a>
          <button
            type="button"
            onClick={() => void openContextSettings()}
            aria-label="Abrir definições"
            title="Definições desta página"
          >
            <CogIcon />
          </button>
          <button
            className="site-editor-publish-button"
            type="button"
            disabled={!canPublish || saveState === 'saving'}
            onClick={() => void publish()}
          >
            <PublishIcon /> <span>Publicar</span>
          </button>
        </div>
      </header>

      <section className="site-editor-main">
        <SiteEditorCanvas
          route={selectedNode?.route || '/'}
          viewport={viewport}
          refreshToken={refreshToken}
          previewReady={previewReady}
          onFrame={setFrame}
          onRouteChange={(route) => void syncPreviewRoute(route)}
        />
      </section>

      <div
        className={`site-editor-drawer-shade${navigationOpen || settingsOpen ? ' is-visible' : ''}`}
        onMouseDown={() => {
          setNavigationOpen(false)
          if (settingsOpen) clearCanvasSelection()
        }}
        aria-hidden="true"
      />

      <aside
        className={`site-editor-drawer is-navigation${navigationOpen ? ' is-open' : ''}`}
        aria-label="Páginas e conteúdo"
      >
        <SiteEditorSidebar
          nodes={manifest.nodes}
          selectedNodeId={selectedNode?.id}
          area={area}
          onAreaChange={setArea}
          onSelect={(node) => {
            clearCanvasSelection(false)
            setInspectorMode('all')
            const keepNavigationOpen = node.documentType === 'storeCategory'
            if (!keepNavigationOpen) setNavigationOpen(false)
            void openDocument(node).then(() => {
              if (node.kind === 'global' || keepNavigationOpen) setSettingsOpen(true)
            })
          }}
          onCreate={openCreate}
          onClose={() => setNavigationOpen(false)}
        />
      </aside>

      <aside
        className={`site-editor-drawer is-settings${settingsOpen ? ' is-open' : ''}`}
        aria-label="Definições"
      >
        <button
          className="site-editor-drawer-close"
          type="button"
          onClick={() => clearCanvasSelection()}
          aria-label="Fechar definições"
        >
          <CloseIcon />
        </button>
        <SiteEditorInspector
          node={selectedNode}
          document={document}
          loading={documentLoading}
          saveState={saveState}
          selectedPath={selectedPath}
          selectedSectionKey={selectedSectionKey}
          projectId={manifest.capabilities.projectId}
          dataset={manifest.capabilities.dataset}
          viewport={viewport}
          canDelete={canPublish}
          mode={inspectorMode}
          nodes={manifest.nodes}
          optionSources={manifest.optionSources}
          onChange={updatePath}
          onReplace={(next) => replaceDocument(next)}
          onSelectSection={setSelectedSectionKey}
          onUpload={async (file, kind) => (await api.uploadAsset(file, kind)).asset}
          onDelete={() => void deleteDocument()}
          onShowAll={() => setInspectorMode('all')}
          onOpenNode={(node, path) => {
            setInspectorMode(path ? 'focused' : 'all')
            void openDocument(node, path)
          }}
        />
      </aside>

      {notice ? (
        <div
          className={`site-editor-notice is-${notice.tone}`}
          role={notice.tone === 'error' ? 'alert' : 'status'}
        >
          <span>
            <strong>{notice.title}</strong>
            {notice.description ? <small>{notice.description}</small> : null}
          </span>
          <button type="button" onClick={() => setNotice(undefined)} aria-label="Fechar">
            <CloseIcon />
          </button>
        </div>
      ) : null}

      {createState.open ? (
        <div
          className="site-editor-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !createState.busy)
              setCreateState(initialCreateState)
          }}
        >
          <form
            className="site-editor-modal"
            onSubmit={(event) => {
              event.preventDefault()
              void createDocument()
            }}
          >
            <div className="site-editor-modal-head">
              <div>
                <small>Novo conteúdo</small>
                <strong>
                  {createState.fixedType && createState.documentType !== 'sitePage'
                    ? `Adicionar ${typeLabels[createState.documentType as Exclude<
                        SiteEditorDocumentType,
                        'siteLanding'
                      >].toLocaleLowerCase('pt')}`
                    : area === 'pages'
                      ? 'Criar página'
                      : 'Adicionar ao site'}
                </strong>
              </div>
              <button
                type="button"
                onClick={() => setCreateState(initialCreateState)}
                aria-label="Fechar"
              >
                <CloseIcon />
              </button>
            </div>
            {area === 'content' && !createState.fixedType ? (
              <label>
                <span>Tipo</span>
                <select
                  value={createState.documentType}
                  onChange={(event) => {
                    const documentType = event.currentTarget.value as SiteEditorDocumentType
                    setCreateState((current) => ({...current, documentType}))
                  }}
                >
                  {(
                    Object.entries(typeLabels) as Array<
                      [Exclude<SiteEditorDocumentType, 'siteLanding'>, string]
                    >
                  )
                    .filter(([type]) => type !== 'sitePage')
                    .map(([type, label]) => (
                      <option key={type} value={type}>
                        {label}
                      </option>
                    ))}
                </select>
              </label>
            ) : null}
            <label>
              <span>Nome</span>
              <input
                autoFocus
                required
                minLength={2}
                maxLength={100}
                value={createState.title}
                onChange={(event) => {
                  const title = event.currentTarget.value
                  setCreateState((current) => ({...current, title}))
                }}
              />
            </label>
            {createState.documentType === 'sitePage' ? (
              <label>
                <span>Endereço</span>
                <input
                  placeholder="/nome-da-pagina"
                  value={createState.route}
                  onChange={(event) => {
                    const route = event.currentTarget.value
                    setCreateState((current) => ({...current, route}))
                  }}
                />
              </label>
            ) : null}
            {createState.error ? (
              <p className="site-editor-modal-error">{createState.error}</p>
            ) : null}
            <div className="site-editor-modal-actions">
              <button type="button" onClick={() => setCreateState(initialCreateState)}>
                Cancelar
              </button>
              <button type="submit" disabled={createState.busy}>
                {createState.busy ? 'A criar…' : 'Criar rascunho'}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  )
}

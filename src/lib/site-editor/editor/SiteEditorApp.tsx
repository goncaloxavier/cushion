import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {ArrowLeftIcon} from '@sanity/icons/ArrowLeft'
import {BasketIcon} from '@sanity/icons/Basket'
import {CaseIcon} from '@sanity/icons/Case'
import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {CloseIcon} from '@sanity/icons/Close'
import {CogIcon} from '@sanity/icons/Cog'
import {CubeIcon} from '@sanity/icons/Cube'
import {DesktopIcon} from '@sanity/icons/Desktop'
import {DocumentIcon} from '@sanity/icons/Document'
import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {LaunchIcon} from '@sanity/icons/Launch'
import {MenuIcon} from '@sanity/icons/Menu'
import {MobileDeviceIcon} from '@sanity/icons/MobileDevice'
import {PublishIcon} from '@sanity/icons/Publish'
import {RedoIcon} from '@sanity/icons/Redo'
import {RefreshIcon} from '@sanity/icons/Refresh'
import {TabletDeviceIcon} from '@sanity/icons/TabletDevice'
import {TagIcon} from '@sanity/icons/Tag'
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
import {ConfirmDialog} from './ConfirmDialog'
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
  closing?: boolean
}

type PublishState = 'idle' | 'publishing' | 'published'

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

// Edits made within this window of each other collapse into one undo step
// instead of one per keystroke — see replaceDocument.
const historyCoalesceWindowMs = 900

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

type CreatableDocumentType = Exclude<SiteEditorDocumentType, 'siteLanding'>

const createTypeDetails: Record<
  CreatableDocumentType,
  {description: string; nameLabel: string; placeholder: string}
> = {
  sitePage: {
    description: 'Uma página nova que pode montar com secções',
    nameLabel: 'Nome da página',
    placeholder: 'Ex.: Sustentabilidade',
  },
  productCategory: {
    description: 'Uma solução apresentada na página Produtos',
    nameLabel: 'Nome do produto',
    placeholder: 'Ex.: Bancos para exterior',
  },
  storeCategory: {
    description: 'Um grupo para organizar os produtos da Loja',
    nameLabel: 'Nome da categoria',
    placeholder: 'Ex.: Decking',
  },
  storeProduct: {
    description: 'Um artigo da Loja com preço, peso e opções',
    nameLabel: 'Nome do produto da Loja',
    placeholder: 'Ex.: Banco Gavião',
  },
  caseStudy: {
    description: 'Um projeto realizado, com texto e galeria',
    nameLabel: 'Nome do caso',
    placeholder: 'Ex.: Proteção de piscina na Trofa',
  },
  blogPost: {
    description: 'Um artigo com resumo, imagens e editor de texto',
    nameLabel: 'Título do artigo',
    placeholder: 'Ex.: Como escolher materiais para exterior',
  },
}

const contentCreateTypes: CreatableDocumentType[] = [
  'productCategory',
  'storeProduct',
  'caseStudy',
  'blogPost',
  'storeCategory',
]

const CreateTypeIcon = ({type}: {type: CreatableDocumentType}) => {
  if (type === 'sitePage') return <DocumentIcon />
  if (type === 'productCategory') return <CubeIcon />
  if (type === 'storeCategory') return <TagIcon />
  if (type === 'storeProduct') return <BasketIcon />
  if (type === 'caseStudy') return <CaseIcon />
  return <DocumentTextIcon />
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
  idle: 'Tudo guardado',
  dirty: 'Alterações por guardar',
  saving: 'A guardar…',
  saved: 'Guardado automaticamente',
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
  const [publishState, setPublishState] = useState<PublishState>('idle')
  const [loading, setLoading] = useState(true)
  const [documentLoading, setDocumentLoading] = useState(false)
  const [loadError, setLoadError] = useState<string>()
  const [history, setHistory] = useState<SiteEditorDocument[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const historyIndexRef = useRef(-1)
  const lastHistoryPushAt = useRef(0)
  const builderStateTimer = useRef<number>()
  const builderStateLastSentAt = useRef(0)
  const latestBuilderState = useRef<{page: SiteEditorDocument; selectedSectionKey?: string}>()
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
  const noticeDismissTimer = useRef<number | undefined>(undefined)
  const noticeRemoveTimer = useRef<number | undefined>(undefined)
  const publishResetTimer = useRef<number | undefined>(undefined)
  const [createState, setCreateState] = useState<CreateState>(initialCreateState)
  const [deleteState, setDeleteState] = useState({open: false, busy: false})
  const dirtyVersion = useRef(0)
  const savedVersion = useRef(0)
  const saving = useRef<Promise<SiteEditorDocument> | null>(null)
  const publishing = useRef<Promise<SiteEditorDocument> | null>(null)
  const saveNowRef = useRef<() => Promise<SiteEditorDocument>>()
  const previewNeedsRefresh = useRef(false)
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

  const dismissNotice = useCallback((id?: number) => {
    window.clearTimeout(noticeDismissTimer.current)
    window.clearTimeout(noticeRemoveTimer.current)
    setNotice((current) => {
      if (!current || (id !== undefined && current.id !== id)) return current
      return {...current, closing: true}
    })
    noticeRemoveTimer.current = window.setTimeout(() => {
      setNotice((current) =>
        !current || (id !== undefined && current.id !== id) ? current : undefined,
      )
    }, 280)
  }, [])

  const pushNotice = useCallback(
    (value: Omit<Notice, 'id' | 'closing'>) => {
      window.clearTimeout(noticeDismissTimer.current)
      window.clearTimeout(noticeRemoveTimer.current)
      const next = {...value, id: ++noticeId.current, closing: false}
      setNotice(next)
      noticeDismissTimer.current = window.setTimeout(
        () => dismissNotice(next.id),
        value.tone === 'success' ? 4800 : 7600,
      )
    },
    [dismissNotice],
  )

  useEffect(
    () => () => {
      window.clearTimeout(noticeDismissTimer.current)
      window.clearTimeout(noticeRemoveTimer.current)
      window.clearTimeout(publishResetTimer.current)
    },
    [],
  )

  const replaceDocument = useCallback(
    (next: SiteEditorDocument, record = true, previewIsAuthoritative = false) => {
      const copy = snapshot(next)
      documentRef.current = copy
      setDocument(copy)
      dirtyVersion.current += 1
      if (!previewIsAuthoritative) previewNeedsRefresh.current = true
      if (record) {
        // Coalesce checkpoints made within the same short burst of typing into one
        // undo step (reusing `copy`, never re-cloning it) instead of recording a
        // full-document snapshot per keystroke — that both halves the cloning cost
        // of every edit and keeps undo granularity the same everywhere an edit can
        // be made, matching the "commit on pause" feel inline canvas editing already has.
        const now = Date.now()
        const coalesce = now - lastHistoryPushAt.current < historyCoalesceWindowMs
        lastHistoryPushAt.current = now
        setHistory((current) => {
          const trimmed = current.slice(0, historyIndexRef.current + 1)
          const result =
            coalesce && trimmed.length ? [...trimmed.slice(0, -1), copy] : [...trimmed, copy]
          const bounded = result.length > 80 ? result.slice(-80) : result
          const nextIndex = bounded.length - 1
          historyIndexRef.current = nextIndex
          setHistoryIndex(nextIndex)
          return bounded
        })
      }
      setSaveState('dirty')
    },
    [],
  )

  useEffect(() => {
    if (!frame?.contentWindow || document?._type !== 'sitePage') return
    latestBuilderState.current = {page: document, selectedSectionKey}
    // Trailing-edge throttle: the free-page canvas needs the live unsaved
    // document to preview edits as they happen, but posting (and structured-
    // cloning) the whole page on every single keystroke is wasted work once
    // typing is faster than the canvas can usefully redraw. Send immediately
    // if we haven't sent recently; otherwise let one already-scheduled send
    // pick up whatever is latest when its window closes.
    const throttleMs = 120
    const send = () => {
      const target = frame.contentWindow
      const payload = latestBuilderState.current
      if (!target || !payload) return
      builderStateLastSentAt.current = Date.now()
      target.postMessage({type: 'df4y:builder-state', ...payload}, window.location.origin)
    }
    const elapsed = Date.now() - builderStateLastSentAt.current
    if (elapsed >= throttleMs) {
      send()
    } else if (!builderStateTimer.current) {
      builderStateTimer.current = window.setTimeout(() => {
        builderStateTimer.current = undefined
        send()
      }, throttleMs - elapsed)
    }
  }, [document, frame, selectedSectionKey])

  useEffect(() => () => window.clearTimeout(builderStateTimer.current), [])

  const openDocument = useCallback(
    async (node: SiteEditorNode, path?: string) => {
      if (!node.documentId || !node.documentType) return

      const switchingDocument =
        !documentRef.current ||
        normalizeEditorDocumentId(documentRef.current._id) !==
          normalizeEditorDocumentId(node.documentId)

      if (switchingDocument && dirtyVersion.current > savedVersion.current) {
        // An edit is still sitting in the autosave debounce window on the document
        // we're about to leave — flush it now, otherwise fetching the new document
        // below overwrites documentRef.current and silently discards it.
        await saveNowRef.current?.().catch(() => undefined)
      }

      const previousNode = selectedNodeRef.current
      selectedNodeRef.current = node
      setSelectedNode(node)
      setArea(node.area)
      const normalizedSelectedPath = path ? normalizePath(path) : undefined
      setSelectedPath(normalizedSelectedPath)
      setSelectedSectionKey(
        normalizedSelectedPath ? sectionKeyFromPath(normalizedSelectedPath) : undefined,
      )

      if (!switchingDocument) {
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
        savedVersion.current = dirtyVersion.current
        previewNeedsRefresh.current = false
        setSaveState('idle')
      } catch (error) {
        selectedNodeRef.current = previousNode
        setSelectedNode(previousNode)
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

  const selectSidebarNode = useCallback(
    (node: SiteEditorNode) => {
      // Global content and Loja categories open straight into settings (there's
      // no canvas element to click for them); everything else closes both
      // drawers so the canvas itself stays directly hoverable/clickable.
      clearCanvasSelection(false)
      setInspectorMode('all')
      const keepNavigationOpen = node.documentType === 'storeCategory'
      if (!keepNavigationOpen) setNavigationOpen(false)
      void openDocument(node).then(() => {
        if (node.kind === 'global' || keepNavigationOpen) setSettingsOpen(true)
      })
    },
    [clearCanvasSelection, openDocument],
  )

  const closeSidebar = useCallback(() => setNavigationOpen(false), [])

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

  const refreshManifest = useCallback(
    async (preferredDocumentId?: string) => {
      const next = await api.manifest()
      setManifest(next)
      const current = selectedNodeRef.current
      const target =
        (current ? next.nodes.find((node) => node.id === current.id) : undefined) ??
        (preferredDocumentId
          ? next.nodes.find(
              (node) =>
                node.documentId &&
                normalizeEditorDocumentId(node.documentId) ===
                  normalizeEditorDocumentId(preferredDocumentId),
            )
          : undefined)
      if (target) {
        selectedNodeRef.current = target
        setSelectedNode(target)
        setArea(target.area)
      }
      return target
    },
    [api],
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
    if (publishing.current) await publishing.current.catch(() => undefined)
    const current = documentRef.current
    if (!current || !canWrite) {
      if (!canWrite) pushNotice({tone: 'warning', title: 'O editor está em modo de leitura'})
      throw new Error('Não existe acesso de escrita.')
    }
    if (saving.current) await saving.current

    const latestBeforeSave = documentRef.current
    if (!latestBeforeSave) throw new Error('Não existe conteúdo para guardar.')
    if (savedVersion.current >= dirtyVersion.current) return latestBeforeSave

    const version = dirtyVersion.current
    const value = snapshot(latestBeforeSave)
    const refreshPreview = previewNeedsRefresh.current
    if (refreshPreview) previewNeedsRefresh.current = false
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
      savedVersion.current = Math.max(savedVersion.current, version)
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
      if (refreshPreview) {
        frame?.contentWindow?.postMessage(
          {
            type: 'df4y:site-editor:refresh-preview',
            documentId: saved._id,
            revision: saved._rev,
          },
          window.location.origin,
        )
      }
      return saved
    } catch (error) {
      if (refreshPreview) previewNeedsRefresh.current = true
      const message = error instanceof Error ? error.message : 'Não foi possível guardar.'
      const conflict = /conflito|alterado noutra|recarregue|revision/i.test(message)
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
    saveNowRef.current = saveNow
  }, [saveNow])

  useEffect(() => {
    if (saveState !== 'dirty') return
    const timer = window.setTimeout(() => void saveNow().catch(() => undefined), 650)
    return () => window.clearTimeout(timer)
  }, [document, saveNow, saveState])

  useEffect(() => {
    const protectUnsavedChanges = (event: BeforeUnloadEvent) => {
      if (!['dirty', 'saving', 'error', 'conflict'].includes(saveState)) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', protectUnsavedChanges)
    return () => window.removeEventListener('beforeunload', protectUnsavedChanges)
  }, [saveState])

  const publish = useCallback(async () => {
    if (!canPublish || !documentRef.current) {
      pushNotice({tone: 'warning', title: 'Apenas administradores podem publicar'})
      return
    }
    if (publishing.current) return
    window.clearTimeout(publishResetTimer.current)
    setPublishState('publishing')
    try {
      await saveNow()
      const value = snapshot(documentRef.current!)
      const version = dirtyVersion.current
      const request = api.publish(value)
      publishing.current = request
      const published = await request
      const latest = documentRef.current
      const hasNewerChanges = dirtyVersion.current !== version
      const copy = hasNewerChanges && latest
        ? {
            ...latest,
            _id: published._id,
            _rev: published._rev,
            _createdAt: published._createdAt,
            _updatedAt: published._updatedAt,
          }
        : snapshot(published)
      documentRef.current = copy
      setDocument(copy)
      savedVersion.current = version
      if (hasNewerChanges) {
        setSaveState('dirty')
      } else {
        setHistory([snapshot(copy)])
        setHistoryIndex(0)
        historyIndexRef.current = 0
        setSaveState('saved')
      }
      try {
        await refreshManifest(published._id)
      } catch {
        setManifest((current) =>
          current
            ? {
                ...current,
                nodes: current.nodes.map((node) =>
                  node.documentId &&
                  normalizeEditorDocumentId(node.documentId) ===
                    normalizeEditorDocumentId(published._id)
                    ? {...node, draft: false, updatedAt: published._updatedAt}
                    : node,
                ),
              }
            : current,
        )
      }
      setPublishState('published')
      publishResetTimer.current = window.setTimeout(() => setPublishState('idle'), 1800)
      pushNotice({
        tone: 'success',
        title: 'Alterações publicadas',
        description: 'A versão pública do site já está atualizada',
      })
    } catch (error) {
      setPublishState('idle')
      pushNotice({
        tone: 'error',
        title: 'Não foi possível publicar',
        description: error instanceof Error ? error.message : undefined,
      })
    } finally {
      publishing.current = null
    }
  }, [api, canPublish, pushNotice, refreshManifest, saveNow])

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
    previewNeedsRefresh.current = true
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
    previewNeedsRefresh.current = true
    setSaveState('dirty')
  }, [history])

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return
      if (event.key.toLowerCase() === 's') {
        event.preventDefault()
        void saveNow().catch(() => undefined)
        return
      }
      if (event.key.toLowerCase() !== 'z') return
      // Let a focused text input keep its own native undo/redo (e.g. mid-word,
      // before the field has even committed a change) instead of hijacking the
      // keystroke for whole-document history, which uses coarser checkpoints.
      const target = event.target as HTMLElement | null
      const tag = target?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return
      event.preventDefault()
      if (event.shiftKey) redo()
      else undo()
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
      const canPatchPreview = current._type === 'sitePage' || Boolean(appearancePath) || typeof value === 'string'
      if (canPatchPreview && current._type !== 'sitePage') {
        frame?.contentWindow?.postMessage(
          {
            type: 'df4y:site-editor:preview-patch',
            documentId: next._id,
            path: patchPath,
            value: patchValue,
          },
          window.location.origin,
        )
      }
      // DOM patches make text feel immediate, but the Svelte page still owns
      // server-loaded data. Reconcile every non-builder preview after save so
      // a later component update can never restore the stale value.
      replaceDocument(next, record, current._type === 'sitePage')
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

      if (event.data.type === 'df4y:builder-ready') {
        const current = documentRef.current
        if (current?._type === 'sitePage') {
          frame.contentWindow?.postMessage(
            {type: 'df4y:builder-state', page: current, selectedSectionKey},
            window.location.origin,
          )
        }
        return
      }

      if (event.data.type === 'df4y:builder-select') {
        if (documentRef.current?._type !== 'sitePage') return
        inlineEditing.current = false
        fieldStateRef.current = undefined
        setSelectedPath(undefined)
        setSelectedSectionKey(String(event.data.sectionKey || '') || undefined)
        setInspectorMode('focused')
        setSettingsOpen(true)
        return
      }

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
    selectedSectionKey,
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
      if (deleteState.open) {
        if (!deleteState.busy) setDeleteState({open: false, busy: false})
      } else if (createState.open) {
        if (!createState.busy) setCreateState(initialCreateState)
      } else if (settingsOpen) clearCanvasSelection()
      else if (navigationOpen) setNavigationOpen(false)
    }
    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [
    clearCanvasSelection,
    createState.busy,
    createState.open,
    deleteState.busy,
    deleteState.open,
    navigationOpen,
    settingsOpen,
  ])

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
    savedVersion.current = dirtyVersion.current
    previewNeedsRefresh.current = false
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
    if (!current) return
    setDeleteState({open: true, busy: true})
    try {
      await api.delete(current._id)
      documentRef.current = undefined
      selectedNodeRef.current = undefined
      setDocument(undefined)
      setSelectedNode(undefined)
      // refreshManifest (unlike loadManifest) has no page-home fallback, so with
      // the selection already cleared above it just refreshes the list without
      // reopening the inspector on an unrelated node or switching the left panel's
      // active tab away from wherever the user was.
      await refreshManifest()
      setDeleteState({open: false, busy: false})
      pushNotice({tone: 'success', title: 'Conteúdo eliminado'})
    } catch (error) {
      setDeleteState({open: true, busy: false})
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

  const createDocumentType = createState.documentType as CreatableDocumentType
  const createDetails = createTypeDetails[createDocumentType]
  const createTitle =
    createDocumentType === 'sitePage'
      ? 'Criar uma página'
      : createState.fixedType
        ? `Adicionar ${typeLabels[createDocumentType].toLocaleLowerCase('pt')}`
        : 'Adicionar conteúdo'

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

        <div
          className={`site-editor-top-save is-${saveState}`}
          aria-live="polite"
          title={saveLabels[saveState]}
        >
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
            className={`site-editor-publish-button is-${publishState}`}
            type="button"
            disabled={!canPublish || publishState === 'publishing'}
            aria-busy={publishState === 'publishing'}
            onClick={() => void publish()}
          >
            {publishState === 'publishing' ? (
              <i className="site-editor-button-spinner" aria-hidden="true" />
            ) : publishState === 'published' ? (
              <CheckmarkIcon />
            ) : (
              <PublishIcon />
            )}{' '}
            <span>
              {publishState === 'publishing'
                ? 'A publicar…'
                : publishState === 'published'
                  ? 'Publicado'
                  : 'Publicar'}
            </span>
          </button>
        </div>
      </header>

      <section className="site-editor-main">
        <SiteEditorCanvas
          route={selectedNode?.route || previewRouteRef.current}
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
          onSelect={selectSidebarNode}
          onCreate={openCreate}
          onClose={closeSidebar}
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
          onReplace={(next) => replaceDocument(next, true, next._type === 'sitePage')}
          onSelectSection={setSelectedSectionKey}
          onUpload={async (file, kind, onProgress) =>
            (await api.uploadAsset(file, kind, onProgress)).asset
          }
          onDelete={() => setDeleteState({open: true, busy: false})}
          onShowAll={() => setInspectorMode('all')}
          onOpenNode={(node, path) => {
            setInspectorMode(path ? 'focused' : 'all')
            void openDocument(node, path)
          }}
        />
      </aside>

      {notice ? (
        <div
          className={`site-editor-notice is-${notice.tone}${notice.closing ? ' is-closing' : ''}`}
          role={notice.tone === 'error' ? 'alert' : 'status'}
          aria-atomic="true"
        >
          <span>
            <strong>{notice.title}</strong>
            {notice.description ? <small>{notice.description}</small> : null}
          </span>
          <button
            type="button"
            onClick={() => dismissNotice(notice.id)}
            aria-label="Fechar notificação"
          >
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
            role="dialog"
            aria-modal="true"
            aria-labelledby="site-editor-create-title"
            onSubmit={(event) => {
              event.preventDefault()
              void createDocument()
            }}
          >
            <div className="site-editor-modal-head">
              <div>
                <small>{typeLabels[createDocumentType]}</small>
                <strong id="site-editor-create-title">{createTitle}</strong>
                <p>{createDetails.description}</p>
              </div>
              <button
                type="button"
                onClick={() => setCreateState(initialCreateState)}
                aria-label="Fechar"
              >
                <CloseIcon />
              </button>
            </div>
            <div className="site-editor-modal-body">
              {area === 'content' && !createState.fixedType ? (
                <fieldset className="site-editor-create-types">
                  <legend>O que quer criar?</legend>
                  <div>
                    {contentCreateTypes.map((type) => (
                      <button
                        key={type}
                        type="button"
                        className={type === createDocumentType ? 'is-active' : undefined}
                        aria-label={typeLabels[type]}
                        aria-pressed={type === createDocumentType}
                        onClick={() =>
                          setCreateState((current) => ({...current, documentType: type}))
                        }
                      >
                        <i aria-hidden="true">
                          <CreateTypeIcon type={type} />
                        </i>
                        <span>
                          <strong>{typeLabels[type]}</strong>
                          <small>{createTypeDetails[type].description}</small>
                        </span>
                      </button>
                    ))}
                  </div>
                </fieldset>
              ) : null}
              <div className="site-editor-create-fields">
                <label>
                  <span>{createDetails.nameLabel}</span>
                  <input
                    aria-label="Nome"
                    autoFocus
                    required
                    minLength={2}
                    maxLength={100}
                    placeholder={createDetails.placeholder}
                    value={createState.title}
                    onChange={(event) => {
                      const title = event.currentTarget.value
                      setCreateState((current) => ({...current, title}))
                    }}
                  />
                </label>
                {createDocumentType === 'sitePage' ? (
                  <label>
                    <span>Endereço da página</span>
                    <input
                      aria-label="Endereço"
                      placeholder="Criado automaticamente a partir do nome"
                      value={createState.route}
                      onChange={(event) => {
                        const route = event.currentTarget.value
                        setCreateState((current) => ({...current, route}))
                      }}
                    />
                    <small>Opcional. Só precisa de alterar se quiser outro endereço</small>
                  </label>
                ) : null}
              </div>
              {createState.error ? (
                <p className="site-editor-modal-error">{createState.error}</p>
              ) : null}
            </div>
            <div className="site-editor-modal-actions">
              <small>Depois de criar, pode completar tudo antes de publicar</small>
              <span>
                <button type="button" onClick={() => setCreateState(initialCreateState)}>
                  Cancelar
                </button>
                <button type="submit" disabled={createState.busy}>
                  {createState.busy ? 'A criar…' : 'Criar e editar'}
                </button>
              </span>
            </div>
          </form>
        </div>
      ) : null}
      <ConfirmDialog
        open={deleteState.open}
        busy={deleteState.busy}
        title={`Eliminar “${selectedNode?.title || 'este conteúdo'}”?`}
        description="Esta ação remove o conteúdo do editor e do site depois de publicado. Não pode ser anulada."
        onCancel={() => setDeleteState({open: false, busy: false})}
        onConfirm={() => void deleteDocument()}
      />
    </div>
  )
}

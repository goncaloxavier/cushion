import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {CogIcon} from '@sanity/icons/Cog'
import {DesktopIcon} from '@sanity/icons/Desktop'
import {MobileDeviceIcon} from '@sanity/icons/MobileDevice'
import {PublishIcon} from '@sanity/icons/Publish'
import {RedoIcon} from '@sanity/icons/Redo'
import {RefreshIcon} from '@sanity/icons/Refresh'
import {TabletDeviceIcon} from '@sanity/icons/TabletDevice'
import {UndoIcon} from '@sanity/icons/Undo'
import {BuilderInspector} from './BuilderInspector'
import {BuilderPreviewFrame} from './BuilderPreviewFrame'
import {BuilderSidebar} from './BuilderSidebar'
import {
  createBuilderKey,
  createBuilderPage,
  createBuilderSection,
  createBuilderSiteSettings,
  duplicateBuilderSection,
} from '../defaults'
import {publishedBuilderId} from '../sanityDocuments'
import {createStandaloneBuilderApi} from './standaloneApi'
import type {
  BuilderMedia,
  BuilderPage,
  BuilderSaveState,
  BuilderSection,
  BuilderSectionType,
  BuilderSiteSettings,
  BuilderViewport,
} from '../types'
import {hasBuilderErrors, validateBuilderPage, validateBuilderSettings} from '../validation'
import './websiteBuilder.css'

type InspectorScope = 'page' | 'section' | 'site'
type PreviewMode = 'legacy' | 'builder'

type StandaloneWebsiteBuilderProps = {
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

const sameDocument = (left: string, right?: string) =>
  publishedBuilderId(left) === (right ? publishedBuilderId(right) : '')

const snapshot = <T,>(value: T): T => structuredClone(value)

const saveLabel: Record<BuilderSaveState, string> = {
  idle: 'Guardado',
  dirty: 'Alterações por guardar',
  saving: 'A guardar…',
  saved: 'Guardado',
  error: 'Erro ao guardar',
  conflict: 'Conflito de edição',
}

export function StandaloneWebsiteBuilder({
  csrfToken,
  previewReady,
  initialCanPublish,
}: StandaloneWebsiteBuilderProps) {
  const api = useMemo(() => createStandaloneBuilderApi(csrfToken), [csrfToken])
  const [pages, setPages] = useState<BuilderPage[]>([])
  const [page, setPage] = useState<BuilderPage>()
  const pageRef = useRef<BuilderPage>()
  const [settings, setSettings] = useState<BuilderSiteSettings>()
  const [selectedSectionKey, setSelectedSectionKey] = useState<string>()
  const [scope, setScope] = useState<InspectorScope>('page')
  const [viewport, setViewport] = useState<BuilderViewport>('desktop')
  const [previewMode, setPreviewMode] = useState<PreviewMode>('builder')
  const [saveState, setSaveState] = useState<BuilderSaveState>('idle')
  const [settingsDirty, setSettingsDirty] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string>()
  const [uploadState, setUploadState] = useState<string>()
  const [history, setHistory] = useState<BuilderPage[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [canPublish, setCanPublish] = useState(initialCanPublish)
  const [notice, setNotice] = useState<Notice>()
  const noticeId = useRef(0)
  const savingPage = useRef<Promise<BuilderPage> | null>(null)

  const pushNotice = useCallback(
    (next: Omit<Notice, 'id'>) => {
      const value = {...next, id: ++noticeId.current}
      setNotice(value)
      window.setTimeout(() => {
        setNotice((current) => (current?.id === value.id ? undefined : current))
      }, 4200)
    },
    [],
  )

  const selectPage = useCallback((next: BuilderPage) => {
    const copy = snapshot(next)
    setPage(copy)
    pageRef.current = copy
    setHistory([snapshot(copy)])
    setHistoryIndex(0)
    setSelectedSectionKey(undefined)
    setScope('page')
    setSaveState('idle')
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(undefined)
    try {
      const next = await api.load()
      setPages(next.pages)
      setSettings(next.settings ?? createBuilderSiteSettings())
      setCanPublish(next.canPublish)

      if (next.pages.length) {
        const selected = pageRef.current
          ? next.pages.find((candidate) => sameDocument(candidate._id, pageRef.current?._id))
          : next.pages[0]
        selectPage(selected ?? next.pages[0])
      } else {
        setPage(undefined)
        pageRef.current = undefined
        setHistory([])
        setHistoryIndex(-1)
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Não foi possível abrir o gestor.')
    } finally {
      setLoading(false)
    }
  }, [api, selectPage])

  useEffect(() => {
    void load()
  }, [load])

  const recordPage = useCallback(
    (next: BuilderPage) => {
      const copy = snapshot(next)
      setPage(copy)
      pageRef.current = copy
      setHistory((current) => {
        const trimmed = current.slice(0, historyIndex + 1)
        const nextHistory = [...trimmed, snapshot(copy)]
        return nextHistory.length <= 60 ? nextHistory : nextHistory.slice(-60)
      })
      setHistoryIndex((current) => Math.min(current + 1, 59))
      setSaveState('dirty')
    },
    [historyIndex],
  )

  const savePageNow = useCallback(async () => {
    const current = pageRef.current
    if (!current) throw new Error('Não existe uma página selecionada.')
    if (savingPage.current) await savingPage.current

    setSaveState('saving')
    const request = api.savePage(current)
    savingPage.current = request
    try {
      const saved = await request
      setPages((items) => {
        const exists = items.some((item) => sameDocument(item._id, saved._id))
        const next = exists
          ? items.map((item) => (sameDocument(item._id, saved._id) ? saved : item))
          : [...items, saved]
        return next.sort((left, right) => left.route.localeCompare(right.route, 'pt'))
      })
      setPage((currentPage) => {
        if (!currentPage || !sameDocument(currentPage._id, saved._id)) return currentPage
        const merged = {
          ...currentPage,
          _id: saved._id,
          _rev: saved._rev,
          _createdAt: saved._createdAt,
          _updatedAt: saved._updatedAt,
        }
        pageRef.current = merged
        return merged
      })
      setSaveState((state) => (state === 'dirty' ? 'dirty' : 'saved'))
      return saved
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível guardar.'
      const conflict = /conflito|alterado noutro|revision/i.test(message)
      setSaveState(conflict ? 'conflict' : 'error')
      pushNotice({
        tone: conflict ? 'warning' : 'error',
        title: conflict ? 'Conflito de edição' : 'Não foi possível guardar',
        description: message,
      })
      throw error
    } finally {
      savingPage.current = null
    }
  }, [api, pushNotice])

  useEffect(() => {
    if (saveState !== 'dirty' || !page) return
    const timer = window.setTimeout(() => void savePageNow().catch(() => undefined), 850)
    return () => window.clearTimeout(timer)
  }, [page, savePageNow, saveState])

  useEffect(() => {
    if (!settingsDirty || !settings || !canPublish) return
    const timer = window.setTimeout(async () => {
      try {
        const saved = await api.saveSettings(settings)
        setSettings((current) => (current ? {...current, ...saved} : saved))
        setSettingsDirty(false)
      } catch (error) {
        pushNotice({
          tone: 'error',
          title: 'Não foi possível guardar as definições',
          description: error instanceof Error ? error.message : undefined,
        })
      }
    }, 850)
    return () => window.clearTimeout(timer)
  }, [api, canPublish, pushNotice, settings, settingsDirty])

  const updateSettings = useCallback(
    (next: BuilderSiteSettings) => {
      if (!canPublish) {
        pushNotice({tone: 'warning', title: 'Apenas administradores alteram o tema global'})
        return
      }
      setSettings(snapshot(next))
      setSettingsDirty(true)
    },
    [canPublish, pushNotice],
  )

  const undo = useCallback(() => {
    if (historyIndex <= 0) return
    const nextIndex = historyIndex - 1
    const next = snapshot(history[nextIndex])
    const current = pageRef.current
    if (current) {
      next._id = current._id
      next._rev = current._rev
      next._createdAt = current._createdAt
      next._updatedAt = current._updatedAt
    }
    setHistoryIndex(nextIndex)
    setPage(next)
    pageRef.current = next
    setSaveState('dirty')
  }, [history, historyIndex])

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return
    const nextIndex = historyIndex + 1
    const next = snapshot(history[nextIndex])
    const current = pageRef.current
    if (current) {
      next._id = current._id
      next._rev = current._rev
      next._createdAt = current._createdAt
      next._updatedAt = current._updatedAt
    }
    setHistoryIndex(nextIndex)
    setPage(next)
    pageRef.current = next
    setSaveState('dirty')
  }, [history, historyIndex])

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return
      if (event.key.toLowerCase() === 's') {
        event.preventDefault()
        void savePageNow().catch(() => undefined)
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
  }, [redo, savePageNow, undo])

  const selectedSection = page?.sections.find((section) => section._key === selectedSectionKey)
  const pageIssues = useMemo(() => (page ? validateBuilderPage(page, pages) : []), [page, pages])
  const settingsIssues = useMemo(
    () => (settings ? validateBuilderSettings(settings) : []),
    [settings],
  )

  const updateSection = useCallback(
    (nextSection: BuilderSection) => {
      const current = pageRef.current
      if (!current) return
      recordPage({
        ...current,
        sections: current.sections.map((section) =>
          section._key === nextSection._key ? nextSection : section,
        ),
      })
    },
    [recordPage],
  )

  const uploadAsset = useCallback(
    async (file: File, kind: 'image' | 'video') => {
      const response = await api.uploadAsset(file, kind)
      return response.asset
    },
    [api],
  )

  const uploadSectionMedia = useCallback(
    async (file: File, kind: 'image' | 'video') => {
      const sectionKey = selectedSectionKey
      if (!sectionKey) return
      setUploadState('A carregar…')
      try {
        const asset = await uploadAsset(file, kind)
        const current = pageRef.current
        const section = current?.sections.find((item) => item._key === sectionKey)
        if (!current || !section) return
        const media: BuilderMedia = {
          ...section.media,
          _type: 'builderMedia',
          kind,
          fit: section.media?.fit ?? 'cover',
          position: section.media?.position ?? 'center',
          ...(kind === 'image'
            ? {image: {_type: 'image', asset: {_type: 'reference', _ref: asset.id}}}
            : {videoFile: {_type: 'file', asset: {_type: 'reference', _ref: asset.id}}}),
        }
        updateSection({...section, media})
        setUploadState('Carregado')
      } catch (error) {
        setUploadState(error instanceof Error ? error.message : 'Falha no carregamento')
      }
    },
    [selectedSectionKey, updateSection, uploadAsset],
  )

  const uploadGalleryMedia = useCallback(
    async (files: FileList) => {
      const sectionKey = selectedSectionKey
      if (!sectionKey) return
      const selectedFiles = Array.from(files).slice(0, 20)
      setUploadState(`A carregar 0/${selectedFiles.length}…`)
      const uploaded: BuilderMedia[] = []
      try {
        for (let index = 0; index < selectedFiles.length; index += 1) {
          const file = selectedFiles[index]
          const kind = file.type.startsWith('video/') ? 'video' : 'image'
          const asset = await uploadAsset(file, kind)
          uploaded.push({
            _type: 'builderMedia',
            _key: createBuilderKey(),
            kind,
            fit: 'contain',
            position: 'center',
            alt: {_type: 'localizedString', pt: ''},
            ...(kind === 'image'
              ? {image: {_type: 'image', asset: {_type: 'reference', _ref: asset.id}}}
              : {
                  videoFile: {_type: 'file', asset: {_type: 'reference', _ref: asset.id}},
                  muted: true,
                  controls: true,
                }),
          })
          setUploadState(`A carregar ${index + 1}/${selectedFiles.length}…`)
        }
        const section = pageRef.current?.sections.find((item) => item._key === sectionKey)
        if (section) updateSection({...section, items: [...(section.items ?? []), ...uploaded]})
        setUploadState('Carregado')
      } catch (error) {
        setUploadState(error instanceof Error ? error.message : 'Falha no carregamento')
      }
    },
    [selectedSectionKey, updateSection, uploadAsset],
  )

  const publish = useCallback(async () => {
    if (!canPublish) {
      pushNotice({tone: 'warning', title: 'Apenas administradores podem publicar'})
      return
    }

    if (scope === 'site') {
      if (!settings) return
      if (hasBuilderErrors(settingsIssues)) {
        pushNotice({tone: 'warning', title: 'Corrija os erros antes de publicar'})
        return
      }
      try {
        const published = await api.publishSettings(settings)
        setSettings(published)
        setSettingsDirty(false)
        pushNotice({tone: 'success', title: 'Definições publicadas'})
      } catch (error) {
        pushNotice({
          tone: 'error',
          title: 'Não foi possível publicar',
          description: error instanceof Error ? error.message : undefined,
        })
      }
      return
    }

    const current = pageRef.current
    if (!current) return
    if (hasBuilderErrors(validateBuilderPage(current, pages))) {
      pushNotice({tone: 'warning', title: 'Corrija os erros antes de publicar'})
      return
    }

    try {
      const saved = await savePageNow()
      const published = await api.publishPage(saved)
      setPages((items) =>
        items.map((item) => (sameDocument(item._id, published._id) ? published : item)),
      )
      selectPage(published)
      pushNotice({tone: 'success', title: 'Página publicada'})
    } catch (error) {
      pushNotice({
        tone: 'error',
        title: 'Não foi possível publicar',
        description: error instanceof Error ? error.message : undefined,
      })
    }
  }, [api, canPublish, pages, pushNotice, savePageNow, scope, selectPage, settings, settingsIssues])

  if (loading) {
    return (
      <div className="df4y-builder-loading">
        <span />
        <strong>A preparar o gestor do site…</strong>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="df4y-builder-empty">
        <strong>Não foi possível abrir o gestor do site</strong>
        <p>{loadError}</p>
        <button type="button" onClick={() => void load()}>
          <RefreshIcon /> Tentar novamente
        </button>
      </div>
    )
  }

  if (!page) {
    return (
      <div className="df4y-builder-empty">
        <span className="df4y-builder-empty-mark">DF4Y</span>
        <strong>Comece pela primeira página</strong>
        <p>O site público continua intacto enquanto prepara o novo renderer.</p>
        <button
          type="button"
          onClick={() => {
            const next = createBuilderPage(1)
            setPages([next])
            selectPage(next)
            setSaveState('dirty')
          }}
        >
          Criar página inicial
        </button>
      </div>
    )
  }

  return (
    <div className="df4y-builder-shell is-standalone">
      <header className="df4y-builder-toolbar">
        <div className="df4y-builder-toolbar-brand">
          <a className="df4y-builder-back" href="/painel/pedidos" aria-label="Voltar ao backoffice">
            <span aria-hidden="true">←</span>
          </a>
          <div>
            <strong>Gestor do site</strong>
            <small>
              {page.title} · {page.route}
            </small>
          </div>
        </div>

        <div className="df4y-builder-toolbar-preview">
          <div className="df4y-builder-preview-mode" aria-label="Versão da pré-visualização">
            <button
              className={previewMode === 'legacy' ? 'is-active' : ''}
              type="button"
              onClick={() => setPreviewMode('legacy')}
            >
              Site atual
            </button>
            <button
              className={previewMode === 'builder' ? 'is-active' : ''}
              type="button"
              onClick={() => setPreviewMode('builder')}
            >
              Construtor
            </button>
          </div>
          <div className="df4y-builder-toolbar-center" aria-label="Tamanho da pré-visualização">
            <button className={viewport === 'desktop' ? 'is-active' : ''} type="button" title="Computador" onClick={() => setViewport('desktop')}>
              <DesktopIcon />
            </button>
            <button className={viewport === 'tablet' ? 'is-active' : ''} type="button" title="Tablet" onClick={() => setViewport('tablet')}>
              <TabletDeviceIcon />
            </button>
            <button className={viewport === 'mobile' ? 'is-active' : ''} type="button" title="Telemóvel" onClick={() => setViewport('mobile')}>
              <MobileDeviceIcon />
            </button>
          </div>
        </div>

        <div className="df4y-builder-toolbar-actions">
          <span className={`df4y-builder-save-state is-${saveState}`}><i />{saveLabel[saveState]}</span>
          <button type="button" onClick={undo} disabled={historyIndex <= 0} title="Desfazer"><UndoIcon /></button>
          <button type="button" onClick={redo} disabled={historyIndex >= history.length - 1} title="Refazer"><RedoIcon /></button>
          <button
            className={scope === 'site' ? 'is-active' : ''}
            type="button"
            onClick={() => {
              if (!canPublish) {
                pushNotice({tone: 'warning', title: 'Apenas administradores alteram o tema global'})
                return
              }
              setScope(scope === 'site' ? 'page' : 'site')
              setSelectedSectionKey(undefined)
            }}
            title="Tema e navegação"
          >
            <CogIcon />
          </button>
          <button
            className="df4y-builder-publish"
            type="button"
            onClick={() => void publish()}
            disabled={!canPublish || saveState === 'saving' || (scope === 'site' ? hasBuilderErrors(settingsIssues) : hasBuilderErrors(pageIssues))}
          >
            <PublishIcon /> Publicar
          </button>
        </div>
      </header>

      <div className="df4y-builder-workspace">
        <BuilderSidebar
          pages={pages}
          page={page}
          selectedPageId={page._id}
          selectedSectionKey={selectedSectionKey}
          onSelectPage={(id) => {
            const next = pages.find((item) => sameDocument(item._id, id))
            if (next) selectPage(next)
          }}
          onCreatePage={() => {
            const next = createBuilderPage(pages.length + 1)
            setPages((items) => [...items, next])
            selectPage(next)
            setSaveState('dirty')
          }}
          onDeletePage={() => {
            if (!canPublish) {
              pushNotice({tone: 'warning', title: 'Apenas administradores podem eliminar páginas'})
              return
            }
            if (!window.confirm(`Eliminar “${page.title}”? Esta ação remove o rascunho e a versão publicada.`)) return
            void api.deletePage(page._id).then(load).catch((error) => pushNotice({tone: 'error', title: 'Não foi possível eliminar', description: error instanceof Error ? error.message : undefined}))
          }}
          onSelectSection={(key) => {setSelectedSectionKey(key); setScope('section'); setPreviewMode('builder')}}
          onAddSection={(type: BuilderSectionType) => {
            const section = createBuilderSection(type)
            recordPage({...pageRef.current!, sections: [...pageRef.current!.sections, section]})
            setSelectedSectionKey(section._key)
            setScope('section')
            setPreviewMode('builder')
          }}
          onDuplicateSection={(key) => {
            const current = pageRef.current!
            const index = current.sections.findIndex((section) => section._key === key)
            if (index < 0) return
            const clone = duplicateBuilderSection(current.sections[index])
            const sections = [...current.sections]
            sections.splice(index + 1, 0, clone)
            recordPage({...current, sections})
            setSelectedSectionKey(clone._key)
          }}
          onMoveSection={(key, direction) => {
            const current = pageRef.current!
            const index = current.sections.findIndex((section) => section._key === key)
            const target = index + direction
            if (index < 0 || target < 0 || target >= current.sections.length) return
            const sections = [...current.sections]
            const [moved] = sections.splice(index, 1)
            sections.splice(target, 0, moved)
            recordPage({...current, sections})
          }}
          onReorderSection={(sourceKey, targetKey) => {
            const current = pageRef.current!
            const source = current.sections.findIndex((section) => section._key === sourceKey)
            const target = current.sections.findIndex((section) => section._key === targetKey)
            if (source < 0 || target < 0) return
            const sections = [...current.sections]
            const [moved] = sections.splice(source, 1)
            sections.splice(target, 0, moved)
            recordPage({...current, sections})
          }}
          onToggleSection={(key) => {
            const current = pageRef.current!
            recordPage({...current, sections: current.sections.map((section) => section._key === key ? {...section, enabled: section.enabled === false} : section)})
          }}
          onDeleteSection={(key) => {
            if (!window.confirm('Eliminar esta secção? Pode desfazer de imediato.')) return
            const current = pageRef.current!
            recordPage({...current, sections: current.sections.filter((section) => section._key !== key)})
            setSelectedSectionKey(undefined)
            setScope('page')
          }}
        />

        <main className="df4y-builder-stage">
          <div className="df4y-builder-stage-note">
            <span>{previewMode === 'legacy' ? 'Referência do site atual' : 'Pré-visualização editável'}</span>
            <small>{previewMode === 'legacy' ? 'Use para comparar antes de migrar.' : 'Clique numa secção para a editar.'}</small>
          </div>
          <BuilderPreviewFrame
            page={page}
            settings={settings}
            viewport={viewport}
            mode={previewMode}
            selectedSectionKey={selectedSectionKey}
            previewReady={previewReady}
            onSelectSection={(key) => {setSelectedSectionKey(key); setScope('section')}}
          />
        </main>

        <BuilderInspector
          scope={scope}
          page={page}
          section={selectedSection}
          settings={settings}
          issues={scope === 'site' ? settingsIssues : pageIssues}
          uploadState={uploadState}
          onUpdatePage={recordPage}
          onUpdateSection={updateSection}
          onUpdateSettings={updateSettings}
          onUploadSectionMedia={(file, kind) => void uploadSectionMedia(file, kind)}
          onUploadGalleryMedia={(files) => void uploadGalleryMedia(files)}
        />
      </div>

      {notice ? (
        <div className={`df4y-builder-notice is-${notice.tone}`} role={notice.tone === 'error' ? 'alert' : 'status'}>
          <strong>{notice.title}</strong>
          {notice.description ? <span>{notice.description}</span> : null}
          <button type="button" onClick={() => setNotice(undefined)} aria-label="Fechar">×</button>
        </div>
      ) : null}
    </div>
  )
}

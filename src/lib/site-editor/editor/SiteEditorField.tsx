import React, {useEffect, useMemo, useRef, useState} from 'react'
import {AddIcon} from '@sanity/icons/Add'
import {ArrowLeftIcon} from '@sanity/icons/ArrowLeft'
import {ArrowRightIcon} from '@sanity/icons/ArrowRight'
import {ArrowDownIcon} from '@sanity/icons/ArrowDown'
import {ArrowUpIcon} from '@sanity/icons/ArrowUp'
import {BoldIcon} from '@sanity/icons/Bold'
import {DesktopIcon} from '@sanity/icons/Desktop'
import {EditIcon} from '@sanity/icons/Edit'
import {ImageIcon} from '@sanity/icons/Image'
import {ImagesIcon} from '@sanity/icons/Images'
import {ItalicIcon} from '@sanity/icons/Italic'
import {LaunchIcon} from '@sanity/icons/Launch'
import {LinkIcon} from '@sanity/icons/Link'
import {MobileDeviceIcon} from '@sanity/icons/MobileDevice'
import {ResetIcon} from '@sanity/icons/Reset'
import {TrashIcon} from '@sanity/icons/Trash'
import {UploadIcon} from '@sanity/icons/Upload'
import {VideoIcon} from '@sanity/icons/Video'
import {getEditorValue} from '../path'
import type {SiteEditorDocumentType, SiteEditorField} from '../types'
import type {BuilderViewport} from '$lib/builder/types'
import {textAppearanceFields, type TextAppearance} from '$lib/text-appearance'
import {editorKey, sanityAssetUrl, slugify} from './asset'
import type {SiteEditorUploadProgress} from './api'
import {ConfirmDialog} from './ConfirmDialog'
import {MediaUploadProgress, type MediaUploadStatus} from './MediaUploadProgress'
import {Toggle} from './Toggle'

type Asset = {id: string; url: string}

type Props = {
  field: SiteEditorField
  path: string
  source: unknown
  documentType: SiteEditorDocumentType
  selectedPath?: string
  projectId: string
  dataset: string
  viewport: BuilderViewport
  onChange: (path: string, value: unknown) => void
  onUpload: (
    file: File,
    kind: 'image' | 'video',
    onProgress?: (progress: SiteEditorUploadProgress) => void,
  ) => Promise<Asset>
  onOpenArticle?: (field: SiteEditorField, path: string, trigger: HTMLButtonElement) => void
}

const fontOptions = [
  {value: '', label: 'Fonte original'},
  {value: 'space-grotesk', label: 'Space Grotesk'},
  {value: 'inter', label: 'Inter'},
  {value: 'arial', label: 'Arial'},
  {value: 'georgia', label: 'Georgia'},
  {value: 'times-new-roman', label: 'Times New Roman'},
]

const viewportSizeField: Record<BuilderViewport, keyof TextAppearance> = {
  desktop: 'fontSize',
  tablet: 'fontSizeTablet',
  mobile: 'fontSizeMobile',
}

const viewportNames: Record<BuilderViewport, string> = {
  desktop: 'computador',
  tablet: 'tablet',
  mobile: 'telemóvel',
}

function TextAppearanceEditor({
  value,
  viewport,
  onChange,
}: {
  value: Record<string, unknown>
  viewport: BuilderViewport
  onChange: (value: Record<string, unknown>) => void
}) {
  const sizeField = viewportSizeField[viewport]
  const patch = (field: keyof TextAppearance, next: unknown) => {
    const updated = {...value}
    if (next === '' || next === undefined || next === null) delete updated[field]
    else updated[field] = next
    onChange(updated)
  }

  const reset = () => {
    const updated = {...value}
    for (const field of textAppearanceFields) delete updated[field]
    onChange(updated)
  }

  return (
    <div className="site-editor-text-tools" aria-label="Aparência do texto">
      <select
        aria-label="Fonte"
        title="Fonte"
        value={String(value.fontFamily || '')}
        onChange={(event) => patch('fontFamily', event.currentTarget.value)}
      >
        {fontOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <label className="site-editor-font-size" title={`Tamanho no ${viewportNames[viewport]}`}>
        <span>px</span>
        <input
          type="number"
          min={10}
          max={120}
          inputMode="numeric"
          aria-label={`Tamanho no ${viewportNames[viewport]}`}
          value={typeof value[sizeField] === 'number' ? String(value[sizeField]) : ''}
          placeholder="Auto"
          onChange={(event) =>
            patch(sizeField, event.currentTarget.value ? Number(event.currentTarget.value) : '')
          }
        />
      </label>
      <button
        type="button"
        className={['bold', '700'].includes(String(value.fontWeight || '')) ? 'is-active' : ''}
        aria-label="Negrito"
        title="Negrito"
        onClick={() =>
          patch(
            'fontWeight',
            ['bold', '700'].includes(String(value.fontWeight || '')) ? '' : 'bold',
          )
        }
      >
        <BoldIcon />
      </button>
      <button
        type="button"
        className={value.fontStyle === 'italic' ? 'is-active' : ''}
        aria-label="Itálico"
        title="Itálico"
        onClick={() => patch('fontStyle', value.fontStyle === 'italic' ? '' : 'italic')}
      >
        <ItalicIcon />
      </button>
      <select
        aria-label="Alinhamento"
        title="Alinhamento"
        value={String(value.textAlign || '')}
        onChange={(event) => patch('textAlign', event.currentTarget.value)}
      >
        <option value="">Alinhar</option>
        <option value="left">Esquerda</option>
        <option value="center">Centro</option>
        <option value="right">Direita</option>
      </select>
      <select
        aria-label="Espaço entre linhas"
        title="Espaço entre linhas"
        value={String(value.lineHeight || '')}
        onChange={(event) => patch('lineHeight', event.currentTarget.value)}
      >
        <option value="">Linhas</option>
        <option value="compact">Compactas</option>
        <option value="normal">Normais</option>
        <option value="relaxed">Abertas</option>
      </select>
      <button type="button" aria-label="Repor aparência" title="Repor aparência" onClick={reset}>
        <ResetIcon />
      </button>
    </div>
  )
}

const localized = (value: unknown, type: 'localizedString' | 'localizedText') => ({
  ...(value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}),
  _type: type,
})

const arrayItemPath = (path: string, item: unknown, index: number) => {
  const key = item && typeof item === 'object' && '_key' in item ? String(item._key || '') : ''
  return key ? `${path}[_key=="${key.replace(/"/g, '\\"')}"]` : `${path}[${index}]`
}

const defaultObjectType = (path: string) => {
  if (path.endsWith('navigation')) return 'navigationItem'
  if (path.endsWith('variants')) return 'storeProductVariant'
  if (path.endsWith('stats') || path.endsWith('timeline')) return 'contentCard'
  if (path.endsWith('partners.items')) return 'partnerItem'
  return 'object'
}

const defaultValue = (field: SiteEditorField, path: string): unknown => {
  if (field.type === 'localizedString') return {_type: 'localizedString', pt: ''}
  if (field.type === 'localizedText') return {_type: 'localizedText', pt: ''}
  if (field.type === 'number') return field.min ?? 0
  if (field.type === 'boolean') return false
  if (
    field.type === 'array' ||
    field.type === 'gallery' ||
    field.type === 'navigation' ||
    field.type === 'sections'
  )
    return []
  if (field.type === 'slug') return {_type: 'slug', current: ''}
  if (field.type === 'object') {
    const value: Record<string, unknown> = {_type: defaultObjectType(path)}
    for (const child of field.fields ?? [])
      value[child.name] = defaultValue(child, `${path}.${child.name}`)
    return value
  }
  return ''
}

const arrayItemTitle = (item: unknown, index: number, fallback: string) => {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return `${fallback} ${index + 1}`
  const value = item as Record<string, unknown>
  const localizedCandidates = ['label', 'title', 'text']
  for (const key of localizedCandidates) {
    const candidate = value[key]
    if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
      const pt = String((candidate as Record<string, unknown>).pt || '').trim()
      if (pt) return pt
    }
  }
  const name = String(value.name || '').trim()
  return name || `${fallback} ${index + 1}`
}

function NavigationEditor({
  value,
  viewport,
  onChange,
}: {
  value: unknown
  viewport: BuilderViewport
  onChange: (value: unknown) => void
}) {
  const items = useMemo(
    () => (Array.isArray(value) ? (value as Array<Record<string, unknown>>) : []),
    [value],
  )
  const [activeKey, setActiveKey] = useState<string>()
  const [pendingRemovalIndex, setPendingRemovalIndex] = useState<number>()

  useEffect(() => {
    if (!items.length) {
      setActiveKey(undefined)
      return
    }
    if (!items.some((item, index) => String(item._key || index) === activeKey)) {
      setActiveKey(String(items[0]._key || 0))
    }
  }, [activeKey, items])

  const update = (index: number, next: Record<string, unknown>) => {
    const result = [...items]
    result[index] = next
    onChange(result)
  }

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= items.length) return
    const result = [...items]
    const [moved] = result.splice(index, 1)
    result.splice(target, 0, moved)
    onChange(result)
  }

  const add = () => {
    const key = editorKey()
    onChange([
      ...items,
      {
        _key: key,
        _type: 'navigationItem',
        label: {_type: 'localizedString', pt: 'Nova ligação'},
        href: '/',
        placement: 'primary',
        visibleDesktop: true,
        visibleMobile: true,
        newTab: false,
      },
    ])
    setActiveKey(key)
  }

  return (
    <div className="site-editor-navigation-manager">
      <div className="site-editor-navigation-list">
        {items.map((item, index) => {
          const key = String(item._key || index)
          const label = localized(item.label, 'localizedString')
          const active = activeKey === key
          const placement = item.placement === 'utility' ? 'Ação do cabeçalho' : 'Menu principal'
          return (
            <article key={key} className={active ? 'is-active' : ''}>
              <div className="site-editor-navigation-row">
                <button
                  type="button"
                  className="site-editor-navigation-summary"
                  onClick={() => setActiveKey(active ? undefined : key)}
                  aria-expanded={active}
                >
                  <LinkIcon />
                  <span>
                    <strong>{String(label.pt || `Ligação ${index + 1}`)}</strong>
                    <small>
                      {String(item.href || 'Sem destino')} · {placement}
                    </small>
                  </span>
                </button>
                <div className="site-editor-navigation-order">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    aria-label="Subir"
                    title="Subir"
                  >
                    <ArrowUpIcon />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === items.length - 1}
                    aria-label="Descer"
                    title="Descer"
                  >
                    <ArrowDownIcon />
                  </button>
                </div>
              </div>
              {active ? (
                <div className="site-editor-navigation-details">
                  <label>
                    <span>Nome</span>
                    <textarea
                      rows={2}
                      placeholder="Ex.: Sustentabilidade"
                      value={String(label.pt || '')}
                      onChange={(event) =>
                        update(index, {...item, label: {...label, pt: event.currentTarget.value}})
                      }
                    />
                  </label>
                  <TextAppearanceEditor
                    value={label}
                    viewport={viewport}
                    onChange={(next) => update(index, {...item, label: next})}
                  />
                  <label>
                    <span>Destino</span>
                    <input
                      value={String(item.href || '')}
                      placeholder="/loja"
                      onChange={(event) =>
                        update(index, {...item, href: event.currentTarget.value})
                      }
                    />
                  </label>
                  <div
                    className="site-editor-navigation-placement"
                    role="group"
                    aria-label="Zona da navegação"
                  >
                    <button
                      type="button"
                      className={item.placement !== 'utility' ? 'is-active' : ''}
                      onClick={() => update(index, {...item, placement: 'primary'})}
                    >
                      Menu
                    </button>
                    <button
                      type="button"
                      className={item.placement === 'utility' ? 'is-active' : ''}
                      onClick={() => update(index, {...item, placement: 'utility'})}
                    >
                      Ação
                    </button>
                  </div>
                  <div className="site-editor-navigation-switches">
                    <span>
                      <DesktopIcon /> Computador{' '}
                      <Toggle
                        checked={item.visibleDesktop !== false}
                        onChange={(checked) => update(index, {...item, visibleDesktop: checked})}
                      />
                    </span>
                    <span>
                      <MobileDeviceIcon /> Telemóvel{' '}
                      <Toggle
                        checked={item.visibleMobile !== false}
                        onChange={(checked) => update(index, {...item, visibleMobile: checked})}
                      />
                    </span>
                    <span>
                      <LaunchIcon /> Novo separador{' '}
                      <Toggle
                        checked={item.newTab === true}
                        onChange={(checked) => update(index, {...item, newTab: checked})}
                      />
                    </span>
                  </div>
                  <button
                    type="button"
                    className="site-editor-navigation-remove"
                    onClick={() => setPendingRemovalIndex(index)}
                  >
                    <TrashIcon /> Remover ligação
                  </button>
                </div>
              ) : null}
            </article>
          )
        })}
      </div>
      <button className="site-editor-array-add" type="button" onClick={add}>
        <AddIcon /> Adicionar ligação
      </button>
      <ConfirmDialog
        open={pendingRemovalIndex !== undefined}
        title="Remover esta ligação do menu?"
        description="Pode anular com Ctrl+Z antes de guardar."
        confirmLabel="Remover"
        onCancel={() => setPendingRemovalIndex(undefined)}
        onConfirm={() => {
          if (pendingRemovalIndex === undefined) return
          onChange(items.filter((_, itemIndex) => itemIndex !== pendingRemovalIndex))
          setPendingRemovalIndex(undefined)
        }}
      />
    </div>
  )
}

function ImageEditor({
  value,
  projectId,
  dataset,
  onChange,
  onUpload,
}: {
  value: unknown
  projectId: string
  dataset: string
  onChange: (value: unknown) => void
  onUpload: Props['onUpload']
}) {
  const [busy, setBusy] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<MediaUploadStatus>()
  const [pendingRemoval, setPendingRemoval] = useState(false)
  const image = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>
  const asset = image.asset as {_ref?: string} | undefined
  const url = sanityAssetUrl(asset?._ref, projectId, dataset)
  const alt = localized(image.alt, 'localizedString')

  const upload = async (file: File) => {
    setBusy(true)
    setUploadStatus({key: 'image', phase: 'preparing', fileName: file.name, percent: 0})
    try {
      const next = await onUpload(file, 'image', (progress) =>
        setUploadStatus({
          key: 'image',
          phase: progress.percent >= 100 ? 'processing' : 'uploading',
          fileName: file.name,
          percent: progress.percent,
        }),
      )
      setUploadStatus({key: 'image', phase: 'done', fileName: file.name, percent: 100})
      onChange({...image, _type: 'image', asset: {_type: 'reference', _ref: next.id}})
    } catch (error) {
      setUploadStatus({
        key: 'image',
        phase: 'error',
        fileName: file.name,
        percent: 0,
        message: error instanceof Error ? error.message : 'Não foi possível carregar o ficheiro',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="site-editor-image-field">
      {url ? (
        <img src={url} alt="" />
      ) : (
        <div className="site-editor-image-empty">
          <ImageIcon />
        </div>
      )}
      <div className="site-editor-media-actions">
        <label className="site-editor-upload-button">
          <UploadIcon /> {busy ? 'A carregar…' : url ? 'Substituir' : 'Carregar imagem'}
          <input
            type="file"
            accept="image/*"
            disabled={busy}
            onChange={(event) => {
              const file = event.currentTarget.files?.[0]
              if (file) void upload(file)
              event.currentTarget.value = ''
            }}
          />
        </label>
        {url ? (
          <button type="button" onClick={() => setPendingRemoval(true)}>
            <TrashIcon /> Remover
          </button>
        ) : null}
      </div>
      <MediaUploadProgress status={uploadStatus} />
      <label>
        <span>Descrição da imagem</span>
        <textarea
          rows={2}
          placeholder="Ex.: Banco em plástico reciclado num jardim público"
          value={String(alt.pt || '')}
          onChange={(event) => onChange({...image, alt: {...alt, pt: event.currentTarget.value}})}
        />
      </label>
      <ConfirmDialog
        open={pendingRemoval}
        title="Remover esta imagem?"
        description="Pode anular com Ctrl+Z antes de guardar."
        confirmLabel="Remover"
        onCancel={() => setPendingRemoval(false)}
        onConfirm={() => {
          onChange(null)
          setPendingRemoval(false)
        }}
      />
    </div>
  )
}

function VideoEditor({
  value,
  projectId,
  dataset,
  onChange,
  onUpload,
}: {
  value: unknown
  projectId: string
  dataset: string
  onChange: (value: unknown) => void
  onUpload: Props['onUpload']
}) {
  const [busy, setBusy] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<MediaUploadStatus>()
  const [pendingRemoval, setPendingRemoval] = useState(false)
  const video = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>
  const file = video.file as {asset?: {_ref?: string}} | undefined
  const fileUrl = sanityAssetUrl(file?.asset?._ref, projectId, dataset)
  const youtubeUrl = typeof video.youtubeUrl === 'string' ? video.youtubeUrl : ''

  // The uploaded file always wins when both are present, so there is never a
  // separate "which source is active" toggle to fall out of sync with the
  // actual data — what's here is what plays.
  const commit = (next: Record<string, unknown>) => {
    const nextFile = next.file as {asset?: {_ref?: string}} | undefined
    const nextYoutubeUrl = typeof next.youtubeUrl === 'string' ? next.youtubeUrl.trim() : ''
    onChange({
      ...next,
      kind: nextFile?.asset?._ref ? 'upload' : nextYoutubeUrl ? 'youtube' : video.kind,
    })
  }

  const upload = async (uploadFile: File) => {
    setBusy(true)
    setUploadStatus({key: 'video', phase: 'preparing', fileName: uploadFile.name, percent: 0})
    try {
      const next = await onUpload(uploadFile, 'video', (progress) =>
        setUploadStatus({
          key: 'video',
          phase: progress.percent >= 100 ? 'processing' : 'uploading',
          fileName: uploadFile.name,
          percent: progress.percent,
        }),
      )
      setUploadStatus({key: 'video', phase: 'done', fileName: uploadFile.name, percent: 100})
      commit({...video, file: {_type: 'file', asset: {_type: 'reference', _ref: next.id}}})
    } catch (error) {
      setUploadStatus({
        key: 'video',
        phase: 'error',
        fileName: uploadFile.name,
        percent: 0,
        message: error instanceof Error ? error.message : 'Não foi possível carregar o ficheiro',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="site-editor-video-field">
      <div className="site-editor-video-upload">
        {fileUrl ? (
          <video src={fileUrl} controls muted />
        ) : (
          <div className="site-editor-video-empty">
            <VideoIcon />
          </div>
        )}
        <div className="site-editor-media-actions">
          <label className="site-editor-upload-button">
            <UploadIcon /> {busy ? 'A carregar…' : fileUrl ? 'Substituir' : 'Carregar vídeo'}
            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              disabled={busy}
              onChange={(event) => {
                const uploadFile = event.currentTarget.files?.[0]
                if (uploadFile) void upload(uploadFile)
                event.currentTarget.value = ''
              }}
            />
          </label>
          {fileUrl ? (
            <button type="button" onClick={() => setPendingRemoval(true)}>
              <TrashIcon /> Remover
            </button>
          ) : null}
        </div>
        <MediaUploadProgress status={uploadStatus} />
      </div>

      <div className="site-editor-video-divider">
        <span>ou</span>
      </div>

      <label>
        <span>Link do YouTube</span>
        <input
          type="url"
          placeholder="https://www.youtube.com/watch?v=…"
          value={youtubeUrl}
          disabled={Boolean(fileUrl)}
          onChange={(event) => commit({...video, youtubeUrl: event.currentTarget.value})}
        />
        {fileUrl ? <small>Remova o vídeo carregado acima para usar este link</small> : null}
      </label>
      <ConfirmDialog
        open={pendingRemoval}
        title="Remover este vídeo?"
        description="Pode anular com Ctrl+Z antes de guardar."
        confirmLabel="Remover"
        onCancel={() => setPendingRemoval(false)}
        onConfirm={() => {
          commit({...video, file: undefined})
          setPendingRemoval(false)
        }}
      />
    </div>
  )
}

function GalleryEditor({
  value,
  path,
  selectedPath,
  documentType,
  projectId,
  dataset,
  onChange,
  onUpload,
}: {
  value: unknown
  path: string
  selectedPath?: string
  documentType: SiteEditorDocumentType
  projectId: string
  dataset: string
  onChange: (value: unknown) => void
  onUpload: Props['onUpload']
}) {
  const items = useMemo(
    () => (Array.isArray(value) ? (value as Array<Record<string, unknown>>) : []),
    [value],
  )
  const [busy, setBusy] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<MediaUploadStatus>()
  const [activeIndex, setActiveIndex] = useState(0)
  const [pendingRemovalIndex, setPendingRemovalIndex] = useState<number>()
  const acceptsVideo = ['productCategory', 'storeProduct', 'caseStudy', 'blogPost'].includes(
    documentType,
  )
  const selectedItemIndex = useMemo(() => {
    if (!selectedPath?.startsWith(`${path}[`)) return undefined
    const selector = selectedPath.slice(path.length)
    const keyed = selector.match(/^\[_key==["']([^"']+)["']\]/)?.[1]
    if (keyed) {
      const index = items.findIndex((item) => String(item._key || '') === keyed)
      return index >= 0 ? index : undefined
    }
    const indexed = selector.match(/^\[(\d+)\]/)?.[1]
    if (indexed === undefined) return undefined
    const index = Number(indexed)
    return index >= 0 && index < items.length ? index : undefined
  }, [items, path, selectedPath])

  useEffect(() => {
    if (selectedItemIndex !== undefined) setActiveIndex(selectedItemIndex)
  }, [selectedItemIndex])

  useEffect(() => {
    if (!items.length) setActiveIndex(0)
    else if (activeIndex >= items.length) setActiveIndex(items.length - 1)
  }, [activeIndex, items.length])

  const commitItem = (index: number, item: Record<string, unknown>) => {
    const next = [...items]
    next[index] = item
    onChange(next)
  }

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= items.length) return
    const next = [...items]
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item)
    onChange(next)
  }

  const uploadAsset = async (file: File, kind: 'image' | 'video', key: string) => {
    setUploadStatus({key, phase: 'preparing', fileName: file.name, percent: 0})
    try {
      const asset = await onUpload(file, kind, (progress) =>
        setUploadStatus({
          key,
          phase: progress.percent >= 100 ? 'processing' : 'uploading',
          fileName: file.name,
          percent: progress.percent,
        }),
      )
      setUploadStatus({key, phase: 'done', fileName: file.name, percent: 100})
      return asset
    } catch (error) {
      setUploadStatus({
        key,
        phase: 'error',
        fileName: file.name,
        percent: 0,
        message: error instanceof Error ? error.message : 'Não foi possível carregar o ficheiro',
      })
      throw error
    }
  }

  const createMediaItem = async (file: File, key: string) => {
    const kind = acceptsVideo && file.type.startsWith('video/') ? 'video' : 'image'
    const asset = await uploadAsset(file, kind, key)
    const galleryImageType =
      documentType === 'productCategory' || documentType === 'storeProduct'
        ? 'galleryImage'
        : 'image'
    return kind === 'video'
      ? {
          _key: editorKey(),
          _type: 'galleryVideo',
          asset: {_type: 'reference', _ref: asset.id},
          title: {_type: 'localizedString', pt: ''},
        }
      : {
          _key: editorKey(),
          _type: galleryImageType,
          asset: {_type: 'reference', _ref: asset.id},
          alt: {_type: 'localizedString', pt: ''},
        }
  }

  const upload = async (files: FileList, replaceIndex?: number) => {
    setBusy(true)
    try {
      if (replaceIndex !== undefined) {
        const file = files[0]
        if (!file) return
        const replacement = await createMediaItem(file, `replace-${replaceIndex}`)
        const current = items[replaceIndex]
        const next = [...items]
        next[replaceIndex] = {
          ...replacement,
          _key: current._key || replacement._key,
          ...(replacement._type === 'galleryVideo'
            ? {
                title: current.title || replacement.title,
                ...(current.poster ? {poster: current.poster} : {}),
              }
            : {alt: current.alt || replacement.alt}),
        }
        onChange(next)
        return
      }
      let next = [...items]
      const selectedFiles = Array.from(files).slice(0, 20)
      for (const [index, file] of selectedFiles.entries()) {
        const uploaded = await createMediaItem(file, `add-${index}`)
        next = [...next, uploaded]
        onChange(next)
        setActiveIndex(next.length - 1)
      }
    } catch {
      // The progress panel carries the actionable upload error.
    } finally {
      setBusy(false)
    }
  }

  const uploadPoster = async (file: File) => {
    if (!activeItem || !activeIsVideo) return
    setBusy(true)
    try {
      const asset = await uploadAsset(file, 'image', `poster-${activeIndex}`)
      const currentPoster = (activeItem.poster as Record<string, unknown> | undefined) ?? {}
      commitItem(activeIndex, {
        ...activeItem,
        poster: {
          ...currentPoster,
          _type: 'image',
          asset: {_type: 'reference', _ref: asset.id},
          alt: currentPoster.alt || {
            _type: 'localizedString',
            pt: String(activeTitle.pt || 'Imagem de capa do vídeo'),
          },
        },
      })
    } catch {
      // The progress panel carries the actionable upload error.
    } finally {
      setBusy(false)
    }
  }

  const activeItem = items[activeIndex]
  const activeType = String(activeItem?._type || 'image')
  const activeAsset = activeItem?.asset as {_ref?: string} | undefined
  const activeUrl = sanityAssetUrl(activeAsset?._ref, projectId, dataset)
  const activeIsVideo = activeType === 'galleryVideo' || activeAsset?._ref?.startsWith('file-')
  const activeAlt = localized(activeItem?.alt, 'localizedString')
  const activeTitle = localized(activeItem?.title, 'localizedString')
  const activePoster = activeItem?.poster as Record<string, unknown> | undefined
  const activePosterAsset = activePoster?.asset as {_ref?: string} | undefined
  const activePosterUrl = sanityAssetUrl(activePosterAsset?._ref, projectId, dataset)

  return (
    <div className="site-editor-gallery-field">
      <div className="site-editor-gallery-strip" role="list" aria-label="Conteúdo da galeria">
        {items.map((item, index) => {
          const type = String(item._type || 'image')
          const asset = item.asset as {_ref?: string} | undefined
          const url = sanityAssetUrl(asset?._ref, projectId, dataset)
          const isVideo = type === 'galleryVideo' || asset?._ref?.startsWith('file-')
          const poster = item.poster as {asset?: {_ref?: string}} | undefined
          const posterUrl = sanityAssetUrl(poster?.asset?._ref, projectId, dataset)
          return (
            <button
              type="button"
              role="listitem"
              className={activeIndex === index ? 'is-active' : ''}
              key={String(item._key || index)}
              onClick={() => setActiveIndex(index)}
              aria-label={`${isVideo ? 'Vídeo' : 'Imagem'} ${index + 1}`}
            >
              <span className="site-editor-gallery-thumb">
                {isVideo && posterUrl ? (
                  <img src={posterUrl} alt="" />
                ) : isVideo ? (
                  <video src={url} muted playsInline preload="metadata" />
                ) : url ? (
                  <img src={url} alt="" />
                ) : (
                  <ImageIcon />
                )}
                <i>{index + 1}</i>
                {isVideo ? (
                  <em>
                    <VideoIcon />
                  </em>
                ) : null}
              </span>
            </button>
          )
        })}
        <label
          className="site-editor-gallery-add-tile"
          aria-label={acceptsVideo ? 'Adicionar imagens ou vídeos' : 'Adicionar imagens'}
        >
          {acceptsVideo ? <VideoIcon /> : <ImageIcon />}
          <span>{busy ? 'A carregar…' : 'Adicionar'}</span>
          <input
            type="file"
            accept={acceptsVideo ? 'image/*,video/mp4,video/webm,video/quicktime' : 'image/*'}
            multiple
            disabled={busy}
            onChange={(event) => {
              if (event.currentTarget.files?.length) void upload(event.currentTarget.files)
              event.currentTarget.value = ''
            }}
          />
        </label>
      </div>
      <MediaUploadProgress status={uploadStatus} />
      {activeItem ? (
        <section className="site-editor-gallery-active">
          <div className="site-editor-gallery-stage">
            {activeIsVideo ? (
              <video
                key={activeUrl}
                src={activeUrl}
                poster={activePosterUrl || undefined}
                controls
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
              />
            ) : activeUrl ? (
              <img src={activeUrl} alt="" />
            ) : (
              <ImageIcon />
            )}
          </div>
          <div className="site-editor-gallery-active-head">
            <span>
              <strong>
                {activeIsVideo ? 'Vídeo' : 'Imagem'} {activeIndex + 1}
              </strong>
              <small>
                {items.length} {items.length === 1 ? 'item' : 'itens'} na galeria
              </small>
            </span>
            <div className="site-editor-gallery-order">
              <button
                type="button"
                onClick={() => {
                  move(activeIndex, -1)
                  setActiveIndex(Math.max(0, activeIndex - 1))
                }}
                disabled={activeIndex === 0}
                aria-label="Mover para a esquerda"
                title="Mover para a esquerda"
              >
                <ArrowLeftIcon />
              </button>
              <button
                type="button"
                onClick={() => {
                  move(activeIndex, 1)
                  setActiveIndex(Math.min(items.length - 1, activeIndex + 1))
                }}
                disabled={activeIndex === items.length - 1}
                aria-label="Mover para a direita"
                title="Mover para a direita"
              >
                <ArrowRightIcon />
              </button>
            </div>
          </div>
          <label className="site-editor-gallery-description">
            <span>{activeIsVideo ? 'Título do vídeo' : 'Descrição da imagem'}</span>
            <textarea
              rows={3}
              placeholder={
                activeIsVideo
                  ? 'Ex.: Instalação de decking num terraço exterior'
                  : 'Ex.: Banco em plástico reciclado num jardim público'
              }
              value={String((activeIsVideo ? activeTitle.pt : activeAlt.pt) || '')}
              onChange={(event) =>
                commitItem(activeIndex, {
                  ...activeItem,
                  ...(activeIsVideo
                    ? {title: {...activeTitle, pt: event.currentTarget.value}}
                    : {alt: {...activeAlt, pt: event.currentTarget.value}}),
                })
              }
            />
          </label>
          {activeIsVideo ? (
            <div className="site-editor-gallery-poster">
              <span>
                <strong>Imagem de capa</strong>
                <small>Aparece na miniatura e antes de o vídeo começar</small>
              </span>
              {activePosterUrl ? <img src={activePosterUrl} alt="" /> : <VideoIcon />}
              <label className="site-editor-upload-button">
                <UploadIcon /> {activePosterUrl ? 'Substituir capa' : 'Adicionar capa'}
                <input
                  type="file"
                  accept="image/*"
                  disabled={busy}
                  onChange={(event) => {
                    const file = event.currentTarget.files?.[0]
                    if (file) void uploadPoster(file)
                    event.currentTarget.value = ''
                  }}
                />
              </label>
            </div>
          ) : null}
          <div className="site-editor-media-actions">
            <label className="site-editor-upload-button">
              <UploadIcon /> {busy ? 'A carregar…' : 'Substituir'}
              <input
                type="file"
                accept={acceptsVideo ? 'image/*,video/mp4,video/webm,video/quicktime' : 'image/*'}
                disabled={busy}
                onChange={(event) => {
                  if (event.currentTarget.files?.length)
                    void upload(event.currentTarget.files, activeIndex)
                  event.currentTarget.value = ''
                }}
              />
            </label>
            <button
              type="button"
              className="is-danger"
              onClick={() => setPendingRemovalIndex(activeIndex)}
            >
              <TrashIcon /> Remover
            </button>
          </div>
        </section>
      ) : (
        <div className="site-editor-gallery-empty">
          <ImagesIcon />{' '}
          <span>
            <strong>Galeria vazia</strong>
            <small>Adicione a primeira imagem ou vídeo</small>
          </span>
        </div>
      )}
      <ConfirmDialog
        open={pendingRemovalIndex !== undefined}
        title={`Remover ${activeIsVideo ? 'este vídeo' : 'esta imagem'}?`}
        description="O item deixa de aparecer nesta galeria. Pode cancelar e mantê-lo como está."
        confirmLabel="Remover da galeria"
        onCancel={() => setPendingRemovalIndex(undefined)}
        onConfirm={() => {
          if (pendingRemovalIndex === undefined) return
          onChange(items.filter((_, itemIndex) => itemIndex !== pendingRemovalIndex))
          setActiveIndex(Math.max(0, Math.min(pendingRemovalIndex, items.length - 2)))
          setPendingRemovalIndex(undefined)
        }}
      />
    </div>
  )
}

export function SiteEditorFieldInput({
  field,
  path,
  source,
  documentType,
  selectedPath,
  projectId,
  dataset,
  viewport,
  onChange,
  onUpload,
  onOpenArticle,
}: Props) {
  const container = useRef<HTMLDivElement>(null)
  const articleLauncher = useRef<HTMLButtonElement>(null)
  const value = getEditorValue(source, path)
  const [activeArrayKey, setActiveArrayKey] = useState<string>()
  const [pendingRemovalIndex, setPendingRemovalIndex] = useState<number>()
  const selected = Boolean(
    selectedPath &&
    (selectedPath === path ||
      selectedPath.startsWith(`${path}.`) ||
      selectedPath.startsWith(`${path}[`)),
  )

  useEffect(() => {
    if (!selected || !container.current) return
    container.current.scrollIntoView({behavior: 'smooth', block: 'center'})
    container.current
      .querySelector<HTMLElement>('input, textarea, select, button')
      ?.focus({preventScroll: true})
  }, [selected, selectedPath])

  useEffect(() => {
    if (field.type !== 'array' || !selectedPath?.startsWith(`${path}[`)) return
    const selector = selectedPath.slice(path.length).match(/^\[_key==["']([^"']+)["']\]/)
    if (selector?.[1]) setActiveArrayKey(selector[1])
  }, [field.type, path, selectedPath])

  if (field.type === 'object') {
    return (
      <div ref={container} className={`site-editor-object${selected ? ' is-selected' : ''}`}>
        <div className="site-editor-object-title">
          <strong>{field.label}</strong>
          {field.description ? <small>{field.description}</small> : null}
        </div>
        <div className="site-editor-object-fields">
          {(field.fields ?? []).map((child) => (
            <SiteEditorFieldInput
              key={child.name}
              {...{
                field: child,
                path: `${path}.${child.name}`,
                source,
                documentType,
                selectedPath,
                projectId,
                dataset,
                viewport,
                onChange,
                onUpload,
                onOpenArticle,
              }}
            />
          ))}
        </div>
      </div>
    )
  }

  if (field.type === 'navigation') {
    return (
      <div ref={container} className={`site-editor-field${selected ? ' is-selected' : ''}`}>
        <div className="site-editor-field-head">
          <strong>{field.label}</strong>
          {field.description ? <small>{field.description}</small> : null}
        </div>
        <NavigationEditor
          value={value}
          viewport={viewport}
          onChange={(next) => onChange(path, next)}
        />
      </div>
    )
  }

  if (field.type === 'array') {
    const items = Array.isArray(value) ? value : []
    const compactObjects = field.item?.type === 'object'
    const activeIndex = compactObjects
      ? items.findIndex(
          (item, index) => String((item as {_key?: string})?._key || index) === activeArrayKey,
        )
      : -1
    const moveItem = (index: number, direction: -1 | 1) => {
      const target = index + direction
      if (target < 0 || target >= items.length) return
      const next = [...items]
      const [moved] = next.splice(index, 1)
      next.splice(target, 0, moved)
      onChange(path, next)
    }
    const removeItem = (index: number) => {
      onChange(
        path,
        items.filter((_, itemIndex) => itemIndex !== index),
      )
      setActiveArrayKey(undefined)
    }
    const removalDialog = (
      <ConfirmDialog
        open={pendingRemovalIndex !== undefined}
        title={`Eliminar ${field.item?.label?.toLocaleLowerCase('pt') || 'este item'}?`}
        description="Pode anular com Ctrl+Z antes de guardar."
        onCancel={() => setPendingRemovalIndex(undefined)}
        onConfirm={() => {
          if (pendingRemovalIndex === undefined) return
          removeItem(pendingRemovalIndex)
          setPendingRemovalIndex(undefined)
        }}
      />
    )
    const addItem = () => {
      const next = defaultValue(field.item ?? {name: 'item', label: 'Item', type: 'string'}, path)
      const keyed =
        next && typeof next === 'object' && !Array.isArray(next)
          ? {...(next as Record<string, unknown>), _key: editorKey()}
          : next
      onChange(path, [...items, keyed])
      if (compactObjects) {
        setActiveArrayKey(String((keyed as {_key?: string})?._key || items.length))
      }
    }

    if (compactObjects && activeIndex >= 0 && field.item) {
      const activeItem = items[activeIndex]
      const itemPath = arrayItemPath(path, activeItem, activeIndex)
      return (
        <div ref={container} className={`site-editor-array${selected ? ' is-selected' : ''}`}>
          <div className="site-editor-array-detail-head">
            <button type="button" onClick={() => setActiveArrayKey(undefined)}>
              <ArrowLeftIcon /> Todas as opções
            </button>
            <div>
              <span>
                <strong>{arrayItemTitle(activeItem, activeIndex, field.item.label)}</strong>
                <small>
                  {activeIndex + 1} de {items.length}
                </small>
              </span>
              <div className="site-editor-array-toolbar">
                <button
                  type="button"
                  onClick={() => moveItem(activeIndex, -1)}
                  disabled={activeIndex === 0}
                  aria-label="Subir"
                >
                  <ArrowUpIcon />
                </button>
                <button
                  type="button"
                  onClick={() => moveItem(activeIndex, 1)}
                  disabled={activeIndex === items.length - 1}
                  aria-label="Descer"
                >
                  <ArrowDownIcon />
                </button>
                <button
                  type="button"
                  onClick={() => setPendingRemovalIndex(activeIndex)}
                  aria-label="Eliminar"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          </div>
          <SiteEditorFieldInput
            field={field.item}
            path={itemPath}
            source={source}
            documentType={documentType}
            selectedPath={selectedPath}
            projectId={projectId}
            dataset={dataset}
            viewport={viewport}
            onChange={onChange}
            onUpload={onUpload}
            onOpenArticle={onOpenArticle}
          />
          {removalDialog}
        </div>
      )
    }

    if (compactObjects) {
      return (
        <div ref={container} className={`site-editor-array${selected ? ' is-selected' : ''}`}>
          <div className="site-editor-field-head">
            <strong>{field.label}</strong>
            {field.description ? <small>{field.description}</small> : null}
          </div>
          <div className="site-editor-array-index">
            {items.map((item, index) => {
              const key = String((item as {_key?: string})?._key || index)
              return (
                <div key={key}>
                  <button type="button" onClick={() => setActiveArrayKey(key)}>
                    <span>
                      <strong>{arrayItemTitle(item, index, field.item!.label)}</strong>
                      <small>Editar {field.item!.label.toLocaleLowerCase('pt')}</small>
                    </span>
                    <ArrowRightIcon />
                  </button>
                  <div className="site-editor-array-toolbar">
                    <button
                      type="button"
                      onClick={() => moveItem(index, -1)}
                      disabled={index === 0}
                      aria-label="Subir"
                    >
                      <ArrowUpIcon />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(index, 1)}
                      disabled={index === items.length - 1}
                      aria-label="Descer"
                    >
                      <ArrowDownIcon />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingRemovalIndex(index)}
                      aria-label="Eliminar"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
          <button className="site-editor-array-add" type="button" onClick={addItem}>
            <AddIcon /> Adicionar {field.item.label.toLocaleLowerCase('pt')}
          </button>
          {removalDialog}
        </div>
      )
    }

    return (
      <div ref={container} className={`site-editor-array${selected ? ' is-selected' : ''}`}>
        <div className="site-editor-field-head">
          <strong>{field.label}</strong>
          {field.description ? <small>{field.description}</small> : null}
        </div>
        <div className="site-editor-array-items">
          {items.map((item, index) => {
            const itemPath = arrayItemPath(path, item, index)
            return (
              <div
                className="site-editor-array-item"
                key={(item as {_key?: string})?._key || index}
              >
                <div className="site-editor-array-toolbar">
                  <strong>{field.item?.label || `Item ${index + 1}`}</strong>
                  <button
                    type="button"
                    onClick={() => moveItem(index, -1)}
                    disabled={index === 0}
                    aria-label="Subir"
                  >
                    <ArrowUpIcon />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveItem(index, 1)}
                    disabled={index === items.length - 1}
                    aria-label="Descer"
                  >
                    <ArrowDownIcon />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingRemovalIndex(index)}
                    aria-label="Eliminar"
                  >
                    <TrashIcon />
                  </button>
                </div>
                {field.item ? (
                  <SiteEditorFieldInput
                    field={field.item}
                    path={itemPath}
                    source={source}
                    documentType={documentType}
                    selectedPath={selectedPath}
                    projectId={projectId}
                    dataset={dataset}
                    viewport={viewport}
                    onChange={onChange}
                    onUpload={onUpload}
                    onOpenArticle={onOpenArticle}
                  />
                ) : null}
              </div>
            )
          })}
        </div>
        <button className="site-editor-array-add" type="button" onClick={addItem}>
          <AddIcon /> Adicionar
        </button>
        {removalDialog}
      </div>
    )
  }

  if (field.type === 'image') {
    return (
      <div ref={container} className={`site-editor-field${selected ? ' is-selected' : ''}`}>
        <div className="site-editor-field-head">
          <strong>{field.label}</strong>
          {field.description ? <small>{field.description}</small> : null}
        </div>
        <ImageEditor
          value={value}
          projectId={projectId}
          dataset={dataset}
          onChange={(next) => onChange(path, next)}
          onUpload={onUpload}
        />
      </div>
    )
  }

  if (field.type === 'video') {
    return (
      <div ref={container} className={`site-editor-field${selected ? ' is-selected' : ''}`}>
        <div className="site-editor-field-head">
          <strong>{field.label}</strong>
          {field.description ? <small>{field.description}</small> : null}
        </div>
        <VideoEditor
          value={value}
          projectId={projectId}
          dataset={dataset}
          onChange={(next) => onChange(path, next)}
          onUpload={onUpload}
        />
      </div>
    )
  }

  if (field.type === 'gallery') {
    return (
      <div ref={container} className={`site-editor-field${selected ? ' is-selected' : ''}`}>
        <div className="site-editor-field-head">
          <strong>{field.label}</strong>
          {field.description ? <small>{field.description}</small> : null}
        </div>
        <GalleryEditor
          value={value}
          path={path}
          selectedPath={selectedPath}
          documentType={documentType}
          projectId={projectId}
          dataset={dataset}
          onChange={(next) => onChange(path, next)}
          onUpload={onUpload}
        />
      </div>
    )
  }

  if (field.type === 'article') {
    const article =
      value && typeof value === 'object' && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : undefined
    const blocks = Array.isArray(article?.pt) ? article.pt : []
    const text = blocks
      .flatMap((block) =>
        block &&
        typeof block === 'object' &&
        Array.isArray((block as {children?: unknown[]}).children)
          ? ((block as {children: unknown[]}).children ?? [])
          : [],
      )
      .map((child) =>
        child && typeof child === 'object' && typeof (child as {text?: unknown}).text === 'string'
          ? String((child as {text: string}).text)
          : '',
      )
      .join(' ')
      .trim()

    return (
      <div ref={container} className={`site-editor-field${selected ? ' is-selected' : ''}`}>
        <div className="site-editor-field-head">
          <strong>{field.label}</strong>
          {field.description ? <small>{field.description}</small> : null}
        </div>
        <div className="site-editor-article-launcher">
          <span>
            <EditIcon />
            <i>{blocks.length}</i>
          </span>
          <div>
            <strong>{blocks.length ? 'Conteúdo estruturado' : 'Artigo vazio'}</strong>
            <small>{text || 'Abra o editor para começar a escrever'}</small>
          </div>
          <button
            ref={articleLauncher}
            type="button"
            aria-haspopup="dialog"
            onClick={() =>
              articleLauncher.current && onOpenArticle?.(field, path, articleLauncher.current)
            }
          >
            <EditIcon /> Editar artigo
          </button>
        </div>
      </div>
    )
  }

  const localizedType = field.type === 'localizedString' || field.type === 'localizedText'
  const localizedValue = localizedType
    ? localized(value, field.type as 'localizedString' | 'localizedText')
    : undefined
  const plainValue = localizedType ? String(localizedValue?.pt || '') : value
  const commit = (next: unknown) =>
    onChange(path, localizedType ? {...localizedValue, pt: next} : next)

  return (
    <div ref={container} className={`site-editor-field${selected ? ' is-selected' : ''}`}>
      <div className="site-editor-field-head">
        <strong>
          {field.label}
          {field.required ? <sup>*</sup> : null}
        </strong>
        {field.description ? <small>{field.description}</small> : null}
      </div>
      {field.type === 'boolean' ? (
        <Toggle checked={value === true} label={field.label} onChange={commit} />
      ) : field.type === 'text' ||
        field.type === 'localizedText' ||
        field.type === 'localizedString' ? (
        <textarea
          aria-label={field.label}
          rows={field.rows ?? 5}
          placeholder={field.placeholder}
          value={String(plainValue || '')}
          onChange={(event) => commit(event.currentTarget.value)}
        />
      ) : field.type === 'number' ? (
        <input
          aria-label={field.label}
          type="number"
          min={field.min}
          max={field.max}
          step={field.step ?? 'any'}
          value={typeof value === 'number' ? value : ''}
          onChange={(event) =>
            commit(event.currentTarget.value === '' ? null : Number(event.currentTarget.value))
          }
        />
      ) : field.type === 'select' ? (
        <select
          aria-label={field.label}
          value={String(value || '')}
          onChange={(event) => commit(event.currentTarget.value)}
        >
          <option value="">Escolha uma opção</option>
          {(field.options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : field.type === 'slug' ? (
        <div className="site-editor-slug-field">
          <input
            aria-label={field.label}
            value={String((value as {current?: string} | undefined)?.current || '')}
            readOnly={field.readOnly}
            disabled={field.readOnly}
            onChange={
              field.readOnly
                ? undefined
                : (event) => commit({_type: 'slug', current: slugify(event.currentTarget.value)})
            }
          />
          {field.readOnly ? null : (
            <button
              type="button"
              onClick={() => {
                const title = getEditorValue<{pt?: string}>(source, 'title')?.pt || ''
                commit({_type: 'slug', current: slugify(title)})
              }}
            >
              Gerar
            </button>
          )}
        </div>
      ) : (
        <input
          aria-label={field.label}
          type={
            field.type === 'email'
              ? 'email'
              : field.type === 'url'
                ? 'url'
                : field.type === 'date'
                  ? 'date'
                  : 'text'
          }
          placeholder={field.placeholder}
          value={String(plainValue || '')}
          onChange={(event) => commit(event.currentTarget.value)}
        />
      )}
      {localizedType && localizedValue ? (
        <TextAppearanceEditor
          value={localizedValue}
          viewport={viewport}
          onChange={(next) => onChange(path, next)}
        />
      ) : null}
      {localizedType ? (
        <small className="site-editor-translation-note">Português · EN e ES automáticos</small>
      ) : null}
    </div>
  )
}

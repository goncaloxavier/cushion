import React, {useMemo, useState} from 'react'
import {AddIcon} from '@sanity/icons/Add'
import {ArrowDownIcon} from '@sanity/icons/ArrowDown'
import {ArrowUpIcon} from '@sanity/icons/ArrowUp'
import {CopyIcon} from '@sanity/icons/Copy'
import {EditIcon} from '@sanity/icons/Edit'
import {EyeClosedIcon} from '@sanity/icons/EyeClosed'
import {EyeOpenIcon} from '@sanity/icons/EyeOpen'
import {TrashIcon} from '@sanity/icons/Trash'
import {
  createBuilderKey,
  createBuilderSection,
  duplicateBuilderSection,
} from '$lib/builder/defaults'
import {BuilderSectionInspector} from '$lib/builder/editor/BuilderInspector'
import type {
  BuilderMedia,
  BuilderSection,
  BuilderSectionType,
} from '$lib/builder/types'
import type {SitePageDocument} from '../types'

type Asset = {id: string; url: string}

type Props = {
  page: SitePageDocument
  selectedSectionKey?: string
  onSelectSection: (key?: string) => void
  onChange: (page: SitePageDocument) => void
  onUpload: (file: File, kind: 'image' | 'video') => Promise<Asset>
}

const sectionTypes: Array<{value: BuilderSectionType; label: string}> = [
  {value: 'builderHeroSection', label: 'Destaque principal'},
  {value: 'builderMediaSection', label: 'Texto com imagem ou vídeo'},
  {value: 'builderRichTextSection', label: 'Texto editorial'},
  {value: 'builderGallerySection', label: 'Galeria'},
  {value: 'builderCardsSection', label: 'Cartões'},
  {value: 'builderStatsSection', label: 'Números e indicadores'},
  {value: 'builderCollectionSection', label: 'Conteúdo dinâmico'},
  {value: 'builderCtaSection', label: 'Chamada para ação'},
  {value: 'builderSpacerSection', label: 'Espaçamento'},
]

const labelFor = (section: BuilderSection) =>
  section.internalLabel?.trim() ||
  sectionTypes.find((type) => type.value === section._type)?.label ||
  'Secção'

export function SitePageSectionsEditor({
  page,
  selectedSectionKey,
  onSelectSection,
  onChange,
  onUpload,
}: Props) {
  const [newType, setNewType] = useState<BuilderSectionType>('builderMediaSection')
  const [uploadState, setUploadState] = useState<string>()
  const sections = useMemo(() => page.sections ?? [], [page.sections])
  const selected = useMemo(
    () => sections.find((section) => section._key === selectedSectionKey),
    [sections, selectedSectionKey],
  )

  const commitSections = (next: BuilderSection[]) => onChange({...page, sections: next})
  const updateSection = (next: BuilderSection) =>
    commitSections(
      sections.map((section) => (section._key === next._key ? next : section)),
    )

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= sections.length) return
    const next = [...sections]
    const [section] = next.splice(index, 1)
    next.splice(target, 0, section)
    commitSections(next)
  }

  const uploadSectionMedia = async (file: File, kind: 'image' | 'video') => {
    if (!selected) return
    setUploadState('A carregar…')
    try {
      const asset = await onUpload(file, kind)
      const media: BuilderMedia = {
        ...selected.media,
        _type: 'builderMedia',
        kind,
        fit: selected.media?.fit ?? 'cover',
        position: selected.media?.position ?? 'center',
        ...(kind === 'image'
          ? {image: {_type: 'image', asset: {_type: 'reference', _ref: asset.id}}}
          : {videoFile: {_type: 'file', asset: {_type: 'reference', _ref: asset.id}}}),
      }
      updateSection({...selected, media})
      setUploadState('Carregado')
    } catch (error) {
      setUploadState(error instanceof Error ? error.message : 'Falha no carregamento')
    }
  }

  const uploadGalleryMedia = async (files: FileList) => {
    if (!selected) return
    const selectedFiles = Array.from(files).slice(0, 20)
    const uploaded: BuilderMedia[] = []
    setUploadState(`A carregar 0/${selectedFiles.length}…`)
    try {
      for (let index = 0; index < selectedFiles.length; index += 1) {
        const file = selectedFiles[index]
        const kind = file.type.startsWith('video/') ? 'video' : 'image'
        const asset = await onUpload(file, kind)
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
      updateSection({...selected, items: [...(selected.items ?? []), ...uploaded]})
      setUploadState('Carregado')
    } catch (error) {
      setUploadState(error instanceof Error ? error.message : 'Falha no carregamento')
    }
  }

  if (selected) {
    return (
      <div className="site-editor-section-properties">
        <button className="site-editor-section-back" type="button" onClick={() => onSelectSection(undefined)}>
          ← Estrutura da página
        </button>
        <BuilderSectionInspector
          section={selected}
          issues={[]}
          uploadState={uploadState}
          onUpdateSection={updateSection}
          onUploadSectionMedia={(file, kind) => void uploadSectionMedia(file, kind)}
          onUploadGalleryMedia={(files) => void uploadGalleryMedia(files)}
        />
      </div>
    )
  }

  return (
    <div className="site-editor-sections">
      <div className="site-editor-field-head">
        <strong>Estrutura da página</strong>
        <small>As coleções mostram sempre os produtos, casos ou artigos reais.</small>
      </div>
      <div className="site-editor-section-list">
        {sections.map((section, index) => (
          <article key={section._key} className={section.enabled === false ? 'is-hidden' : ''}>
            <button type="button" className="site-editor-section-main" onClick={() => onSelectSection(section._key)}>
              <EditIcon />
              <span>
                <strong>{labelFor(section)}</strong>
                <small>{sectionTypes.find((type) => type.value === section._type)?.label}</small>
              </span>
            </button>
            <div className="site-editor-section-actions">
              <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Subir"><ArrowUpIcon /></button>
              <button type="button" onClick={() => move(index, 1)} disabled={index === sections.length - 1} aria-label="Descer"><ArrowDownIcon /></button>
              <button type="button" onClick={() => updateSection({...section, enabled: section.enabled === false})} aria-label={section.enabled === false ? 'Mostrar' : 'Ocultar'}>{section.enabled === false ? <EyeClosedIcon /> : <EyeOpenIcon />}</button>
              <button type="button" onClick={() => {
                const clone = duplicateBuilderSection(section)
                const next = [...sections]
                next.splice(index + 1, 0, clone)
                commitSections(next)
              }} aria-label="Duplicar"><CopyIcon /></button>
              <button type="button" onClick={() => {
                if (window.confirm(`Eliminar “${labelFor(section)}”?`)) commitSections(sections.filter((item) => item._key !== section._key))
              }} aria-label="Eliminar"><TrashIcon /></button>
            </div>
          </article>
        ))}
        {!sections.length ? <div className="site-editor-sections-empty">Esta página ainda não tem secções.</div> : null}
      </div>
      <div className="site-editor-section-add">
        <select value={newType} onChange={(event) => setNewType(event.currentTarget.value as BuilderSectionType)}>
          {sectionTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
        </select>
        <button type="button" onClick={() => {
          const section = createBuilderSection(newType)
          commitSections([...sections, section])
          onSelectSection(section._key)
        }}><AddIcon /> Adicionar secção</button>
      </div>
    </div>
  )
}

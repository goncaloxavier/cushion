import React, {useEffect, useMemo, useRef, useState} from 'react'
import {AddIcon} from '@sanity/icons/Add'
import {BarChartIcon} from '@sanity/icons/BarChart'
import {BlockContentIcon} from '@sanity/icons/BlockContent'
import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {DocumentsIcon} from '@sanity/icons/Documents'
import {EnvelopeIcon} from '@sanity/icons/Envelope'
import {HomeIcon} from '@sanity/icons/Home'
import {ImageIcon} from '@sanity/icons/Image'
import {ImagesIcon} from '@sanity/icons/Images'
import {LaunchIcon} from '@sanity/icons/Launch'
import {ProjectsIcon} from '@sanity/icons/Projects'
import {CopyIcon} from '@sanity/icons/Copy'
import {EditIcon} from '@sanity/icons/Edit'
import {EyeClosedIcon} from '@sanity/icons/EyeClosed'
import {EyeOpenIcon} from '@sanity/icons/EyeOpen'
import {TrashIcon} from '@sanity/icons/Trash'
import {createBuilderSection, duplicateBuilderSection} from '$lib/builder/defaults'
import type {BuilderSection, BuilderSectionType} from '$lib/builder/types'
import type {
  Asset,
  SiteEditorAssetKind,
  SiteEditorDocumentType,
  SitePageDocument,
} from '../types'
import type {SiteEditorUploadProgress} from './api'
import {ConfirmDialog} from './ConfirmDialog'
import {SitePageSectionEditor} from './SitePageSectionEditor'

type Props = {
  page: SitePageDocument
  documentType?: SiteEditorDocumentType
  contextLabel?: string
  emptyTitle?: string
  emptyDescription?: string
  selectedSectionKey?: string
  dataset: string
  onSelectSection: (key?: string) => void
  onChange: (page: SitePageDocument, options?: {structural?: boolean}) => void
  onUpload: (
    file: File,
    kind: SiteEditorAssetKind,
    onProgress?: (progress: SiteEditorUploadProgress) => void,
  ) => Promise<Asset>
  onOpenArticle?: (path: string, returnFocus: HTMLButtonElement) => void
  onOpenManagedSection?: () => void
}

const sectionTypes: Array<{
  value: BuilderSectionType
  label: string
  description: string
  group: 'open' | 'explain' | 'finish'
}> = [
  {
    value: 'builderHeroSection',
    label: 'Destaque principal',
    description: 'Abertura com título, botão e imagem ou vídeo',
    group: 'open',
  },
  {
    value: 'builderMediaSection',
    label: 'Texto com imagem',
    description: 'Texto e media apresentados lado a lado',
    group: 'explain',
  },
  {
    value: 'builderRichTextSection',
    label: 'Texto editorial',
    description: 'Texto longo com títulos, listas, imagens e tabelas',
    group: 'explain',
  },
  {
    value: 'builderGallerySection',
    label: 'Galeria',
    description: 'Conjunto ordenado de imagens e vídeos',
    group: 'explain',
  },
  {
    value: 'builderCardsSection',
    label: 'Cartões',
    description: 'Vários conteúdos curtos numa grelha',
    group: 'explain',
  },
  {
    value: 'builderStatsSection',
    label: 'Números',
    description: 'Indicadores e resultados em destaque',
    group: 'explain',
  },
  {
    value: 'builderCollectionSection',
    label: 'Lista automática',
    description: 'Produtos, loja, casos de estudo ou artigos do blog',
    group: 'explain',
  },
  {
    value: 'builderPartnersSection',
    label: 'Parceiros',
    description: 'Logótipos de entidades e projetos, com ligação a cada um',
    group: 'explain',
  },
  {
    value: 'builderCtaSection',
    label: 'Chamada para ação',
    description: 'Mensagem curta com um ou mais botões',
    group: 'finish',
  },
  {
    value: 'builderContactSection',
    label: 'Contacto',
    description: 'Ligação para contacto, orçamento ou pedido de catálogo',
    group: 'finish',
  },
]

const sectionGroups = [
  {value: 'open', label: 'Abrir a página'},
  {value: 'explain', label: 'Explicar e mostrar'},
  {value: 'finish', label: 'Concluir'},
] as const

const SectionTypeIcon = ({type}: {type: BuilderSectionType}) => {
  if (type === 'builderHeroSection') return <HomeIcon />
  if (type === 'builderMediaSection') return <ImageIcon />
  if (type === 'builderRichTextSection') return <DocumentTextIcon />
  if (type === 'builderGallerySection') return <ImagesIcon />
  if (type === 'builderCardsSection') return <BlockContentIcon />
  if (type === 'builderStatsSection') return <BarChartIcon />
  if (type === 'builderCollectionSection') return <DocumentsIcon />
  if (type === 'builderPartnersSection') return <ProjectsIcon />
  if (type === 'builderCtaSection') return <LaunchIcon />
  return <EnvelopeIcon />
}

const definitionFor = (section: BuilderSection) =>
  section._type === 'builderManagedSection'
    ? {
        value: section._type,
        label: 'Conteúdo atual da página',
        description: 'Texto, imagens e estrutura que já aparecem no site',
      }
    : sectionTypes.find((type) => type.value === section._type)

const labelFor = (section: BuilderSection) =>
  section.internalLabel?.trim() || definitionFor(section)?.label || 'Secção'

export function SitePageSectionsEditor({
  page,
  documentType,
  contextLabel = 'Página livre',
  emptyTitle = 'Esta página ainda está vazia.',
  emptyDescription = 'Adicione a primeira secção para começar.',
  selectedSectionKey,
  dataset,
  onSelectSection,
  onChange,
  onUpload,
  onOpenArticle,
  onOpenManagedSection,
}: Props) {
  const [actionsFor, setActionsFor] = useState<string>()
  const [addOpen, setAddOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<BuilderSection>()
  const menuRef = useRef<HTMLDivElement>(null)
  // The designed area is an anchor in the same ordered page stream. Keeping it
  // in this list is what lets a client place new blocks before or after the
  // established product/page design. Its content still opens in the one
  // canonical fields panel; this row only owns position and visibility.
  const sections = useMemo(() => page.sections ?? [], [page.sections])
  const selected = useMemo(
    () => sections.find((section) => section._key === selectedSectionKey),
    [sections, selectedSectionKey],
  )

  useEffect(() => {
    if (!actionsFor) return
    const close = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setActionsFor(undefined)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [actionsFor])

  const commitSections = (next: BuilderSection[], structural = false) =>
    onChange({...page, sections: next}, {structural})
  const updateSection = (next: BuilderSection) =>
    commitSections(sections.map((section) => (section._key === next._key ? next : section)))
  const createSection = (type: BuilderSectionType) => {
    const section = createBuilderSection(type)
    if (documentType !== 'productCategory' || type !== 'builderMediaSection') return section

    return {
      ...section,
      internalLabel: 'Secção do produto',
      variant: 'product-feature',
      mediaSide: 'left',
      layout: {
        ...section.layout,
        width: 'full',
        surface: 'white',
        spacing: {
          _type: 'builderSpacing',
          top: 0,
          bottom: 0,
          sides: 0,
        },
      },
    }
  }

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= sections.length) return
    const next = [...sections]
    const [section] = next.splice(index, 1)
    next.splice(target, 0, section)
    commitSections(next, true)
    setActionsFor(undefined)
  }

  if (selected) {
    return (
      <div className="site-editor-section-properties">
        <button
          className="site-editor-section-back"
          type="button"
          onClick={() => onSelectSection(undefined)}
        >
          ← Voltar ao conteúdo
        </button>
        {selected._type === 'builderManagedSection' ? (
          <div className="site-editor-managed-section-empty">
            <strong>{labelFor(selected)}</strong>
            <p>Esta é a apresentação principal já usada nesta página.</p>
            <button type="button" onClick={onOpenManagedSection}>
              <EditIcon /> Editar conteúdo principal
            </button>
          </div>
        ) : (
          <SitePageSectionEditor
            section={selected}
            dataset={dataset}
            onUpdate={updateSection}
            onUpload={onUpload}
            onOpenArticle={onOpenArticle}
          />
        )}
      </div>
    )
  }

  return (
    <div className="site-editor-sections">
      <div className="site-editor-sections-head">
        <span>
          <small>{contextLabel}</small>
          <strong>Conteúdo da página</strong>
          <p>Abra uma secção para editar apenas essa parte da página.</p>
        </span>
        <b>{sections.length}</b>
      </div>

      <div className="site-editor-section-list">
        {sections.map((section, index) => {
          const definition = definitionFor(section)
          return (
            <article key={section._key} className={section.enabled === false ? 'is-hidden' : ''}>
              <button
                type="button"
                className="site-editor-section-main"
                onClick={() =>
                  section._type === 'builderManagedSection'
                    ? onOpenManagedSection?.()
                    : onSelectSection(section._key)
                }
              >
                <i aria-hidden="true">
                  <EditIcon />
                </i>
                <span>
                  <span className="site-editor-section-name">
                    <strong>{labelFor(section)}</strong>
                    {section.enabled === false ? <em>Oculta</em> : null}
                  </span>
                  <small>{definition?.label}</small>
                </span>
              </button>
              <div
                className="site-editor-section-menu-wrap"
                ref={actionsFor === section._key ? menuRef : undefined}
              >
                <button
                  className="site-editor-section-menu-button"
                  type="button"
                  aria-label={`Ações de ${labelFor(section)}`}
                  aria-expanded={actionsFor === section._key}
                  onClick={() =>
                    setActionsFor((current) =>
                      current === section._key ? undefined : section._key,
                    )
                  }
                >
                  <span aria-hidden="true">•••</span>
                </button>
                {actionsFor === section._key ? (
                  <div className="site-editor-section-menu">
                    <button type="button" disabled={index === 0} onClick={() => move(index, -1)}>
                      Mover para cima
                    </button>
                    <button
                      type="button"
                      disabled={index === sections.length - 1}
                      onClick={() => move(index, 1)}
                    >
                      Mover para baixo
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        commitSections(
                          sections.map((candidate) =>
                            candidate._key === section._key
                              ? {...candidate, enabled: candidate.enabled === false}
                              : candidate,
                          ),
                          true,
                        )
                        setActionsFor(undefined)
                      }}
                    >
                      {section.enabled === false ? <EyeOpenIcon /> : <EyeClosedIcon />}
                      {section.enabled === false ? 'Mostrar no site' : 'Ocultar do site'}
                    </button>
                    {section._type !== 'builderManagedSection' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            const clone = duplicateBuilderSection(section)
                            const next = [...sections]
                            next.splice(index + 1, 0, clone)
                            commitSections(next, true)
                            setActionsFor(undefined)
                            onSelectSection(clone._key)
                          }}
                        >
                          <CopyIcon /> Duplicar
                        </button>
                        <button
                          className="is-danger"
                          type="button"
                          onClick={() => {
                            setPendingDelete(section)
                            setActionsFor(undefined)
                          }}
                        >
                          <TrashIcon /> Eliminar
                        </button>
                      </>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </article>
          )
        })}
        {!sections.length ? (
          <div className="site-editor-sections-empty">
            <strong>{emptyTitle}</strong>
            <span>{emptyDescription}</span>
          </div>
        ) : null}
      </div>

      <div className="site-editor-section-add">
        <button
          className="site-editor-section-add-trigger"
          type="button"
          aria-expanded={addOpen}
          onClick={() => setAddOpen((current) => !current)}
        >
          <AddIcon /> {addOpen ? 'Fechar opções' : 'Adicionar secção'}
        </button>
        {addOpen ? (
          <div className="site-editor-section-picker">
            <header>
              <strong>O que quer acrescentar?</strong>
              <small>Escolha pelo resultado que pretende ver na página</small>
            </header>
            {sectionGroups.map((group) => (
              <section key={group.value} className="site-editor-section-picker-group">
                <strong>{group.label}</strong>
                <div>
                  {sectionTypes
                    .filter((type) => type.group === group.value)
                    .map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        data-section-type={type.value}
                        onClick={() => {
                          const section = createSection(type.value)
                          commitSections([...sections, section], true)
                          setAddOpen(false)
                          onSelectSection(section._key)
                        }}
                      >
                        <i aria-hidden="true">
                          <SectionTypeIcon type={type.value} />
                        </i>
                        <span>
                          <strong>{type.label}</strong>
                          <small>{type.description}</small>
                        </span>
                        <AddIcon />
                      </button>
                    ))}
                </div>
              </section>
            ))}
          </div>
        ) : null}
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title={`Eliminar “${pendingDelete ? labelFor(pendingDelete) : 'esta secção'}”?`}
        description="A secção deixa de aparecer nesta página. Pode desfazer esta alteração antes de publicar."
        onCancel={() => setPendingDelete(undefined)}
        onConfirm={() => {
          if (!pendingDelete) return
          commitSections(
            sections.filter((section) => section._key !== pendingDelete._key),
            true,
          )
          setPendingDelete(undefined)
        }}
      />
    </div>
  )
}

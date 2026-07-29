import React, {useEffect, useMemo, useRef, useState, type ReactNode} from 'react'
import {AddIcon} from '@sanity/icons/Add'
import {CopyIcon} from '@sanity/icons/Copy'
import {EditIcon} from '@sanity/icons/Edit'
import {EyeClosedIcon} from '@sanity/icons/EyeClosed'
import {EyeOpenIcon} from '@sanity/icons/EyeOpen'
import {TrashIcon} from '@sanity/icons/Trash'
import {createBuilderSection, duplicateBuilderSection} from '$lib/builder/defaults'
import type {BuilderSection, BuilderSectionType} from '$lib/builder/types'
import type {Asset, SiteEditorAssetKind, SitePageDocument} from '../types'
import type {SiteEditorUploadProgress} from './api'
import {ConfirmDialog} from './ConfirmDialog'
import {SitePageSectionEditor} from './SitePageSectionEditor'

type Props = {
  page: SitePageDocument
  contextLabel?: string
  emptyTitle?: string
  emptyDescription?: string
  selectedSectionKey?: string
  dataset: string
  onSelectSection: (key?: string) => void
  onChange: (page: SitePageDocument) => void
  onUpload: (
    file: File,
    kind: SiteEditorAssetKind,
    onProgress?: (progress: SiteEditorUploadProgress) => void,
  ) => Promise<Asset>
  onOpenArticle?: (path: string, returnFocus: HTMLButtonElement) => void
  renderManagedSection?: (
    section: BuilderSection,
    updateSection: (next: BuilderSection) => void,
  ) => ReactNode
}

const sectionTypes: Array<{
  value: BuilderSectionType
  label: string
  description: string
}> = [
  {
    value: 'builderHeroSection',
    label: 'Destaque principal',
    description: 'Abertura com título, botão e imagem ou vídeo',
  },
  {
    value: 'builderMediaSection',
    label: 'Texto com imagem',
    description: 'Texto e media apresentados lado a lado',
  },
  {
    value: 'builderRichTextSection',
    label: 'Texto editorial',
    description: 'Texto longo com títulos, listas, imagens e tabelas',
  },
  {
    value: 'builderGallerySection',
    label: 'Galeria',
    description: 'Conjunto ordenado de imagens e vídeos',
  },
  {
    value: 'builderCardsSection',
    label: 'Cartões',
    description: 'Vários conteúdos curtos numa grelha',
  },
  {
    value: 'builderStatsSection',
    label: 'Números',
    description: 'Indicadores e resultados em destaque',
  },
  {
    value: 'builderCollectionSection',
    label: 'Lista automática',
    description: 'Produtos, loja, casos de estudo ou artigos do blog',
  },
  {
    value: 'builderPartnersSection',
    label: 'Parceiros',
    description: 'Logótipos de entidades e projetos, com ligação a cada um',
  },
  {
    value: 'builderCtaSection',
    label: 'Chamada para ação',
    description: 'Mensagem curta com um ou mais botões',
  },
  {
    value: 'builderContactSection',
    label: 'Contacto',
    description: 'Ligação para contacto, orçamento ou pedido de catálogo',
  },
]

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
  contextLabel = 'Página livre',
  emptyTitle = 'Esta página ainda está vazia.',
  emptyDescription = 'Adicione a primeira secção para começar.',
  selectedSectionKey,
  dataset,
  onSelectSection,
  onChange,
  onUpload,
  onOpenArticle,
  renderManagedSection,
}: Props) {
  const [actionsFor, setActionsFor] = useState<string>()
  const [addOpen, setAddOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<BuilderSection>()
  const menuRef = useRef<HTMLDivElement>(null)
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

  const commitSections = (next: BuilderSection[]) => onChange({...page, sections: next})
  const updateSection = (next: BuilderSection) =>
    commitSections(sections.map((section) => (section._key === next._key ? next : section)))

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= sections.length) return
    const next = [...sections]
    const [section] = next.splice(index, 1)
    next.splice(target, 0, section)
    commitSections(next)
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
          renderManagedSection?.(selected, updateSection) ?? (
            <div className="site-editor-managed-section-empty">
              <strong>Conteúdo atual da página</strong>
              <p>Os campos desta área não estão disponíveis neste contexto.</p>
            </div>
          )
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
                onClick={() => onSelectSection(section._key)}
              >
                <i aria-hidden="true">
                  <EditIcon />
                </i>
                <span>
                  <strong>{labelFor(section)}</strong>
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
                        updateSection({...section, enabled: section.enabled === false})
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
                            commitSections(next)
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
            {sectionTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => {
                  const section = createBuilderSection(type.value)
                  commitSections([...sections, section])
                  setAddOpen(false)
                  onSelectSection(section._key)
                }}
              >
                <span>
                  <strong>{type.label}</strong>
                  <small>{type.description}</small>
                </span>
                <AddIcon />
              </button>
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
          commitSections(sections.filter((section) => section._key !== pendingDelete._key))
          setPendingDelete(undefined)
        }}
      />
    </div>
  )
}

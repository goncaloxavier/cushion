import React, {useState, type DragEvent} from 'react'
import {AddIcon} from '@sanity/icons/Add'
import {ArrowDownIcon} from '@sanity/icons/ArrowDown'
import {ArrowUpIcon} from '@sanity/icons/ArrowUp'
import {CopyIcon} from '@sanity/icons/Copy'
import {DocumentIcon} from '@sanity/icons/Document'
import {EyeClosedIcon} from '@sanity/icons/EyeClosed'
import {EyeOpenIcon} from '@sanity/icons/EyeOpen'
import {TrashIcon} from '@sanity/icons/Trash'
import {builderSectionDefinitions, builderSectionTitle} from '../defaults'
import type {BuilderPage, BuilderSectionType} from '../types'

type BuilderSidebarProps = {
  pages: BuilderPage[]
  page?: BuilderPage
  selectedPageId?: string
  selectedSectionKey?: string
  onSelectPage: (id: string) => void
  onCreatePage: () => void
  onDeletePage: () => void
  onSelectSection: (key: string) => void
  onAddSection: (type: BuilderSectionType) => void
  onDuplicateSection: (key: string) => void
  onMoveSection: (key: string, direction: -1 | 1) => void
  onReorderSection: (sourceKey: string, targetKey: string) => void
  onToggleSection: (key: string) => void
  onDeleteSection: (key: string) => void
}

const samePage = (left: string, right?: string) =>
  left.replace(/^drafts\./, '') === right?.replace(/^drafts\./, '')

export function BuilderSidebar({
  pages,
  page,
  selectedPageId,
  selectedSectionKey,
  onSelectPage,
  onCreatePage,
  onDeletePage,
  onSelectSection,
  onAddSection,
  onDuplicateSection,
  onMoveSection,
  onReorderSection,
  onToggleSection,
  onDeleteSection,
}: BuilderSidebarProps) {
  const [draggedKey, setDraggedKey] = useState<string>()
  const [showBlocks, setShowBlocks] = useState(false)

  const dropSection = (event: DragEvent, targetKey: string) => {
    event.preventDefault()
    if (draggedKey && draggedKey !== targetKey) onReorderSection(draggedKey, targetKey)
    setDraggedKey(undefined)
  }

  return (
    <aside className="df4y-builder-sidebar" aria-label="Páginas e secções">
      <div className="df4y-builder-sidebar-heading">
        <div>
          <span className="df4y-builder-overline">Estrutura</span>
          <h2>Páginas</h2>
        </div>
        <button
          className="df4y-builder-icon-button"
          type="button"
          onClick={onCreatePage}
          title="Nova página"
        >
          <AddIcon />
        </button>
      </div>

      <div className="df4y-builder-pages" role="list">
        {pages.map((item) => (
          <button
            className={`df4y-builder-page-row${samePage(item._id, selectedPageId) ? ' is-active' : ''}`}
            key={item._id}
            type="button"
            onClick={() => onSelectPage(item._id)}
          >
            <DocumentIcon />
            <span>
              <strong>{item.title || 'Página sem nome'}</strong>
              <small>{item.route || 'Sem endereço'}</small>
            </span>
            <i>{item._id.startsWith('drafts.') ? 'Rascunho' : 'Publicada'}</i>
          </button>
        ))}
      </div>

      {page ? (
        <>
          <div className="df4y-builder-sidebar-heading is-sections">
            <div>
              <span className="df4y-builder-overline">Página atual</span>
              <h2>Secções</h2>
            </div>
            <button
              className="df4y-builder-icon-button is-danger"
              type="button"
              onClick={onDeletePage}
              title="Eliminar página"
            >
              <TrashIcon />
            </button>
          </div>

          <div className="df4y-builder-section-tree" role="list">
            {page.sections.map((section, index) => (
              <div
                className={`df4y-builder-section-row${
                  section._key === selectedSectionKey ? ' is-active' : ''
                }${section.enabled === false ? ' is-hidden' : ''}`}
                draggable
                key={section._key}
                role="listitem"
                onDragStart={() => setDraggedKey(section._key)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => dropSection(event, section._key)}
                onDragEnd={() => setDraggedKey(undefined)}
              >
                <button
                  className="df4y-builder-section-main"
                  type="button"
                  onClick={() => onSelectSection(section._key)}
                >
                  <span className="df4y-builder-drag-handle" aria-hidden="true">
                    ⋮⋮
                  </span>
                  <span>
                    <strong>{section.internalLabel || builderSectionTitle(section._type)}</strong>
                    <small>{builderSectionTitle(section._type)}</small>
                  </span>
                </button>
                <div className="df4y-builder-section-actions">
                  <button
                    type="button"
                    onClick={() => onMoveSection(section._key, -1)}
                    disabled={index === 0}
                    title="Subir"
                  >
                    <ArrowUpIcon />
                  </button>
                  <button
                    type="button"
                    onClick={() => onMoveSection(section._key, 1)}
                    disabled={index === page.sections.length - 1}
                    title="Descer"
                  >
                    <ArrowDownIcon />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDuplicateSection(section._key)}
                    title="Duplicar"
                  >
                    <CopyIcon />
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleSection(section._key)}
                    title={section.enabled === false ? 'Mostrar' : 'Ocultar'}
                  >
                    {section.enabled === false ? <EyeClosedIcon /> : <EyeOpenIcon />}
                  </button>
                  <button
                    className="is-danger"
                    type="button"
                    onClick={() => onDeleteSection(section._key)}
                    title="Eliminar secção"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="df4y-builder-add-block">
            <button
              className="df4y-builder-add-block-trigger"
              type="button"
              aria-expanded={showBlocks}
              onClick={() => setShowBlocks((value) => !value)}
            >
              <AddIcon /> Adicionar secção
            </button>
            {showBlocks ? (
              <div className="df4y-builder-block-menu">
                {builderSectionDefinitions.map((definition) => (
                  <button
                    key={definition.type}
                    type="button"
                    onClick={() => {
                      onAddSection(definition.type)
                      setShowBlocks(false)
                    }}
                  >
                    <strong>{definition.title}</strong>
                    <span>{definition.description}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </>
      ) : null}
    </aside>
  )
}

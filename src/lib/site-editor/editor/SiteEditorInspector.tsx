import React, {useEffect, useMemo, useState} from 'react'
import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {CogIcon} from '@sanity/icons/Cog'
import {DocumentIcon} from '@sanity/icons/Document'
import {TrashIcon} from '@sanity/icons/Trash'
import {panelsForEditorNode} from '../model'
import type {
  SiteEditorDocument,
  SiteEditorField,
  SiteEditorNode,
  SiteEditorPanel,
  SiteEditorSaveState,
  SitePageDocument,
} from '../types'
import {SiteEditorFieldInput} from './SiteEditorField'
import {SitePageSectionsEditor} from './SitePageSectionsEditor'
import type {BuilderViewport} from '$lib/builder/types'

type Asset = {id: string; url: string}

type Props = {
  node?: SiteEditorNode
  document?: SiteEditorDocument
  loading: boolean
  saveState: SiteEditorSaveState
  selectedPath?: string
  selectedSectionKey?: string
  projectId: string
  dataset: string
  viewport: BuilderViewport
  canDelete: boolean
  mode: 'focused' | 'all'
  onChange: (path: string, value: unknown) => void
  onReplace: (document: SiteEditorDocument) => void
  onSelectSection: (key?: string) => void
  onUpload: (file: File, kind: 'image' | 'video') => Promise<Asset>
  onDelete: () => void
  onShowAll: () => void
}

const saveLabels: Record<SiteEditorSaveState, string> = {
  idle: 'Sem alterações',
  dirty: 'Alterações por guardar',
  saving: 'A guardar…',
  saved: 'Guardado',
  error: 'Erro ao guardar',
  conflict: 'Conflito de edição',
}

const fieldPath = (rootPath: string | undefined, name: string) => {
  if (!rootPath) return name
  if (rootPath === name) return name
  return `${rootPath}.${name}`
}

type FocusedField = {
  field: SiteEditorField
  panel: SiteEditorPanel
  path: string
}

const pathContains = (selectedPath: string, candidatePath: string) =>
  selectedPath === candidatePath ||
  selectedPath.startsWith(`${candidatePath}.`) ||
  selectedPath.startsWith(`${candidatePath}[`)

const focusedFieldFor = (
  panels: SiteEditorPanel[],
  rootPath: string | undefined,
  selectedPath: string | undefined,
): FocusedField | undefined => {
  if (!selectedPath) return undefined
  let match: FocusedField | undefined

  const visit = (panel: SiteEditorPanel, fields: SiteEditorField[], parentPath?: string) => {
    for (const field of fields) {
      const path = fieldPath(parentPath, field.name)
      if (!pathContains(selectedPath, path)) continue
      match = {field, panel, path}
      if (field.fields?.length) visit(panel, field.fields, path)
      if (field.item) {
        const selector = selectedPath.slice(path.length).match(/^\[[^\]]+\]/)?.[0]
        if (!selector) continue
        const itemPath = `${path}${selector}`
        match = {field: field.item, panel, path: itemPath}
        if (field.item.fields?.length) visit(panel, field.item.fields, itemPath)
      }
    }
  }

  for (const panel of panels) visit(panel, panel.fields, rootPath)
  return match
}

const scrollPanelWithWheel = (event: React.WheelEvent<HTMLDivElement>) => {
  const element = event.currentTarget
  if (!event.deltaY || element.scrollHeight <= element.clientHeight) return
  const scale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? element.clientHeight : 1
  const before = element.scrollTop
  element.scrollTop += event.deltaY * scale
  if (element.scrollTop !== before) {
    event.preventDefault()
    event.stopPropagation()
  }
}

export function SiteEditorInspector({
  node,
  document,
  loading,
  saveState,
  selectedPath,
  selectedSectionKey,
  projectId,
  dataset,
  viewport,
  canDelete,
  mode,
  onChange,
  onReplace,
  onSelectSection,
  onUpload,
  onDelete,
  onShowAll,
}: Props) {
  const panels = useMemo(
    () => panelsForEditorNode(node?.documentType, node?.rootPath),
    [node?.documentType, node?.rootPath],
  )
  const [openPanels, setOpenPanels] = useState<Set<string>>(() => new Set())
  const focusedField = useMemo(
    () => (mode === 'focused' ? focusedFieldFor(panels, node?.rootPath, selectedPath) : undefined),
    [mode, node?.rootPath, panels, selectedPath],
  )
  const focusedSection = mode === 'focused' && document?._type === 'sitePage' && selectedSectionKey
  const focusedUnavailable = mode === 'focused' && !focusedField && !focusedSection

  useEffect(() => {
    setOpenPanels(new Set(panels.map((panel) => panel.id)))
  }, [node?.id, panels])

  const togglePanel = (panel: SiteEditorPanel) => {
    setOpenPanels((current) => {
      const next = new Set(current)
      if (next.has(panel.id)) next.delete(panel.id)
      else next.add(panel.id)
      return next
    })
  }

  return (
    <aside className="site-editor-inspector" aria-label="Propriedades do conteúdo">
      <div className="site-editor-inspector-head">
        <div className="site-editor-inspector-title">
          <DocumentIcon />
          <span>
            <small>{node?.kind === 'global' ? 'Global' : node?.kind === 'page' ? 'Página' : 'Conteúdo'}</small>
            <strong>{node?.title || 'Selecione conteúdo'}</strong>
          </span>
        </div>
        <div className={`site-editor-save-state is-${saveState}`}>
          <i /> {saveLabels[saveState]}
        </div>
      </div>

      {loading ? (
        <div className="site-editor-inspector-loading"><span /> A abrir conteúdo…</div>
      ) : !document || !node ? (
        <div className="site-editor-inspector-empty">
          Clique numa página ou num elemento da pré-visualização para o editar.
        </div>
      ) : (
        <div className="site-editor-inspector-scroll" onWheel={scrollPanelWithWheel}>
          {mode === 'focused' ? (
            <div className="site-editor-focused-context">
              <span>
                <small>A editar</small>
                <strong>
                  {focusedField?.field.label ||
                    (focusedSection ? 'Secção selecionada' : 'Elemento selecionado')}
                </strong>
              </span>
              <button type="button" onClick={onShowAll}>
                <CogIcon /> Todas as definições
              </button>
            </div>
          ) : null}

          {node.kind === 'global' && mode === 'all' ? (
            <div className="site-editor-global-note">
              <strong>Componente global</strong>
              <p>As alterações são apresentadas em todas as páginas onde este conteúdo é usado.</p>
            </div>
          ) : null}

          {focusedSection ? (
            <SitePageSectionsEditor
              page={document as SitePageDocument}
              selectedSectionKey={selectedSectionKey}
              onSelectSection={onSelectSection}
              onChange={(next) => onReplace(next)}
              onUpload={onUpload}
            />
          ) : focusedField ? (
            <div className="site-editor-focused-field">
              <SiteEditorFieldInput
                field={focusedField.field}
                path={focusedField.path}
                source={document}
                documentType={document._type}
                selectedPath={selectedPath}
                projectId={projectId}
                dataset={dataset}
                viewport={viewport}
                onChange={onChange}
                onUpload={onUpload}
              />
            </div>
          ) : focusedUnavailable ? (
            <div className="site-editor-focused-unavailable">
              <strong>Este elemento não tem um campo isolado.</strong>
              <p>
                Abra todas as definições para editar o grupo onde este elemento está incluído.
              </p>
              <button type="button" onClick={onShowAll}>
                <CogIcon /> Abrir todas as definições
              </button>
            </div>
          ) : (
            <div className="site-editor-panels">
              {panels.map((panel) => {
                const open = openPanels.has(panel.id)
                return (
                  <section key={panel.id} className={open ? 'is-open' : ''}>
                    <button type="button" className="site-editor-panel-toggle" onClick={() => togglePanel(panel)} aria-expanded={open}>
                      <span><strong>{panel.label}</strong>{panel.description ? <small>{panel.description}</small> : null}</span>
                      <ChevronDownIcon />
                    </button>
                    {open ? (
                      <div className="site-editor-panel-fields">
                        {panel.fields.map((field) =>
                          field.type === 'sections' && document._type === 'sitePage' ? (
                            <SitePageSectionsEditor
                              key={field.name}
                              page={document as SitePageDocument}
                              selectedSectionKey={selectedSectionKey}
                              onSelectSection={onSelectSection}
                              onChange={(next) => onReplace(next)}
                              onUpload={onUpload}
                            />
                          ) : (
                            <SiteEditorFieldInput
                              key={field.name}
                              field={field}
                              path={fieldPath(node.rootPath, field.name)}
                              source={document}
                              documentType={document._type}
                              selectedPath={selectedPath}
                              projectId={projectId}
                              dataset={dataset}
                              viewport={viewport}
                              onChange={onChange}
                              onUpload={onUpload}
                            />
                          ),
                        )}
                      </div>
                    ) : null}
                  </section>
                )
              })}
              {!panels.length ? (
                <div className="site-editor-inspector-empty">
                  Este tipo de conteúdo ainda não tem campos no editor simplificado.
                </div>
              ) : null}
            </div>
          )}

          {mode === 'all' && canDelete && document._type !== 'siteLanding' ? (
            <div className="site-editor-danger-zone">
              <button type="button" onClick={onDelete}><TrashIcon /> Eliminar conteúdo</button>
            </div>
          ) : null}
        </div>
      )}
    </aside>
  )
}

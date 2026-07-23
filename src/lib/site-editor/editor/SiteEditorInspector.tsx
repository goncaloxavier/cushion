import React, {Suspense, useCallback, useEffect, useMemo, useState} from 'react'
import {ArrowLeftIcon} from '@sanity/icons/ArrowLeft'
import {ChevronRightIcon} from '@sanity/icons/ChevronRight'
import {CogIcon} from '@sanity/icons/Cog'
import {DocumentIcon} from '@sanity/icons/Document'
import {TrashIcon} from '@sanity/icons/Trash'
import {panelsForEditorNode} from '../model'
import {getEditorValue} from '../path'
import type {
  Asset,
  SiteEditorDocument,
  SiteEditorField,
  SiteEditorNode,
  SiteEditorPanel,
  SiteEditorSaveState,
  SitePageDocument,
} from '../types'
import {SiteEditorFieldInput} from './SiteEditorField'
import {SitePageSectionsEditor} from './SitePageSectionsEditor'
import type {SiteEditorUploadProgress} from './api'
import type {BuilderViewport} from '$lib/builder/types'

const ArticleWorkspace = React.lazy(() =>
  import('./ArticleWorkspace').then((module) => ({default: module.ArticleWorkspace})),
)
const StoreCategoryManager = React.lazy(() =>
  import('./StoreCategoryManager').then((module) => ({default: module.StoreCategoryManager})),
)

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
  nodes: SiteEditorNode[]
  optionSources: Record<string, Array<{label: string; value: string}>>
  onChange: (path: string, value: unknown, immediate?: boolean) => void
  onReplace: (document: SiteEditorDocument) => void
  onSelectSection: (key?: string) => void
  onUpload: (
    file: File,
    kind: 'image' | 'video',
    onProgress?: (progress: SiteEditorUploadProgress) => void,
  ) => Promise<Asset>
  onDelete: () => void
  onShowAll: () => void
  onOpenNode: (node: SiteEditorNode, path?: string) => void
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

const resolveFieldOptions = (
  field: SiteEditorField,
  optionSources: Props['optionSources'],
): SiteEditorField => ({
  ...field,
  options: field.optionsSource
    ? (optionSources[field.optionsSource] ?? field.options)
    : field.options,
  fields: field.fields?.map((child) => resolveFieldOptions(child, optionSources)),
  item: field.item ? resolveFieldOptions(field.item, optionSources) : undefined,
})

const itemCountLabel = (count: number, singular: string, plural: string) =>
  `${count} ${count === 1 ? singular : plural}`

const emptyFieldSummary = (field: SiteEditorField) =>
  field.required ? 'Preenchimento obrigatório' : 'Opcional'

const fieldValueSummary = (field: SiteEditorField, value: unknown) => {
  if (field.type === 'localizedString' || field.type === 'localizedText') {
    const text =
      value && typeof value === 'object' && !Array.isArray(value)
        ? String((value as Record<string, unknown>).pt || '').trim()
        : ''
    return text || emptyFieldSummary(field)
  }
  if (field.type === 'boolean') return value === true ? 'Ativado' : 'Desativado'
  if (field.type === 'number')
    return typeof value === 'number' ? String(value) : emptyFieldSummary(field)
  if (field.type === 'slug') {
    const slug =
      value && typeof value === 'object' && !Array.isArray(value)
        ? String((value as Record<string, unknown>).current || '').trim()
        : ''
    return slug || emptyFieldSummary(field)
  }
  if (field.type === 'select') {
    return (
      field.options?.find((option) => option.value === value)?.label ||
      String(value || emptyFieldSummary(field))
    )
  }
  if (field.type === 'image') {
    const asset =
      value && typeof value === 'object' && !Array.isArray(value)
        ? (value as Record<string, unknown>).asset
        : undefined
    return asset ? 'Imagem adicionada' : 'Sem imagem'
  }
  if (field.type === 'gallery') {
    return itemCountLabel(Array.isArray(value) ? value.length : 0, 'ficheiro', 'ficheiros')
  }
  if (field.type === 'video') {
    const video =
      value && typeof value === 'object' && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : undefined
    const hasFile = Boolean(
      video?.file && typeof video.file === 'object' && (video.file as {asset?: unknown}).asset,
    )
    const hasYoutubeUrl = Boolean(
      typeof video?.youtubeUrl === 'string' && (video.youtubeUrl as string).trim(),
    )
    if (hasFile) return 'Vídeo carregado'
    if (hasYoutubeUrl) return 'Link do YouTube'
    return emptyFieldSummary(field)
  }
  if (field.type === 'navigation') {
    return itemCountLabel(Array.isArray(value) ? value.length : 0, 'ligação', 'ligações')
  }
  if (field.type === 'sections') {
    return itemCountLabel(Array.isArray(value) ? value.length : 0, 'secção', 'secções')
  }
  if (field.type === 'article') {
    const article =
      value && typeof value === 'object' && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : undefined
    return Array.isArray(article?.pt) && article.pt.length ? 'Artigo com conteúdo' : 'Ainda vazio'
  }
  if (field.type === 'array') {
    return itemCountLabel(Array.isArray(value) ? value.length : 0, 'item', 'itens')
  }
  if (field.type === 'object') {
    const count =
      value && typeof value === 'object' && !Array.isArray(value)
        ? Object.values(value as Record<string, unknown>).filter(
            (item) => item !== undefined && item !== null && item !== '',
          ).length
        : 0
    return count ? 'Configurado' : emptyFieldSummary(field)
  }
  return String(value || '').trim() || emptyFieldSummary(field)
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

function SiteEditorInspectorComponent({
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
  nodes,
  optionSources,
  onChange,
  onReplace,
  onSelectSection,
  onUpload,
  onDelete,
  onShowAll,
  onOpenNode,
}: Props) {
  const panels = useMemo(
    () =>
      panelsForEditorNode(node?.documentType, node?.rootPath).map((panel) => ({
        ...panel,
        fields: panel.fields.map((field) => resolveFieldOptions(field, optionSources)),
      })),
    [node?.documentType, node?.rootPath, optionSources],
  )
  const [activePanelId, setActivePanelId] = useState<string>()
  const [activeFieldName, setActiveFieldName] = useState<string>()
  const [articleWorkspace, setArticleWorkspace] = useState<{
    field: SiteEditorField
    path: string
    returnFocus: HTMLButtonElement
  }>()
  const closeArticleWorkspace = useCallback(() => setArticleWorkspace(undefined), [])
  const activePanel = panels.find((panel) => panel.id === activePanelId)
  const activeField = activePanel?.fields.find((field) => field.name === activeFieldName)
  const focusedField = useMemo(
    () => (mode === 'focused' ? focusedFieldFor(panels, node?.rootPath, selectedPath) : undefined),
    [mode, node?.rootPath, panels, selectedPath],
  )
  const focusedSection = mode === 'focused' && document?._type === 'sitePage' && selectedSectionKey
  const focusedUnavailable = mode === 'focused' && !focusedField && !focusedSection
  const categoryProducts = useMemo(
    () =>
      document?._type === 'storeCategory' && node?.slug
        ? nodes
            .filter(
              (candidate) =>
                candidate.documentType === 'storeProduct' && candidate.category === node.slug,
            )
            .sort((left, right) => left.title.localeCompare(right.title, 'pt'))
        : [],
    [document?._type, node?.slug, nodes],
  )
  const categoryPendingProducts = useMemo(
    () =>
      document?._type === 'storeCategory' && node?.slug
        ? nodes
            .filter(
              (candidate) =>
                candidate.documentType === 'storeProduct' &&
                candidate.publishedCategory === node.slug &&
                candidate.category !== node.slug,
            )
            .sort((left, right) => left.title.localeCompare(right.title, 'pt'))
        : [],
    [document?._type, node?.slug, nodes],
  )

  useEffect(() => {
    setActivePanelId(undefined)
    setActiveFieldName(undefined)
    setArticleWorkspace(undefined)
  }, [node?.id])

  const showAllDefinitions = (panelId?: string, fieldName?: string) => {
    setActivePanelId(panelId)
    setActiveFieldName(fieldName)
    onShowAll()
  }

  const openSectionArticle = (path: string, returnFocus: HTMLButtonElement) =>
    setArticleWorkspace({
      field: {
        name: 'body',
        label: 'Texto editorial da secção',
        type: 'article',
      },
      path,
      returnFocus,
    })

  const renderField = (field: SiteEditorField) =>
    field.type === 'sections' && document?._type === 'sitePage' ? (
      <SitePageSectionsEditor
        key={field.name}
        page={document as SitePageDocument}
        selectedSectionKey={selectedSectionKey}
        dataset={dataset}
        onSelectSection={onSelectSection}
        onChange={(next) => onReplace(next)}
        onUpload={onUpload}
        onOpenArticle={openSectionArticle}
      />
    ) : (
      <SiteEditorFieldInput
        key={field.name}
        field={field}
        path={fieldPath(node?.rootPath, field.name)}
        source={document!}
        documentType={document!._type}
        selectedPath={selectedPath}
        projectId={projectId}
        dataset={dataset}
        viewport={viewport}
        onChange={onChange}
        onUpload={onUpload}
        onOpenArticle={(field, path, returnFocus) =>
          setArticleWorkspace({field, path, returnFocus})
        }
      />
    )

  const focusedRootField = focusedField?.panel.fields.find((field) =>
    selectedPath ? pathContains(selectedPath, fieldPath(node?.rootPath, field.name)) : false,
  )

  return (
    <aside className="site-editor-inspector" aria-label="Propriedades do conteúdo">
      <div className="site-editor-inspector-head">
        <div className="site-editor-inspector-title">
          <DocumentIcon />
          <span>
            <small>
              {node?.kind === 'global' ? 'Global' : node?.kind === 'page' ? 'Página' : 'Conteúdo'}
            </small>
            <strong>{node?.title || 'Selecione conteúdo'}</strong>
          </span>
        </div>
        <div className={`site-editor-save-state is-${saveState}`}>
          <i /> {saveLabels[saveState]}
        </div>
      </div>

      {loading ? (
        <div className="site-editor-inspector-loading">
          <span /> A abrir conteúdo…
        </div>
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
              <button
                type="button"
                onClick={() => showAllDefinitions(focusedField?.panel.id, focusedRootField?.name)}
              >
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

          {document._type === 'storeCategory' && mode === 'all' ? (
            <Suspense fallback={null}>
              <StoreCategoryManager
                document={document}
                products={categoryProducts}
                pendingProducts={categoryPendingProducts}
                selectedPath={selectedPath}
                projectId={projectId}
                dataset={dataset}
                viewport={viewport}
                onChange={onChange}
                onUpload={onUpload}
                onOpenProduct={(product) => onOpenNode(product, 'category')}
              />
            </Suspense>
          ) : focusedSection ? (
            <SitePageSectionsEditor
              page={document as SitePageDocument}
              selectedSectionKey={selectedSectionKey}
              dataset={dataset}
              onSelectSection={onSelectSection}
              onChange={(next) => onReplace(next)}
              onUpload={onUpload}
              onOpenArticle={openSectionArticle}
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
                onOpenArticle={(field, path, returnFocus) =>
                  setArticleWorkspace({field, path, returnFocus})
                }
              />
            </div>
          ) : focusedUnavailable ? (
            <div className="site-editor-focused-unavailable">
              <strong>Este elemento não tem um campo isolado.</strong>
              <p>Abra todas as definições para editar o grupo onde este elemento está incluído.</p>
              <button type="button" onClick={() => showAllDefinitions()}>
                <CogIcon /> Abrir todas as definições
              </button>
            </div>
          ) : (
            <div className="site-editor-panels">
              {activePanel ? (
                <section className="site-editor-panel-workspace">
                  <header className="site-editor-panel-workspace-head">
                    <button
                      type="button"
                      onClick={() => {
                        if (activeField) setActiveFieldName(undefined)
                        else setActivePanelId(undefined)
                      }}
                    >
                      <ArrowLeftIcon /> {activeField ? activePanel.label : 'Todas as áreas'}
                    </button>
                    <span>
                      <strong>{activeField?.label || activePanel.label}</strong>
                      {activeField?.description || activePanel.description ? (
                        <small>{activeField?.description || activePanel.description}</small>
                      ) : null}
                    </span>
                  </header>
                  {activeField ? (
                    <div className="site-editor-panel-fields">{renderField(activeField)}</div>
                  ) : (
                    <div className="site-editor-field-index">
                      {activePanel.fields.map((field) => (
                        <button
                          key={field.name}
                          type="button"
                          onClick={() => setActiveFieldName(field.name)}
                        >
                          <span>
                            <strong>{field.label}</strong>
                            <small>
                              {fieldValueSummary(
                                field,
                                getEditorValue(document, fieldPath(node.rootPath, field.name)),
                              )}
                            </small>
                          </span>
                          <ChevronRightIcon />
                        </button>
                      ))}
                    </div>
                  )}
                </section>
              ) : panels.length ? (
                <div className="site-editor-panel-overview">
                  <header>
                    <small>Definições desta página</small>
                    <strong>O que quer editar?</strong>
                    <p>Abra uma área para ver apenas os campos relacionados.</p>
                  </header>
                  <div className="site-editor-panel-index">
                    {panels.map((panel) => (
                      <button
                        key={panel.id}
                        type="button"
                        onClick={() => {
                          setActivePanelId(panel.id)
                          setActiveFieldName(
                            panel.fields.length === 1 ? panel.fields[0]?.name : undefined,
                          )
                        }}
                      >
                        <span>
                          <strong>{panel.label}</strong>
                          <small>{panel.description || `${panel.fields.length} campos`}</small>
                        </span>
                        <i>{panel.fields.length}</i>
                        <ChevronRightIcon />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="site-editor-inspector-empty">
                  Este tipo de conteúdo ainda não tem campos no editor simplificado.
                </div>
              )}
            </div>
          )}

          {mode === 'all' && !activePanel && canDelete && document._type !== 'siteLanding' ? (
            document._type === 'storeCategory' &&
            (categoryProducts.length || categoryPendingProducts.length) ? (
              <div className="site-editor-category-delete-guard">
                <strong>
                  {categoryProducts.length
                    ? 'Esta categoria está em uso'
                    : 'Existem mudanças por publicar'}
                </strong>
                <p>
                  {categoryProducts.length
                    ? 'Mova os produtos acima para outra categoria antes de a eliminar. Assim nenhum produto fica sem organização na Loja.'
                    : 'Abra os produtos assinalados acima e publique a mudança. Depois poderá eliminar esta categoria em segurança.'}
                </p>
              </div>
            ) : (
              <div className="site-editor-danger-zone">
                <button type="button" onClick={onDelete}>
                  <TrashIcon /> Eliminar conteúdo
                </button>
              </div>
            )
          ) : null}
        </div>
      )}
      {articleWorkspace && document && node ? (
        <Suspense fallback={null}>
          <ArticleWorkspace
            document={document}
            documentTitle={node.title}
            fieldLabel={articleWorkspace.field.label}
            path={articleWorkspace.path}
            projectId={projectId}
            dataset={dataset}
            saveState={saveState}
            returnFocus={articleWorkspace.returnFocus}
            onChange={onChange}
            onUpload={onUpload}
            onClose={closeArticleWorkspace}
          />
        </Suspense>
      ) : null}
    </aside>
  )
}

export const SiteEditorInspector = React.memo(SiteEditorInspectorComponent)

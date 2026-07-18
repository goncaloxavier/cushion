import React, {useMemo, useState} from 'react'
import {AddIcon} from '@sanity/icons/Add'
import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {CloseIcon} from '@sanity/icons/Close'
import {DocumentIcon} from '@sanity/icons/Document'
import {HomeIcon} from '@sanity/icons/Home'
import {SearchIcon} from '@sanity/icons/Search'
import {StackCompactIcon} from '@sanity/icons/StackCompact'
import type {SiteEditorArea, SiteEditorDocumentType, SiteEditorNode} from '../types'

const areaLabels: Array<{value: SiteEditorArea; label: string}> = [
  {value: 'pages', label: 'Páginas'},
  {value: 'content', label: 'Conteúdo'},
  {value: 'global', label: 'Global'},
]

const thumbnailUrl = (source?: string) => {
  if (!source) return undefined
  try {
    const url = new URL(source)
    if (url.hostname === 'cdn.sanity.io') {
      url.searchParams.set('w', '96')
      url.searchParams.set('h', '96')
      url.searchParams.set('fit', 'crop')
      url.searchParams.set('auto', 'format')
    }
    return url.toString()
  } catch {
    return source
  }
}

type Props = {
  nodes: SiteEditorNode[]
  selectedNodeId?: string
  area: SiteEditorArea
  onAreaChange: (area: SiteEditorArea) => void
  onSelect: (node: SiteEditorNode) => void
  onCreate: (documentType?: SiteEditorDocumentType) => void
  onClose: () => void
}

const collectionCreateLabels: Partial<Record<SiteEditorDocumentType, string>> = {
  sitePage: 'Adicionar página',
  productCategory: 'Adicionar produto',
  storeCategory: 'Adicionar categoria',
  storeProduct: 'Adicionar produto da Loja',
  caseStudy: 'Adicionar caso de estudo',
  blogPost: 'Adicionar artigo',
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

function SiteEditorSidebarComponent({
  nodes,
  selectedNodeId,
  area,
  onAreaChange,
  onSelect,
  onCreate,
  onClose,
}: Props) {
  const [query, setQuery] = useState('')
  const [collapsed, setCollapsed] = useState<Set<string>>(
    () =>
      new Set(
        nodes
          .filter((node) => node.area === 'content' && node.kind === 'collection')
          .map((node) => node.id),
      ),
  )
  const normalizedQuery = query.trim().toLocaleLowerCase('pt')

  const areaNodes = useMemo(() => {
    const relevant = nodes.filter((node) => node.area === area)
    if (!normalizedQuery) return relevant
    const matchingDocuments = new Set(
      relevant
        .filter((node) =>
          `${node.title} ${node.subtitle || ''} ${node.route || ''}`
            .toLocaleLowerCase('pt')
            .includes(normalizedQuery),
        )
        .map((node) => node.id),
    )
    for (const node of relevant) {
      if (node.parentId && matchingDocuments.has(node.id)) matchingDocuments.add(node.parentId)
    }
    return relevant.filter(
      (node) =>
        matchingDocuments.has(node.id) || (node.parentId && matchingDocuments.has(node.parentId)),
    )
  }, [area, nodes, normalizedQuery])

  const roots = areaNodes.filter((node) => !node.parentId)
  const childrenFor = (id: string) => areaNodes.filter((node) => node.parentId === id)

  const toggleCollection = (id: string) => {
    setCollapsed((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const renderNode = (node: SiteEditorNode, nested = false) => {
    const children = childrenFor(node.id)
    const collection = node.kind === 'collection'
    const isCollapsed = collapsed.has(node.id) && !normalizedQuery
    const thumbnail = collection ? undefined : thumbnailUrl(node.thumbnailUrl)
    const assignedProductCount =
      node.documentType === 'storeCategory' && node.slug
        ? nodes.filter(
            (candidate) =>
              candidate.documentType === 'storeProduct' && candidate.category === node.slug,
          ).length
        : undefined
    const subtitle =
      assignedProductCount === undefined
        ? node.subtitle || node.route || `${node.count ?? 0} itens`
        : `${assignedProductCount} ${assignedProductCount === 1 ? 'produto' : 'produtos'}`
    const treeButton = (
      <button
        type="button"
        className={`site-editor-tree-item${nested ? ' is-nested' : ''}${
          selectedNodeId === node.id ? ' is-selected' : ''
        }${collection ? ' is-collection' : ''}`}
        onClick={() => (collection ? toggleCollection(node.id) : onSelect(node))}
        aria-expanded={collection ? !isCollapsed : undefined}
      >
        <span
          className={`site-editor-tree-icon${thumbnail ? ' has-thumbnail' : ''}`}
          aria-hidden="true"
        >
          {collection ? (
            <StackCompactIcon />
          ) : node.route === '/' ? (
            <HomeIcon />
          ) : (
            <DocumentIcon />
          )}
          {thumbnail ? <img src={thumbnail} alt="" loading="lazy" decoding="async" /> : null}
        </span>
        <span className="site-editor-tree-copy">
          <strong>{node.title}</strong>
          <small>{subtitle}</small>
        </span>
        {node.draft ? <i className="site-editor-draft-dot" title="Rascunho" /> : null}
        {collection ? (
          <span className={`site-editor-tree-chevron${isCollapsed ? '' : ' is-open'}`}>
            <ChevronDownIcon />
          </span>
        ) : null}
      </button>
    )

    return (
      <React.Fragment key={node.id}>
        {collection && node.collectionType ? (
          <div className="site-editor-tree-collection-row">
            {treeButton}
            <button
              type="button"
              className="site-editor-tree-add"
              onClick={() => onCreate(node.collectionType)}
              aria-label={collectionCreateLabels[node.collectionType] || 'Adicionar conteúdo'}
              title={collectionCreateLabels[node.collectionType] || 'Adicionar conteúdo'}
            >
              <AddIcon />
            </button>
          </div>
        ) : (
          treeButton
        )}
        {collection && !isCollapsed ? children.map((child) => renderNode(child, true)) : null}
      </React.Fragment>
    )
  }

  return (
    <aside className="site-editor-sidebar" aria-label="Conteúdo do site">
      <div className="site-editor-sidebar-head">
        <div>
          <span>DaFábrica4You</span>
          <strong>Editor do site</strong>
        </div>
        <button
          className="site-editor-sidebar-close"
          type="button"
          onClick={onClose}
          aria-label="Fechar páginas e conteúdo"
          title="Fechar"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="site-editor-area-tabs" role="tablist" aria-label="Áreas do editor">
        {areaLabels.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={area === item.value}
            className={area === item.value ? 'is-active' : ''}
            onClick={() => onAreaChange(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <label className="site-editor-search">
        <SearchIcon />
        <span className="sr-only">Pesquisar conteúdo</span>
        <input
          type="search"
          value={query}
          placeholder="Pesquisar…"
          onChange={(event) => setQuery(event.currentTarget.value)}
        />
      </label>

      <div className="site-editor-tree" onWheel={scrollPanelWithWheel}>
        {roots.map((node) => renderNode(node))}
        {!roots.length ? (
          <div className="site-editor-sidebar-empty">Nenhum conteúdo encontrado.</div>
        ) : null}
      </div>

      {area !== 'global' ? (
        <button className="site-editor-create" type="button" onClick={() => onCreate()}>
          <AddIcon />
          {area === 'pages' ? 'Nova página' : 'Novo conteúdo'}
        </button>
      ) : null}
    </aside>
  )
}

export const SiteEditorSidebar = React.memo(SiteEditorSidebarComponent)

import React, {useMemo, useState} from 'react'
import {AddIcon} from '@sanity/icons/Add'
import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {DocumentIcon} from '@sanity/icons/Document'
import {HomeIcon} from '@sanity/icons/Home'
import {SearchIcon} from '@sanity/icons/Search'
import {StackCompactIcon} from '@sanity/icons/StackCompact'
import type {SiteEditorArea, SiteEditorNode} from '../types'

const areaLabels: Array<{value: SiteEditorArea; label: string}> = [
  {value: 'pages', label: 'Páginas'},
  {value: 'content', label: 'Conteúdo'},
  {value: 'global', label: 'Global'},
]

type Props = {
  nodes: SiteEditorNode[]
  selectedNodeId?: string
  area: SiteEditorArea
  onAreaChange: (area: SiteEditorArea) => void
  onSelect: (node: SiteEditorNode) => void
  onCreate: () => void
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

export function SiteEditorSidebar({
  nodes,
  selectedNodeId,
  area,
  onAreaChange,
  onSelect,
  onCreate,
}: Props) {
  const [query, setQuery] = useState('')
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set())
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
      (node) => matchingDocuments.has(node.id) || (node.parentId && matchingDocuments.has(node.parentId)),
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
    return (
      <React.Fragment key={node.id}>
        <button
          type="button"
          className={`site-editor-tree-item${nested ? ' is-nested' : ''}${
            selectedNodeId === node.id ? ' is-selected' : ''
          }${collection ? ' is-collection' : ''}`}
          onClick={() => (collection ? toggleCollection(node.id) : onSelect(node))}
          aria-expanded={collection ? !isCollapsed : undefined}
        >
          <span className="site-editor-tree-icon" aria-hidden="true">
            {collection ? <StackCompactIcon /> : node.route === '/' ? <HomeIcon /> : <DocumentIcon />}
          </span>
          <span className="site-editor-tree-copy">
            <strong>{node.title}</strong>
            <small>{node.subtitle || node.route || `${node.count ?? 0} itens`}</small>
          </span>
          {node.draft ? <i className="site-editor-draft-dot" title="Rascunho" /> : null}
          {collection ? (
            <span className={`site-editor-tree-chevron${isCollapsed ? '' : ' is-open'}`}>
              <ChevronDownIcon />
            </span>
          ) : null}
        </button>
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
        <a href="/painel/pedidos" aria-label="Voltar ao backoffice" title="Voltar ao backoffice">
          ←
        </a>
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
        <button className="site-editor-create" type="button" onClick={onCreate}>
          <AddIcon />
          {area === 'pages' ? 'Nova página' : 'Novo conteúdo'}
        </button>
      ) : null}
    </aside>
  )
}

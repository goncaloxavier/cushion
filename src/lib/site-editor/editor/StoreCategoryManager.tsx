import React from 'react'
import {ChevronRightIcon} from '@sanity/icons/ChevronRight'
import {StackCompactIcon} from '@sanity/icons/StackCompact'
import type {BuilderViewport} from '$lib/builder/types'
import type {
  SiteEditorDocument,
  SiteEditorField,
  SiteEditorNode,
} from '$lib/site-editor/types'
import {SiteEditorFieldInput} from './SiteEditorField'

type Asset = {id: string; url: string}

type Props = {
  document: SiteEditorDocument
  products: SiteEditorNode[]
  pendingProducts: SiteEditorNode[]
  selectedPath?: string
  projectId: string
  dataset: string
  viewport: BuilderViewport
  onChange: (path: string, value: unknown) => void
  onUpload: (file: File, kind: 'image' | 'video') => Promise<Asset>
  onOpenProduct: (node: SiteEditorNode) => void
}

const titleField: SiteEditorField = {
  name: 'title',
  label: 'Nome da categoria',
  description: 'É o nome apresentado nos filtros e junto aos produtos',
  type: 'localizedString',
  required: true,
}

const slugField: SiteEditorField = {
  name: 'slug',
  label: 'Endereço',
  type: 'slug',
  readOnly: true,
  description:
    'Gerado a partir do nome na primeira vez que a categoria é guardada. Fica estável depois para não quebrar os produtos associados',
}

const orderField: SiteEditorField = {
  name: 'orderRank',
  label: 'Posição na Loja',
  description: 'Os números mais baixos aparecem primeiro',
  type: 'number',
  min: 0,
  step: 1,
}

const compactThumbnail = (source?: string) => {
  if (!source) return undefined
  try {
    const url = new URL(source)
    if (url.hostname === 'cdn.sanity.io') {
      url.searchParams.set('w', '112')
      url.searchParams.set('h', '112')
      url.searchParams.set('fit', 'crop')
      url.searchParams.set('auto', 'format')
    }
    return url.toString()
  } catch {
    return source
  }
}

export function StoreCategoryManager({
  document,
  products,
  pendingProducts,
  selectedPath,
  projectId,
  dataset,
  viewport,
  onChange,
  onUpload,
  onOpenProduct,
}: Props) {
  const productRow = (product: SiteEditorNode, action: string) => {
    const thumbnail = compactThumbnail(product.thumbnailUrl)
    return (
      <button
        key={product.id}
        type="button"
        onClick={() => onOpenProduct(product)}
        aria-label={
          action === 'Alterar categoria'
            ? `Alterar categoria de ${product.title}`
            : `${action}: ${product.title}`
        }
      >
        <span className={thumbnail ? 'has-image' : ''} aria-hidden="true">
          <StackCompactIcon />
          {thumbnail ? <img src={thumbnail} alt="" loading="lazy" /> : null}
        </span>
        <span>
          <strong>{product.title}</strong>
          <small>{action}</small>
        </span>
        <ChevronRightIcon />
      </button>
    )
  }

  return (
    <div className="site-editor-category-manager">
      <section className="site-editor-category-details">
        <header>
          <small>Categoria da Loja</small>
          <strong>Nome e posição</strong>
        </header>
        <SiteEditorFieldInput
          field={titleField}
          path="title"
          source={document}
          documentType={document._type}
          selectedPath={selectedPath}
          projectId={projectId}
          dataset={dataset}
          viewport={viewport}
          onChange={onChange}
          onUpload={onUpload}
        />
        <SiteEditorFieldInput
          field={slugField}
          path="slug"
          source={document}
          documentType={document._type}
          selectedPath={selectedPath}
          projectId={projectId}
          dataset={dataset}
          viewport={viewport}
          onChange={onChange}
          onUpload={onUpload}
        />
        <SiteEditorFieldInput
          field={orderField}
          path="orderRank"
          source={document}
          documentType={document._type}
          selectedPath={selectedPath}
          projectId={projectId}
          dataset={dataset}
          viewport={viewport}
          onChange={onChange}
          onUpload={onUpload}
        />
      </section>

      <section className="site-editor-category-products">
        <header>
          <span>
            <small>Produtos associados</small>
            <strong>
              {products.length} {products.length === 1 ? 'produto' : 'produtos'}
            </strong>
          </span>
          <p>Abra um produto para mudar a sua categoria.</p>
        </header>

        {products.length ? (
          <div className="site-editor-category-product-list">
            {products.map((product) => productRow(product, 'Alterar categoria'))}
          </div>
        ) : (
          <div className="site-editor-category-products-empty">
            Nenhum produto está atualmente nesta categoria.
          </div>
        )}

        {pendingProducts.length ? (
          <div className="site-editor-category-pending">
            <span>
              <strong>Mudança por publicar</strong>
              <small>
                {pendingProducts.length === 1
                  ? 'Este produto já foi movido no editor, mas a Loja pública ainda usa esta categoria.'
                  : 'Estes produtos já foram movidos no editor, mas a Loja pública ainda usa esta categoria.'}
              </small>
            </span>
            <div className="site-editor-category-product-list">
              {pendingProducts.map((product) => productRow(product, 'Abrir e publicar'))}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  )
}

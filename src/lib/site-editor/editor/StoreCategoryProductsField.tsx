import React from 'react'
import {ChevronRightIcon} from '@sanity/icons/ChevronRight'
import {StackCompactIcon} from '@sanity/icons/StackCompact'
import type {SiteEditorNode} from '$lib/site-editor/types'

type Props = {
  products: SiteEditorNode[]
  pendingProducts: SiteEditorNode[]
  onOpenProduct: (node: SiteEditorNode) => void
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

export function StoreCategoryProductsField({products, pendingProducts, onOpenProduct}: Props) {
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

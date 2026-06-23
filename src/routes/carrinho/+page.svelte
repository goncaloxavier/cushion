<script lang="ts">
  import PageHero from '$lib/components/PageHero.svelte'
  import {
    cartEventName,
    cartTotalQuantity,
    clearCart,
    readCart,
    removeCartItem,
    setCartItemQuantity,
    type StoreCartItem,
  } from '$lib/cart'
  import type {LanguageCode} from '$lib/site-content'
  import {showToast} from '$lib/toast'
  import {onMount} from 'svelte'

  let {data} = $props()

  type CartLabels = {
    hero: {kicker: string; title: string; lead: string}
    empty: string
    continueShopping: string
    clear: string
    request: string
    quantity: string
    remove: string
    removed: string
    finish: string
    unitPrice: string
    total: string
    summary: string
    product: string
  }

  const labelsByLanguage: Record<LanguageCode, CartLabels> = {
    pt: {
      hero: {
        kicker: 'Carrinho',
        title: 'Reveja os produtos antes de pedir orçamento',
        lead: '',
      },
      empty: 'O carrinho ainda está vazio.',
      continueShopping: 'Continuar na loja',
      clear: 'Limpar carrinho',
      request: 'Pedir orçamento',
      quantity: 'Quantidade',
      remove: 'Remover',
      removed: 'Produto removido do carrinho',
      finish: 'Acabamento',
      unitPrice: 'Preço unitário',
      total: 'Total estimado',
      summary: 'Resumo',
      product: 'Produto',
    },
    en: {
      hero: {
        kicker: 'Cart',
        title: 'Review the products before requesting a quote',
        lead: '',
      },
      empty: 'Your cart is still empty.',
      continueShopping: 'Continue shopping',
      clear: 'Clear cart',
      request: 'Request a quote',
      quantity: 'Quantity',
      remove: 'Remove',
      removed: 'Item removed from cart',
      finish: 'Finish',
      unitPrice: 'Unit price',
      total: 'Estimated total',
      summary: 'Summary',
      product: 'Product',
    },
    es: {
      hero: {
        kicker: 'Carrito',
        title: 'Revisa los productos antes de pedir presupuesto',
        lead: '',
      },
      empty: 'El carrito todavía está vacío.',
      continueShopping: 'Seguir en tienda',
      clear: 'Vaciar carrito',
      request: 'Pedir presupuesto',
      quantity: 'Cantidad',
      remove: 'Eliminar',
      removed: 'Producto eliminado del carrito',
      finish: 'Acabado',
      unitPrice: 'Precio unitario',
      total: 'Total estimado',
      summary: 'Resumen',
      product: 'Producto',
    },
  }

  let items = $state<StoreCartItem[]>([])

  const content = $derived(data.site[data.language])
  const labels = $derived(labelsByLanguage[data.language])
  const langQuery = $derived(`?lang=${data.language}`)
  const priceFormatter = $derived(
    new Intl.NumberFormat(
      data.language === 'en' ? 'en-GB' : data.language === 'es' ? 'es-ES' : 'pt-PT',
      {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
      },
    ),
  )
  const formatPrice = (price: number) => priceFormatter.format(price)
  const itemKey = (item: StoreCartItem) => `${item.slug}-${item.variantIndex}-${item.finish}`
  const rows = $derived.by(() =>
    items
      .map((item) => {
        const product = content.storeProducts.find((candidate) => candidate.slug === item.slug)
        const variant = product?.variants[item.variantIndex]
        if (!product || !variant) return null

        const unitPrice = variant.prices[item.finish]
        return {
          item,
          product,
          variant,
          unitPrice,
          total: unitPrice * item.quantity,
        }
      })
      .filter((row): row is NonNullable<typeof row> => row !== null),
  )
  const cartTotal = $derived(rows.reduce((total, row) => total + row.total, 0))
  const itemCount = $derived(cartTotalQuantity(items))

  const refreshCart = () => {
    items = readCart()
  }

  onMount(() => {
    refreshCart()
    window.addEventListener(cartEventName, refreshCart)

    return () => {
      window.removeEventListener(cartEventName, refreshCart)
    }
  })
</script>

<svelte:head>
  <title>{content.nav.cart} | DaFábrica4You</title>
</svelte:head>

<main class="cart-page">
  <PageHero {...labels.hero} />

  <section class="section cart-section">
    {#if rows.length}
      <div class="cart-layout">
        <div class="cart-items">
          <div class="cart-items-head" aria-hidden="true">
            <span>{labels.product}</span>
            <span>{labels.unitPrice}</span>
            <span>{labels.quantity}</span>
            <span>{labels.total}</span>
            <span></span>
          </div>
          {#each rows as row (itemKey(row.item))}
            <article class="cart-item">
              <div class="cart-item-main">
                <h2>{row.product.title}</h2>
                <p class="cart-item-meta">
                  <span>{row.variant.label}</span>
                  <span class="cart-item-finish">
                    <span class={`finish-dot finish-dot-${row.item.finish}`} aria-hidden="true"></span>
                    {content.storePage.finishLabels[row.item.finish]}
                  </span>
                </p>
              </div>

              <div class="cart-item-price">
                <span class="cart-col-label">{labels.unitPrice}</span>
                <strong>{formatPrice(row.unitPrice)}</strong>
              </div>

              <label class="cart-quantity">
                <span class="cart-col-label">{labels.quantity}</span>
                <input
                  value={row.item.quantity}
                  type="number"
                  min="1"
                  max="99"
                  inputmode="numeric"
                  oninput={(event) => {
                    setCartItemQuantity(row.item, Number(event.currentTarget.value))
                  }}
                />
              </label>

              <div class="cart-item-total">
                <span class="cart-col-label">{labels.total}</span>
                <strong>{formatPrice(row.total)}</strong>
              </div>

              <button
                class="cart-remove"
                type="button"
                onclick={() => {
                  removeCartItem(row.item)
                  showToast(labels.removed, 'info')
                }}
              >
                {labels.remove}
              </button>
            </article>
          {/each}
        </div>

        <aside class="cart-summary">
          <p class="kicker">{labels.summary}</p>
          <dl>
            <div>
              <dt>{content.nav.cart}</dt>
              <dd>{itemCount}</dd>
            </div>
            <div>
              <dt>{labels.total}</dt>
              <dd>{formatPrice(cartTotal)}</dd>
            </div>
          </dl>
          <a class="button primary" href={`/contacto${langQuery}&source=loja`}>{labels.request}</a>
          <a class="text-link" href={`/loja${langQuery}`}>{labels.continueShopping}</a>
          <button class="cart-clear" type="button" onclick={clearCart}>{labels.clear}</button>
        </aside>
      </div>
    {:else}
      <div class="cart-empty">
        <p>{labels.empty}</p>
        <a class="button primary" href={`/loja${langQuery}`}>{labels.continueShopping}</a>
      </div>
    {/if}
  </section>
</main>

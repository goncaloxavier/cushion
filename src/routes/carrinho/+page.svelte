<script lang="ts">
  import {browser} from '$app/environment'
  import PageHero from '$lib/components/PageHero.svelte'
  import SeoHead from '$lib/components/SeoHead.svelte'
  import StorePostalGate from '$lib/components/StorePostalGate.svelte'
  import {sizedImage} from '$lib/image'
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
  import {
    calculateStoreEstimate,
    postalZonePrefixFor,
    postalZoneFor,
    readInitialStorePostalCode,
    readStorePostalCode,
    storeDeliveryEventName,
  } from '$lib/store-shipping'
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
    productSubtotal: string
    transport: string
    iva: string
    finalTotal: string
    deliveryPostcode: string
    changePostcode: string
    totalWeight: string
    transportPending: string
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
      request: 'Finalizar pedido',
      quantity: 'Quantidade',
      remove: 'Remover',
      removed: 'Produto removido do carrinho',
      finish: 'Acabamento',
      unitPrice: 'Preço unitário',
      total: 'Total estimado',
      productSubtotal: 'Produtos s/ IVA',
      transport: 'Transporte estimado',
      iva: 'IVA 23%',
      finalTotal: 'Total c/ IVA',
      deliveryPostcode: 'Zona',
      changePostcode: 'Alterar',
      totalWeight: 'Peso total',
      transportPending: 'A confirmar',
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
      request: 'Checkout',
      quantity: 'Quantity',
      remove: 'Remove',
      removed: 'Item removed from cart',
      finish: 'Finish',
      unitPrice: 'Unit price',
      total: 'Estimated total',
      productSubtotal: 'Products excl. VAT',
      transport: 'Estimated transport',
      iva: 'VAT 23%',
      finalTotal: 'Total incl. VAT',
      deliveryPostcode: 'Zone',
      changePostcode: 'Change',
      totalWeight: 'Total weight',
      transportPending: 'To confirm',
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
      request: 'Finalizar pedido',
      quantity: 'Cantidad',
      remove: 'Eliminar',
      removed: 'Producto eliminado del carrito',
      finish: 'Acabado',
      unitPrice: 'Precio unitario',
      total: 'Total estimado',
      productSubtotal: 'Productos sin IVA',
      transport: 'Transporte estimado',
      iva: 'IVA 23%',
      finalTotal: 'Total con IVA',
      deliveryPostcode: 'Zona',
      changePostcode: 'Cambiar',
      totalWeight: 'Peso total',
      transportPending: 'Por confirmar',
      summary: 'Resumen',
      product: 'Producto',
    },
  }

  let items = $state<StoreCartItem[]>([])
  let deliveryPostalCode = $state(browser ? readInitialStorePostalCode() : '')
  let deliveryModalOpen = $state(false)

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
  const initialsFor = (title: string) =>
    title
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toLocaleUpperCase(data.language)
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
  const cartEstimate = $derived(
    calculateStoreEstimate(
      rows.map((row) => ({
        unitPrice: row.unitPrice,
        quantity: row.item.quantity,
        weightKg: row.variant.weightKg,
      })),
      deliveryPostalCode,
      {transportMultiplier: content.storePage.transportMultiplier},
    ),
  )
  const itemCount = $derived(cartTotalQuantity(items))
  const deliveryZone = $derived(postalZoneFor(deliveryPostalCode))
  const deliveryZonePrefix = $derived(postalZonePrefixFor(deliveryPostalCode))

  const refreshCart = () => {
    items = readCart()
  }

  onMount(() => {
    const refreshDelivery = () => {
      deliveryPostalCode = readStorePostalCode()
    }

    refreshCart()
    refreshDelivery()
    window.addEventListener(cartEventName, refreshCart)
    window.addEventListener(storeDeliveryEventName, refreshDelivery)

    return () => {
      window.removeEventListener(cartEventName, refreshCart)
      window.removeEventListener(storeDeliveryEventName, refreshDelivery)
    }
  })
</script>

<SeoHead title={content.nav.cart} description={labels.hero.title} noindex />

<main class="cart-page">
  <PageHero {...labels.hero} />

  <section class="section cart-section">
    {#if rows.length}
      {#if deliveryPostalCode}
        <div
          class="store-delivery-strip cart-delivery-strip"
          class:store-blurred-preview={deliveryModalOpen}
          inert={deliveryModalOpen}
        >
          <div class="store-delivery-info">
            <svg class="store-delivery-pin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M20 10c0 5.5-8 11-8 11s-8-5.5-8-11a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="2.6" />
            </svg>
            <span class="store-delivery-text">
              <span>{labels.deliveryPostcode}</span>
              <strong>{deliveryZonePrefix}</strong>
              {#if deliveryZone}
                <small>{deliveryZone.label}</small>
              {/if}
            </span>
          </div>
          <button type="button" onclick={() => (deliveryModalOpen = true)}>
            {labels.changePostcode}
          </button>
        </div>
      {/if}
      <div
        class="cart-layout"
        class:store-blurred-preview={!deliveryPostalCode || deliveryModalOpen}
        aria-hidden={!deliveryPostalCode || deliveryModalOpen}
        inert={!deliveryPostalCode || deliveryModalOpen}
      >
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
              <a class="cart-item-main" href={`/loja/${row.product.slug}${langQuery}`}>
                <span class="cart-item-thumb" aria-hidden="true">
                  {#if row.product.image}
                    <img
                      src={sizedImage(row.product.image.url, 200)}
                      alt=""
                      loading="lazy"
                      decoding="async"
                    />
                  {:else}
                    <span class="cart-item-thumb-fallback">{initialsFor(row.product.title)}</span>
                  {/if}
                </span>
                <span class="cart-item-copy">
                  <h2>{row.product.title}</h2>
                  <p class="cart-item-meta">
                    <span>{row.variant.label}</span>
                    <span class="cart-item-finish">
                      <span class={`finish-dot finish-dot-${row.item.finish}`} aria-hidden="true"></span>
                      {content.storePage.finishLabels[row.item.finish]}
                    </span>
                  </p>
                </span>
              </a>

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
              <dt>{labels.productSubtotal}</dt>
              <dd>{formatPrice(cartEstimate.productNet)}</dd>
            </div>
            <div>
              <dt>{labels.totalWeight}</dt>
              <dd>{cartEstimate.totalWeightKg.toLocaleString(data.language)} kg</dd>
            </div>
            {#if deliveryPostalCode}
              <div>
                <dt>{labels.transport}</dt>
                <dd>
                  {cartEstimate.transport
                    ? formatPrice(cartEstimate.transport.transportNet)
                    : labels.transportPending}
                </dd>
              </div>
              <div>
                <dt>{labels.iva}</dt>
                <dd>{cartEstimate.vat !== null ? formatPrice(cartEstimate.vat) : labels.transportPending}</dd>
              </div>
              <div class="cart-summary-total">
                <dt>{labels.finalTotal}</dt>
                <dd>
                  {cartEstimate.totalGross !== null
                    ? formatPrice(cartEstimate.totalGross)
                    : labels.transportPending}
                </dd>
              </div>
            {:else}
              <div>
                <dt>{labels.transport}</dt>
                <dd>{labels.transportPending}</dd>
              </div>
            {/if}
          </dl>

          <a class="button primary" href={`/finalizar-compra${langQuery}`}>{labels.request}</a>
          <a class="text-link" href={`/loja${langQuery}`}>{labels.continueShopping}</a>
          <button class="cart-clear" type="button" onclick={clearCart}>{labels.clear}</button>
        </aside>
      </div>

      {#if !deliveryPostalCode || deliveryModalOpen}
        <div class="store-gate-layer" role="presentation">
          <StorePostalGate
            language={data.language}
            initialPostalCode={deliveryPostalCode}
            closable={Boolean(deliveryPostalCode)}
            onclose={() => {
              deliveryModalOpen = false
            }}
            onconfirm={(postalCode) => {
              deliveryPostalCode = postalCode
              deliveryModalOpen = false
            }}
          />
        </div>
      {/if}
    {:else}
      <div class="cart-empty">
        <p>{labels.empty}</p>
        <a class="button primary" href={`/loja${langQuery}`}>{labels.continueShopping}</a>
      </div>
    {/if}
  </section>
</main>

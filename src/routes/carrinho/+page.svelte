<script lang="ts">
  import {browser} from '$app/environment'
  import {createDataAttribute} from '@sanity/visual-editing/create-data-attribute'
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
    storeVariantForCartItem,
    type StoreCartItem,
  } from '$lib/cart'
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

  let items = $state<StoreCartItem[]>([])
  let deliveryPostalCode = $state(browser ? readInitialStorePostalCode() : '')
  let deliveryModalOpen = $state(false)

  const content = $derived(data.site)
  const labels = $derived(content.cartPage)
  const siteContentDataAttribute = $derived(
    (data.preview || data.builderPreview) && data.studioUrl
      ? createDataAttribute({baseUrl: data.studioUrl, id: 'siteContent', type: 'siteLanding'})
      : null,
  )
  const cartPageDataAttribute = (path: string) =>
    siteContentDataAttribute?.(`cartPage.${path}`)
  const cartHeroDataAttribute = (field: 'kicker' | 'title' | 'lead') =>
    cartPageDataAttribute(`hero.${field}.pt`)
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
  const itemKey = (item: StoreCartItem) =>
    `${item.slug}-${item.variantKey || `legacy-${item.variantIndex ?? 0}`}-${item.finish}`
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
        const variant = product ? storeVariantForCartItem(product, item) : undefined
        if (!product || !variant) return null

        const finish = product.hasFinishChoice ? item.finish : 'natural'
        const unitPrice = variant.prices[finish]
        return {
          item,
          product,
          variant,
          finish,
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
        flatTransportPrice: row.product.flatTransportPrice,
      })),
      deliveryPostalCode,
      {transportMultiplier: content.storePage.transportMultiplier},
    ),
  )
  const itemCount = $derived(cartTotalQuantity(items))
  const deliveryZone = $derived(postalZoneFor(deliveryPostalCode))
  const deliveryZonePrefix = $derived(postalZonePrefixFor(deliveryPostalCode))
  const transportStatus = $derived(
    cartEstimate.transportIssue === 'overweight'
      ? labels.transportOverweight
      : labels.transportPending,
  )

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
  <PageHero {...labels.hero} dataAttribute={cartHeroDataAttribute} />

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
                    {#if row.product.hasFinishChoice}
                      <span class="cart-item-finish">
                        <span class={`finish-dot finish-dot-${row.finish}`} aria-hidden="true"></span>
                        {content.storePage.finishLabels[row.finish]}
                      </span>
                    {/if}
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
          <p class="kicker" data-sanity={cartPageDataAttribute('summary.pt')}>{labels.summary}</p>
          <dl>
            <div>
              <dt data-sanity={cartPageDataAttribute('cartItems.pt')}>{labels.cartItems}</dt>
              <dd>{itemCount}</dd>
            </div>
            <div>
              <dt data-sanity={cartPageDataAttribute('productSubtotal.pt')}>{labels.productSubtotal}</dt>
              <dd>{formatPrice(cartEstimate.productNet)}</dd>
            </div>
            <div>
              <dt data-sanity={cartPageDataAttribute('totalWeight.pt')}>{labels.totalWeight}</dt>
              <dd>{cartEstimate.totalWeightKg.toLocaleString(data.language)} kg</dd>
            </div>
            {#if deliveryPostalCode}
              <div>
                <dt data-sanity={cartPageDataAttribute('transport.pt')}>{labels.transport}</dt>
                <dd>
                  {cartEstimate.transport
                    ? formatPrice(cartEstimate.transport.transportNet)
                    : transportStatus}
                </dd>
              </div>
              <div>
                <dt data-sanity={cartPageDataAttribute('iva.pt')}>{labels.iva}</dt>
                <dd>{cartEstimate.vat !== null ? formatPrice(cartEstimate.vat) : transportStatus}</dd>
              </div>
              <div class="cart-summary-total">
                <dt data-sanity={cartPageDataAttribute('finalTotal.pt')}>{labels.finalTotal}</dt>
                <dd>
                  {cartEstimate.totalGross !== null
                    ? formatPrice(cartEstimate.totalGross)
                    : transportStatus}
                </dd>
              </div>
            {:else}
              <div>
                <dt data-sanity={cartPageDataAttribute('transport.pt')}>{labels.transport}</dt>
                <dd data-sanity={cartPageDataAttribute('transportPending.pt')}>{labels.transportPending}</dd>
              </div>
            {/if}
          </dl>

          <a
            class="button primary"
            href={`/finalizar-compra${langQuery}`}
            data-sanity={cartPageDataAttribute('request.pt')}
          >{labels.request}</a>
          <a
            class="text-link"
            href={`/loja${langQuery}`}
            data-sanity={cartPageDataAttribute('continueShopping.pt')}
          >{labels.continueShopping}</a>
          <button
            class="cart-clear"
            type="button"
            data-sanity={cartPageDataAttribute('clear.pt')}
            onclick={() => {
              if (window.confirm(labels.clearConfirm)) clearCart()
            }}
          >
            {labels.clear}
          </button>
        </aside>
      </div>

      {#if !deliveryPostalCode || deliveryModalOpen}
        <div class="store-gate-layer" role="presentation">
          <StorePostalGate
            labels={content.storePage.postalGate}
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
        <p data-sanity={cartPageDataAttribute('empty.pt')}>{labels.empty}</p>
        <a
          class="button primary"
          href={`/loja${langQuery}`}
          data-sanity={cartPageDataAttribute('continueShopping.pt')}
        >{labels.continueShopping}</a>
      </div>
    {/if}
  </section>
</main>

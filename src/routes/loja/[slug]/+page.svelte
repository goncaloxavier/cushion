<script lang="ts">
  import StorePostalGate from '$lib/components/StorePostalGate.svelte'
  import {addCartItem} from '$lib/cart'
  import {collectionListHref} from '$lib/collection-page'
  import {imageSrcset, sizedImage} from '$lib/image'
  import {showToast} from '$lib/toast'
  import type {LanguageCode, StoreFinish} from '$lib/site-content'
  import {
    calculateStoreEstimate,
    postalZoneFor,
    readStorePostalCode,
    storeDeliveryEventName,
  } from '$lib/store-shipping'
  import {onMount} from 'svelte'

  let {data} = $props()

  const finishes: StoreFinish[] = ['natural', 'dark']
  const pageCopy: Record<
    LanguageCode,
    {
      back: string
      category: string
      variant: string
      finish: string
      dimensions: string
      weight: string
      selectedPrice: string
      productNet: string
      transport: string
      totalWithVat: string
      deliveryPostcode: string
      changePostcode: string
      transportPending: string
      addToCart: string
      added: string
      viewCart: string
      imagePending: string
      quantity: string
    }
  > = {
    pt: {
      back: 'Voltar à loja',
      category: 'Categoria',
      variant: 'Medida / variante',
      finish: 'Acabamento',
      dimensions: 'Dimensões',
      weight: 'Peso',
      selectedPrice: 'Preço selecionado',
      productNet: 'Produto s/ IVA',
      transport: 'Transporte estimado',
      totalWithVat: 'Total c/ IVA',
      deliveryPostcode: 'Código postal',
      changePostcode: 'Alterar',
      transportPending: 'Transporte a confirmar',
      addToCart: 'Adicionar ao carrinho',
      added: 'Adicionado ao carrinho',
      viewCart: 'Ver carrinho',
      imagePending: 'Imagem a adicionar pelo cliente',
      quantity: 'Quantidade',
    },
    en: {
      back: 'Back to store',
      category: 'Category',
      variant: 'Size / variant',
      finish: 'Finish',
      dimensions: 'Dimensions',
      weight: 'Weight',
      selectedPrice: 'Selected price',
      productNet: 'Product excl. VAT',
      transport: 'Estimated transport',
      totalWithVat: 'Total incl. VAT',
      deliveryPostcode: 'Postcode',
      changePostcode: 'Change',
      transportPending: 'Transport to confirm',
      addToCart: 'Add to cart',
      added: 'Added to cart',
      viewCart: 'View cart',
      imagePending: 'Image to be added by the client',
      quantity: 'Quantity',
    },
    es: {
      back: 'Volver a tienda',
      category: 'Categoría',
      variant: 'Medida / variante',
      finish: 'Acabado',
      dimensions: 'Dimensiones',
      weight: 'Peso',
      selectedPrice: 'Precio seleccionado',
      productNet: 'Producto sin IVA',
      transport: 'Transporte estimado',
      totalWithVat: 'Total con IVA',
      deliveryPostcode: 'Código postal',
      changePostcode: 'Cambiar',
      transportPending: 'Transporte por confirmar',
      addToCart: 'Añadir al carrito',
      added: 'Añadido al carrito',
      viewCart: 'Ver carrito',
      imagePending: 'Imagen pendiente del cliente',
      quantity: 'Cantidad',
    },
  }

  let selectedVariantIndex = $state(0)
  let selectedFinish = $state<StoreFinish>('natural')
  let quantity = $state(1)
  let deliveryPostalCode = $state('')
  let deliveryModalOpen = $state(false)

  const content = $derived(data.site[data.language])
  const langQuery = $derived(`?lang=${data.language}`)
  const backHref = $derived(collectionListHref('/loja', data.language, data.returnPage))
  const labels = $derived(pageCopy[data.language])
  const selectedVariant = $derived(
    data.storeProduct.variants[selectedVariantIndex] ?? data.storeProduct.variants[0],
  )
  const selectedPrice = $derived(selectedVariant.prices[selectedFinish])
  const normalizedQuantity = $derived(Math.min(99, Math.max(1, Math.floor(quantity || 1))))
  const selectedEstimate = $derived(
    calculateStoreEstimate(
      [{unitPrice: selectedPrice, quantity: normalizedQuantity, weightKg: selectedVariant.weightKg}],
      deliveryPostalCode,
    ),
  )
  const deliveryZone = $derived(postalZoneFor(deliveryPostalCode))
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
  const initials = $derived(
    data.storeProduct.title
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toLocaleUpperCase(data.language),
  )

  const formatPrice = (price: number) => priceFormatter.format(price)
  const addSelectedToCart = () => {
    addCartItem({
      slug: data.storeProduct.slug,
      variantIndex: selectedVariantIndex,
      finish: selectedFinish,
      quantity: normalizedQuantity,
    })
    showToast(labels.added)
  }

  onMount(() => {
    const refreshDelivery = () => {
      deliveryPostalCode = readStorePostalCode()
      if (!deliveryPostalCode) deliveryModalOpen = false
    }

    refreshDelivery()
    window.addEventListener(storeDeliveryEventName, refreshDelivery)

    return () => {
      window.removeEventListener(storeDeliveryEventName, refreshDelivery)
    }
  })
</script>

<svelte:head>
  <title>{data.storeProduct.title} | DaFábrica4You</title>
</svelte:head>

<main class="store-detail-page">
  {#if deliveryPostalCode}
    <article
      class="detail-page store-detail"
      class:store-blurred-preview={deliveryModalOpen}
      aria-hidden={deliveryModalOpen}
      inert={deliveryModalOpen}
    >
    <div class="store-detail-head">
      <a class="detail-back-link" href={backHref}>
        <span aria-hidden="true">←</span>
        {labels.back}
      </a>
      <div class="store-detail-delivery">
        <span>{labels.deliveryPostcode}</span>
        <strong>{deliveryPostalCode}</strong>
        {#if deliveryZone}
          <small>{deliveryZone.label}</small>
        {/if}
        <button
          type="button"
          onclick={() => {
            deliveryModalOpen = true
          }}
        >
          {labels.changePostcode}
        </button>
      </div>
    </div>

    <section class="store-detail-shell">
      <div class="store-detail-copy">
        <p class="store-detail-category">
          <span>{labels.category}</span>
          {content.storePage.categoryLabels[data.storeProduct.category]}
        </p>
        <h1>{data.storeProduct.title}</h1>
        <p class="article-lead">{data.storeProduct.summary}</p>
      </div>

      <div class="store-detail-visual" class:no-image={!data.storeProduct.image}>
        {#if data.storeProduct.image}
          <img
            src={sizedImage(data.storeProduct.image.url, 900)}
            srcset={imageSrcset(data.storeProduct.image.url, [500, 760, 1000, 1400])}
            sizes="(max-width: 900px) 92vw, 520px"
            alt={data.storeProduct.image.alt}
            loading="eager"
            fetchpriority="high"
            decoding="async"
            style:background={data.storeProduct.image.lqip
              ? `center / cover no-repeat url(${data.storeProduct.image.lqip})`
              : undefined}
          />
        {:else}
          <div aria-hidden="true">
            <strong>{initials}</strong>
            <span>{labels.imagePending}</span>
          </div>
        {/if}
      </div>
    </section>

    <section class="store-buy-panel" aria-label={`${data.storeProduct.title}: ${labels.selectedPrice}`}>
      <div class="store-option-grid">
        <fieldset class="store-detail-variants">
          <legend>{labels.variant}</legend>
          <div>
            {#each data.storeProduct.variants as variant, index}
              <button
                type="button"
                class:active={selectedVariantIndex === index}
                aria-pressed={selectedVariantIndex === index}
                onclick={() => {
                  selectedVariantIndex = index
                }}
              >
                {variant.label}
              </button>
            {/each}
          </div>
        </fieldset>

        <fieldset class="store-detail-finishes">
          <legend>{labels.finish}</legend>
          <div>
            {#each finishes as finish}
              <button
                type="button"
                class:active={selectedFinish === finish}
                aria-pressed={selectedFinish === finish}
                onclick={() => {
                  selectedFinish = finish
                }}
              >
                <span class={`finish-dot finish-dot-${finish}`} aria-hidden="true"></span>
                {content.storePage.finishLabels[finish]}
              </button>
            {/each}
          </div>
        </fieldset>

        <label class="store-quantity-control">
          <span>{labels.quantity}</span>
          <input
            value={quantity}
            type="number"
            min="1"
            max="99"
            inputmode="numeric"
            oninput={(event) => {
              quantity = Number(event.currentTarget.value)
            }}
          />
        </label>
      </div>

      <div class="store-spec-grid">
        <section class="store-spec-dimensions">
          <h2>{labels.dimensions}</h2>
          <ul>
            {#each selectedVariant.dimensions as dimension}
              <li>{dimension}</li>
            {/each}
          </ul>
          {#if selectedVariant.note}
            <p class="store-spec-note">{selectedVariant.note}</p>
          {/if}
        </section>

        {#if selectedVariant.weightKg}
          <section class="store-spec-weight">
            <h2>{labels.weight}</h2>
            <p class="store-spec-weight-value">{selectedVariant.weightKg} kg</p>
          </section>
        {/if}

        <section class="store-spec-price">
          <h2>{labels.productNet}</h2>
          <p class="store-spec-price-value">{formatPrice(selectedEstimate.productNet)}</p>
        </section>

        <section class="store-spec-transport">
          <h2>{labels.transport}</h2>
          {#if selectedEstimate.transport}
            <p class="store-spec-price-value">{formatPrice(selectedEstimate.transport.transportNet)}</p>
          {:else}
            <p>{labels.transportPending}</p>
          {/if}
        </section>

        <section class="store-spec-price store-spec-total">
          <h2>{labels.totalWithVat}</h2>
          <p class="store-spec-price-value">
            {selectedEstimate.totalGross !== null
              ? formatPrice(selectedEstimate.totalGross)
              : labels.transportPending}
          </p>
        </section>
      </div>

      <div class="store-detail-actions">
        <button class="button primary store-detail-request" type="button" onclick={addSelectedToCart}>
          {labels.addToCart}
        </button>
        <a class="text-link" href={`/carrinho${langQuery}`}>{labels.viewCart}</a>
      </div>
    </section>
    </article>

    {#if deliveryModalOpen}
      <div class="store-gate-layer" role="presentation">
        <StorePostalGate
          language={data.language}
          initialPostalCode={deliveryPostalCode}
          closable
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
    <section class="section store-section store-section-gated">
      <StorePostalGate
        language={data.language}
        onconfirm={(postalCode) => {
          deliveryPostalCode = postalCode
        }}
      />
    </section>
  {/if}
</main>

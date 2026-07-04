<script lang="ts">
  import {browser} from '$app/environment'
  import {page} from '$app/state'
  import {createDataAttribute} from '@sanity/visual-editing/create-data-attribute'
  import SeoHead from '$lib/components/SeoHead.svelte'
  import StoreMediaGallery from '$lib/components/StoreMediaGallery.svelte'
  import StorePostalGate from '$lib/components/StorePostalGate.svelte'
  import {absoluteUrl, productSchema} from '$lib/seo'
  import {addCartItem} from '$lib/cart'
  import {collectionListHref} from '$lib/collection-page'
  import {showToast} from '$lib/toast'
  import {storeProductMediaFor, type LanguageCode, type StoreFinish} from '$lib/site-content'
  import {
    calculateStoreEstimate,
    postalZonePrefixFor,
    postalZoneFor,
    readInitialStorePostalCode,
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
      ivaIncluded: string
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
      transport: 'Transporte',
      totalWithVat: 'Total',
      ivaIncluded: 'IVA incluído',
      deliveryPostcode: 'Zona',
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
      transport: 'Transport',
      totalWithVat: 'Total',
      ivaIncluded: 'VAT included',
      deliveryPostcode: 'Zone',
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
      transport: 'Transporte',
      totalWithVat: 'Total',
      ivaIncluded: 'IVA incluido',
      deliveryPostcode: 'Zona',
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
  let deliveryPostalCode = $state(browser ? readInitialStorePostalCode() : '')
  let deliveryModalOpen = $state(false)

  const content = $derived(data.site[data.language])
  const langQuery = $derived(`?lang=${data.language}`)
  const backHref = $derived(collectionListHref('/loja', data.language, data.returnPage))
  const labels = $derived(pageCopy[data.language])
  const selectedVariant = $derived(
    data.storeProduct.variants[selectedVariantIndex] ?? data.storeProduct.variants[0],
  )
  const selectedPrice = $derived(selectedVariant.prices[selectedFinish])
  const selectedPriceField = $derived(
    selectedFinish === 'natural' ? 'priceNatural' : 'priceDark',
  )
  const storeProductDataAttribute = $derived(
    data.preview && data.studioUrl && data.storeProduct.studioDocumentId
      ? createDataAttribute({
          baseUrl: data.studioUrl,
          id: data.storeProduct.studioDocumentId,
          type: 'storeProduct',
        })
      : null,
  )
  const selectedPricePath = $derived(
    selectedVariant.sourceKey
      ? `variants[_key=="${selectedVariant.sourceKey.replace(/"/g, '\\"')}"].${selectedPriceField}`
      : `variants[${selectedVariantIndex}].${selectedPriceField}`,
  )
  const selectedWeightPath = $derived(
    selectedVariant.sourceKey
      ? `variants[_key=="${selectedVariant.sourceKey.replace(/"/g, '\\"')}"].weightKg`
      : `variants[${selectedVariantIndex}].weightKg`,
  )
  const selectedPriceDataAttribute = $derived(
    storeProductDataAttribute ? storeProductDataAttribute(selectedPricePath) : undefined,
  )
  const selectedWeightDataAttribute = $derived(
    storeProductDataAttribute ? storeProductDataAttribute(selectedWeightPath) : undefined,
  )
  const normalizedQuantity = $derived(Math.min(99, Math.max(1, Math.floor(quantity || 1))))
  const selectedEstimate = $derived(
    calculateStoreEstimate(
      [{unitPrice: selectedPrice, quantity: normalizedQuantity, weightKg: selectedVariant.weightKg}],
      deliveryPostalCode,
      {transportMultiplier: content.storePage.transportMultiplier},
    ),
  )
  const deliveryZone = $derived(postalZoneFor(deliveryPostalCode))
  const deliveryZonePrefix = $derived(postalZonePrefixFor(deliveryPostalCode))
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
  const storeImages = $derived(
    data.storeProduct.images?.length
      ? data.storeProduct.images
      : data.storeProduct.image
        ? [data.storeProduct.image]
        : [],
  )
  const storeMedia = $derived(storeProductMediaFor(data.storeProduct))
  const hasStoreMedia = $derived(storeMedia.length > 0)
  const imageDataAttribute = $derived(
    storeProductDataAttribute ? storeProductDataAttribute('image') : undefined,
  )
  const mediaDataAttribute = $derived(
    storeProductDataAttribute
      ? (path: string) => storeProductDataAttribute(path)
      : undefined,
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

  const storeJsonLd = $derived(
    productSchema({
      name: data.storeProduct.title,
      description: data.storeProduct.summary,
      imageUrl: absoluteUrl(page.url.origin, storeImages[0]?.url),
      price: Math.min(
        ...data.storeProduct.variants.flatMap((variant) => [
          variant.prices.natural,
          variant.prices.dark,
        ]),
      ),
    }),
  )
</script>

<SeoHead
  title={data.storeProduct.title}
  description={data.storeProduct.summary}
  image={storeImages[0]}
  jsonLd={storeJsonLd}
/>

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

      <div
        class="store-detail-visual"
        class:no-image={!hasStoreMedia}
        data-sanity={hasStoreMedia ? undefined : imageDataAttribute}
        data-sanity-edit-target={!hasStoreMedia && imageDataAttribute ? true : undefined}
      >
        {#if hasStoreMedia}
          <StoreMediaGallery
            media={storeMedia}
            label={content.common.zoomImage}
            closeLabel={content.common.close}
            className="store-detail-gallery"
            sizes="(max-width: 900px) 92vw, 520px"
            dataAttribute={mediaDataAttribute}
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
          <section
            class="store-spec-weight"
            data-sanity={selectedWeightDataAttribute}
            data-sanity-edit-target={selectedWeightDataAttribute ? true : undefined}
          >
            <h2>{labels.weight}</h2>
            <p class="store-spec-weight-value">{selectedVariant.weightKg} kg</p>
          </section>
        {/if}

        <section
          class="store-spec-price"
          data-sanity={selectedPriceDataAttribute}
          data-sanity-edit-target={selectedPriceDataAttribute ? true : undefined}
        >
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
          {#if selectedEstimate.totalGross !== null}
            <small class="store-spec-iva">{labels.ivaIncluded}</small>
          {/if}
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

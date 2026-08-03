<script lang="ts">
  import DownloadList from '$lib/components/DownloadList.svelte'
  import {browser} from '$app/environment'
  import {page} from '$app/state'
  import {loadSanityDataAttributeFactory, type SanityDataAttributeFactory} from '$lib/sanity-edit-attributes'
  import {lineReveal} from '$lib/actions/line-reveal'
  import ManagedPageComposition from '$lib/components/builder/ManagedPageComposition.svelte'
  import Reveal from '$lib/components/Reveal.svelte'
  import SeoHead from '$lib/components/SeoHead.svelte'
  import StoreMediaGallery from '$lib/components/StoreMediaGallery.svelte'
  import StorePostalGate from '$lib/components/StorePostalGate.svelte'
  import {absoluteUrl, breadcrumbListSchema, productSchema} from '$lib/seo'
  import {addCartItem} from '$lib/cart'
  import {collectionListHref} from '$lib/collection-page'
  import {showToast} from '$lib/toast'
  import {textAppearanceStyle} from '$lib/text-appearance'
  import {
    storeCategoryLabel,
    storeProductMediaFor,
    withLanguage,
    type StoreFinish,
  } from '$lib/site-content'
  import {
    calculateStoreEstimate,
    postalZonePrefixFor,
    postalZoneFor,
    readInitialStorePostalCode,
    readStorePostalCode,
    storeDeliveryEventName,
  } from '$lib/store-shipping'
  import {onMount} from 'svelte'
  import {managedCoreSectionForDocumentType} from '$lib/builder/managed-page-sections'

  let {data} = $props()
  const pageCore = managedCoreSectionForDocumentType('storeProduct')!
  let dataAttributeFactory = $state<SanityDataAttributeFactory | null>(null)
  $effect(() => {
    if ((data.preview || data.builderPreview) && !dataAttributeFactory) {
      void loadSanityDataAttributeFactory().then((factory) => (dataAttributeFactory = factory))
    }
  })

  const finishes: StoreFinish[] = ['natural', 'dark']
  let selectedVariantIndex = $state(0)
  let selectedFinish = $state<StoreFinish>('natural')
  let quantity = $state(1)
  let deliveryPostalCode = $state(browser ? readInitialStorePostalCode() : '')
  let deliveryModalOpen = $state(false)

  const content = $derived(data.site)
  const langQuery = $derived(`?lang=${data.language}`)
  const backHref = $derived(collectionListHref('/loja', data.language, data.returnPage))
  const labels = $derived(content.storePage.detail)
  const selectedVariant = $derived(
    data.storeProduct.variants[selectedVariantIndex] ?? data.storeProduct.variants[0],
  )
  const hasFinishChoice = $derived(data.storeProduct.hasFinishChoice)
  const effectiveFinish = $derived<StoreFinish>(hasFinishChoice ? selectedFinish : 'natural')
  const selectedPrice = $derived(selectedVariant.prices[effectiveFinish])
  const selectedPriceField = $derived(
    effectiveFinish === 'natural' ? 'priceNatural' : 'priceDark',
  )
  const storeProductDataAttribute = $derived(
    (data.preview || data.builderPreview) && data.studioUrl && data.storeProduct.studioDocumentId
      ? dataAttributeFactory?.({
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
      [
        {
          unitPrice: selectedPrice,
          quantity: normalizedQuantity,
          weightKg: selectedVariant.weightKg,
          flatTransportPrice: data.storeProduct.flatTransportPrice,
        },
      ],
      deliveryPostalCode,
      {transportMultiplier: content.storePage.transportMultiplier},
    ),
  )
  const selectedTransportStatus = $derived(
    selectedEstimate.transportIssue === 'overweight'
      ? labels.transportOverweight
      : labels.transportPending,
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
      variantKey: selectedVariant.key,
      variantIndex: selectedVariantIndex,
      finish: effectiveFinish,
      quantity: normalizedQuantity,
    })
    showToast(labels.added)
  }

  $effect(() => {
    if (!hasFinishChoice && selectedFinish !== 'natural') selectedFinish = 'natural'
  })

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

  const storeJsonLd = $derived([
    productSchema({
      name: data.storeProduct.title,
      description: data.storeProduct.summary,
      imageUrl: absoluteUrl(page.url.origin, storeImages[0]?.url),
      price: Math.min(
        ...data.storeProduct.variants.flatMap((variant) => [
          variant.prices.natural,
          ...(data.storeProduct.hasFinishChoice ? [variant.prices.dark] : []),
        ]),
      ),
    }),
    breadcrumbListSchema([
      {name: content.nav.home, url: absoluteUrl(page.url.origin, withLanguage('/', data.language))!},
      {name: content.nav.store, url: absoluteUrl(page.url.origin, withLanguage('/loja', data.language))!},
      {name: data.storeProduct.title, url: absoluteUrl(page.url.origin, withLanguage(page.url.pathname, data.language))!},
    ]),
  ])
</script>

<SeoHead
  title={data.storeProduct.title}
  description={data.storeProduct.summary}
  image={storeImages[0]}
  jsonLd={storeJsonLd}
/>

<main class="store-detail-page">
  {#if deliveryPostalCode}
    <ManagedPageComposition
      sections={data.storeProduct.sections ?? []}
      core={pageCore}
      settings={data.settings}
      {content}
      language={data.language}
      dataset={data.sanityDataset}
      preview={data.preview || data.builderPreview}
      editorSource={{
        baseUrl: data.studioUrl,
        id: data.storeProduct.studioDocumentId,
        type: 'storeProduct',
      }}
    >
      <article
        class="detail-page store-detail"
        class:store-blurred-preview={deliveryModalOpen}
        aria-hidden={deliveryModalOpen}
        inert={deliveryModalOpen}
      >
    <Reveal class="store-detail-head-reveal" variant="panel">
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
    </Reveal>

    <section class="store-detail-shell">
      <Reveal class="store-detail-copy" variant="hero" priority>
        <p class="store-detail-category">
          <span>{labels.category}</span>
          <strong data-sanity={storeProductDataAttribute?.('category')}>
            {storeCategoryLabel(content.storePage, data.storeProduct.category)}
          </strong>
        </p>
        <h1
          class="cms-styled-text"
          style={textAppearanceStyle(data.storeProduct.textAppearance?.title)}
          use:lineReveal
          data-sanity={storeProductDataAttribute?.('title.pt')}
        >
          {data.storeProduct.title}
        </h1>
        <p
          class="article-lead cms-styled-text"
          style={textAppearanceStyle(data.storeProduct.textAppearance?.summary)}
          data-sanity={storeProductDataAttribute?.('summary.pt')}
        >
          {data.storeProduct.summary}
        </p>

        <DownloadList
          documents={data.storeProduct.documents}
          title={data.storeProduct.documentsTitle}
          fallbackTitle={content.common.downloadsTitle}
        />
      </Reveal>

      <Reveal class="store-detail-visual-reveal" delay={120} variant="media">
        <div
          class="store-detail-visual"
          class:no-image={!hasStoreMedia}
          data-sanity={hasStoreMedia ? undefined : imageDataAttribute}
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
      </Reveal>
    </section>

    <Reveal class="store-buy-panel-reveal" variant="panel">
    <section class="store-buy-panel" aria-label={`${data.storeProduct.title}: ${labels.selectedPrice}`}>
      <div class="store-option-grid">
        <fieldset class="store-detail-variants">
          <legend>{labels.variant}</legend>
          <div role="radiogroup" aria-label={labels.variant}>
            {#each data.storeProduct.variants as variant, index}
              <button
                type="button"
                role="radio"
                class:active={selectedVariantIndex === index}
                aria-checked={selectedVariantIndex === index}
                onclick={() => {
                  selectedVariantIndex = index
                }}
              >
                {variant.label}
              </button>
            {/each}
          </div>
        </fieldset>

        {#if hasFinishChoice}
          <fieldset class="store-detail-finishes">
            <legend>{labels.finish}</legend>
            <div role="radiogroup" aria-label={labels.finish}>
              {#each finishes as finish}
                <button
                  type="button"
                  role="radio"
                  class:active={selectedFinish === finish}
                  aria-checked={selectedFinish === finish}
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
        {/if}

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
            <p
              class="store-spec-weight-value"
              data-sanity={selectedWeightDataAttribute}
              data-df4y-editor-field={selectedWeightDataAttribute ? true : undefined}
              data-df4y-editor-kind={selectedWeightDataAttribute ? 'number' : undefined}
              data-df4y-editor-label={selectedWeightDataAttribute ? labels.weight : undefined}
            >{selectedVariant.weightKg} kg</p>
          </section>
        {/if}

        <section class="store-spec-price">
          <h2>{labels.productNet}</h2>
          <p
            class="store-spec-price-value"
            data-sanity={selectedPriceDataAttribute}
            data-df4y-editor-field={selectedPriceDataAttribute ? true : undefined}
            data-df4y-editor-kind={selectedPriceDataAttribute ? 'number' : undefined}
            data-df4y-editor-label={selectedPriceDataAttribute ? labels.productNet : undefined}
          >{formatPrice(selectedEstimate.productNet)}</p>
        </section>

        <section class="store-spec-transport">
          <h2>{labels.transport}</h2>
          {#if selectedEstimate.transport}
            <p class="store-spec-price-value">{formatPrice(selectedEstimate.transport.transportNet)}</p>
          {:else}
            <p>{selectedTransportStatus}</p>
          {/if}
        </section>

        <section class="store-spec-price store-spec-total">
          <h2>{labels.totalWithVat}</h2>
          <p class="store-spec-price-value">
            {selectedEstimate.totalGross !== null
              ? formatPrice(selectedEstimate.totalGross)
              : selectedTransportStatus}
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
    </Reveal>
      </article>
    </ManagedPageComposition>

    {#if deliveryModalOpen}
      <div class="store-gate-layer" role="presentation">
        <StorePostalGate
          labels={content.storePage.postalGate}
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
        labels={content.storePage.postalGate}
        onconfirm={(postalCode) => {
          deliveryPostalCode = postalCode
        }}
      />
    </section>
  {/if}
</main>

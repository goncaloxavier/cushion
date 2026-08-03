<script lang="ts">
  import DownloadList from '$lib/components/DownloadList.svelte'
  import Pagination from '$lib/components/Pagination.svelte'
  import ManagedPageComposition from '$lib/components/builder/ManagedPageComposition.svelte'
  import PageHero from '$lib/components/PageHero.svelte'
  import Reveal from '$lib/components/Reveal.svelte'
  import SeoHead from '$lib/components/SeoHead.svelte'
  import {seoDescription} from '$lib/seo'
  import StorePostalGate from '$lib/components/StorePostalGate.svelte'
  import {browser} from '$app/environment'
  import {loadSanityDataAttributeFactory, type SanityDataAttributeFactory} from '$lib/sanity-edit-attributes'
  import {collectionDetailHref} from '$lib/collection-page'
  import {imageSrcset, sizedImage} from '$lib/image'
  import {changeListPage} from '$lib/scroll'
  import {storeCategoryLabel} from '$lib/site-content'
  import {textAppearanceStyle} from '$lib/text-appearance'
  import type {StoreCategory, StoreProduct, StoreSortKey} from '$lib/site-content'
  import {
    calculateStoreEstimate,
    postalZonePrefixFor,
    postalZoneFor,
    readInitialStorePostalCode,
    readStorePostalCode,
    storeDeliveryEventName,
  } from '$lib/store-shipping'
  import {onMount, tick} from 'svelte'
  import {managedCoreSectionForRoot} from '$lib/builder/managed-page-sections'

  let {data} = $props()
  let dataAttributeFactory = $state<SanityDataAttributeFactory | null>(null)
  $effect(() => {
    if ((data.preview || data.builderPreview) && !dataAttributeFactory) {
      void loadSanityDataAttributeFactory().then((factory) => (dataAttributeFactory = factory))
    }
  })

  type CategoryFilter = 'all' | StoreCategory
  type SortKey = StoreSortKey

  const sortOptions: SortKey[] = ['featured', 'priceAsc', 'priceDesc', 'name']
  let query = $state('')
  let category = $state<CategoryFilter>('all')
  let sort = $state<SortKey>('featured')
  let page = $state((() => data.initialPage)())
  let swapping = $state(false)
  let deliveryPostalCode = $state(browser ? readInitialStorePostalCode() : '')
  let deliveryModalOpen = $state(false)
  let filterEffectInitialized = false
  let collectionSection: HTMLElement | null = null
  const pageSize = 9

  const content = $derived(data.site)
  const pageCore = managedCoreSectionForRoot('storePage')!
  const siteContentDataAttribute = $derived(
    (data.preview || data.builderPreview) && data.studioUrl
      ? dataAttributeFactory?.({baseUrl: data.studioUrl, id: 'siteContent', type: 'siteLanding'})
      : null,
  )
  const storeHeroDataAttribute = (field: 'kicker' | 'title' | 'lead') =>
    siteContentDataAttribute?.(`storePage.hero.${field}.pt`)
  const langQuery = $derived(`?lang=${data.language}`)
  const hero = $derived({...content.storePage.hero, lead: ''})
  const normalizedQuery = $derived(query.trim().toLocaleLowerCase(data.language))
  const localizedSortLabels = $derived(content.storePage.sortOptions)
  const localizedDeliveryLabels = $derived(content.storePage.delivery)
  const categories = $derived.by(() => {
    const options = [...content.storePage.categories]
    const known = new Set(options.map((option) => option.slug))

    for (const product of content.storeProducts) {
      if (known.has(product.category)) continue
      known.add(product.category)
      options.push({
        slug: product.category,
        label: storeCategoryLabel(content.storePage, product.category),
      })
    }

    return options
  })
  const deliveryZone = $derived(postalZoneFor(deliveryPostalCode))
  const deliveryZonePrefix = $derived(postalZonePrefixFor(deliveryPostalCode))
  const priceFormatter = $derived(
    new Intl.NumberFormat(data.language === 'en' ? 'en-GB' : data.language === 'es' ? 'es-ES' : 'pt-PT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }),
  )

  const basePriceFor = (product: StoreProduct) =>
    Math.min(
      ...product.variants.flatMap((variant) => [
        variant.prices.natural,
        ...(product.hasFinishChoice ? [variant.prices.dark] : []),
      ]),
    )

  const entryPriceFor = (product: StoreProduct) => {
    const candidates = product.variants.flatMap((variant) =>
      (product.hasFinishChoice ? (['natural', 'dark'] as const) : (['natural'] as const)).map(
        (finish) => ({
          price: variant.prices[finish],
          weightKg: variant.weightKg,
        }),
      ),
    )
    const candidate = candidates.sort((left, right) => left.price - right.price)[0]
    if (!candidate) return {price: 0, includesDelivery: false}

    const estimate = calculateStoreEstimate(
      [
        {
          unitPrice: candidate.price,
          quantity: 1,
          weightKg: candidate.weightKg,
          flatTransportPrice: product.flatTransportPrice,
        },
      ],
      deliveryPostalCode,
      {transportMultiplier: content.storePage.transportMultiplier},
    )

    if (estimate.totalGross !== null) return {price: estimate.totalGross, includesDelivery: true}
    return {price: candidate.price, includesDelivery: false}
  }

  const formatPrice = (price: number) => priceFormatter.format(price)

  const initials = (title: string) =>
    title
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toLocaleUpperCase(data.language)

  const storeProductFieldDataAttribute = (product: StoreProduct, path: string) =>
    data.preview && data.studioUrl && product.studioDocumentId
      ? dataAttributeFactory?.({
          baseUrl: data.studioUrl,
          id: product.studioDocumentId,
          type: 'storeProduct',
        })(path)
      : undefined

  const searchableText = (product: StoreProduct) =>
    [
      product.title,
      product.summary,
      storeCategoryLabel(content.storePage, product.category),
    ]
      .join(' ')
      .toLocaleLowerCase(data.language)

  const filteredProducts = $derived.by(() => {
    const products = content.storeProducts.filter((product) => {
      const matchesCategory = category === 'all' || product.category === category
      const matchesQuery = !normalizedQuery || searchableText(product).includes(normalizedQuery)

      return matchesCategory && matchesQuery
    })

    return [...products].sort((left, right) => {
      if (sort === 'priceAsc') return entryPriceFor(left).price - entryPriceFor(right).price
      if (sort === 'priceDesc') return entryPriceFor(right).price - entryPriceFor(left).price
      if (sort === 'name') return left.title.localeCompare(right.title, data.language)
      return content.storeProducts.indexOf(left) - content.storeProducts.indexOf(right)
    })
  })
  const totalPages = $derived(Math.max(1, Math.ceil(filteredProducts.length / pageSize)))
  const visibleProducts = $derived(filteredProducts.slice((page - 1) * pageSize, page * pageSize))
  const updatePageUrl = (nextPage: number) => {
    if (!browser) return

    const url = new URL(window.location.href)
    if (nextPage > 1) url.searchParams.set('page', String(nextPage))
    else url.searchParams.delete('page')
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`)
  }

  $effect(() => {
    query
    category
    sort
    if (!filterEffectInitialized) {
      filterEffectInitialized = true
      return
    }

    page = 1
    updatePageUrl(1)
  })

  $effect(() => {
    if (page > totalPages) {
      page = totalPages
      updatePageUrl(totalPages)
    }
  })

  const setCollectionPage = (nextPage: number) => {
    const boundedPage = Math.min(totalPages, Math.max(1, nextPage))

    if (boundedPage === page || swapping) return

    changeListPage(
      collectionSection,
      () => {
        page = boundedPage
        updatePageUrl(boundedPage)
      },
      tick,
      (value) => {
        swapping = value
      },
    )
  }

  onMount(() => {
    const refreshDelivery = () => {
      deliveryPostalCode = readStorePostalCode()
      if (!deliveryPostalCode) deliveryModalOpen = true
    }

    refreshDelivery()
    window.addEventListener(storeDeliveryEventName, refreshDelivery)

    return () => {
      window.removeEventListener(storeDeliveryEventName, refreshDelivery)
    }
  })
</script>

<SeoHead
  title={content.nav.store}
  description={seoDescription(
    data.language,
    content.storePage.hero.lead,
    content.storeProducts.map((product) => product.summary).join(' '),
  )}
  pagination={{page, totalPages}}
/>

<main class="store-page">
  <ManagedPageComposition
    sections={content.storePage.sections}
    core={pageCore}
    settings={data.settings}
    {content}
    language={data.language}
    dataset={data.sanityDataset}
    preview={data.preview || data.builderPreview}
    editorSource={{
      baseUrl: data.studioUrl,
      id: 'siteContent',
      type: 'siteLanding',
      rootPath: 'storePage',
    }}
  >
    <PageHero {...hero} dataAttribute={storeHeroDataAttribute}>
      <DownloadList
        documents={content.storePage.documents}
        title={content.storePage.documentsTitle}
        fallbackTitle={content.common.downloadsTitle}
      />
    </PageHero>

    <section class="section store-section" bind:this={collectionSection}>
    {#if deliveryPostalCode}
      <Reveal class="store-delivery-strip" variant="panel">
        <div class="store-delivery-info">
          <svg class="store-delivery-pin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M20 10c0 5.5-8 11-8 11s-8-5.5-8-11a8 8 0 0 1 16 0Z" />
            <circle cx="12" cy="10" r="2.6" />
          </svg>
          <span class="store-delivery-text">
            <span>{localizedDeliveryLabels.postcode}</span>
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
          {localizedDeliveryLabels.change}
        </button>
      </Reveal>
    {/if}

    <div
      class:store-blurred-preview={!deliveryPostalCode || deliveryModalOpen}
      aria-hidden={!deliveryPostalCode || deliveryModalOpen}
      inert={!deliveryPostalCode || deliveryModalOpen}
    >
      <Reveal class="store-toolbar" variant="panel">
        <label class="search-field store-search">
          <span>{content.storePage.searchLabel}</span>
          <input
            bind:value={query}
            type="search"
            aria-label={content.storePage.searchLabel}
            placeholder={content.common.searchPlaceholder}
          />
        </label>

        <label class="store-select">
          <span>{content.storePage.categoryLabel}</span>
          <select bind:value={category}>
            <option value="all">{content.storePage.allCategoriesLabel}</option>
            {#each categories as option}
              <option value={option.slug}>{option.label}</option>
            {/each}
          </select>
        </label>

        <label class="store-select">
          <span>{content.storePage.sortLabel}</span>
          <select bind:value={sort}>
            {#each sortOptions as option}
              <option value={option}>{localizedSortLabels[option]}</option>
            {/each}
          </select>
        </label>
      </Reveal>

      {#if filteredProducts.length}
        <div class="store-grid" class:page-swap-out={swapping}>
          {#each visibleProducts as product, index}
            {@const entryPrice = entryPriceFor(product)}
            {@const cardImageDataAttribute = storeProductFieldDataAttribute(product, 'image')}
            <Reveal class="store-card-reveal" delay={Math.min(index * 35, 180)} variant="card">
              <a
                class="store-card"
                href={collectionDetailHref(`/loja/${product.slug}`, data.language, page)}
                data-store-product={product.slug}
              >
                <div
                  class={`store-card-visual ${product.image ? '' : 'no-image'}`}
                  data-sanity={cardImageDataAttribute}
                >
                  {#if product.image}
                    <img
                      src={sizedImage(product.image.url, 640)}
                      srcset={imageSrcset(product.image.url, [360, 480, 640, 800])}
                      sizes="(max-width: 700px) 92vw, 360px"
                      alt={product.image.alt || product.title}
                      loading="lazy"
                      decoding="async"
                      style:background={product.image.lqip
                        ? `center / cover no-repeat url(${product.image.lqip})`
                        : undefined}
                    />
                  {:else}
                    <div aria-hidden="true">
                      <span>{storeCategoryLabel(content.storePage, product.category)}</span>
                      <strong>{initials(product.title)}</strong>
                    </div>
                  {/if}
                </div>

                <div class="store-card-body">
                  <div class="store-card-heading">
                    <p>{storeCategoryLabel(content.storePage, product.category)}</p>
                    <h3
                      class="cms-styled-text"
                      style={textAppearanceStyle(product.textAppearance?.title)}
                    >{product.title}</h3>
                  </div>
                  <p
                    class="store-card-summary cms-styled-text"
                    style={textAppearanceStyle(product.textAppearance?.summary)}
                  >{product.summary}</p>

                  <div class="store-price-line">
                    <span>
                      {entryPrice.includesDelivery
                        ? localizedDeliveryLabels.cardPriceWithDelivery
                        : localizedDeliveryLabels.cardPriceWithoutDelivery}
                    </span>
                    <strong>{formatPrice(entryPrice.price)}</strong>
                  </div>
                </div>
              </a>
            </Reveal>
          {/each}
        </div>
      {:else}
        <p class="empty-state store-empty">{content.storePage.noResults}</p>
      {/if}

      <Pagination
        {page}
        {totalPages}
        onchange={setCollectionPage}
        label={content.common.pageLabel}
        previousLabel={content.common.previous}
        nextLabel={content.common.next}
        disabled={swapping}
      />
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
    </section>
  </ManagedPageComposition>
</main>

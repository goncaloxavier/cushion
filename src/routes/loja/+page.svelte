<script lang="ts">
  import Pagination from '$lib/components/Pagination.svelte'
  import PageHero from '$lib/components/PageHero.svelte'
  import Reveal from '$lib/components/Reveal.svelte'
  import {browser} from '$app/environment'
  import {collectionDetailHref} from '$lib/collection-page'
  import {imageSrcset, sizedImage} from '$lib/image'
  import {changeListPage} from '$lib/scroll'
  import type {LanguageCode, StoreCategory, StoreProduct} from '$lib/site-content'
  import {tick} from 'svelte'

  let {data} = $props()

  type CategoryFilter = 'all' | StoreCategory
  type SortKey = 'featured' | 'priceAsc' | 'priceDesc' | 'name'

  const categories: StoreCategory[] = ['bancos', 'mesas', 'cadeiras', 'residuos', 'cultivo']
  const sortOptions: SortKey[] = ['featured', 'priceAsc', 'priceDesc', 'name']
  const sortLabels: Record<LanguageCode, Record<SortKey, string>> = {
    pt: {
      featured: 'Destaque',
      priceAsc: 'Preço crescente',
      priceDesc: 'Preço decrescente',
      name: 'Nome',
    },
    en: {
      featured: 'Featured',
      priceAsc: 'Price low to high',
      priceDesc: 'Price high to low',
      name: 'Name',
    },
    es: {
      featured: 'Destacado',
      priceAsc: 'Precio ascendente',
      priceDesc: 'Precio descendente',
      name: 'Nombre',
    },
  }
  let query = $state('')
  let category = $state<CategoryFilter>('all')
  let sort = $state<SortKey>('featured')
  let page = $state((() => data.initialPage)())
  let swapping = $state(false)
  let filterEffectInitialized = false
  let collectionSection: HTMLElement | null = null
  const pageSize = 9

  const content = $derived(data.site[data.language])
  const langQuery = $derived(`?lang=${data.language}`)
  const hero = $derived({...content.storePage.hero, lead: ''})
  const normalizedQuery = $derived(query.trim().toLocaleLowerCase(data.language))
  const localizedSortLabels = $derived(sortLabels[data.language])
  const priceFormatter = $derived(
    new Intl.NumberFormat(data.language === 'en' ? 'en-GB' : data.language === 'es' ? 'es-ES' : 'pt-PT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }),
  )

  const priceFor = (product: StoreProduct) =>
    Math.min(...product.variants.flatMap((variant) => [variant.prices.natural, variant.prices.dark]))

  const formatPrice = (price: number) => priceFormatter.format(price)

  const initials = (title: string) =>
    title
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toLocaleUpperCase(data.language)

  const searchableText = (product: StoreProduct) =>
    [
      product.title,
      product.summary,
      content.storePage.categoryLabels[product.category],
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
      if (sort === 'priceAsc') return priceFor(left) - priceFor(right)
      if (sort === 'priceDesc') return priceFor(right) - priceFor(left)
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
</script>

<svelte:head>
  <title>{content.nav.store} | DaFábrica4You</title>
</svelte:head>

<main class="store-page">
  <PageHero {...hero} />

  <section class="section store-section" bind:this={collectionSection}>
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
            <option value={option}>{content.storePage.categoryLabels[option]}</option>
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
          <Reveal class="store-card-reveal" delay={Math.min(index * 35, 180)} variant="card">
            <a
              class="store-card"
              href={collectionDetailHref(`/loja/${product.slug}`, data.language, page)}
              data-store-product={product.slug}
            >
              <div class={`store-card-visual ${product.image ? '' : 'no-image'}`}>
                {#if product.image}
                  <img
                    src={sizedImage(product.image.url, 640)}
                    srcset={imageSrcset(product.image.url, [360, 480, 640, 800])}
                    sizes="(max-width: 700px) 92vw, 360px"
                    alt={product.image.alt}
                    loading="lazy"
                    decoding="async"
                    style:background={product.image.lqip
                      ? `center / cover no-repeat url(${product.image.lqip})`
                      : undefined}
                  />
                {:else}
                  <div aria-hidden="true">
                    <span>{content.storePage.categoryLabels[product.category]}</span>
                    <strong>{initials(product.title)}</strong>
                  </div>
                {/if}
              </div>

              <div class="store-card-body">
                <div class="store-card-heading">
                  <p>{content.storePage.categoryLabels[product.category]}</p>
                  <h3>{product.title}</h3>
                </div>
                <p class="store-card-summary">{product.summary}</p>

                <div class="store-price-line">
                  <span>{content.storePage.priceFromLabel}</span>
                  <strong>{formatPrice(priceFor(product))}</strong>
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
  </section>
</main>

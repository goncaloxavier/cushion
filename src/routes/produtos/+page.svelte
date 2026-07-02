<script lang="ts">
  import Pagination from '$lib/components/Pagination.svelte'
  import Reveal from '$lib/components/Reveal.svelte'
  import SeoHead from '$lib/components/SeoHead.svelte'
  import {browser} from '$app/environment'
  import {collectionDetailHref} from '$lib/collection-page'
  import {lineReveal} from '$lib/actions/line-reveal'
  import {imageFor, productImageFallback} from '$lib/site-content'
  import {imageSrcset, sizedImage} from '$lib/image'
  import {changeListPage} from '$lib/scroll'
  import {tick} from 'svelte'

  let {data} = $props()
  const content = $derived(data.site[data.language])
  let query = $state('')
  let page = $state((() => data.initialPage)())
  let swapping = $state(false)
  let queryEffectInitialized = false
  let collectionSection: HTMLElement | null = null
  const pageSize = 9
  const normalizedQuery = $derived(query.trim().toLowerCase())
  const filteredProducts = $derived(
    content.products.filter((product) =>
      [product.title, product.summary, product.description]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery),
    ),
  )
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
    if (!queryEffectInitialized) {
      queryEffectInitialized = true
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

<SeoHead
  title={content.nav.products}
  description={content.productsPage.lead || content.productsPage.hero.title}
  image={content.productsPage.heroImage}
/>

<main class="products-page">
  <section class="product-index-hero">
    <Reveal class="product-index-copy" variant="hero" priority>
      <p class="kicker">{content.productsPage.hero.kicker}</p>
      <h1 use:lineReveal>{content.productsPage.hero.title}</h1>
    </Reveal>

    <Reveal class="product-index-media" delay={120} variant="media" priority>
      <img
        src={sizedImage(content.productsPage.heroImage.url, 1100)}
        srcset={imageSrcset(content.productsPage.heroImage.url, [600, 900, 1200, 1600])}
        sizes="(max-width: 900px) 92vw, 600px"
        alt={content.productsPage.heroImage.alt}
        loading="eager"
        fetchpriority="high"
        decoding="async"
        style:background={content.productsPage.heroImage.lqip
          ? `center / cover no-repeat url(${content.productsPage.heroImage.lqip})`
          : undefined}
      />
    </Reveal>
  </section>

  <section class="section product-collection-section" bind:this={collectionSection}>
    <Reveal delay={80} variant="panel">
      <div class="collection-tools">
        <label class="search-field">
          <span>{content.nav.products}</span>
          <input
            bind:value={query}
            type="search"
            aria-label={content.common.searchProducts}
            placeholder={content.common.searchPlaceholder}
          />
        </label>
        <p>{filteredProducts.length} / {content.products.length}</p>
      </div>
    </Reveal>

    <div class="collection-results" class:page-swap-out={swapping}>
      {#each visibleProducts as product}
        {@const image = imageFor(product, productImageFallback)}
        <a
          class="product-panel"
          href={collectionDetailHref(`/produtos/${product.slug}`, data.language, page)}
        >
          <div class="product-panel-media">
            <img
              src={sizedImage(image.url, 640)}
              srcset={imageSrcset(image.url, [360, 480, 640, 800])}
              sizes="(max-width: 700px) 92vw, 360px"
              alt={image.alt}
              loading="lazy"
              decoding="async"
              style:background={image.lqip
                ? `center / cover no-repeat url(${image.lqip})`
                : undefined}
              style:view-transition-name={`vt-${product.slug}`}
            />
          </div>
          <div class="product-panel-copy">
            <h2>{product.title}</h2>
          </div>
        </a>
      {/each}
    </div>

    {#if !visibleProducts.length}
      <p class="empty-state">{content.common.noResults}</p>
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

<script lang="ts">
  import Reveal from '$lib/components/Reveal.svelte'
  import {imageFor, productImageFallback} from '$lib/site-content'

  let {data} = $props()
  const content = $derived(data.site[data.language])
  const langQuery = $derived(`?lang=${data.language}`)
  let query = $state('')
  let page = $state(1)
  let collectionSection: HTMLElement | null = null
  const pageSize = 4
  const normalizedQuery = $derived(query.trim().toLowerCase())
  const filteredProducts = $derived(
    content.products.filter((product) =>
      [product.title, product.summary, product.description, ...product.features, ...product.applications]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery),
    ),
  )
  const totalPages = $derived(Math.max(1, Math.ceil(filteredProducts.length / pageSize)))
  const visibleProducts = $derived(filteredProducts.slice((page - 1) * pageSize, page * pageSize))

  $effect(() => {
    query
    page = 1
  })

  $effect(() => {
    if (page > totalPages) page = totalPages
  })

  const scrollToCollectionTop = () => {
    requestAnimationFrame(() => {
      collectionSection?.scrollIntoView({
        block: 'start',
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      })
    })
  }

  const setCollectionPage = (nextPage: number) => {
    const boundedPage = Math.min(totalPages, Math.max(1, nextPage))

    if (boundedPage === page) return

    page = boundedPage
    scrollToCollectionTop()
  }
</script>

<svelte:head>
  <title>{content.nav.products} | DaFábrica4You</title>
</svelte:head>

<main class="products-page">
  <section class="product-index-hero">
    <Reveal class="product-index-copy" variant="hero" priority>
      <p class="kicker">{content.productsPage.hero.kicker}</p>
      <h1>{content.productsPage.hero.title}</h1>
      <p>{content.productsPage.hero.lead}</p>
    </Reveal>

    <Reveal class="product-index-media" delay={120} variant="media" priority>
      <img
        src={content.productsPage.heroImage.url}
        alt={content.productsPage.heroImage.alt}
        loading="eager"
        decoding="async"
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

    <div class="product-directory product-directory-editorial">
      {#each visibleProducts as product}
        {@const image = imageFor(product, productImageFallback)}
        <a class="product-panel" href={`/produtos/${product.slug}${langQuery}`}>
          <div class="product-panel-media">
            <img src={image.url} alt={image.alt} loading="lazy" decoding="async" />
          </div>
          <div class="product-panel-copy">
            <span>{product.features[0]}</span>
            <h2>{product.title}</h2>
            <p>{product.summary}</p>
            <div class="tag-row">
              {#each product.features.slice(0, 3) as feature}
                <small>{feature}</small>
              {/each}
            </div>
          </div>
        </a>
      {/each}
    </div>

    {#if !visibleProducts.length}
      <p class="empty-state">{content.common.noResults}</p>
    {/if}

    <nav class="pagination" aria-label={content.common.pageLabel}>
      <button
        type="button"
        disabled={page === 1}
        onclick={() => {
          setCollectionPage(page - 1)
        }}
      >
        {content.common.previous}
      </button>
      <span>{content.common.pageLabel} {page} / {totalPages}</span>
      <button
        type="button"
        disabled={page === totalPages}
        onclick={() => {
          setCollectionPage(page + 1)
        }}
      >
        {content.common.next}
      </button>
    </nav>
  </section>
</main>

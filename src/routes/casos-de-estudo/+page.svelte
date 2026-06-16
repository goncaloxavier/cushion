<script lang="ts">
  import Reveal from '$lib/components/Reveal.svelte'
  import {caseStudyImageFallback, imageFor} from '$lib/site-content'

  let {data} = $props()
  const content = $derived(data.site[data.language])
  const langQuery = $derived(`?lang=${data.language}`)
  let query = $state('')
  let page = $state(1)
  let collectionSection: HTMLElement | null = null
  const pageSize = 2
  const normalizedQuery = $derived(query.trim().toLowerCase())
  const filteredCases = $derived(
    content.caseStudies.filter((item) =>
      [item.title, item.location, item.summary, item.challenge, item.solution, item.result]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery),
    ),
  )
  const totalPages = $derived(Math.max(1, Math.ceil(filteredCases.length / pageSize)))
  const visibleCases = $derived(filteredCases.slice((page - 1) * pageSize, page * pageSize))

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
  <title>{content.nav.cases} | DaFábrica4You</title>
</svelte:head>

<main class="cases-page">
  <section class="case-index-hero">
    <Reveal class="case-index-copy" variant="hero" priority>
      <p class="kicker">{content.casesPage.hero.kicker}</p>
      <h1>{content.casesPage.hero.title}</h1>
      <p>{content.casesPage.hero.lead}</p>
    </Reveal>

    <Reveal class="case-index-proof" delay={120} variant="panel" priority>
      <span>{content.common.challenge}</span>
      <span>{content.common.solution}</span>
      <span>{content.common.result}</span>
    </Reveal>
  </section>

  <section class="section collection-section case-collection-section" bind:this={collectionSection}>
    <Reveal variant="panel">
      <div class="collection-tools">
        <label class="search-field">
          <span>{content.nav.cases}</span>
          <input
            bind:value={query}
            type="search"
            aria-label={content.common.searchCases}
            placeholder={content.common.searchPlaceholder}
          />
        </label>
        <p>{filteredCases.length} / {content.caseStudies.length}</p>
      </div>
    </Reveal>

    <div class="case-strip">
      {#each visibleCases as item}
        {@const image = imageFor(item, caseStudyImageFallback)}
        <a class="case-card" href={`/casos-de-estudo/${item.slug}${langQuery}`}>
          <div class="case-card-media">
            <img src={image.url} alt={image.alt} loading="lazy" decoding="async" />
          </div>
          <div class="case-card-copy">
            <span>{item.location}</span>
            <h2>{item.title}</h2>
            <p>{item.summary}</p>
          </div>
        </a>
      {/each}
    </div>

    {#if !visibleCases.length}
      <p class="empty-state collection-empty">{content.common.noResults}</p>
    {/if}

    <nav class="pagination collection-pagination" aria-label={content.common.pageLabel}>
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

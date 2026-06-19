<script lang="ts">
  import Pagination from '$lib/components/Pagination.svelte'
  import Reveal from '$lib/components/Reveal.svelte'
  import {caseStudyImageFallback, imageFor} from '$lib/site-content'
  import {changeListPage, type ListPageTransitionPhase} from '$lib/scroll'
  import {tick} from 'svelte'

  let {data} = $props()
  const content = $derived(data.site[data.language])
  const langQuery = $derived(`?lang=${data.language}`)
  let query = $state('')
  let page = $state(1)
  let pageTransitionPhase = $state<ListPageTransitionPhase>('idle')
  let collectionSection: HTMLElement | null = null
  const pageSize = 4
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

  const setCollectionPage = (nextPage: number) => {
    const boundedPage = Math.min(totalPages, Math.max(1, nextPage))

    if (boundedPage === page || pageTransitionPhase !== 'idle') return

    changeListPage(
      collectionSection,
      () => {
        page = boundedPage
      },
      tick,
      {
        setPhase: (phase) => {
          pageTransitionPhase = phase
        },
      },
    )
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

    <Reveal class="case-index-media" delay={120} variant="media" priority>
      <img
        src={content.casesPage.heroImage.url}
        alt={content.casesPage.heroImage.alt}
        loading="eager"
        decoding="async"
      />
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

    <div
      class="collection-results case-strip"
      class:page-swap-out={pageTransitionPhase === 'out'}
      class:page-swap-in={pageTransitionPhase === 'in'}
    >
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

    <Pagination
      {page}
      {totalPages}
      onchange={setCollectionPage}
      label={content.common.pageLabel}
      previousLabel={content.common.previous}
      nextLabel={content.common.next}
      disabled={pageTransitionPhase !== 'idle'}
    />
  </section>
</main>

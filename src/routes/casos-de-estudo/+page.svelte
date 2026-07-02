<script lang="ts">
  import Pagination from '$lib/components/Pagination.svelte'
  import Reveal from '$lib/components/Reveal.svelte'
  import SeoHead from '$lib/components/SeoHead.svelte'
  import {browser} from '$app/environment'
  import {collectionDetailHref} from '$lib/collection-page'
  import {caseStudyImageFallback, imageFor} from '$lib/site-content'
  import {lineReveal} from '$lib/actions/line-reveal'
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
  const filteredCases = $derived(
    content.caseStudies.filter((item) =>
      [
        item.title,
        item.location,
        item.summary,
        item.description,
        item.challenge,
        item.solution,
        item.result,
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery),
    ),
  )
  const totalPages = $derived(Math.max(1, Math.ceil(filteredCases.length / pageSize)))
  const visibleCases = $derived(filteredCases.slice((page - 1) * pageSize, page * pageSize))
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
  title={content.nav.cases}
  description={content.casesPage.hero.title}
  image={content.casesPage.heroImage}
/>

<main class="cases-page">
  <section class="case-index-hero">
    <Reveal class="case-index-copy" variant="hero" priority>
      <p class="kicker">{content.casesPage.hero.kicker}</p>
      <h1 use:lineReveal>{content.casesPage.hero.title}</h1>
    </Reveal>

    <Reveal class="case-index-media" delay={120} variant="media" priority>
      <img
        src={sizedImage(content.casesPage.heroImage.url, 1100)}
        srcset={imageSrcset(content.casesPage.heroImage.url, [600, 900, 1200, 1600])}
        sizes="(max-width: 900px) 92vw, 600px"
        alt={content.casesPage.heroImage.alt}
        loading="eager"
        fetchpriority="high"
        decoding="async"
        style:background={content.casesPage.heroImage.lqip
          ? `center / cover no-repeat url(${content.casesPage.heroImage.lqip})`
          : undefined}
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

    <div class="collection-results" class:page-swap-out={swapping}>
      {#each visibleCases as item}
        {@const image = imageFor(item, caseStudyImageFallback)}
        <a
          class="case-card"
          href={collectionDetailHref(`/casos-de-estudo/${item.slug}`, data.language, page)}
        >
          <div class="case-card-media">
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
              style:view-transition-name={`vt-${item.slug}`}
            />
            <span class="card-meta">{item.location}</span>
          </div>
          <div class="case-card-copy">
            <h2>{item.title}</h2>
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
      disabled={swapping}
    />
  </section>
</main>

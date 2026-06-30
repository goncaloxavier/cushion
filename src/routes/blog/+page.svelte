<script lang="ts">
  import Pagination from '$lib/components/Pagination.svelte'
  import Reveal from '$lib/components/Reveal.svelte'
  import SeoHead from '$lib/components/SeoHead.svelte'
  import {browser} from '$app/environment'
  import {collectionDetailHref} from '$lib/collection-page'
  import {lineReveal} from '$lib/actions/line-reveal'
  import {blogImageFallback, imageFor, type LanguageCode} from '$lib/site-content'
  import {imageSrcset, sizedImage} from '$lib/image'
  import {changeListPage} from '$lib/scroll'
  import {tick} from 'svelte'

  let {data} = $props()
  const readArticleLabels: Record<LanguageCode, string> = {
    pt: 'Ler artigo',
    en: 'Read article',
    es: 'Leer artículo',
  }
  const readArticleLabel = $derived(readArticleLabels[data.language])
  const content = $derived(data.site[data.language])
  let query = $state('')
  let page = $state((() => data.initialPage)())
  let swapping = $state(false)
  let queryEffectInitialized = false
  let collectionSection: HTMLElement | null = null
  const pageSize = 9
  const normalizedQuery = $derived(query.trim().toLowerCase())
  const filteredPosts = $derived(
    content.blogPosts.filter((post) =>
      [post.title, post.excerpt, post.category].join(' ').toLowerCase().includes(normalizedQuery),
    ),
  )
  const totalPages = $derived(Math.max(1, Math.ceil(filteredPosts.length / pageSize)))
  const visiblePosts = $derived(filteredPosts.slice((page - 1) * pageSize, page * pageSize))
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
  title={content.nav.blog}
  description={content.blogPage.newsletter.lead || content.blogPage.hero.title}
  image={content.blogPage.heroImage}
/>

<main class="blog-page">
  <section class="blog-index-hero">
    <Reveal class="blog-index-copy" variant="hero" priority>
      <p class="kicker">{content.blogPage.hero.kicker}</p>
      <h1 use:lineReveal>{content.blogPage.hero.title}</h1>
    </Reveal>

    <Reveal class="blog-index-media" delay={120} variant="media" priority>
      <img
        src={sizedImage(content.blogPage.heroImage.url, 1100)}
        srcset={imageSrcset(content.blogPage.heroImage.url, [600, 900, 1200, 1600])}
        sizes="(max-width: 900px) 92vw, 600px"
        alt={content.blogPage.heroImage.alt}
        loading="eager"
        fetchpriority="high"
        decoding="async"
        style:background={content.blogPage.heroImage.lqip
          ? `center / cover no-repeat url(${content.blogPage.heroImage.lqip})`
          : undefined}
      />
    </Reveal>
  </section>

  <section class="section collection-section blog-collection-section" bind:this={collectionSection}>
    <Reveal variant="panel">
      <div class="collection-tools">
        <label class="search-field">
          <span>{content.nav.blog}</span>
          <input
            bind:value={query}
            type="search"
            aria-label={content.common.searchPosts}
            placeholder={content.common.searchPlaceholder}
          />
        </label>
        <p>{filteredPosts.length} / {content.blogPosts.length}</p>
      </div>
    </Reveal>

    <div class="collection-results" class:page-swap-out={swapping}>
      {#each visiblePosts as post}
        {@const image = imageFor(post, blogImageFallback)}
        <a
          class="journal-card"
          href={collectionDetailHref(`/blog/${post.slug}`, data.language, page)}
        >
          <div class="journal-card-media">
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
              style:view-transition-name={`vt-${post.slug}`}
            />
          </div>
          <div class="journal-card-copy">
            <span>{post.category}</span>
            <time datetime={post.publishedAt}>{post.publishedAt}</time>
            <h2>{post.title}</h2>
            <p>{post.excerpt}</p>
            <strong>{readArticleLabel}</strong>
          </div>
        </a>
      {/each}
    </div>

    {#if !visiblePosts.length}
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

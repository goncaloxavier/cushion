<script lang="ts">
  import Pagination from '$lib/components/Pagination.svelte'
  import Reveal from '$lib/components/Reveal.svelte'
  import {blogImageFallback, imageFor} from '$lib/site-content'
  import {changeListPage} from '$lib/scroll'
  import {tick} from 'svelte'

  let {data} = $props()
  const content = $derived(data.site[data.language])
  const langQuery = $derived(`?lang=${data.language}`)
  let query = $state('')
  let page = $state(1)
  let swapping = $state(false)
  let collectionSection: HTMLElement | null = null
  const pageSize = 9
  const normalizedQuery = $derived(query.trim().toLowerCase())
  const filteredPosts = $derived(
    content.blogPosts.filter((post) =>
      [post.title, post.excerpt, post.category, post.body].join(' ').toLowerCase().includes(normalizedQuery),
    ),
  )
  const totalPages = $derived(Math.max(1, Math.ceil(filteredPosts.length / pageSize)))
  const visiblePosts = $derived(filteredPosts.slice((page - 1) * pageSize, page * pageSize))

  $effect(() => {
    query
    page = 1
  })

  $effect(() => {
    if (page > totalPages) page = totalPages
  })

  const setCollectionPage = (nextPage: number) => {
    const boundedPage = Math.min(totalPages, Math.max(1, nextPage))
    if (boundedPage === page || swapping) return

    changeListPage(
      collectionSection,
      () => {
        page = boundedPage
      },
      tick,
      (value) => {
        swapping = value
      },
    )
  }
</script>

<svelte:head>
  <title>{content.nav.blog} | DaFábrica4You</title>
</svelte:head>

<main class="blog-page">
  <section class="blog-index-hero">
    <Reveal class="blog-index-copy" variant="hero" priority>
      <p class="kicker">{content.blogPage.hero.kicker}</p>
      <h1>{content.blogPage.hero.title}</h1>
      <p>{content.blogPage.hero.lead}</p>
    </Reveal>

    <Reveal class="blog-index-media" delay={120} variant="media" priority>
      <img
        src={content.blogPage.heroImage.url}
        alt={content.blogPage.heroImage.alt}
        loading="eager"
        decoding="async"
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
        <a class="journal-card" href={`/blog/${post.slug}${langQuery}`}>
          <div class="journal-card-media">
            <img src={image.url} alt={image.alt} loading="lazy" decoding="async" />
            <time class="card-meta" datetime={post.publishedAt}>{post.publishedAt}</time>
          </div>
          <div class="journal-card-copy">
            <h2>{post.title}</h2>
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

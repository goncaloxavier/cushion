<script lang="ts">
  import Reveal from '$lib/components/Reveal.svelte'
  import {blogImageFallback, imageFor} from '$lib/site-content'

  let {data} = $props()
  const content = $derived(data.site[data.language])
  const langQuery = $derived(`?lang=${data.language}`)
  const latestPost = $derived(content.blogPosts[0])
  let query = $state('')
  let page = $state(1)
  const pageSize = 2
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

    {#if latestPost}
      <Reveal class="blog-index-current" delay={120} variant="panel" priority>
        <span>{latestPost.category}</span>
        <h2>{latestPost.title}</h2>
        <p>{latestPost.excerpt}</p>
      </Reveal>
    {/if}
  </section>

  <section class="section collection-section blog-collection-section">
    <Reveal variant="panel">
      <div class="collection-tools">
        <label class="search-field">
          <input
            bind:value={query}
            type="search"
            aria-label={content.common.searchPosts}
            placeholder={content.nav.blog}
          />
        </label>
        <p>{filteredPosts.length} / {content.blogPosts.length}</p>
      </div>
    </Reveal>

    <div class="journal-board">
      {#each visiblePosts as post}
        {@const image = imageFor(post, blogImageFallback)}
        <a class="journal-card" href={`/blog/${post.slug}${langQuery}`}>
          <div class="journal-card-media">
            <img src={image.url} alt={image.alt} loading="lazy" decoding="async" />
          </div>
          <div class="journal-card-copy">
            <span>{post.category}</span>
            <time datetime={post.publishedAt}>{post.publishedAt}</time>
            <h2>{post.title}</h2>
            <p>{post.excerpt}</p>
          </div>
        </a>
      {/each}
    </div>

    {#if !visiblePosts.length}
      <p class="empty-state collection-empty">{content.common.noResults}</p>
    {/if}

    <nav class="pagination collection-pagination" aria-label={content.common.pageLabel}>
      <button
        type="button"
        disabled={page === 1}
        onclick={() => {
          page = Math.max(1, page - 1)
        }}
      >
        {content.common.previous}
      </button>
      <span>{content.common.pageLabel} {page} / {totalPages}</span>
      <button
        type="button"
        disabled={page === totalPages}
        onclick={() => {
          page = Math.min(totalPages, page + 1)
        }}
      >
        {content.common.next}
      </button>
    </nav>
  </section>
</main>

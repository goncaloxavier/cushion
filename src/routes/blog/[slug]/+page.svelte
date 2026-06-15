<script lang="ts">
  import {blogImageFallback, imageFor} from '$lib/site-content'

  let {data} = $props()
  const image = $derived(imageFor(data.post, blogImageFallback))
</script>

<svelte:head>
  <title>{data.post.title} | DaFábrica4You</title>
</svelte:head>

<main>
  <article class="detail-page blog-detail">
    <header class="blog-detail-header">
      <div>
        <h1>{data.post.title}</h1>
        <time datetime={data.post.publishedAt}>{data.post.publishedAt}</time>
      </div>
      <p class="article-lead">{data.post.excerpt}</p>
    </header>
    <div class="blog-detail-media">
      <img src={image.url} alt={image.alt} decoding="async" fetchpriority="high" />
    </div>
    <div class="article-body blog-body">
      <p>{data.post.body}</p>
    </div>
  </article>
</main>

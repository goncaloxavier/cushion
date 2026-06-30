<script lang="ts">
  import {page} from '$app/state'
  import ImageGallery from '$lib/components/ImageGallery.svelte'
  import SeoHead from '$lib/components/SeoHead.svelte'
  import StructuredArticleBody from '$lib/components/StructuredArticleBody.svelte'
  import {collectionListHref} from '$lib/collection-page'
  import {absoluteUrl, blogPostingSchema} from '$lib/seo'
  import {blogImageFallback, blogImagesFor} from '$lib/site-content'

  let {data} = $props()
  const content = $derived(data.site[data.language])
  const backHref = $derived(collectionListHref('/blog', data.language, data.returnPage))
  const images = $derived(blogImagesFor(data.post, blogImageFallback))
  const blogJsonLd = $derived(
    blogPostingSchema({
      title: data.post.title,
      description: data.post.excerpt || data.post.body,
      imageUrl: absoluteUrl(page.url.origin, images[0]?.url),
      datePublished: data.post.publishedAt,
      logoUrl: absoluteUrl(page.url.origin, '/logo/brand_mark.png'),
    }),
  )
</script>

<SeoHead
  title={data.post.title}
  description={data.post.excerpt || data.post.body}
  image={images[0]}
  type="article"
  jsonLd={blogJsonLd}
/>

<main>
  <article class="detail-page blog-detail">
    <header class="blog-detail-header">
      <div>
        <a class="detail-back-link" href={backHref}>
          <span aria-hidden="true">←</span>
          {content.common.backToBlog}
        </a>
        <h1>{data.post.title}</h1>
        <time datetime={data.post.publishedAt}>{data.post.publishedAt}</time>
      </div>
      <p class="article-lead">{data.post.excerpt}</p>
    </header>
    <ImageGallery
      {images}
      label={content.common.zoomImage}
      closeLabel={content.common.close}
      className="blog-detail-gallery"
      transitionName={`vt-${data.post.slug}`}
    />
    <div class="article-body blog-body">
      <StructuredArticleBody body={data.post.body} article={data.post.article} />
    </div>
  </article>
</main>

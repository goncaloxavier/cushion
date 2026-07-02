<script lang="ts">
  import {page} from '$app/state'
  import ImageGallery from '$lib/components/ImageGallery.svelte'
  import BlogArticleRail from '$lib/components/BlogArticleRail.svelte'
  import SeoHead from '$lib/components/SeoHead.svelte'
  import StructuredArticleBody from '$lib/components/StructuredArticleBody.svelte'
  import {collectionListHref} from '$lib/collection-page'
  import {absoluteUrl, blogPostingSchema} from '$lib/seo'
  import {blogImageFallback, blogImagesFor, defaultLanguage, type LanguageCode} from '$lib/site-content'

  const railLabels: Record<
    LanguageCode,
    {
      related: string
      share: string
      nativeShare: string
      whatsapp: string
      linkedin: string
      copy: string
      copied: string
    }
  > = {
    pt: {
      related: 'Ler também',
      share: 'Partilhar',
      nativeShare: 'Partilhar',
      whatsapp: 'Partilhar no WhatsApp',
      linkedin: 'Partilhar no LinkedIn',
      copy: 'Copiar link',
      copied: 'Link copiado',
    },
    en: {
      related: 'Read next',
      share: 'Share',
      nativeShare: 'Share',
      whatsapp: 'Share on WhatsApp',
      linkedin: 'Share on LinkedIn',
      copy: 'Copy link',
      copied: 'Link copied',
    },
    es: {
      related: 'Leer también',
      share: 'Compartir',
      nativeShare: 'Compartir',
      whatsapp: 'Compartir en WhatsApp',
      linkedin: 'Compartir en LinkedIn',
      copy: 'Copiar enlace',
      copied: 'Enlace copiado',
    },
  }

  let {data} = $props()
  const content = $derived(data.site[data.language])
  const backHref = $derived(collectionListHref('/blog', data.language, data.returnPage))
  const images = $derived(blogImagesFor(data.post, blogImageFallback))
  const labels = $derived(railLabels[data.language])
  const languageQuery = $derived(`?lang=${data.language}`)
  const relatedBlogPosts = $derived.by(() => {
    const sameCategory = content.blogPosts.filter(
      (post) => post.slug !== data.post.slug && post.category === data.post.category,
    )
    const fallbackPosts = content.blogPosts.filter(
      (post) =>
        post.slug !== data.post.slug &&
        !sameCategory.some((relatedPost) => relatedPost.slug === post.slug),
    )

    return [...sameCategory, ...fallbackPosts].slice(0, 4)
  })
  const articleRailItems = $derived.by(() => {
    return relatedBlogPosts.map((post) => ({
      href: `/blog/${post.slug}${languageQuery}`,
      text: post.title,
    }))
  })
  const shareUrl = $derived(
    `${page.url.origin}${page.url.pathname}${data.language === defaultLanguage ? '' : `?lang=${data.language}`}`,
  )
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
    <section class="blog-detail-reading">
      <div class="article-body blog-body">
        <StructuredArticleBody body={data.post.body} article={data.post.article} />
      </div>
      <BlogArticleRail items={articleRailItems} {labels} {shareUrl} shareText={data.post.title} />
    </section>
  </article>
</main>

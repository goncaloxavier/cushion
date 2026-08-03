<script lang="ts">
  import {page} from '$app/state'
  import {loadSanityDataAttributeFactory, type SanityDataAttributeFactory} from '$lib/sanity-edit-attributes'
  import ManagedPageComposition from '$lib/components/builder/ManagedPageComposition.svelte'
  import StoreMediaGallery from '$lib/components/StoreMediaGallery.svelte'
  import BlogArticleRail from '$lib/components/BlogArticleRail.svelte'
  import SeoHead from '$lib/components/SeoHead.svelte'
  import StructuredArticleBody from '$lib/components/StructuredArticleBody.svelte'
  import {collectionListHref} from '$lib/collection-page'
  import {absoluteUrl, blogPostingSchema, breadcrumbListSchema} from '$lib/seo'
  import {textAppearanceStyle} from '$lib/text-appearance'
  import {
    blogImageFallback,
    blogImagesFor,
    blogMediaFor,
    defaultLanguage,
    withLanguage,
    type LanguageCode,
  } from '$lib/site-content'
  import {managedCoreSectionForDocumentType} from '$lib/builder/managed-page-sections'

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
  let dataAttributeFactory = $state<SanityDataAttributeFactory | null>(null)
  $effect(() => {
    if ((data.preview || data.builderPreview) && !dataAttributeFactory) {
      void loadSanityDataAttributeFactory().then((factory) => (dataAttributeFactory = factory))
    }
  })
  const content = $derived(data.site)
  const pageCore = managedCoreSectionForDocumentType('blogPost')!
  const backHref = $derived(collectionListHref('/blog', data.language, data.returnPage))
  const images = $derived(blogImagesFor(data.post, blogImageFallback))
  const media = $derived(blogMediaFor(data.post, blogImageFallback))
  const postDataAttribute = $derived(
    (data.preview || data.builderPreview) && data.studioUrl && data.post.studioDocumentId
      ? dataAttributeFactory?.({
          baseUrl: data.studioUrl,
          id: data.post.studioDocumentId,
          type: 'blogPost',
        })
      : null,
  )
  const imageDataAttribute = $derived(
    postDataAttribute ? (path: string) => postDataAttribute(path) : undefined,
  )
  const articleFieldPath = $derived(data.post.article?.length ? 'article.pt' : 'body.pt')
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
  const blogJsonLd = $derived([
    blogPostingSchema({
      title: data.post.title,
      description: data.post.excerpt || data.post.body,
      imageUrl: absoluteUrl(page.url.origin, images[0]?.url),
      datePublished: data.post.publishedAt,
      dateModified: data.post.updatedAt,
      url: absoluteUrl(page.url.origin, withLanguage(page.url.pathname, data.language)),
      logoUrl: absoluteUrl(page.url.origin, '/logo/brand_mark.png'),
    }),
    breadcrumbListSchema([
      {name: content.nav.home, url: absoluteUrl(page.url.origin, withLanguage('/', data.language))!},
      {name: content.nav.blog, url: absoluteUrl(page.url.origin, withLanguage('/blog', data.language))!},
      {name: data.post.title, url: absoluteUrl(page.url.origin, withLanguage(page.url.pathname, data.language))!},
    ]),
  ])
</script>

<SeoHead
  title={data.post.title}
  description={data.post.excerpt || data.post.body}
  image={images[0]}
  type="article"
  jsonLd={blogJsonLd}
/>

<main>
  <ManagedPageComposition
    sections={data.post.sections ?? []}
    core={pageCore}
    settings={data.settings}
    {content}
    language={data.language}
    dataset={data.sanityDataset}
    preview={data.preview || data.builderPreview}
    editorSource={{
      baseUrl: data.studioUrl,
      id: data.post.studioDocumentId,
      type: 'blogPost',
    }}
  >
    <article class="detail-page blog-detail">
    <header class="blog-detail-header">
      <div>
        <a class="detail-back-link" href={backHref}>
          <span aria-hidden="true">←</span>
          {content.common.backToBlog}
        </a>
        <h1
          class="cms-styled-text"
          style={textAppearanceStyle(data.post.textAppearance?.title)}
          data-sanity={postDataAttribute?.('title.pt')}
        >{data.post.title}</h1>
        <time
          datetime={data.post.publishedAt}
          data-sanity={postDataAttribute?.('publishedAt')}
        >{data.post.publishedAt}</time>
      </div>
      <p
        class="article-lead cms-styled-text"
        style={textAppearanceStyle(data.post.textAppearance?.excerpt)}
        data-sanity={postDataAttribute?.('excerpt.pt')}
      >{data.post.excerpt}</p>
    </header>
    <StoreMediaGallery
      {media}
      label={content.common.zoomImage}
      closeLabel={content.common.close}
      className="blog-detail-gallery"
      transitionName={`vt-${data.post.slug}`}
      dataAttribute={imageDataAttribute}
      fallbackEditPath="image"
    />
    <section class="blog-detail-reading">
      <div class="article-body blog-body" data-sanity={postDataAttribute?.(articleFieldPath)}>
        <StructuredArticleBody
          body={data.post.body}
          article={data.post.article}
          previewDocumentId={data.post.studioDocumentId}
          previewFieldPath="article"
        />
      </div>
      <BlogArticleRail items={articleRailItems} {labels} {shareUrl} shareText={data.post.title} />
    </section>
    </article>
  </ManagedPageComposition>
</main>

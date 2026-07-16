<script lang="ts">
  import {page} from '$app/state'
  import {createDataAttribute} from '@sanity/visual-editing/create-data-attribute'
  import StoreMediaGallery from '$lib/components/StoreMediaGallery.svelte'
  import SeoHead from '$lib/components/SeoHead.svelte'
  import {collectionListHref} from '$lib/collection-page'
  import {youtubeEmbedUrl} from '$lib/media'
  import {absoluteUrl, breadcrumbListSchema, productSchema} from '$lib/seo'
  import {textAppearanceStyle} from '$lib/text-appearance'
  import {
    cleanProductMaterialCopy,
    productImageFallback,
    productImagesFor,
    productMediaFor,
    withLanguage,
  } from '$lib/site-content'

  const productResistancePattern =
    /\b(resiste|resistem|resistente|resistentes|resistant|withstands?|weatherproof|water-resistant|uv-resistant|rot-proof|maintenance-free|low maintenance|no maintenance|sem manutenção|manutenção|mantenimiento|sin mantenimiento|apodrec|pudr|rot|rots|pintura|painting|paint|água|agua|water|humidade|humedad|damp|chuva|lluvia|rain|sol|sun|uv|compressão|compression|duradour|duração|long-lasting|estável|stable)\b/i

  const splitSentences = (value: string) =>
    value
      .match(/[^.!?]+(?:[.!?]+|$)/g)
      ?.map((sentence) => sentence.trim())
      .filter(Boolean) ?? []

  const productDetailCopy = (summary: string, description: string) => {
    const source = cleanProductMaterialCopy(description || summary)
    const sentences = splitSentences(source)
    const introSentences: string[] = []
    const resistanceSentences: string[] = []

    sentences.forEach((sentence, index) => {
      if (index > 0 && productResistancePattern.test(sentence)) {
        resistanceSentences.push(sentence)
        return
      }

      introSentences.push(sentence)
    })

    return {
      intro: introSentences.join(' ') || source,
      resistance: resistanceSentences.join(' '),
    }
  }

  let {data} = $props()
  const content = $derived(data.site)
  const langQuery = $derived(`?lang=${data.language}`)
  const backHref = $derived(collectionListHref('/produtos', data.language, data.returnPage))
  const images = $derived(productImagesFor(data.product, productImageFallback))
  const media = $derived(productMediaFor(data.product, productImageFallback))
  const productDataAttribute = $derived(
    (data.preview || data.builderPreview) && data.studioUrl && data.product.studioDocumentId
      ? createDataAttribute({
          baseUrl: data.studioUrl,
          id: data.product.studioDocumentId,
          type: 'productCategory',
        })
      : null,
  )
  const imageDataAttribute = $derived(
    productDataAttribute ? (path: string) => productDataAttribute(path) : undefined,
  )
  const copy = $derived(productDetailCopy(data.product.summary, data.product.description))
  const copyFieldPath = $derived(data.product.description ? 'description.pt' : 'summary.pt')
  const videoEmbedUrl = $derived(youtubeEmbedUrl(data.product.videoUrl, {quality: 'highres'}))
  const hasProductSupport = $derived(Boolean(videoEmbedUrl || data.product.toolUrl))
  const toolButtonLabel = $derived(data.product.toolLabel || data.product.toolTitle || data.product.title)
  const productJsonLd = $derived([
    productSchema({
      name: data.product.title,
      description: copy.intro || data.product.summary,
      imageUrl: absoluteUrl(page.url.origin, images[0]?.url),
    }),
    breadcrumbListSchema([
      {name: content.nav.home, url: absoluteUrl(page.url.origin, withLanguage('/', data.language))!},
      {name: content.nav.products, url: absoluteUrl(page.url.origin, withLanguage('/produtos', data.language))!},
      {name: data.product.title, url: absoluteUrl(page.url.origin, withLanguage(page.url.pathname, data.language))!},
    ]),
  ])
</script>

<SeoHead
  title={data.product.title}
  description={copy.intro || data.product.summary}
  image={images[0]}
  jsonLd={productJsonLd}
/>

<main class="product-detail-page">
  <article class="detail-page product-detail product-editorial">
    <div class="product-editorial-head">
      <a class="detail-back-link" href={backHref}>
        <span aria-hidden="true">←</span>
        {content.common.backToProducts}
      </a>
      <p class="kicker">{content.nav.products}</p>
    </div>

    <section class="product-editorial-intro">
      <div class="product-editorial-title">
        <h1
          class="cms-styled-text"
          style={textAppearanceStyle(data.product.textAppearance?.title)}
          data-sanity={productDataAttribute?.('title.pt')}
        >{data.product.title}</h1>
      </div>
      <div class="product-editorial-copy">
        <p
          class="article-lead cms-styled-text"
          style={textAppearanceStyle(
            data.product.textAppearance?.[copyFieldPath.startsWith('description') ? 'description' : 'summary'],
          )}
          data-df4y-editor-field="true"
          data-df4y-editor-label="Descrição do produto"
          data-sanity={productDataAttribute?.(copyFieldPath)}
        >{copy.intro}</p>
        {#if copy.resistance}
          <p
            class="product-editorial-proof cms-styled-text"
            style={textAppearanceStyle(
              data.product.textAppearance?.[copyFieldPath.startsWith('description') ? 'description' : 'summary'],
            )}
            data-df4y-editor-field="true"
            data-df4y-editor-label="Descrição do produto"
            data-sanity={productDataAttribute?.(copyFieldPath)}
          >{copy.resistance}</p>
        {/if}
      </div>
    </section>

    {#snippet quoteButton()}
      <a class="button primary" href={`/contacto${langQuery}`}>{content.common.requestQuote}</a>
    {/snippet}

    <section class="product-editorial-stage">
      <StoreMediaGallery
        {media}
        label={content.common.zoomImage}
        closeLabel={content.common.close}
        className="product-stage-gallery"
        transitionName={`vt-${data.product.slug}`}
        dataAttribute={imageDataAttribute}
        fallbackEditPath="image"
      />
      {#if !hasProductSupport}
        <div class="product-stage-cta">
          {@render quoteButton()}
        </div>
      {/if}
    </section>

    {#if hasProductSupport}
      <section
        class="product-editorial-support"
        class:is-single={!(videoEmbedUrl && data.product.toolUrl)}
        aria-label={data.product.videoTitle || toolButtonLabel}
      >
        {#if videoEmbedUrl}
          <figure class="product-support-video">
            <div class="product-support-frame">
              <iframe
                src={videoEmbedUrl}
                title={data.product.videoTitle || data.product.title}
                loading="lazy"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowfullscreen
              ></iframe>
            </div>
            {#if data.product.videoTitle}
              <figcaption>{data.product.videoTitle}</figcaption>
            {/if}
          </figure>
        {/if}

        {#if data.product.toolUrl}
          <aside class="product-support-tool">
            <div class="product-support-tool-body">
              {#if data.product.toolTitle}
                <h2>{data.product.toolTitle}</h2>
              {/if}
              {#if data.product.toolText}
                <p>{data.product.toolText}</p>
              {/if}
            </div>
            <a
              class="product-support-tool-link"
              href={data.product.toolUrl}
              target="_blank"
              rel="noreferrer"
            >
              <span>{toolButtonLabel}</span>
              <span class="product-support-tool-arrow" aria-hidden="true">→</span>
            </a>
          </aside>
        {/if}
      </section>
    {/if}

    {#if hasProductSupport}
      <section class="product-editorial-cta">
        {@render quoteButton()}
      </section>
    {/if}
  </article>
</main>

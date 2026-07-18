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
    type LanguageCode,
  } from '$lib/site-content'

  const specsLabels: Record<
    LanguageCode,
    {dimensions: string; materials: string; specifications: string; advantages: string}
  > = {
    pt: {
      dimensions: 'Dimensões',
      materials: 'Materiais',
      specifications: 'Especificações',
      advantages: 'Vantagens',
    },
    en: {
      dimensions: 'Dimensions',
      materials: 'Materials',
      specifications: 'Specifications',
      advantages: 'Advantages',
    },
    es: {
      dimensions: 'Dimensiones',
      materials: 'Materiales',
      specifications: 'Especificaciones',
      advantages: 'Ventajas',
    },
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
  const summaryCopy = $derived(cleanProductMaterialCopy(data.product.summary))
  const descriptionCopy = $derived(cleanProductMaterialCopy(data.product.description))
  const leadCopy = $derived(summaryCopy || descriptionCopy)
  const leadFieldPath = $derived(summaryCopy ? 'summary.pt' : 'description.pt')
  const specsCopy = $derived(specsLabels[data.language] ?? specsLabels.pt)
  const specs = $derived(
    data.product.specs ?? {dimensions: [], materials: [], specifications: [], advantages: []},
  )
  const hasSpecs = $derived(
    Boolean(
      specs.dimensions.length ||
        specs.materials.length ||
        specs.specifications.length ||
        specs.advantages.length,
    ),
  )
  const videoEmbedUrl = $derived(youtubeEmbedUrl(data.product.videoUrl, {quality: 'highres'}))
  const hasProductSupport = $derived(Boolean(videoEmbedUrl || data.product.toolUrl))
  const toolButtonLabel = $derived(data.product.toolLabel || data.product.toolTitle || data.product.title)
  const productJsonLd = $derived([
    productSchema({
      name: data.product.title,
      description: leadCopy,
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
  description={leadCopy}
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
        {#if leadCopy}
          <p
            class="article-lead cms-styled-text"
            style={textAppearanceStyle(
              data.product.textAppearance?.[leadFieldPath.startsWith('summary') ? 'summary' : 'description'],
            )}
            data-df4y-editor-field="true"
            data-df4y-editor-label={summaryCopy ? 'Resumo do produto' : 'Descrição do produto'}
            data-sanity={productDataAttribute?.(leadFieldPath)}
          >{leadCopy}</p>
        {/if}
        {#if summaryCopy && descriptionCopy}
          <p
            class="product-editorial-proof cms-styled-text"
            style={textAppearanceStyle(data.product.textAppearance?.description)}
            data-df4y-editor-field="true"
            data-df4y-editor-label="Descrição do produto"
            data-sanity={productDataAttribute?.('description.pt')}
          >{descriptionCopy}</p>
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

    {#if hasSpecs}
      <section class="product-editorial-specs">
        {#if specs.dimensions.length}
          <div class="product-spec-block">
            <h2>{specsCopy.dimensions}</h2>
            <ul class="product-spec-tags">
              {#each specs.dimensions as item}
                <li>{item}</li>
              {/each}
            </ul>
          </div>
        {/if}
        {#if specs.materials.length}
          <div class="product-spec-block">
            <h2>{specsCopy.materials}</h2>
            <ul class="product-spec-list">
              {#each specs.materials as item}
                <li>{item}</li>
              {/each}
            </ul>
          </div>
        {/if}
        {#if specs.specifications.length}
          <div class="product-spec-block">
            <h2>{specsCopy.specifications}</h2>
            <ul class="product-spec-list">
              {#each specs.specifications as item}
                <li>{item}</li>
              {/each}
            </ul>
          </div>
        {/if}
        {#if specs.advantages.length}
          <div class="product-spec-block">
            <h2>{specsCopy.advantages}</h2>
            <ul class="product-spec-list">
              {#each specs.advantages as item}
                <li>{item}</li>
              {/each}
            </ul>
          </div>
        {/if}
      </section>
    {/if}

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

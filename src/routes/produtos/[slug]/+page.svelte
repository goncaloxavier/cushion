<script lang="ts">
  import ImageGallery from '$lib/components/ImageGallery.svelte'
  import SeoHead from '$lib/components/SeoHead.svelte'
  import {collectionListHref} from '$lib/collection-page'
  import {youtubeEmbedUrl} from '$lib/media'
  import {
    cleanProductMaterialCopy,
    productImageFallback,
    productImagesFor,
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
  const content = $derived(data.site[data.language])
  const langQuery = $derived(`?lang=${data.language}`)
  const backHref = $derived(collectionListHref('/produtos', data.language, data.returnPage))
  const images = $derived(productImagesFor(data.product, productImageFallback))
  const copy = $derived(productDetailCopy(data.product.summary, data.product.description))
  const videoEmbedUrl = $derived(youtubeEmbedUrl(data.product.videoUrl, {quality: 'highres'}))
  const hasProductSupport = $derived(Boolean(videoEmbedUrl || data.product.toolUrl))
  const toolButtonLabel = $derived(data.product.toolLabel || data.product.toolTitle || data.product.title)
</script>

<SeoHead title={data.product.title} description={copy.intro || data.product.summary} image={images[0]} />

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
        <h1>{data.product.title}</h1>
      </div>
      <div class="product-editorial-copy">
        <p class="article-lead">{copy.intro}</p>
        {#if copy.resistance}
          <p class="product-editorial-proof">{copy.resistance}</p>
        {/if}
      </div>
    </section>

    <section class="product-editorial-stage">
      <ImageGallery
        {images}
        label={content.common.zoomImage}
        closeLabel={content.common.close}
        className="product-stage-gallery"
        transitionName={`vt-${data.product.slug}`}
      />
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

    <section class="product-editorial-cta">
      <a class="button primary" href={`/contacto${langQuery}`}>{content.common.requestQuote}</a>
      <a class="text-link" href={`/catalogo${langQuery}`}>{content.catalogue.estimate.kicker}</a>
    </section>
  </article>
</main>

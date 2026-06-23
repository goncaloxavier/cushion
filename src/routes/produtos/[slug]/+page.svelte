<script lang="ts">
  import ImageGallery from '$lib/components/ImageGallery.svelte'
  import {collectionListHref} from '$lib/collection-page'
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
</script>

<svelte:head>
  <title>{data.product.title} | DaFábrica4You</title>
</svelte:head>

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

    {#if data.product.features.length || data.product.applications.length}
      <section class="product-editorial-specs">
        {#if data.product.features.length}
          <div class="product-spec-block">
            <h2>{content.common.featuresLabel}</h2>
            <ul class="product-spec-tags">
              {#each data.product.features as feature}
                <li>{feature}</li>
              {/each}
            </ul>
          </div>
        {/if}
        {#if data.product.applications.length}
          <div class="product-spec-block">
            <h2>{content.common.applicationsLabel}</h2>
            <ul class="product-spec-list">
              {#each data.product.applications as application}
                <li>{application}</li>
              {/each}
            </ul>
          </div>
        {/if}
      </section>
    {/if}

    <section class="product-editorial-cta">
      <a class="button primary" href={`/contacto${langQuery}`}>{content.common.requestQuote}</a>
      <a class="text-link" href={`/catalogo${langQuery}`}>{content.catalogue.estimate.kicker}</a>
    </section>
  </article>
</main>

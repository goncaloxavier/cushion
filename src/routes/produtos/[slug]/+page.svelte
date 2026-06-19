<script lang="ts">
  import ImageGallery from '$lib/components/ImageGallery.svelte'
  import {productImageFallback, productImagesFor} from '$lib/site-content'

  let {data} = $props()
  const content = $derived(data.site[data.language])
  const langQuery = $derived(`?lang=${data.language}`)
  const images = $derived(productImagesFor(data.product, productImageFallback))
</script>

<svelte:head>
  <title>{data.product.title} | DaFábrica4You</title>
</svelte:head>

<main>
  <article class="detail-page product-detail">
    <section class="detail-hero product-detail-hero">
      <div class="detail-hero-copy">
        <a class="detail-back-link" href={`/produtos${langQuery}`}>
          <span aria-hidden="true">←</span>
          {content.common.backToProducts}
        </a>
        <p class="kicker">{content.nav.products}</p>
        <h1>{data.product.title}</h1>
        <p class="article-lead">{data.product.description}</p>
      </div>
      <ImageGallery {images} label={content.common.zoomImage} closeLabel={content.common.close} />
    </section>

    <section class="detail-body product-detail-body">
      <div class="detail-sticky">
        <h2>{content.common.featuresLabel}</h2>
        <div class="tag-row">
          {#each data.product.features as feature}
            <small>{feature}</small>
          {/each}
        </div>
        <a class="button primary" href={`/contacto${langQuery}`}>{content.common.requestQuote}</a>
        <a class="text-link quote-process-link" href={`/catalogo${langQuery}`}>{content.catalogue.estimate.kicker}</a>
      </div>

      <div class="detail-panel">
        <h2>{content.common.applicationsLabel}</h2>
        <ul class="detail-list">
          {#each data.product.applications as application}
            <li>{application}</li>
          {/each}
        </ul>
      </div>
    </section>
  </article>

</main>

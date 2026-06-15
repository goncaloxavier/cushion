<script lang="ts">
  import {productImageFallback, productImagesFor} from '$lib/site-content'

  let {data} = $props()
  const content = $derived(data.site[data.language])
  const langQuery = $derived(`?lang=${data.language}`)
  let selectedImageIndex = $state(0)
  let zoomOpen = $state(false)
  const images = $derived(productImagesFor(data.product, productImageFallback))
  const image = $derived(images[selectedImageIndex] ?? images[0])
</script>

<svelte:head>
  <title>{data.product.title} | DaFábrica4You</title>
</svelte:head>

<svelte:window
  onkeydown={(event) => {
    if (zoomOpen && event.key === 'Escape') zoomOpen = false
  }}
/>

<main>
  <article class="detail-page product-detail">
    <section class="detail-hero product-detail-hero">
      <div class="detail-hero-copy">
        <p class="kicker">{content.nav.products}</p>
        <h1>{data.product.title}</h1>
        <p class="article-lead">{data.product.description}</p>
      </div>
      <div class="product-gallery">
        <button
          class="detail-hero-media product-gallery-main"
          type="button"
          aria-label={content.common.zoomImage}
          onclick={() => {
            zoomOpen = true
          }}
        >
          <img src={image.url} alt={image.alt} decoding="async" fetchpriority="high" />
          <span>{content.common.zoomImage}</span>
        </button>

        {#if images.length > 1}
          <div class="product-thumbnails" aria-label={content.common.zoomImage}>
            {#each images as galleryImage, index}
              <button
                type="button"
                class:active={selectedImageIndex === index}
                aria-label={`${content.common.zoomImage} ${index + 1}`}
                onclick={() => {
                  selectedImageIndex = index
                }}
              >
                <img src={galleryImage.url} alt={galleryImage.alt} loading="lazy" decoding="async" />
              </button>
            {/each}
          </div>
        {/if}
      </div>
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

  {#if zoomOpen}
    <div
      class="image-lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={content.common.zoomImage}
      tabindex="-1"
      onclick={(event) => {
        if (event.currentTarget === event.target) zoomOpen = false
      }}
      onkeydown={(event) => {
        if (event.key === 'Escape') zoomOpen = false
      }}
    >
      <button
        class="lightbox-close"
        type="button"
        aria-label={content.common.close}
        onclick={() => {
          zoomOpen = false
        }}
      >
        {content.common.close}
      </button>
      <img src={image.url} alt={image.alt} decoding="async" />
    </div>
  {/if}
</main>

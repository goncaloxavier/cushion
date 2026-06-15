<script lang="ts">
  import {caseStudyImageFallback, caseStudyImagesFor} from '$lib/site-content'

  let {data} = $props()
  const content = $derived(data.site[data.language])
  let selectedImageIndex = $state(0)
  let zoomOpen = $state(false)
  const images = $derived(caseStudyImagesFor(data.caseStudy, caseStudyImageFallback))
  const image = $derived(images[selectedImageIndex] ?? images[0])
</script>

<svelte:head>
  <title>{data.caseStudy.title} | DaFábrica4You</title>
</svelte:head>

<svelte:window
  onkeydown={(event) => {
    if (zoomOpen && event.key === 'Escape') zoomOpen = false
  }}
/>

<main>
  <article class="detail-page case-detail">
    <section class="case-detail-hero">
      <div class="case-detail-overlay">
        <p class="kicker">{data.caseStudy.location}</p>
        <h1>{data.caseStudy.title}</h1>
        <p class="article-lead">{data.caseStudy.summary}</p>
      </div>
      <div class="product-gallery case-gallery">
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

    <section class="case-detail-list">
      <article>
        <span>{content.common.challenge}</span>
        <p>{data.caseStudy.challenge}</p>
      </article>
      <article>
        <span>{content.common.solution}</span>
        <p>{data.caseStudy.solution}</p>
      </article>
      <article>
        <span>{content.common.result}</span>
        <p>{data.caseStudy.result}</p>
      </article>
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

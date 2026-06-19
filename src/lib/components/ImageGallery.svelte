<script lang="ts">
  import type {ContentImage} from '$lib/site-content'
  import {tick} from 'svelte'

  let {
    images,
    label,
    closeLabel,
    className = '',
  } = $props<{
    images: ContentImage[]
    label: string
    closeLabel: string
    className?: string
  }>()

  let selectedImageIndex = $state(0)
  let zoomOpen = $state(false)
  let lightbox = $state<HTMLDivElement | null>(null)
  const image = $derived(images[selectedImageIndex] ?? images[0])
  const hasMultiple = $derived(images.length > 1)
  const position = $derived(`${selectedImageIndex + 1} / ${images.length}`)

  const selectImage = (index: number) => {
    selectedImageIndex = Math.min(images.length - 1, Math.max(0, index))
  }

  const moveImage = (direction: -1 | 1) => {
    if (!images.length) return
    selectedImageIndex = (selectedImageIndex + direction + images.length) % images.length
  }

  const openLightbox = () => {
    zoomOpen = true
  }

  const closeLightbox = () => {
    zoomOpen = false
  }

  $effect(() => {
    if (images.length && selectedImageIndex >= images.length) selectedImageIndex = 0
  })

  $effect(() => {
    if (!zoomOpen) return

    document.documentElement.classList.add('lightbox-open')
    document.body.classList.add('lightbox-open')
    tick().then(() => lightbox?.focus())

    return () => {
      document.documentElement.classList.remove('lightbox-open')
      document.body.classList.remove('lightbox-open')
    }
  })
</script>

{#if image}
  <div class={`product-gallery image-gallery ${className}`}>
    <button
      class="detail-hero-media product-gallery-main image-gallery-main"
      type="button"
      aria-label={label}
      onclick={openLightbox}
    >
      <img src={image.url} alt={image.alt} decoding="async" fetchpriority="high" />
      <span class="image-gallery-zoom">{label}</span>
      {#if hasMultiple}
        <span class="image-gallery-count">{position}</span>
      {/if}
    </button>

    {#if hasMultiple}
      <div class="product-thumbnails image-gallery-thumbnails" aria-label={label}>
        {#each images as galleryImage, index}
          <button
            type="button"
            class:active={selectedImageIndex === index}
            aria-label={`${label} ${index + 1}`}
            onclick={() => {
              selectImage(index)
            }}
          >
            <img src={galleryImage.url} alt={galleryImage.alt} loading="lazy" decoding="async" />
          </button>
        {/each}
      </div>
    {/if}
  </div>
{/if}

{#if zoomOpen && image}
  <div
    class="image-lightbox"
    role="dialog"
    aria-modal="true"
    aria-label={label}
    tabindex="-1"
    bind:this={lightbox}
    onclick={(event) => {
      if (event.currentTarget === event.target) closeLightbox()
    }}
    onkeydown={(event) => {
      if (event.key === 'Escape') closeLightbox()
      if (event.key === 'ArrowLeft') moveImage(-1)
      if (event.key === 'ArrowRight') moveImage(1)
    }}
  >
    <button class="lightbox-close" type="button" aria-label={closeLabel} onclick={closeLightbox}>
      {closeLabel}
    </button>

    {#if hasMultiple}
      <button
        class="lightbox-nav lightbox-prev"
        type="button"
        aria-label={`${label} ${selectedImageIndex === 0 ? images.length : selectedImageIndex}`}
        onclick={() => {
          moveImage(-1)
        }}
      >
        ←
      </button>
      <button
        class="lightbox-nav lightbox-next"
        type="button"
        aria-label={`${label} ${(selectedImageIndex + 2 - 1) % images.length + 1}`}
        onclick={() => {
          moveImage(1)
        }}
      >
        →
      </button>
    {/if}

    <figure class="lightbox-frame">
      <img src={image.url} alt={image.alt} decoding="async" />
      {#if hasMultiple}
        <figcaption>{position}</figcaption>
      {/if}
    </figure>
  </div>
{/if}

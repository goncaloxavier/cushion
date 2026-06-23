<script lang="ts">
  import type {ContentImage} from '$lib/site-content'
  import {imageSrcset, sizedImage} from '$lib/image'
  import {tick} from 'svelte'

  const lqipBackground = (img: ContentImage) =>
    img.lqip ? `center / cover no-repeat url(${img.lqip})` : undefined

  // Full-size lightbox width (warmed by scripts/warm-images.ts, so never cold).
  const lightboxWidth = 1600
  const preloadFull = (img: ContentImage | undefined) => {
    if (typeof Image === 'undefined' || !img?.url) return
    const preloader = new Image()
    preloader.src = sizedImage(img.url, lightboxWidth)
  }

  let {
    images,
    label,
    closeLabel,
    className = '',
    transitionName = undefined,
  } = $props<{
    images: ContentImage[]
    label: string
    closeLabel: string
    className?: string
    transitionName?: string
  }>()

  let selectedImageIndex = $state(0)
  let zoomOpen = $state(false)
  let lightbox = $state<HTMLDivElement | null>(null)

  // Render the lightbox as a direct child of <body> so it escapes the routed
  // page's clip-path stacking context (otherwise the sticky header paints over
  // it on the product/case detail pages, breaking the blurred full-screen focus).
  const portal = (node: HTMLElement) => {
    document.body.appendChild(node)
    return {
      destroy() {
        node.remove()
      },
    }
  }
  const image = $derived(images[selectedImageIndex] ?? images[0])
  const hasMultiple = $derived(images.length > 1)
  const position = $derived(`${selectedImageIndex + 1} / ${images.length}`)
  const previousImageIndex = $derived(
    images.length ? (selectedImageIndex - 1 + images.length) % images.length : 0,
  )
  const nextImageIndex = $derived(images.length ? (selectedImageIndex + 1) % images.length : 0)
  const imageStyle = $derived(
    image?.aspectRatio && Number.isFinite(image.aspectRatio)
      ? `--image-aspect: ${image.aspectRatio}`
      : undefined,
  )

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

  // While the lightbox is open, preload the neighbouring full-size images so
  // arrowing through the gallery is instant instead of fetching on each step.
  $effect(() => {
    if (!zoomOpen) return
    preloadFull(images[nextImageIndex])
    preloadFull(images[previousImageIndex])
  })
</script>

{#if image}
  <div class={`product-gallery image-gallery ${className}`}>
    <button
      class="detail-hero-media product-gallery-main image-gallery-main"
      type="button"
      aria-label={label}
      style={imageStyle}
      onmouseenter={() => preloadFull(image)}
      onfocus={() => preloadFull(image)}
      onclick={openLightbox}
    >
      <img
        src={sizedImage(image.url, 1100)}
        srcset={imageSrcset(image.url, [600, 900, 1200, 1600])}
        sizes="(max-width: 900px) 92vw, 620px"
        alt={image.alt}
        decoding="async"
        fetchpriority="high"
        style:background={lqipBackground(image)}
        style:view-transition-name={transitionName}
      />
      <span class="image-gallery-zoom" aria-hidden="true"></span>
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
            <img
              src={sizedImage(galleryImage.url, 220)}
              srcset={imageSrcset(galleryImage.url, [120, 180, 240, 320])}
              sizes="6rem"
              alt={galleryImage.alt}
              loading="lazy"
              decoding="async"
              style:background={lqipBackground(galleryImage)}
            />
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
    use:portal
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
    <figure class="lightbox-frame">
      <img
        src={sizedImage(image.url, lightboxWidth)}
        srcset={imageSrcset(image.url, [800, 1200, 1600])}
        sizes="94vw"
        alt={image.alt}
        decoding="async"
        style:background={lqipBackground(image)}
      />
      {#if hasMultiple}
        <figcaption class="lightbox-counter">{position}</figcaption>
      {/if}
    </figure>

    {#if hasMultiple}
      <button
        class="lightbox-nav lightbox-prev"
        type="button"
        aria-label={`${label} ${previousImageIndex + 1}`}
        onclick={() => {
          moveImage(-1)
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>
      <button
        class="lightbox-nav lightbox-next"
        type="button"
        aria-label={`${label} ${nextImageIndex + 1}`}
        onclick={() => {
          moveImage(1)
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </button>
    {/if}

    <button class="lightbox-close" type="button" aria-label={closeLabel} onclick={closeLightbox}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
        <path d="M18 6 6 18M6 6l12 12" />
      </svg>
    </button>
  </div>
{/if}

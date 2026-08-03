<script lang="ts">
  import type {ContentImage, StoreProductMedia} from '$lib/site-content'
  import {portal} from '$lib/actions/portal'
  import {trapFocus} from '$lib/actions/trap-focus'
  import {imageSrcset, sizedImage} from '$lib/image'
  import {prefersReducedMotion} from '$lib/motion'
  import {tick} from 'svelte'

  type ImageMedia = Extract<StoreProductMedia, {type: 'image'}>

  const lqipBackground = (img: ContentImage | undefined) =>
    img?.lqip ? `center / cover no-repeat url(${img.lqip})` : undefined

  const lightboxWidth = 1600
  const isImageMedia = (item: StoreProductMedia | undefined): item is ImageMedia =>
    item?.type === 'image'

  const imageForThumb = (item: StoreProductMedia) => (item.type === 'image' ? item : item.poster)

  const preloadFull = (item: StoreProductMedia | undefined) => {
    if (typeof Image === 'undefined' || !isImageMedia(item) || !item.url) return
    const preloader = new Image()
    preloader.src = sizedImage(item.url, lightboxWidth)
  }

  // Selected videos preview inline: muted + looping autoplay, quietly skipped
  // for reduced-motion users (they get the poster frame and expand for sound).
  const autoplayInline = (node: HTMLVideoElement) => {
    node.muted = true
    if (prefersReducedMotion()) return
    const play = () => node.play().catch(() => {})
    play()
    node.addEventListener('canplay', play, {once: true})
    return {
      destroy() {
        node.removeEventListener('canplay', play)
      },
    }
  }

  let {
    media,
    label,
    closeLabel,
    className = '',
    transitionName = undefined,
    sizes = '(max-width: 900px) 92vw, (max-width: 1400px) calc(100vw - 2.5rem), 1210px',
    dataAttribute = undefined,
    fallbackEditPath = 'image',
  } = $props<{
    media: StoreProductMedia[]
    label: string
    closeLabel: string
    className?: string
    transitionName?: string
    sizes?: string
    dataAttribute?: (path: string) => string | undefined
    fallbackEditPath?: string
  }>()

  // Each media item carries its own Sanity field path so click-to-edit maps to
  // the exact image / gallery item, regardless of order or a missing main image.
  const attrFor = (entry: StoreProductMedia | undefined) =>
    dataAttribute ? dataAttribute(entry?.editPath || fallbackEditPath) : undefined

  let selectedIndex = $state(0)
  let zoomOpen = $state(false)
  let lightbox = $state<HTMLDivElement | null>(null)
  let previouslyFocused: HTMLElement | null = null

  const item = $derived(media[selectedIndex] ?? media[0])
  const hasMultiple = $derived(media.length > 1)
  const position = $derived(`${selectedIndex + 1} / ${media.length}`)
  const previousIndex = $derived(media.length ? (selectedIndex - 1 + media.length) % media.length : 0)
  const nextIndex = $derived(media.length ? (selectedIndex + 1) % media.length : 0)
  const visualImage = $derived(item?.type === 'image' ? item : item?.poster)
  const activeDataAttribute = $derived(attrFor(item))
  const mediaStyle = $derived(
    visualImage?.aspectRatio && Number.isFinite(visualImage.aspectRatio)
      ? `--image-aspect: ${visualImage.aspectRatio}`
      : undefined,
  )
  const itemLabel = $derived(item?.type === 'image' ? label : item?.title || label)
  const altFor = (candidate: ContentImage) => candidate.alt?.trim() || label

  const selectItem = (index: number) => {
    selectedIndex = Math.min(media.length - 1, Math.max(0, index))
  }

  const moveItem = (direction: -1 | 1) => {
    if (!media.length) return
    selectedIndex = (selectedIndex + direction + media.length) % media.length
  }

  const openLightbox = () => {
    zoomOpen = true
  }

  const closeLightbox = () => {
    zoomOpen = false
  }

  $effect(() => {
    if (media.length && selectedIndex >= media.length) selectedIndex = 0
  })

  $effect(() => {
    if (!zoomOpen) return

    previouslyFocused = document.activeElement as HTMLElement | null
    document.documentElement.classList.add('lightbox-open')
    document.body.classList.add('lightbox-open')
    tick().then(() => lightbox?.focus())

    return () => {
      document.documentElement.classList.remove('lightbox-open')
      document.body.classList.remove('lightbox-open')
      previouslyFocused?.focus()
    }
  })

  $effect(() => {
    if (!zoomOpen) return
    preloadFull(media[nextIndex])
    preloadFull(media[previousIndex])
  })
</script>

{#if item}
  <div class={`product-gallery image-gallery product-media-gallery ${className}`}>
    <button
      class="detail-hero-media product-gallery-main image-gallery-main"
      class:is-video={item.type !== 'image'}
      type="button"
      aria-label={itemLabel}
      style={mediaStyle}
      onmouseenter={() => preloadFull(item)}
      onfocus={() => preloadFull(item)}
      onclick={openLightbox}
      data-sanity={activeDataAttribute}
      data-df4y-editor-kind={item.type}
    >
      {#if item.type === 'image'}
        <img
          src={sizedImage(item.url, 1600, 76)}
          srcset={imageSrcset(item.url, [640, 900, 1200, 1600, 2000], 76)}
          {sizes}
          alt={altFor(item)}
          decoding="async"
          fetchpriority="high"
          style:background={lqipBackground(item)}
          style:view-transition-name={transitionName}
        />
      {:else if item.type === 'video'}
        <video
          class="media-gallery-video"
          src={item.url}
          poster={item.poster?.url ? sizedImage(item.poster.url, 1200, 76) : undefined}
          autoplay
          muted
          loop
          playsinline
          preload="metadata"
          aria-label={item.title}
          style:background={lqipBackground(item.poster)}
          use:autoplayInline
        >
          {#if item.captionsUrl}
            <track kind="captions" src={item.captionsUrl} srclang="pt" label="Português" default />
          {/if}
        </video>
        <span class="media-gallery-badge" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 5 6 9H3v6h3l5 4V5Z" />
            <path d="m16.5 9.5 4 5M20.5 9.5l-4 5" />
          </svg>
        </span>
      {:else}
        {#if item.poster}
          <img
            class="media-gallery-embed-poster"
            src={sizedImage(item.poster.url, 1600, 76)}
            srcset={imageSrcset(item.poster.url, [640, 900, 1200, 1600], 76)}
            {sizes}
            alt={altFor(item.poster)}
            decoding="async"
            style:background={lqipBackground(item.poster)}
          />
        {:else}
          <span class="media-gallery-embed-placeholder" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        {/if}
        <span class="media-gallery-badge is-play" aria-hidden="true"></span>
      {/if}
      <span class="image-gallery-zoom" aria-hidden="true"></span>
      {#if hasMultiple}
        <span class="image-gallery-count">{position}</span>
      {/if}
    </button>

    {#if item.caption}
      <p class="image-gallery-caption" aria-live="polite">{item.caption}</p>
    {/if}

    {#if hasMultiple}
      <div class="product-thumbnails image-gallery-thumbnails" aria-label={label}>
        {#each media as mediaItem, index}
          {@const thumb = imageForThumb(mediaItem)}
          {@const thumbAttr = attrFor(mediaItem)}
          <button
            type="button"
            class:active={selectedIndex === index}
            class:is-video={mediaItem.type !== 'image'}
            aria-label={`${mediaItem.type === 'image' ? label : mediaItem.title || label} ${index + 1}`}
            data-sanity={thumbAttr}
            data-df4y-editor-kind={mediaItem.type}
            onclick={() => {
              selectItem(index)
            }}
          >
            {#if thumb}
              <img
                src={sizedImage(thumb.url, 220)}
                srcset={imageSrcset(thumb.url, [120, 180, 240, 320])}
                sizes="6rem"
                alt={altFor(thumb)}
                loading="lazy"
                decoding="async"
                style:background={lqipBackground(thumb)}
              />
            {:else}
              <span class="media-gallery-video-thumb">
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            {/if}
            {#if mediaItem.type !== 'image'}
              <span class="media-gallery-thumb-play" aria-hidden="true"></span>
            {/if}
          </button>
        {/each}
      </div>
    {/if}
  </div>
{/if}

{#if zoomOpen && item}
  <div
    class="image-lightbox"
    role="dialog"
    aria-modal="true"
    aria-label={itemLabel}
    tabindex="-1"
    use:portal
    use:trapFocus
    bind:this={lightbox}
    onclick={(event) => {
      if (event.currentTarget === event.target) closeLightbox()
    }}
    onkeydown={(event) => {
      if (event.key === 'Escape') closeLightbox()
      if (event.key === 'ArrowLeft') moveItem(-1)
      if (event.key === 'ArrowRight') moveItem(1)
    }}
  >
    <figure class="lightbox-frame" class:is-video={item.type !== 'image'}>
      {#if item.type === 'image'}
        <img
          src={sizedImage(item.url, lightboxWidth)}
          srcset={imageSrcset(item.url, [800, 1200, 1600])}
          sizes="94vw"
          alt={altFor(item)}
          decoding="async"
          style:background={lqipBackground(item)}
        />
      {:else if item.type === 'video'}
        <video
          class="lightbox-video"
          controls
          playsinline
          preload="metadata"
          poster={item.poster?.url ? sizedImage(item.poster.url, 1600, 76) : undefined}
        >
          <source src={item.url} type={item.mimeType || 'video/mp4'} />
          {#if item.captionsUrl}
            <track kind="captions" src={item.captionsUrl} srclang="pt" label="Português" default />
          {/if}
        </video>
      {:else}
        <iframe
          class="lightbox-video lightbox-embed"
          src={item.url}
          title={item.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      {/if}
      {#if hasMultiple}
        <figcaption class="lightbox-counter">{position}</figcaption>
      {/if}
    </figure>

    {#if hasMultiple}
      <button
        class="lightbox-nav lightbox-prev"
        type="button"
        aria-label={`${label} ${previousIndex + 1}`}
        onclick={() => {
          moveItem(-1)
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>
      <button
        class="lightbox-nav lightbox-next"
        type="button"
        aria-label={`${label} ${nextIndex + 1}`}
        onclick={() => {
          moveItem(1)
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

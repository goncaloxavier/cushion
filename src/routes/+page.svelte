<script lang="ts">
  import {page} from '$app/state'
  import {lineReveal} from '$lib/actions/line-reveal'
  import ManagedPageComposition from '$lib/components/builder/ManagedPageComposition.svelte'
  import Reveal from '$lib/components/Reveal.svelte'
  import SeoHead from '$lib/components/SeoHead.svelte'
  import {youtubeEmbedUrl} from '$lib/media'
  import {prefersReducedMotion} from '$lib/motion'
  import {textAppearanceStyle} from '$lib/text-appearance'
  import {absoluteUrl, organizationSchema} from '$lib/seo'
  import {buildLocalizedHomeSections} from '$lib/builder/home-sections'
  import {managedCoreSectionForRoot} from '$lib/builder/managed-page-sections'
  import {onMount} from 'svelte'

  let {data} = $props()
  // Structured data carries absolute URLs too, so it needs the same fixed origin
  // the canonical tag uses — otherwise a preview host publishes a breadcrumb
  // trail pointing at itself.
  const seoOrigin = $derived(
    (page.data?.canonicalOrigin as string | null | undefined) || page.url.origin,
  )
  const content = $derived(data.site)
  const pageCore = managedCoreSectionForRoot('home')!

  const organizationJsonLd = $derived(
    organizationSchema({
      origin: seoOrigin,
      logoUrl: absoluteUrl(seoOrigin, '/logo/brand_mark.png'),
      email: content.common.contactEmail,
      phone: content.common.contactPhone,
      sameAs: [
        content.common.instagramUrl,
        content.common.facebookUrl,
        content.common.youtubeUrl,
      ],
    }),
  )

  const heroVideoKind = $derived(content.home.heroVideo.kind)
  const heroVideoUrl = $derived(content.home.heroVideo.url)
  const heroBackgroundVideoEmbed = $derived(
    heroVideoKind === 'youtube'
      ? youtubeEmbedUrl(heroVideoUrl, {
          autoplay: true,
          controls: false,
          loop: true,
          muted: true,
          playsInline: true,
        })
      : undefined,
  )
  const heroWatchVideoEmbed = $derived(
    heroVideoKind === 'youtube'
      ? youtubeEmbedUrl(heroVideoUrl, {autoplay: true, playsInline: true})
      : undefined,
  )
  const heroBackgroundVideoFile = $derived(
    heroVideoKind === 'upload' && heroVideoUrl ? heroVideoUrl : undefined,
  )
  const hasHeroVideo = $derived(Boolean(heroBackgroundVideoEmbed || heroBackgroundVideoFile))
  const hasHeroWatchVideo = $derived(Boolean(heroWatchVideoEmbed || heroBackgroundVideoFile))
  let heroVideoOpen = $state(false)
  let heroDialog = $state<HTMLDivElement | null>(null)
  // The background embed isn't needed for first paint, so keep it out of the
  // critical path: mount it once the browser is idle rather than eagerly on
  // every load, and skip it entirely for reduced-motion users (an autoplaying
  // background video is exactly the kind of motion they've opted out of).
  let heroBackgroundReady = $state(false)
  const previewMode = $derived(Boolean(data.preview || data.builderPreview))
  const homeSections = $derived(
    content.home.sections.length
      ? content.home.sections
      : buildLocalizedHomeSections(content),
  )

  const closeHeroVideo = () => {
    heroVideoOpen = false
  }

  onMount(() => {
    if (prefersReducedMotion()) return

    const ric = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 200))
    const cic = window.cancelIdleCallback ?? window.clearTimeout
    const handle = ric(() => {
      heroBackgroundReady = true
    })
    return () => cic(handle)
  })

  // Reset the player when language changes so a stale embed never lingers.
  $effect(() => {
    void data.language
    heroVideoOpen = false
  })

  $effect(() => {
    if (!heroVideoOpen || typeof document === 'undefined') return

    document.documentElement.classList.add('lightbox-open')
    document.body.classList.add('lightbox-open')

    const focusTimer = window.setTimeout(() => heroDialog?.focus(), 0)
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeHeroVideo()
    }

    document.addEventListener('keydown', handleKeydown)

    return () => {
      window.clearTimeout(focusTimer)
      document.removeEventListener('keydown', handleKeydown)
      document.documentElement.classList.remove('lightbox-open')
      document.body.classList.remove('lightbox-open')
    }
  })
</script>

<SeoHead
  title="DaFábrica4You | Plástico reciclado para exterior"
  description={content.home.hero.lead || content.home.intro.lead}
  image={content.home.heroImage}
  jsonLd={organizationJsonLd}
/>

<main class="home-page">
  <ManagedPageComposition
    sections={homeSections}
    core={pageCore}
    settings={data.settings}
    {content}
    language={data.language}
    dataset={data.sanityDataset}
    preview={previewMode}
    editorSource={{
      baseUrl: data.studioUrl,
      id: 'siteContent',
      type: 'siteLanding',
      rootPath: 'home',
    }}
  >
    <section class="home-hero">
    <div class="home-hero-bg" aria-hidden="true">
      {#if hasHeroVideo && heroBackgroundReady}
        {#if heroBackgroundVideoFile}
          <video
            class="home-hero-video home-hero-video-bg"
            src={heroBackgroundVideoFile}
            tabindex="-1"
            autoplay
            muted
            loop
            playsinline
          ></video>
        {:else if heroBackgroundVideoEmbed}
          <iframe
            class="home-hero-video home-hero-video-bg"
            title=""
            src={heroBackgroundVideoEmbed}
            tabindex="-1"
            allow="autoplay; encrypted-media; picture-in-picture; web-share"
          ></iframe>
        {/if}
      {/if}
    </div>

    <div class="home-hero-copy">
      <Reveal variant="hero" priority>
        <h1
          class="cms-styled-text"
          style={textAppearanceStyle(content.home.hero.textAppearance?.title)}
          use:lineReveal
        >{content.home.hero.title}</h1>
      </Reveal>
    </div>

    {#if hasHeroWatchVideo}
      <button
        type="button"
        class="home-hero-play"
        onclick={() => (heroVideoOpen = true)}
        aria-label={content.home.heroVideoLabel}
      >
        <span class="home-hero-play-icon" aria-hidden="true"></span>
        <span class="home-hero-play-text">{content.home.heroVideoLabel}</span>
      </button>
    {/if}
    </section>

    {#if heroVideoOpen && hasHeroWatchVideo}
      <div
        class="video-lightbox"
        role="dialog"
        aria-modal="true"
        aria-label={content.home.heroVideoLabel}
        tabindex="-1"
        bind:this={heroDialog}
      >
      <button
        class="video-lightbox-backdrop"
        type="button"
        aria-label={content.home.heroVideoCloseLabel}
        onclick={closeHeroVideo}
      ></button>
      <button
        class="lightbox-close video-lightbox-close"
        type="button"
        aria-label={content.home.heroVideoCloseLabel}
        onclick={closeHeroVideo}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
      <div class="video-lightbox-frame">
        {#if heroBackgroundVideoFile}
          <!-- svelte-ignore a11y_media_has_caption (the optional CMS caption track is rendered below when supplied) -->
          <video
            title={content.home.heroVideoLabel}
            src={heroBackgroundVideoFile}
            autoplay
            controls
            playsinline
          >
            {#if content.home.heroVideo.captionsUrl}
              <track
                kind="captions"
                src={content.home.heroVideo.captionsUrl}
                srclang="pt"
                label="Português"
                default
              />
            {/if}
          </video>
        {:else if heroWatchVideoEmbed}
          <iframe
            title={content.home.heroVideoLabel}
            src={heroWatchVideoEmbed}
            allow="autoplay; encrypted-media; picture-in-picture; web-share"
            allowfullscreen
          ></iframe>
        {/if}
      </div>
      </div>
    {/if}
  </ManagedPageComposition>
</main>

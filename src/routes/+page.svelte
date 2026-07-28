<script lang="ts">
  import {page} from '$app/state'
  import {lineReveal} from '$lib/actions/line-reveal'
  import BuilderPageRenderer from '$lib/components/builder/BuilderPageRenderer.svelte'
  import CollectionCard from '$lib/components/CollectionCard.svelte'
  import Reveal from '$lib/components/Reveal.svelte'
  import SeoHead from '$lib/components/SeoHead.svelte'
  import {imageSrcset, sizedImage} from '$lib/image'
  import {youtubeEmbedUrl} from '$lib/media'
  import {prefersReducedMotion} from '$lib/motion'
  import {textAppearanceStyle} from '$lib/text-appearance'
  import {absoluteUrl, organizationSchema} from '$lib/seo'
  import {
    caseStudyImageFallback,
    imageFor,
    productImageFallback,
    type LanguageCode,
  } from '$lib/site-content'
  import {onMount} from 'svelte'

  let {data} = $props()
  const content = $derived(data.site)
  const langQuery = $derived(`?lang=${data.language}`)

  const organizationJsonLd = $derived(
    organizationSchema({
      origin: page.url.origin,
      logoUrl: absoluteUrl(page.url.origin, '/logo/brand_mark.png'),
      email: content.common.contactEmail,
      phone: content.common.contactPhone,
      sameAs: [
        content.common.instagramUrl,
        content.common.facebookUrl,
        content.common.youtubeUrl,
      ],
    }),
  )

  const featuredSolutions = $derived(content.products.slice(0, 4))
  const viewAllLabel: Record<LanguageCode, string> = {
    pt: 'Ver todos os produtos',
    en: 'View all products',
    es: 'Ver todos los productos',
  }
  const selectedWorkLabel: Record<LanguageCode, string> = {
    pt: 'Casos em uso real',
    en: 'In the field',
    es: 'Casos reales',
  }
  const viewAllWorkLabel: Record<LanguageCode, string> = {
    pt: 'Ver todos os casos',
    en: 'View all case studies',
    es: 'Ver todos los casos',
  }
  const featuredWork = $derived(content.caseStudies.slice(0, 3))

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

  <!-- Everything below the hero is section-driven. The hero itself stays
       pinned: its video facade and line-reveal are not reproducible by the
       generic renderer, and a hero does not need to move below the products. -->
  {#if content.home.sections.length}
    <BuilderPageRenderer
      page={{sections: content.home.sections}}
      settings={data.settings}
      {content}
      language={data.language}
      dataset={data.sanityDataset}
      preview={data.preview}
    />
  {:else}
    <!-- Until the sections are seeded in Sanity the original blocks still
         render, so the live page never goes blank mid-migration. -->
  <section class="section home-solutions">
    <Reveal class="home-section-head" variant="panel">
      <p class="kicker">{content.nav.products}</p>
      <h2
        class="cms-styled-text"
        style={textAppearanceStyle(content.productsPage.hero.textAppearance?.title)}
      >{content.productsPage.hero.title}</h2>
    </Reveal>

    <div class="home-solutions-grid">
      {#each featuredSolutions as product, index}
        {@const image = imageFor(product, productImageFallback)}
        <CollectionCard
          href={`/produtos/${product.slug}${langQuery}`}
          title={product.title}
          description={product.description}
          {image}
          {index}
          transitionName={`vt-${product.slug}`}
          textAppearance={product.textAppearance}
        />
      {/each}
    </div>

    <Reveal variant="scale">
      <a class="home-section-cta" href={`/produtos${langQuery}`}>
        {viewAllLabel[data.language]}
        <span aria-hidden="true">→</span>
      </a>
    </Reveal>
  </section>

  <section class="section home-impact-ledger">
    <Reveal class="impact-copy" variant="panel">
      <h2
        class="cms-styled-text"
        style={textAppearanceStyle(content.home.impact.textAppearance?.title)}
      >{content.home.impact.title}</h2>
    </Reveal>

    <div class="impact-ledger">
      {#each content.home.impact.stats as stat, index}
        <Reveal delay={index * 60} variant="list">
          <article>
            <strong
              class="cms-styled-text"
              style={textAppearanceStyle(stat.textAppearance?.title)}
            >{stat.title}</strong>
            <p
              class="cms-styled-text"
              style={textAppearanceStyle(stat.textAppearance?.text)}
            >{stat.text}</p>
          </article>
        </Reveal>
      {/each}
    </div>
  </section>

  {#if featuredWork.length}
    <section class="section home-work">
      <Reveal class="home-section-head" variant="panel">
        <p class="kicker">{selectedWorkLabel[data.language]}</p>
        <h2
          class="cms-styled-text"
          style={textAppearanceStyle(content.casesPage.hero.textAppearance?.title)}
        >{content.casesPage.hero.title}</h2>
      </Reveal>

      <div class="home-work-grid">
        {#each featuredWork as item, index}
          {@const image = imageFor(item, caseStudyImageFallback)}
          <Reveal class="home-work-card-wrap" delay={index * 70} variant="card">
            <a class="home-work-card" href={`/casos-de-estudo/${item.slug}${langQuery}`}>
              <div class="home-work-media">
                <img
                  src={sizedImage(image.url, 720)}
                  srcset={imageSrcset(image.url, [400, 640, 800, 1100])}
                  sizes="(max-width: 760px) 92vw, 30vw"
                  alt={image.alt}
                  loading="lazy"
                  decoding="async"
                  style:background={image.lqip
                    ? `center / cover no-repeat url(${image.lqip})`
                    : undefined}
                  style:view-transition-name={`vt-${item.slug}`}
                />
                <span class="card-meta">{item.location}</span>
              </div>
              <h3
                class="cms-styled-text"
                style={textAppearanceStyle(item.textAppearance?.title)}
              >{item.title}</h3>
            </a>
          </Reveal>
        {/each}
      </div>

      <Reveal variant="scale">
        <a class="home-section-cta" href={`/casos-de-estudo${langQuery}`}>
          {viewAllWorkLabel[data.language]}
          <span aria-hidden="true">→</span>
        </a>
      </Reveal>
    </section>
  {/if}

  <section class="section home-partners-section">
    <Reveal class="partner-panel" variant="panel">
      <div class="partner-copy">
        <p
          class="kicker cms-styled-text"
          style={textAppearanceStyle(content.home.partners.textAppearance?.kicker)}
        >{content.home.partners.kicker}</p>
        <h2
          class="cms-styled-text"
          style={textAppearanceStyle(content.home.partners.textAppearance?.title)}
        >{content.home.partners.title}</h2>
        <p
          class="cms-styled-text"
          style={textAppearanceStyle(content.home.partners.textAppearance?.lead)}
        >{content.home.partners.lead}</p>
      </div>

      <div class="partner-grid" aria-label={content.home.partners.title}>
        {#each content.home.partners.items as partner}
          <a class="partner-logo-card" href={partner.url} target="_blank" rel="noreferrer">
            <span class="partner-logo-wrap" data-logo-tone={partner.logoTone}>
              <img
                src={sizedImage(partner.logo.url, 320)}
                srcset={imageSrcset(partner.logo.url, [160, 240, 320])}
                sizes="160px"
                alt={partner.logo.alt}
                loading="lazy"
                decoding="async"
              />
            </span>
            <span class="partner-name">{partner.name}</span>
            <span class="partner-text">{partner.text}</span>
          </a>
        {/each}
      </div>
    </Reveal>
  </section>
  {/if}
</main>

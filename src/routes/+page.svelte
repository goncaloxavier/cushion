<script lang="ts">
  import {lineReveal} from '$lib/actions/line-reveal'
  import Reveal from '$lib/components/Reveal.svelte'
  import {imageSrcset, sizedImage} from '$lib/image'
  import {youtubeEmbedUrl} from '$lib/media'
  import {
    caseStudyImageFallback,
    imageFor,
    productImageFallback,
    type LanguageCode,
  } from '$lib/site-content'

  let {data} = $props()
  const content = $derived(data.site[data.language])
  const langQuery = $derived(`?lang=${data.language}`)

  const featuredSolutions = $derived(content.products.slice(0, 4))
  const viewAllLabel: Record<LanguageCode, string> = {
    pt: 'Ver todas as soluções',
    en: 'View all solutions',
    es: 'Ver todas las soluciones',
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

  const heroBackgroundVideoEmbed = $derived(
    youtubeEmbedUrl(content.home.heroVideoUrl, {
      autoplay: true,
      controls: false,
      loop: true,
      muted: true,
      playsInline: true,
    }),
  )
  const heroWatchVideoEmbed = $derived(
    youtubeEmbedUrl(content.home.heroVideoUrl, {autoplay: true, playsInline: true}),
  )
  let heroVideoOpen = $state(false)
  let heroDialog = $state<HTMLDivElement | null>(null)

  const closeHeroVideo = () => {
    heroVideoOpen = false
  }

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

<svelte:head>
  <title>DaFábrica4You | Plástico reciclado para exterior</title>
</svelte:head>

<main class="home-page">
  <section class="home-hero">
    <div class="home-hero-bg" aria-hidden="true">
      {#if heroBackgroundVideoEmbed}
        <iframe
          class="home-hero-video home-hero-video-bg"
          title=""
          src={heroBackgroundVideoEmbed}
          tabindex="-1"
          allow="autoplay; encrypted-media; picture-in-picture; web-share"
        ></iframe>
      {/if}
    </div>

    <div class="home-hero-copy">
      <Reveal variant="hero" priority>
        <h1 use:lineReveal>{content.home.hero.title}</h1>
      </Reveal>
      <Reveal class="home-hero-actions" delay={130} variant="scale" priority>
        <div class="hero-actions">
          <a class="button primary" href={`/contacto${langQuery}`}>{content.common.requestQuote}</a>
          <a class="button secondary" href={`/catalogo${langQuery}`}>{content.nav.catalogue}</a>
        </div>
      </Reveal>
    </div>

    {#if heroWatchVideoEmbed}
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

  {#if heroVideoOpen && heroWatchVideoEmbed}
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
        <iframe
          title={content.home.heroVideoLabel}
          src={heroWatchVideoEmbed}
          allow="autoplay; encrypted-media; picture-in-picture; web-share"
          allowfullscreen
        ></iframe>
      </div>
    </div>
  {/if}

  <section class="section home-solutions">
    <Reveal class="home-section-head" variant="panel">
      <p class="kicker">{content.nav.products}</p>
      <h2>{content.productsPage.hero.title}</h2>
      {#if content.productsPage.lead}
        <p class="home-section-lead">{content.productsPage.lead}</p>
      {/if}
    </Reveal>

    <div class="home-solutions-grid">
      {#each featuredSolutions as product, index}
        {@const image = imageFor(product, productImageFallback)}
        <Reveal class="home-solution-card-wrap" delay={index * 70} variant="card">
          <a class="home-solution-card" href={`/produtos/${product.slug}${langQuery}`}>
            <div class="home-solution-media">
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
                style:view-transition-name={`vt-${product.slug}`}
              />
            </div>
            <div class="home-solution-copy">
              <h3>{product.title}</h3>
              {#if product.summary}
                <p>{product.summary}</p>
              {/if}
            </div>
          </a>
        </Reveal>
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
      <h2>{content.home.impact.title}</h2>
    </Reveal>

    <div class="impact-ledger">
      {#each content.home.impact.stats as stat, index}
        <Reveal delay={index * 60} variant="list">
          <article>
            <strong>{stat.title}</strong>
            <p>{stat.text}</p>
          </article>
        </Reveal>
      {/each}
    </div>
  </section>

  {#if featuredWork.length}
    <section class="section home-work">
      <Reveal class="home-section-head" variant="panel">
        <p class="kicker">{selectedWorkLabel[data.language]}</p>
        <h2>{content.casesPage.hero.title}</h2>
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
              <h3>{item.title}</h3>
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
        <p class="kicker">{content.home.partners.kicker}</p>
        <h2>{content.home.partners.title}</h2>
        <p>{content.home.partners.lead}</p>
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
</main>

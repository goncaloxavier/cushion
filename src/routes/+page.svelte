<script lang="ts">
  import Reveal from '$lib/components/Reveal.svelte'
  import {youtubeEmbedUrl} from '$lib/media'

  let {data} = $props()
  const content = $derived(data.site[data.language])
  const langQuery = $derived(`?lang=${data.language}`)

  const heroVideoEmbed = $derived(youtubeEmbedUrl(content.home.heroVideoUrl, {autoplay: true}))
  let heroPlaying = $state(false)

  // Reset the player when language changes so a stale embed never lingers.
  $effect(() => {
    void data.language
    heroPlaying = false
  })
</script>

<svelte:head>
  <title>DaFábrica4You | Plástico reciclado para exterior</title>
</svelte:head>

<main class="home-page">
  <section class="home-hero" class:playing={heroPlaying}>
    <div class="home-hero-bg">
      {#if heroPlaying && heroVideoEmbed}
        <iframe
          class="home-hero-video"
          title={content.home.heroVideoLabel}
          src={heroVideoEmbed}
          allow="autoplay; encrypted-media; picture-in-picture; web-share"
          allowfullscreen
        ></iframe>
      {:else}
        <img
          class="home-hero-poster"
          src={content.home.heroImage.url}
          alt={content.home.heroImage.alt}
          decoding="async"
          fetchpriority="high"
        />
      {/if}
    </div>

    {#if !heroPlaying}
      <div class="home-hero-copy">
        <Reveal variant="hero" priority>
          <h1>{content.home.hero.title}</h1>
          <p>{content.home.hero.lead}</p>
        </Reveal>
        <Reveal class="home-hero-actions" delay={130} variant="scale" priority>
          <div class="hero-actions">
            <a class="button primary" href={`/contacto${langQuery}`}>{content.common.requestQuote}</a>
            <a class="button secondary" href={`/catalogo${langQuery}`}>{content.nav.catalogue}</a>
          </div>
        </Reveal>
      </div>

      {#if heroVideoEmbed}
        <button
          type="button"
          class="home-hero-play"
          onclick={() => (heroPlaying = true)}
          aria-label={content.home.heroVideoLabel}
        >
          <span class="home-hero-play-icon" aria-hidden="true"></span>
          <span class="home-hero-play-text">{content.home.heroVideoLabel}</span>
        </button>
      {/if}
    {:else}
      <button
        type="button"
        class="home-hero-close"
        onclick={() => (heroPlaying = false)}
        aria-label={content.home.heroVideoCloseLabel}
      >
        <span aria-hidden="true">×</span>
      </button>
    {/if}
  </section>

  <section class="section home-brief">
    <Reveal class="home-brief-lead" variant="panel">
      <p class="kicker">{content.home.intro.kicker}</p>
      <h2>{content.home.intro.title}</h2>
      <p>{content.home.intro.lead}</p>
    </Reveal>

    <div class="home-story-rail">
      {#each content.about.timeline as item, index}
        <Reveal delay={index * 60} variant="list">
          <article>
            <span>{item.title}</span>
            <p>{item.text}</p>
          </article>
        </Reveal>
      {/each}
    </div>
  </section>

  <section class="section home-impact-ledger">
    <Reveal class="impact-copy" variant="panel">
      <h2>{content.home.impact.title}</h2>
      <p>{content.home.impact.lead}</p>
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
              <img src={partner.logo.url} alt={partner.logo.alt} loading="lazy" decoding="async" />
            </span>
            <span class="partner-name">{partner.name}</span>
            <span class="partner-text">{partner.text}</span>
          </a>
        {/each}
      </div>
    </Reveal>
  </section>
</main>

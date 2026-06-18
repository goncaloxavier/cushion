<script lang="ts">
  import MediaShowcase from '$lib/components/MediaShowcase.svelte'
  import Reveal from '$lib/components/Reveal.svelte'

  let {data} = $props()
  const content = $derived(data.site[data.language])
  const langQuery = $derived(`?lang=${data.language}`)
</script>

<svelte:head>
  <title>DaFábrica4You | Plástico reciclado para exterior</title>
</svelte:head>

<main class="home-page">
  <section class="home-hero">
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
    <Reveal class="home-hero-media" delay={80} variant="media" priority>
      <img
        src={content.home.heroImage.url}
        alt={content.home.heroImage.alt}
        decoding="async"
        fetchpriority="high"
      />
    </Reveal>
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

  <section class="section home-media-partners">
    <Reveal class="home-media-copy" variant="panel">
      <p class="kicker">{content.home.mediaShowcase.kicker}</p>
      <h2>{content.home.mediaShowcase.title}</h2>
      <p>{content.home.mediaShowcase.lead}</p>
    </Reveal>

    <Reveal class="home-media-gallery" delay={80} variant="media">
      <MediaShowcase items={content.home.mediaShowcase.items} />
    </Reveal>

    <Reveal class="partner-panel" delay={120} variant="panel">
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

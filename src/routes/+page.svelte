<script lang="ts">
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
        <div class="hero-proof-strip" aria-label={content.home.impact.title}>
          {#each content.home.impact.stats.slice(0, 3) as stat}
            <span><strong>{stat.title}</strong>{stat.text}</span>
          {/each}
        </div>
      </Reveal>
      <Reveal delay={130} variant="scale" priority>
        <div class="hero-actions">
          <a class="button primary" href={`/contacto${langQuery}`}>{content.common.requestQuote}</a>
          <a class="button secondary" href={`/catalogo${langQuery}`}>{content.nav.catalogue}</a>
        </div>
      </Reveal>
    </div>
    <p class="scroll-cue">{content.common.scroll}</p>
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
</main>

<script lang="ts">
  import Reveal from '$lib/components/Reveal.svelte'

  let {data} = $props()
  const content = $derived(data.site[data.language])
</script>

<svelte:head>
  <title>{content.nav.about} | DaFábrica4You</title>
</svelte:head>

<main class="about-page">
  <section class="about-index-hero">
    <Reveal class="about-index-copy" variant="hero" priority>
      <p class="kicker">{content.about.hero.kicker}</p>
      <h1>{content.about.hero.title}</h1>
    </Reveal>

    <Reveal class="about-index-lead" delay={120} variant="panel" priority>
      <p>{content.about.hero.lead}</p>
    </Reveal>
  </section>

  <section class="section about-narrative">
    <Reveal class="about-statement" variant="panel">
      <p class="kicker">{content.home.intro.kicker}</p>
      <h2>{content.home.intro.title}</h2>
      <p>{content.home.intro.lead}</p>
    </Reveal>

    <div class="about-moments">
      {#each content.about.timeline as item, index}
        <Reveal delay={index * 70} variant="list">
          <article class="about-moment">
            <span>{item.title}</span>
            <p>{item.text}</p>
          </article>
        </Reveal>
      {/each}
    </div>
  </section>

  <section class="section about-principles">
    <Reveal class="about-principles-lead" variant="panel">
      <p class="kicker">{content.home.manifesto.attribution}</p>
      <h2>{content.home.manifesto.quote}</h2>
    </Reveal>

    <div class="principle-grid">
      {#each content.about.principles as principle, index}
        <Reveal delay={index * 70} variant="card">
          <article class="feature-card about-principle-card">
            <span>{String(index + 1).padStart(2, '0')}</span>
            <h2>{principle.title}</h2>
            <p>{principle.text}</p>
          </article>
        </Reveal>
      {/each}
    </div>
  </section>
</main>

<script lang="ts">
  import {lineReveal} from '$lib/actions/line-reveal'
  import Reveal from '$lib/components/Reveal.svelte'

  let {data} = $props()
  const content = $derived(data.site[data.language])
</script>

<svelte:head>
  <title>{content.nav.about} | DaFábrica4You</title>
</svelte:head>

<main class="about-page">
  <section class="about-index-hero about-index-hero-solo">
    <Reveal class="about-index-copy" variant="hero" priority>
      <p class="kicker">{content.about.hero.kicker}</p>
      <h1 use:lineReveal>{content.about.hero.title}</h1>
    </Reveal>
  </section>

  <section class="section about-narrative">
    <Reveal class="about-statement" variant="panel">
      <p class="kicker">{content.home.intro.kicker}</p>
      <h2>{content.home.intro.title}</h2>
    </Reveal>

    <div class="about-timeline">
      {#each content.about.timeline as item, index}
        <Reveal delay={index * 70} variant="list">
          <article class="about-timeline-item">
            <span class="about-timeline-year">{item.title}</span>
            <p>{item.text}</p>
          </article>
        </Reveal>
      {/each}
    </div>
  </section>
</main>

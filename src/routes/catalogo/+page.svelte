<script lang="ts">
  import PageHero from '$lib/components/PageHero.svelte'
  import Reveal from '$lib/components/Reveal.svelte'

  let {data} = $props()
  const content = $derived(data.site[data.language])
  const langQuery = $derived(`?lang=${data.language}`)
</script>

<svelte:head>
  <title>{content.nav.catalogue} | DaFábrica4You</title>
</svelte:head>

<main>
  <PageHero {...content.catalogue.hero} />

  <section class="section catalogue-board">
    <Reveal class="catalogue-intro" variant="panel">
      <p class="kicker">{content.catalogue.estimate.kicker}</p>
      <h2>{content.catalogue.estimate.title}</h2>
      <p>{content.catalogue.estimate.lead}</p>
      <a class="button primary" href={`/contacto${langQuery}`}>{content.common.requestQuote}</a>
    </Reveal>

    <div class="price-factors">
      {#each content.catalogue.estimate.cards as card, index}
        <Reveal delay={index * 70} variant="card">
          <article class="factor-card">
            <h3>{card.title}</h3>
            <p>{card.text}</p>
          </article>
        </Reveal>
      {/each}
    </div>

    <Reveal class="quote-checklist" delay={120} variant="scale">
      <h2>{content.catalogue.estimate.checklistTitle}</h2>
      <ul>
        {#each content.catalogue.estimate.checklist as item}
          <li>{item}</li>
        {/each}
      </ul>
      <p>{content.catalogue.note}</p>
    </Reveal>

    <div class="quote-flow compact-flow">
      {#each content.catalogue.quoteFlow as step, index}
        <Reveal delay={index * 55} variant="list">
          <article>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </article>
        </Reveal>
      {/each}
    </div>
  </section>
</main>

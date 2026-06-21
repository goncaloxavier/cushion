<script lang="ts">
  import PageHero from '$lib/components/PageHero.svelte'
  import Reveal from '$lib/components/Reveal.svelte'

  let {data} = $props()
  const content = $derived(data.site[data.language])
  const contactQuery = $derived(`?lang=${data.language}&source=catalogo`)
</script>

<svelte:head>
  <title>{content.nav.catalogue} | DaFábrica4You</title>
</svelte:head>

<main>
  <PageHero {...content.catalogue.hero} />

  <section class="section catalogue-request-section">
    <Reveal class="catalogue-request-panel" variant="panel">
      <p class="kicker">{content.catalogue.estimate.kicker}</p>
      <h2>{content.catalogue.estimate.title}</h2>
      <p>{content.catalogue.estimate.lead}</p>
      <a class="button primary" href={`/contacto${contactQuery}`}>{content.catalogue.ctaLabel}</a>
    </Reveal>

    <Reveal class="catalogue-request-checklist" delay={120} variant="scale">
      <h2>{content.catalogue.estimate.checklistTitle}</h2>
      <ul>
        {#each content.catalogue.estimate.checklist as item}
          <li>{item}</li>
        {/each}
      </ul>
      <p>{content.catalogue.note}</p>
    </Reveal>
  </section>
</main>

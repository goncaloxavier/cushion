<script lang="ts">
  import PageHero from '$lib/components/PageHero.svelte'
  import Reveal from '$lib/components/Reveal.svelte'

  let {data} = $props()
  const content = $derived(data.site[data.language])
</script>

<svelte:head>
  <title>{content.nav.contact} | DaFábrica4You</title>
</svelte:head>

<main>
  <PageHero {...content.contactPage.hero} />

  <section class="section contact-grid">
    <Reveal class="contact-method" variant="card">
      <div class="contact-box">
        <span>{content.common.emailLabel}</span>
        <a href={`mailto:${content.common.contactEmail}`}>{content.common.contactEmail}</a>
      </div>
    </Reveal>
    <Reveal class="contact-method" delay={80} variant="card">
      <div class="contact-box">
        <span>{content.common.phoneLabel}</span>
        <a href={`tel:${content.common.contactPhone.replaceAll(' ', '')}`}>{content.common.contactPhone}</a>
      </div>
    </Reveal>
    <Reveal class="contact-form-reveal" delay={160} variant="panel">
      <form class="contact-form">
        {#each content.contactPage.fields as field}
          <label>
            <span>{field}</span>
            {#if field.toLowerCase().includes('mensagem') || field.toLowerCase().includes('message') || field.toLowerCase().includes('mensaje')}
              <textarea rows="4"></textarea>
            {:else}
              <input />
            {/if}
          </label>
        {/each}
        <button class="button primary" type="button">{content.common.requestQuote}</button>
      </form>
    </Reveal>
  </section>
</main>

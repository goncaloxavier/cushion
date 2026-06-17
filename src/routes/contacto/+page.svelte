<script lang="ts">
  import BrandIcon from '$lib/components/BrandIcon.svelte'
  import PageHero from '$lib/components/PageHero.svelte'
  import Reveal from '$lib/components/Reveal.svelte'

  let {data} = $props()
  const content = $derived(data.site[data.language])
  const socialLinks = $derived(
    [
      {href: content.common.instagramUrl, label: 'Instagram', icon: 'instagram' as const},
      {href: content.common.facebookUrl, label: 'Facebook', icon: 'facebook' as const},
      {href: content.common.youtubeUrl, label: 'YouTube', icon: 'youtube' as const},
    ].filter((link) => link.href),
  )
  const isMessageField = (field: string) =>
    field.toLowerCase().includes('mensagem') ||
    field.toLowerCase().includes('message') ||
    field.toLowerCase().includes('mensaje')
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
    <Reveal class="contact-method" delay={140} variant="card">
      <div class="contact-box contact-links-box">
        <span>{content.common.socialLabel}</span>
        <div class="social-links">
          {#each socialLinks as link}
            <a href={link.href} target="_blank" rel="noreferrer" data-social={link.icon}>
              <BrandIcon name={link.icon} />
              <span>{link.label}</span>
            </a>
          {/each}
        </div>
        <a class="complaints-link" href={content.common.complaintsUrl} target="_blank" rel="noreferrer">
          {content.common.complaintsLabel}
        </a>
      </div>
    </Reveal>
    <Reveal class="contact-form-reveal" delay={180} variant="panel">
      <form class="contact-form">
        {#each content.contactPage.fields as field}
          <label class:message-field={isMessageField(field)}>
            <span>{field}</span>
            {#if isMessageField(field)}
              <textarea rows="4"></textarea>
            {:else}
              <input />
            {/if}
          </label>
        {/each}
        <label class="consent-field">
          <input type="checkbox" />
          <span>{content.common.marketingConsent}</span>
        </label>
        <button class="button primary" type="button">{content.common.requestQuote}</button>
      </form>
    </Reveal>
  </section>
</main>

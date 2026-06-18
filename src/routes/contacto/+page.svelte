<script lang="ts">
  import BrandIcon from '$lib/components/BrandIcon.svelte'
  import PageHero from '$lib/components/PageHero.svelte'
  import Reveal from '$lib/components/Reveal.svelte'

  let {data} = $props()
  const content = $derived(data.site[data.language])
  let fieldValues = $state<string[]>([])
  let consentAccepted = $state(false)

  $effect(() => {
    const fields = content.contactPage.fields
    if (fieldValues.length !== fields.length) {
      fieldValues = fields.map((_, index) => fieldValues[index] ?? '')
    }
  })

  const formIsComplete = $derived(
    content.contactPage.fields.every((_, index) => Boolean(fieldValues[index]?.trim())) &&
      consentAccepted,
  )

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

  const inputType = (field: string) => {
    const normalized = field.toLowerCase()
    if (normalized.includes('email')) return 'email'
    if (
      normalized.includes('telefone') ||
      normalized.includes('phone') ||
      normalized.includes('teléfono')
    ) {
      return 'tel'
    }
    return 'text'
  }

  const autocomplete = (field: string) => {
    const normalized = field.toLowerCase()
    if (normalized.includes('nome') || normalized.includes('name') || normalized.includes('nombre')) {
      return 'name'
    }
    if (normalized.includes('email')) return 'email'
    if (
      normalized.includes('telefone') ||
      normalized.includes('phone') ||
      normalized.includes('teléfono')
    ) {
      return 'tel'
    }
    if (normalized.includes('postal')) return 'postal-code'
    return 'off'
  }

  const handleSubmit = (event: SubmitEvent) => {
    event.preventDefault()
    if (!formIsComplete) return
  }
</script>

<svelte:head>
  <title>{content.nav.contact} | DaFábrica4You</title>
</svelte:head>

<main>
  <PageHero {...content.contactPage.hero} />

  <section class="section contact-grid">
    <Reveal class="contact-method contact-method-email" variant="card" priority>
      <div class="contact-box">
        <span>{content.common.emailLabel}</span>
        <a href={`mailto:${content.common.contactEmail}`}>{content.common.contactEmail}</a>
      </div>
    </Reveal>
    <Reveal class="contact-method contact-method-phone" delay={80} variant="card" priority>
      <div class="contact-box">
        <span>{content.common.phoneLabel}</span>
        <a href={`tel:${content.common.contactPhone.replaceAll(' ', '')}`}>{content.common.contactPhone}</a>
      </div>
    </Reveal>
    <Reveal class="contact-method contact-method-legal" delay={140} variant="card" priority>
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
        <p class="complaints-note">{content.common.complaintsNote}</p>
      </div>
    </Reveal>
    <Reveal class="contact-form-reveal" delay={180} variant="panel" priority>
      <form class="contact-form" onsubmit={handleSubmit}>
        {#each content.contactPage.fields as field, index}
          {@const fieldId = `contact-field-${index}`}
          <label class:message-field={isMessageField(field)} for={fieldId}>
            <span>{field}</span>
            {#if isMessageField(field)}
              <textarea
                id={fieldId}
                name={field}
                rows="4"
                required
                aria-required="true"
                bind:value={fieldValues[index]}
              ></textarea>
            {:else}
              <input
                id={fieldId}
                name={field}
                type={inputType(field)}
                autocomplete={autocomplete(field)}
                required
                aria-required="true"
                bind:value={fieldValues[index]}
              />
            {/if}
          </label>
        {/each}
        <label class="consent-field">
          <input type="checkbox" required aria-required="true" bind:checked={consentAccepted} />
          <span>{content.common.marketingConsent}</span>
        </label>
        <button class="button primary" type="submit" disabled={!formIsComplete}>
          {content.common.requestQuote}
        </button>
      </form>
    </Reveal>
  </section>
</main>

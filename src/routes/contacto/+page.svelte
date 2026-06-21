<script lang="ts">
  import BrandIcon from '$lib/components/BrandIcon.svelte'
  import PageHero from '$lib/components/PageHero.svelte'
  import Reveal from '$lib/components/Reveal.svelte'
  import {contactFieldKeys, type ContactFieldKey} from '$lib/site-content'

  type ContactFormValues = Partial<Record<ContactFieldKey, string>>

  let {data, form} = $props()
  const content = $derived(data.site[data.language])
  const fallbackFieldLabels: Record<string, Record<ContactFieldKey, string>> = {
    pt: {
      name: 'Nome',
      email: 'Email',
      phone: 'Telefone',
      postalCode: 'Código postal',
      locality: 'Localidade',
      message: 'Mensagem',
    },
    en: {
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      postalCode: 'Postcode',
      locality: 'Location',
      message: 'Message',
    },
    es: {
      name: 'Nombre',
      email: 'Email',
      phone: 'Teléfono',
      postalCode: 'Código postal',
      locality: 'Localidad',
      message: 'Mensaje',
    },
  }
  let fieldValues = $state<Record<ContactFieldKey, string>>({
    name: '',
    email: '',
    phone: '',
    postalCode: '',
    locality: '',
    message: '',
  })
  let consentAccepted = $state(false)
  let lastFormValues = $state<ContactFormValues | undefined>(undefined)

  $effect(() => {
    const currentFormValues = form?.values as ContactFormValues | undefined

    if (currentFormValues && currentFormValues !== lastFormValues) {
      fieldValues = {
        name: currentFormValues.name ?? '',
        email: currentFormValues.email ?? '',
        phone: currentFormValues.phone ?? '',
        postalCode: currentFormValues.postalCode ?? '',
        locality: currentFormValues.locality ?? '',
        message: currentFormValues.message ?? '',
      }
      lastFormValues = currentFormValues
    }
  })

  const formIsComplete = $derived(
    contactFieldKeys.every((key) => Boolean(fieldValues[key]?.trim())) && consentAccepted,
  )
  const contactFields = $derived(
    contactFieldKeys.map((key, index) => ({
      key,
      label:
        content.contactPage.formLabels[key] ||
        content.contactPage.fields[index] ||
        fallbackFieldLabels[data.language]?.[key] ||
        fallbackFieldLabels.pt[key],
    })),
  )

  const socialLinks = $derived(
    [
      {href: content.common.instagramUrl, label: 'Instagram', icon: 'instagram' as const},
      {href: content.common.facebookUrl, label: 'Facebook', icon: 'facebook' as const},
      {href: content.common.youtubeUrl, label: 'YouTube', icon: 'youtube' as const},
    ].filter((link) => link.href),
  )
  const isMessageField = (field: ContactFieldKey) => field === 'message'

  const inputType = (field: ContactFieldKey) => {
    if (field === 'email') return 'email'
    if (field === 'phone') return 'tel'
    return 'text'
  }

  const autocomplete = (field: ContactFieldKey) => {
    if (field === 'name') return 'name'
    if (field === 'email') return 'email'
    if (field === 'phone') return 'tel'
    if (field === 'postalCode') return 'postal-code'
    return 'off'
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
      <form class="contact-form" method="POST">
        <input type="hidden" name="csrfToken" value={data.csrfToken} />
        <input type="hidden" name="language" value={data.language} />
        <input type="hidden" name="source" value={data.submissionSource} />
        <input type="hidden" name="consentText" value={content.common.marketingConsent} />
        <label class="visually-hidden" aria-hidden="true">
          Website
          <input name="companyWebsite" tabindex="-1" autocomplete="off" />
        </label>

        {#if form?.message}
          <p class:success={form?.success} class="form-feedback" role={form?.success ? 'status' : 'alert'}>
            {form.message}
          </p>
        {/if}

        {#each contactFields as field}
          {@const fieldId = `contact-field-${field.key}`}
          <label class:message-field={isMessageField(field.key)} for={fieldId}>
            <span>{field.label}</span>
            {#if isMessageField(field.key)}
              <textarea
                id={fieldId}
                name={field.key}
                rows="4"
                required
                aria-required="true"
                bind:value={fieldValues[field.key]}
              ></textarea>
            {:else}
              <input
                id={fieldId}
                name={field.key}
                type={inputType(field.key)}
                autocomplete={autocomplete(field.key)}
                required
                aria-required="true"
                bind:value={fieldValues[field.key]}
              />
            {/if}
          </label>
        {/each}
        <label class="consent-field">
          <input
            name="marketingConsent"
            type="checkbox"
            required
            aria-required="true"
            bind:checked={consentAccepted}
          />
          <span>{content.common.marketingConsent}</span>
        </label>
        <button class="button primary" type="submit" disabled={!formIsComplete}>
          {content.common.requestQuote}
        </button>
      </form>
    </Reveal>
  </section>
</main>

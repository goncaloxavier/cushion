<script lang="ts">
  import PageHero from '$lib/components/PageHero.svelte'
  import Reveal from '$lib/components/Reveal.svelte'
  import SeoHead from '$lib/components/SeoHead.svelte'
  import {contactFieldKeys, type ContactFieldKey} from '$lib/site-content'

  let {data, form} = $props()
  const content = $derived(data.site[data.language])

  const fieldKeys = contactFieldKeys

  let values = $state<Record<ContactFieldKey, string>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    postalCode: '',
    locality: '',
    message: '',
  })
  let consentAccepted = $state(false)
  let lastFormValues = $state<Record<string, string> | undefined>(undefined)

  $effect(() => {
    const fv = form?.values as Record<string, string> | undefined
    if (fv && fv !== lastFormValues) {
      values = {
        firstName: fv.firstName ?? '',
        lastName: fv.lastName ?? '',
        email: fv.email ?? '',
        phone: fv.phone ?? '',
        address: fv.address ?? '',
        postalCode: fv.postalCode ?? '',
        locality: fv.locality ?? '',
        message: fv.message ?? '',
      }
      lastFormValues = fv
    }
  })

  const labelFor = (key: ContactFieldKey) => content.contactPage.formLabels[key]

  const isMessageField = (key: ContactFieldKey) => key === 'message'

  const inputType = (key: ContactFieldKey) => (key === 'email' ? 'email' : key === 'phone' ? 'tel' : 'text')

  const autocomplete = (key: ContactFieldKey) => {
    if (key === 'firstName') return 'given-name'
    if (key === 'lastName') return 'family-name'
    if (key === 'email') return 'email'
    if (key === 'phone') return 'tel'
    if (key === 'address') return 'street-address'
    if (key === 'postalCode') return 'postal-code'
    if (key === 'locality') return 'address-level2'
    return 'off'
  }

  const formIsComplete = $derived(
    fieldKeys.every((key) => Boolean(values[key]?.trim())) && consentAccepted,
  )
</script>

<SeoHead
  title={content.nav.catalogue}
  description={content.catalogue.estimate.lead || content.catalogue.hero.title}
/>

<main>
  <PageHero {...content.catalogue.hero} lead="" />

  <section class="section catalogue-request-section">
    <Reveal class="catalogue-request-panel" variant="panel">
      <p class="kicker">{content.catalogue.estimate.kicker}</p>
      <h2>{content.catalogue.estimate.title}</h2>
      {#each content.catalogue.estimate.lead.split(/\n+/) as paragraph}
        <p>{paragraph}</p>
      {/each}
      <h3 class="catalogue-checklist-title">{content.catalogue.estimate.checklistTitle}</h3>
      <ul class="catalogue-checklist">
        {#each content.catalogue.estimate.checklist as item}
          <li>{item}</li>
        {/each}
      </ul>
      {#if content.catalogue.note}
        <p class="catalogue-note">{content.catalogue.note}</p>
      {/if}
    </Reveal>

    <Reveal class="catalogue-form-reveal" delay={120} variant="panel">
      <form class="contact-form catalogue-form" method="POST">
        <input type="hidden" name="csrfToken" value={data.csrfToken} />
        <input type="hidden" name="language" value={data.language} />
        <input type="hidden" name="source" value="catalogo" />
        <input type="hidden" name="consentText" value={content.common.marketingConsent} />
        <label class="visually-hidden" aria-hidden="true">
          Website
          <input name="companyWebsite" tabindex="-1" autocomplete="off" />
        </label>

        {#if form?.message}
          <p
            class:success={form?.success}
            class="form-feedback"
            role={form?.success ? 'status' : 'alert'}
          >
            {form.message}
          </p>
        {/if}

        {#each fieldKeys as key}
          {@const fieldId = `catalogue-field-${key}`}
          <label class:message-field={isMessageField(key)} for={fieldId}>
            <span>{labelFor(key)}</span>
            {#if isMessageField(key)}
              <textarea
                id={fieldId}
                name={key}
                rows="4"
                required
                aria-required="true"
                bind:value={values[key]}
              ></textarea>
            {:else}
              <input
                id={fieldId}
                name={key}
                type={inputType(key)}
                autocomplete={autocomplete(key)}
                required
                aria-required="true"
                bind:value={values[key]}
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
          {content.catalogue.ctaLabel}
        </button>
      </form>
    </Reveal>
  </section>
</main>

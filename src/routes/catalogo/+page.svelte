<script lang="ts">
  import PageHero from '$lib/components/PageHero.svelte'
  import Reveal from '$lib/components/Reveal.svelte'

  let {data, form} = $props()
  const content = $derived(data.site[data.language])

  const addressLabel: Record<string, string> = {pt: 'Morada', en: 'Address', es: 'Dirección'}

  type FieldKey = 'name' | 'email' | 'phone' | 'address' | 'postalCode' | 'locality'
  const fieldKeys: FieldKey[] = ['name', 'email', 'phone', 'address', 'postalCode', 'locality']

  let values = $state<Record<FieldKey, string>>({
    name: '',
    email: '',
    phone: '',
    address: '',
    postalCode: '',
    locality: '',
  })
  let consentAccepted = $state(false)
  let lastFormValues = $state<Record<string, string> | undefined>(undefined)

  $effect(() => {
    const fv = form?.values as Record<string, string> | undefined
    if (fv && fv !== lastFormValues) {
      values = {
        name: fv.name ?? '',
        email: fv.email ?? '',
        phone: fv.phone ?? '',
        address: fv.address ?? '',
        postalCode: fv.postalCode ?? '',
        locality: fv.locality ?? '',
      }
      lastFormValues = fv
    }
  })

  const labelFor = (key: FieldKey) =>
    key === 'address' ? (addressLabel[data.language] ?? 'Morada') : content.contactPage.formLabels[key]

  const inputType = (key: FieldKey) => (key === 'email' ? 'email' : key === 'phone' ? 'tel' : 'text')

  const autocomplete = (key: FieldKey) => {
    if (key === 'name') return 'name'
    if (key === 'email') return 'email'
    if (key === 'phone') return 'tel'
    if (key === 'address') return 'street-address'
    if (key === 'postalCode') return 'postal-code'
    return 'address-level2'
  }

  const formIsComplete = $derived(
    fieldKeys.every((key) => Boolean(values[key]?.trim())) && consentAccepted,
  )
</script>

<svelte:head>
  <title>{content.nav.catalogue} | DaFábrica4You</title>
</svelte:head>

<main>
  <PageHero {...content.catalogue.hero} lead="" />

  <section class="section catalogue-request-section">
    <Reveal class="catalogue-request-panel" variant="panel">
      <p class="kicker">{content.catalogue.estimate.kicker}</p>
      <h2>{content.catalogue.estimate.title}</h2>
      <p>{content.catalogue.estimate.lead}</p>
      <h3 class="catalogue-checklist-title">{content.catalogue.estimate.checklistTitle}</h3>
      <ul class="catalogue-checklist">
        {#each content.catalogue.estimate.checklist as item}
          <li>{item}</li>
        {/each}
      </ul>
      <p class="catalogue-note">{content.catalogue.note}</p>
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
          <label for={fieldId}>
            <span>{labelFor(key)}</span>
            <input
              id={fieldId}
              name={key}
              type={inputType(key)}
              autocomplete={autocomplete(key)}
              required
              aria-required="true"
              bind:value={values[key]}
            />
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

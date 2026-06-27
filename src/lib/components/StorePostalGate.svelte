<script lang="ts">
  import type {LanguageCode} from '$lib/site-content'
  import {normalizePostalCode, postalCodeIssue, postalZoneFor, writeStorePostalCode} from '$lib/store-shipping'

  type Labels = {
    kicker: string
    title: string
    lead: string
    field: string
    placeholder: string
    submit: string
    update: string
    close: string
    zone: string
    incomplete: string
    unsupported: string
  }

  const labelsByLanguage: Record<LanguageCode, Labels> = {
    pt: {
      kicker: 'Entrega',
      title: 'Para onde entregamos?',
      lead:
        'Os preços da loja já incluem o transporte até à sua zona e o IVA. Indique o código postal para ver os valores certos.',
      field: 'Código postal',
      placeholder: '7000-000',
      submit: 'Ver loja',
      update: 'Atualizar código postal',
      close: 'Fechar',
      zone: 'Zona de entrega',
      incomplete: 'Indique pelo menos os quatro primeiros dígitos do código postal.',
      unsupported:
        'Neste momento a loja calcula transporte apenas para Portugal continental entre 1000 e 8999.',
    },
    en: {
      kicker: 'Delivery',
      title: 'Where are we delivering?',
      lead:
        'Store prices already include delivery to your area and VAT. Enter your postcode to see the right values.',
      field: 'Postcode',
      placeholder: '7000-000',
      submit: 'View store',
      update: 'Update postcode',
      close: 'Close',
      zone: 'Delivery area',
      incomplete: 'Enter at least the first four postcode digits.',
      unsupported:
        'The store currently estimates transport only for mainland Portugal between 1000 and 8999.',
    },
    es: {
      kicker: 'Entrega',
      title: '¿A dónde entregamos?',
      lead:
        'Los precios ya incluyen el transporte hasta tu zona y el IVA. Indica el código postal para ver los valores correctos.',
      field: 'Código postal',
      placeholder: '7000-000',
      submit: 'Ver tienda',
      update: 'Actualizar código postal',
      close: 'Cerrar',
      zone: 'Zona de entrega',
      incomplete: 'Indica al menos los cuatro primeros dígitos del código postal.',
      unsupported:
        'La tienda calcula transporte solo para Portugal continental entre 1000 y 8999.',
    },
  }

  let {
    language,
    compact = false,
    initialPostalCode = '',
    closable = false,
    onconfirm,
    onclose,
  } = $props<{
    language: LanguageCode
    compact?: boolean
    initialPostalCode?: string
    closable?: boolean
    onconfirm?: (postalCode: string) => void
    onclose?: () => void
  }>()

  let postalCode = $state(normalizePostalCode(initialPostalCode))
  let error = $state('')

  const labels = $derived(labelsByLanguage[language])
  const zone = $derived(postalZoneFor(postalCode))

  const submitPostalCode = () => {
    const issue = postalCodeIssue(postalCode)
    if (issue) {
      error = labels[issue]
      return
    }

    const normalized = writeStorePostalCode(postalCode)
    if (!normalized) {
      error = labels.unsupported
      return
    }

    error = ''
    postalCode = normalized
    onconfirm?.(normalized)
  }
</script>

<form
  class="store-postal-gate"
  class:compact
  onsubmit={(event) => {
    event.preventDefault()
    submitPostalCode()
  }}
>
  {#if closable}
    <button class="store-postal-close" type="button" aria-label={labels.close} onclick={onclose}>
      <span aria-hidden="true">×</span>
    </button>
  {/if}

  <span class="store-postal-icon" aria-hidden="true">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 10c0 5.5-8 11-8 11s-8-5.5-8-11a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  </span>

  <div class="store-postal-gate-copy">
    <p class="kicker">{labels.kicker}</p>
    <h2>{labels.title}</h2>
    <p>{labels.lead}</p>
  </div>

  <div class="store-postal-form">
    <label>
      <span>{labels.field}</span>
      <input
        bind:value={postalCode}
        type="text"
        inputmode="numeric"
        autocomplete="postal-code"
        placeholder={labels.placeholder}
        aria-invalid={Boolean(error)}
        oninput={() => {
          postalCode = normalizePostalCode(postalCode)
          error = ''
        }}
      />
    </label>

    {#if error}
      <p class="store-postal-error" role="alert">{error}</p>
    {:else if zone}
      <p class="store-postal-zone">{labels.zone}: {zone.label}</p>
    {/if}

    <button class="button primary" type="submit">{closable ? labels.update : labels.submit}</button>
  </div>
</form>

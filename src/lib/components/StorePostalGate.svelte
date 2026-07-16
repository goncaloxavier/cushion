<script lang="ts">
  import type {StorePostalGateLabels} from '$lib/site-content'
  import {
    normalizeStorePostalCode,
    postalCodeIssue,
    postalZoneFor,
    writeStorePostalCode,
  } from '$lib/store-shipping'

  let {
    labels,
    compact = false,
    initialPostalCode = '',
    closable = false,
    onconfirm,
    onclose,
  } = $props<{
    labels: StorePostalGateLabels
    compact?: boolean
    initialPostalCode?: string
    closable?: boolean
    onconfirm?: (postalCode: string) => void
    onclose?: () => void
  }>()

  let postalCode = $state('')
  let previousInitialPostalCode = $state<string | null>(null)
  let error = $state('')

  const zone = $derived(postalZoneFor(postalCode))

  $effect(() => {
    const normalized = normalizeStorePostalCode(initialPostalCode)
    if (normalized === previousInitialPostalCode) return

    previousInitialPostalCode = normalized
    postalCode = normalized
    error = ''
  })

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
        maxlength="4"
        autocomplete="postal-code"
        placeholder={labels.placeholder}
        aria-invalid={Boolean(error)}
        oninput={() => {
          postalCode = normalizeStorePostalCode(postalCode)
          error = ''
        }}
      />
    </label>

    {#if error}
      <p class="store-postal-error" role="alert">{error}</p>
    {:else if zone}
      <p class="store-postal-zone">{zone.label}</p>
    {/if}

    <button class="button primary" type="submit">{closable ? labels.update : labels.submit}</button>
  </div>
</form>

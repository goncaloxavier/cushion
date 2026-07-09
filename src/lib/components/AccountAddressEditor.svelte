<script lang="ts">
  import {enhance} from '$app/forms'

  type AddressType = 'billing' | 'delivery'
  type Address = {
    id: string
    name: string
    addressLine1: string
    addressLine2: string
    postalCode: string
    locality: string
    country: string
  }

  type Labels = {
    label: string
    address: string
    address2: string
    postalCode: string
    locality: string
    country: string
    optional: string
    save: string
    cancel: string
  }

  let {
    csrfToken,
    address = null,
    addressType,
    labels,
    onCancel,
    onSuccess,
    onError,
  } = $props<{
    csrfToken: string
    address?: Address | null
    addressType: AddressType
    labels: Labels
    onCancel: () => void
    onSuccess?: () => void
    onError?: (message: string) => void
  }>()

  // Portuguese postal code: 4 digits, a hyphen, then up to 3 more (1234-567).
  const formatPostalCode = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 7)
    return digits.length > 4 ? `${digits.slice(0, 4)}-${digits.slice(4)}` : digits
  }

  const fields = $state({
    name: '',
    addressLine1: '',
    addressLine2: '',
    postalCode: '',
    locality: '',
    country: 'PT',
  })
  const autocompleteScope = $derived(addressType === 'delivery' ? 'shipping' : 'billing')

  $effect(() => {
    fields.name = address?.name ?? ''
    fields.addressLine1 = address?.addressLine1 ?? ''
    fields.addressLine2 = address?.addressLine2 ?? ''
    fields.postalCode = formatPostalCode(address?.postalCode ?? '')
    fields.locality = address?.locality ?? ''
    fields.country = address?.country ?? 'PT'
  })
</script>

<form
  method="POST"
  action="?/saveAddress"
  class="account-form account-edit-form"
  use:enhance={() =>
    async ({result}) => {
      if (result.type === 'success') onSuccess?.()
      else if (result.type === 'failure')
        onError?.((result.data as {message?: string} | undefined)?.message ?? '')
    }}
>
  <input type="hidden" name="csrfToken" value={csrfToken} />
  <input type="hidden" name="addressType" value={addressType} />
  {#if address}
    <input type="hidden" name="addressId" value={address.id} />
  {/if}

  <label>
    <span>{labels.label} <em>({labels.optional})</em></span>
    <input name="name" autocomplete="organization" bind:value={fields.name} />
  </label>

  <label>
    <span>{labels.address}</span>
    <input name="addressLine1" autocomplete={`${autocompleteScope} street-address`} required bind:value={fields.addressLine1} />
  </label>

  <label>
    <span>{labels.address2} <em>({labels.optional})</em></span>
    <input name="addressLine2" bind:value={fields.addressLine2} />
  </label>

  <div class="account-form-row">
    <label>
      <span>{labels.postalCode}</span>
      <input
        name="postalCode"
        autocomplete={`${autocompleteScope} postal-code`}
        inputmode="numeric"
        maxlength="8"
        placeholder="1234-567"
        required
        value={fields.postalCode}
        oninput={(event) => (fields.postalCode = formatPostalCode(event.currentTarget.value))}
      />
    </label>
    <label>
      <span>{labels.locality}</span>
      <input name="locality" autocomplete={`${autocompleteScope} address-level2`} required bind:value={fields.locality} />
    </label>
  </div>

  <label>
    <span>{labels.country}</span>
    <input name="country" maxlength="2" autocomplete={`${autocompleteScope} country`} required bind:value={fields.country} />
  </label>

  <div class="account-edit-actions">
    <button class="button primary" type="submit">{labels.save}</button>
    <button class="button subtle" type="button" onclick={onCancel}>{labels.cancel}</button>
  </div>
</form>

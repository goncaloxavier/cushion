<script lang="ts">
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
  } = $props<{
    csrfToken: string
    address?: Address | null
    addressType: AddressType
    labels: Labels
    onCancel: () => void
  }>()

  const fields = $state({
    name: address?.name ?? '',
    addressLine1: address?.addressLine1 ?? '',
    addressLine2: address?.addressLine2 ?? '',
    postalCode: address?.postalCode ?? '',
    locality: address?.locality ?? '',
    country: address?.country ?? 'PT',
  })
  const autocompleteScope = $derived(addressType === 'delivery' ? 'shipping' : 'billing')
</script>

<form method="POST" action="?/saveAddress" class="account-form account-edit-form">
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
      <input name="postalCode" autocomplete={`${autocompleteScope} postal-code`} required bind:value={fields.postalCode} />
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

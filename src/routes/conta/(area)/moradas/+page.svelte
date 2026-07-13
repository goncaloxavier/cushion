<script lang="ts">
  import {enhance} from '$app/forms'
  import {invalidate} from '$app/navigation'
  import type {SubmitFunction} from '@sveltejs/kit'
  import AccountAddressEditor from '$lib/components/AccountAddressEditor.svelte'
  import Reveal from '$lib/components/Reveal.svelte'
  import {showToast} from '$lib/toast'

  let {data} = $props()

  type AddressType = 'billing' | 'delivery'
  type Copy = {
    title: string
    billing: string
    delivery: string
    addBilling: string
    addDelivery: string
    emptyBilling: string
    emptyDelivery: string
    edit: string
    remove: string
    makeDefault: string
    defaultLabel: string
    saved: string
    deleted: string
    defaultSaved: string
    label: string
    nif: string
    address: string
    postalCode: string
    locality: string
    country: string
    optional: string
    save: string
    cancel: string
  }

  const copyByLanguage: Record<string, Copy> = {
    pt: {
      title: 'Moradas',
      billing: 'Faturação',
      delivery: 'Entrega',
      addBilling: 'Adicionar faturação',
      addDelivery: 'Adicionar entrega',
      emptyBilling: 'Ainda não tem moradas de faturação guardadas.',
      emptyDelivery: 'Ainda não tem moradas de entrega guardadas.',
      edit: 'Editar',
      remove: 'Remover',
      makeDefault: 'Preferida',
      defaultLabel: 'Preferida',
      saved: 'Morada guardada.',
      deleted: 'Morada removida.',
      defaultSaved: 'Preferência atualizada.',
      label: 'Nome',
      nif: 'NIF',
      address: 'Morada',
      postalCode: 'Código postal',
      locality: 'Localidade',
      country: 'País',
      optional: 'opcional',
      save: 'Guardar morada',
      cancel: 'Cancelar',
    },
    en: {
      title: 'Addresses',
      billing: 'Billing',
      delivery: 'Delivery',
      addBilling: 'Add billing',
      addDelivery: 'Add delivery',
      emptyBilling: 'No billing addresses saved yet.',
      emptyDelivery: 'No delivery addresses saved yet.',
      edit: 'Edit',
      remove: 'Remove',
      makeDefault: 'Preferred',
      defaultLabel: 'Preferred',
      saved: 'Address saved.',
      deleted: 'Address removed.',
      defaultSaved: 'Preference updated.',
      label: 'Name',
      nif: 'Tax number',
      address: 'Address',
      postalCode: 'Postal code',
      locality: 'Locality',
      country: 'Country',
      optional: 'optional',
      save: 'Save address',
      cancel: 'Cancel',
    },
    es: {
      title: 'Direcciones',
      billing: 'Facturación',
      delivery: 'Entrega',
      addBilling: 'Añadir facturación',
      addDelivery: 'Añadir entrega',
      emptyBilling: 'Todavía no hay direcciones de facturación guardadas.',
      emptyDelivery: 'Todavía no hay direcciones de entrega guardadas.',
      edit: 'Editar',
      remove: 'Eliminar',
      makeDefault: 'Preferida',
      defaultLabel: 'Preferida',
      saved: 'Dirección guardada.',
      deleted: 'Dirección eliminada.',
      defaultSaved: 'Preferencia actualizada.',
      label: 'Nombre',
      nif: 'NIF',
      address: 'Dirección',
      postalCode: 'Código postal',
      locality: 'Localidad',
      country: 'País',
      optional: 'opcional',
      save: 'Guardar dirección',
      cancel: 'Cancelar',
    },
  }

  const t = $derived(copyByLanguage[data.language] ?? copyByLanguage.pt)
  const editorLabels = $derived({
    label: t.label,
    nif: t.nif,
    address: t.address,
    postalCode: t.postalCode,
    locality: t.locality,
    country: t.country,
    optional: t.optional,
    save: t.save,
    cancel: t.cancel,
  })
  let preferredAddressIds = $state<Partial<Record<AddressType, string>>>({})
  const addresses = $derived(
    data.addresses.map((address) => {
      const preferredId = preferredAddressIds[address.addressType as AddressType]
      return preferredId ? {...address, isDefault: address.id === preferredId} : address
    }),
  )
  const billingAddresses = $derived(addresses.filter((address) => address.addressType === 'billing'))
  const deliveryAddresses = $derived(addresses.filter((address) => address.addressType === 'delivery'))
  let creatingType = $state<AddressType | ''>('')
  let editingId = $state('')

  const startCreate = (type: AddressType) => {
    editingId = ''
    creatingType = type
  }
  const closeEditor = () => {
    creatingType = ''
    editingId = ''
  }

  // Refresh only the address list (depends('account:addresses')) instead of
  // invalidateAll() — keeps the shell mounted, no page remount.
  const onAddressSaved = async () => {
    closeEditor()
    preferredAddressIds = {}
    await invalidate('account:addresses')
    showToast(t.saved)
  }
  const onAddressError = (message: string) => {
    if (message) showToast(message, 'error')
  }
  const afterAddressAction =
    (successMessage: string): SubmitFunction =>
    () =>
    async ({result}) => {
      if (result.type === 'success') {
        preferredAddressIds = {}
        await invalidate('account:addresses')
        showToast(successMessage)
      } else if (result.type === 'failure') {
        const message = (result.data as {message?: string} | undefined)?.message
        if (message) showToast(message, 'error')
      }
    }

  const afterDefaultAction =
    (addressId: string, addressType: AddressType): SubmitFunction =>
    () =>
    async ({result}) => {
      if (result.type === 'success') {
        preferredAddressIds = {...preferredAddressIds, [addressType]: addressId}
        showToast(t.defaultSaved)
      } else if (result.type === 'failure') {
        const message = (result.data as {message?: string} | undefined)?.message
        if (message) showToast(message, 'error')
      }
    }
</script>

<svelte:head>
  <title>{t.title} | DaFábrica4You</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<Reveal class="account-card account-address-page-card" variant="card" priority>
    <div class="account-card-head">
      <h2>{t.title}</h2>
    </div>

    <div class="account-address-columns">
      <section class="account-address-section">
        <div class="account-address-section-head">
          <h3>{t.billing}</h3>
          <button class="account-edit-btn" type="button" onclick={() => startCreate('billing')}>{t.addBilling}</button>
        </div>

        {#if creatingType === 'billing'}
          <div class="account-inline-form">
            <AccountAddressEditor
              csrfToken={data.csrfToken}
              addressType="billing"
              labels={editorLabels}
              onCancel={closeEditor}
              onSuccess={onAddressSaved}
              onError={onAddressError}
            />
          </div>
        {/if}

        <div class="account-address-list">
          {#if billingAddresses.length}
            {#each billingAddresses as address, index (address.id)}
              {#if editingId === address.id}
                <div class="account-inline-form">
                  <AccountAddressEditor
                    csrfToken={data.csrfToken}
                    {address}
                    addressType="billing"
                    labels={editorLabels}
                    onCancel={closeEditor}
                    onSuccess={onAddressSaved}
                    onError={onAddressError}
                  />
                </div>
              {:else}
                <article
                  class="account-address-block"
                  class:is-default={address.isDefault}
                  style={`--item-index: ${index}`}
                >
                  <div class="account-address-block-head">
                    <span>{address.name || t.billing}</span>
                    {#if address.isDefault}
                      <span class="account-chip is-verified">{t.defaultLabel}</span>
                    {/if}
                  </div>
                  {#if address.nif}
                    <p class="account-address-nif">{t.nif}: {address.nif}</p>
                  {/if}
                  <p class="account-address">
                    {address.addressLine1}
                    {#if address.addressLine2}<br />{address.addressLine2}{/if}
                    <br />{address.postalCode} {address.locality}
                    <br />{address.country}
                  </p>
                  <div class="account-address-actions">
                    <button class="account-edit-btn" type="button" onclick={() => ((creatingType = ''), (editingId = address.id))}>
                      {t.edit}
                    </button>
                    {#if !address.isDefault}
                      <form
                        method="POST"
                        action="?/setDefault"
                        use:enhance={afterDefaultAction(address.id, 'billing')}
                      >
                        <input type="hidden" name="csrfToken" value={data.csrfToken} />
                        <input type="hidden" name="addressId" value={address.id} />
                        <button class="account-edit-btn" type="submit">{t.makeDefault}</button>
                      </form>
                    {/if}
                    <form method="POST" action="?/deleteAddress" use:enhance={afterAddressAction(t.deleted)}>
                      <input type="hidden" name="csrfToken" value={data.csrfToken} />
                      <input type="hidden" name="addressId" value={address.id} />
                      <button class="account-edit-btn danger" type="submit">{t.remove}</button>
                    </form>
                  </div>
                </article>
              {/if}
            {/each}
          {:else}
            <p class="account-empty">{t.emptyBilling}</p>
          {/if}
        </div>
      </section>

      <section class="account-address-section">
        <div class="account-address-section-head">
          <h3>{t.delivery}</h3>
          <button class="account-edit-btn" type="button" onclick={() => startCreate('delivery')}>{t.addDelivery}</button>
        </div>

        {#if creatingType === 'delivery'}
          <div class="account-inline-form">
            <AccountAddressEditor
              csrfToken={data.csrfToken}
              addressType="delivery"
              labels={editorLabels}
              onCancel={closeEditor}
              onSuccess={onAddressSaved}
              onError={onAddressError}
            />
          </div>
        {/if}

        <div class="account-address-list">
          {#if deliveryAddresses.length}
            {#each deliveryAddresses as address, index (address.id)}
              {#if editingId === address.id}
                <div class="account-inline-form">
                  <AccountAddressEditor
                    csrfToken={data.csrfToken}
                    {address}
                    addressType="delivery"
                    labels={editorLabels}
                    onCancel={closeEditor}
                    onSuccess={onAddressSaved}
                    onError={onAddressError}
                  />
                </div>
              {:else}
                <article
                  class="account-address-block"
                  class:is-default={address.isDefault}
                  style={`--item-index: ${index}`}
                >
                  <div class="account-address-block-head">
                    <span>{address.name || t.delivery}</span>
                    {#if address.isDefault}
                      <span class="account-chip is-verified">{t.defaultLabel}</span>
                    {/if}
                  </div>
                  <p class="account-address">
                    {address.addressLine1}
                    {#if address.addressLine2}<br />{address.addressLine2}{/if}
                    <br />{address.postalCode} {address.locality}
                    <br />{address.country}
                  </p>
                  <div class="account-address-actions">
                    <button class="account-edit-btn" type="button" onclick={() => ((creatingType = ''), (editingId = address.id))}>
                      {t.edit}
                    </button>
                    {#if !address.isDefault}
                      <form
                        method="POST"
                        action="?/setDefault"
                        use:enhance={afterDefaultAction(address.id, 'delivery')}
                      >
                        <input type="hidden" name="csrfToken" value={data.csrfToken} />
                        <input type="hidden" name="addressId" value={address.id} />
                        <button class="account-edit-btn" type="submit">{t.makeDefault}</button>
                      </form>
                    {/if}
                    <form method="POST" action="?/deleteAddress" use:enhance={afterAddressAction(t.deleted)}>
                      <input type="hidden" name="csrfToken" value={data.csrfToken} />
                      <input type="hidden" name="addressId" value={address.id} />
                      <button class="account-edit-btn danger" type="submit">{t.remove}</button>
                    </form>
                  </div>
                </article>
              {/if}
            {/each}
          {:else}
            <p class="account-empty">{t.emptyDelivery}</p>
          {/if}
        </div>
      </section>
    </div>
  </Reveal>

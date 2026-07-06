<script lang="ts">
  import AccountAddressEditor from '$lib/components/AccountAddressEditor.svelte'
  import Reveal from '$lib/components/Reveal.svelte'
  import {showToast} from '$lib/toast'

  let {data, form} = $props()

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
    address: string
    address2: string
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
      label: 'Nome da morada',
      address: 'Morada',
      address2: 'Complemento',
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
      label: 'Address name',
      address: 'Address',
      address2: 'Address line 2',
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
      label: 'Nombre de la dirección',
      address: 'Dirección',
      address2: 'Complemento',
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
    address: t.address,
    address2: t.address2,
    postalCode: t.postalCode,
    locality: t.locality,
    country: t.country,
    optional: t.optional,
    save: t.save,
    cancel: t.cancel,
  })
  const billingAddresses = $derived(data.addresses.filter((address) => address.addressType === 'billing'))
  const deliveryAddresses = $derived(data.addresses.filter((address) => address.addressType === 'delivery'))
  let creatingType = $state<AddressType | ''>('')
  let editingId = $state('')
  let toastKey = $state('')

  const startCreate = (type: AddressType) => {
    editingId = ''
    creatingType = type
  }
  const closeEditor = () => {
    creatingType = ''
    editingId = ''
  }
  $effect(() => {
    let key = ''
    let message = ''
    let tone: 'success' | 'error' = 'success'

    if (form?.address === 'saved') {
      key = 'address-saved'
      message = t.saved
    } else if (form?.address === 'deleted') {
      key = 'address-deleted'
      message = t.deleted
    } else if (form?.address === 'default') {
      key = 'address-default'
      message = t.defaultSaved
    } else if (form?.address === 'error' && form?.message) {
      key = `address-error-${form.message}`
      message = form.message
      tone = 'error'
    }

    if (key && key !== toastKey) {
      toastKey = key
      showToast(message, tone)
    }
  })
</script>

<svelte:head>
  <title>{t.title} | DaFábrica4You</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<Reveal class="account-card account-address-page-card" variant="card">
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
            />
          </div>
        {/if}

        <div class="account-address-list">
          {#if billingAddresses.length}
            {#each billingAddresses as address (address.id)}
              {#if editingId === address.id}
                <div class="account-inline-form">
                  <AccountAddressEditor
                    csrfToken={data.csrfToken}
                    {address}
                    addressType="billing"
                    labels={editorLabels}
                    onCancel={closeEditor}
                  />
                </div>
              {:else}
                <article class="account-address-block" class:is-default={address.isDefault}>
                  <div class="account-address-block-head">
                    <span>{address.name || t.billing}</span>
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
                      <form method="POST" action="?/setDefault">
                        <input type="hidden" name="csrfToken" value={data.csrfToken} />
                        <input type="hidden" name="addressId" value={address.id} />
                        <button class="account-edit-btn" type="submit">{t.makeDefault}</button>
                      </form>
                    {/if}
                    <form method="POST" action="?/deleteAddress">
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
            />
          </div>
        {/if}

        <div class="account-address-list">
          {#if deliveryAddresses.length}
            {#each deliveryAddresses as address (address.id)}
              {#if editingId === address.id}
                <div class="account-inline-form">
                  <AccountAddressEditor
                    csrfToken={data.csrfToken}
                    {address}
                    addressType="delivery"
                    labels={editorLabels}
                    onCancel={closeEditor}
                  />
                </div>
              {:else}
                <article class="account-address-block" class:is-default={address.isDefault}>
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
                      <form method="POST" action="?/setDefault">
                        <input type="hidden" name="csrfToken" value={data.csrfToken} />
                        <input type="hidden" name="addressId" value={address.id} />
                        <button class="account-edit-btn" type="submit">{t.makeDefault}</button>
                      </form>
                    {/if}
                    <form method="POST" action="?/deleteAddress">
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

<script lang="ts">
  import {enhance} from '$app/forms'
  import Reveal from '$lib/components/Reveal.svelte'

  let {data, form} = $props()

  const localeByLanguage: Record<string, string> = {pt: 'pt-PT', en: 'en-GB', es: 'es-ES'}
  const locale = $derived(localeByLanguage[data.language] ?? 'pt-PT')
  const money = $derived(
    new Intl.NumberFormat(locale, {style: 'currency', currency: 'EUR', minimumFractionDigits: 2}),
  )

  type Copy = {
    kicker: string
    greeting: string
    title: string
    logout: string
    details: string
    personal: string
    delivery: string
    firstName: string
    lastName: string
    name: string
    email: string
    phone: string
    nif: string
    optional: string
    type: string
    individual: string
    company: string
    address: string
    postalCode: string
    locality: string
    emailStatus: string
    verified: string
    pending: string
    empty: string
    edit: string
    save: string
    cancel: string
    saved: string
    nameError: string
    orders: string
    noOrders: string
    verifyTitle: string
    verifyBody: string
    resend: string
    resent: string
    already: string
    emailFailed: string
  }

  const copyByLanguage: Record<string, Copy> = {
    pt: {
      kicker: 'Área de cliente',
      greeting: 'Olá',
      title: 'A sua conta',
      logout: 'Terminar sessão',
      details: 'Os seus dados',
      personal: 'Dados pessoais',
      delivery: 'Morada de entrega',
      firstName: 'Primeiro nome',
      lastName: 'Apelido',
      name: 'Nome',
      email: 'Email',
      phone: 'Telefone',
      nif: 'NIF',
      optional: 'opcional',
      type: 'Tipo de cliente',
      individual: 'Particular',
      company: 'Empresa',
      address: 'Morada',
      postalCode: 'Código postal',
      locality: 'Localidade',
      emailStatus: 'Email',
      verified: 'Confirmado',
      pending: 'Por confirmar',
      empty: 'Por preencher',
      edit: 'Editar dados',
      save: 'Guardar',
      cancel: 'Cancelar',
      saved: 'Dados atualizados.',
      nameError: 'Indique o primeiro nome e o apelido.',
      orders: 'Encomendas',
      noOrders: 'Ainda não existem encomendas associadas a esta conta.',
      verifyTitle: 'Confirme o seu email',
      verifyBody: 'Enviámos um link de confirmação para o seu email. Confirme para proteger a sua conta.',
      resend: 'Reenviar email',
      resent: 'Email de confirmação reenviado. Verifique a sua caixa de entrada.',
      already: 'O seu email já está confirmado.',
      emailFailed: 'Não foi possível enviar o email de confirmação. Confirme a configuração de email e tente reenviar.',
    },
    en: {
      kicker: 'Customer area',
      greeting: 'Hi',
      title: 'Your account',
      logout: 'Sign out',
      details: 'Your details',
      personal: 'Personal details',
      delivery: 'Delivery address',
      firstName: 'First name',
      lastName: 'Last name',
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      nif: 'Tax number',
      optional: 'optional',
      type: 'Customer type',
      individual: 'Individual',
      company: 'Company',
      address: 'Address',
      postalCode: 'Postcode',
      locality: 'Location',
      emailStatus: 'Email',
      verified: 'Confirmed',
      pending: 'Unconfirmed',
      empty: 'Not set',
      edit: 'Edit details',
      save: 'Save',
      cancel: 'Cancel',
      saved: 'Details updated.',
      nameError: 'Enter your first and last name.',
      orders: 'Orders',
      noOrders: 'No orders are linked to this account yet.',
      verifyTitle: 'Confirm your email',
      verifyBody: 'We sent a confirmation link to your email. Confirm it to protect your account.',
      resend: 'Resend email',
      resent: 'Confirmation email sent again. Check your inbox.',
      already: 'Your email is already confirmed.',
      emailFailed: 'The confirmation email could not be sent. Check the email configuration and try resending.',
    },
    es: {
      kicker: 'Área de cliente',
      greeting: 'Hola',
      title: 'Tu cuenta',
      logout: 'Cerrar sesión',
      details: 'Tus datos',
      personal: 'Datos personales',
      delivery: 'Dirección de entrega',
      firstName: 'Nombre',
      lastName: 'Apellidos',
      name: 'Nombre',
      email: 'Email',
      phone: 'Teléfono',
      nif: 'NIF',
      optional: 'opcional',
      type: 'Tipo de cliente',
      individual: 'Particular',
      company: 'Empresa',
      address: 'Dirección',
      postalCode: 'Código postal',
      locality: 'Localidad',
      emailStatus: 'Email',
      verified: 'Confirmado',
      pending: 'Sin confirmar',
      empty: 'Sin definir',
      edit: 'Editar datos',
      save: 'Guardar',
      cancel: 'Cancelar',
      saved: 'Datos actualizados.',
      nameError: 'Indica el nombre y los apellidos.',
      orders: 'Pedidos',
      noOrders: 'Todavía no hay pedidos asociados a esta cuenta.',
      verifyTitle: 'Confirma tu email',
      verifyBody: 'Enviamos un enlace de confirmación a tu email. Confírmalo para proteger tu cuenta.',
      resend: 'Reenviar email',
      resent: 'Email de confirmación reenviado. Revisa tu bandeja de entrada.',
      already: 'Tu email ya está confirmado.',
      emailFailed: 'No fue posible enviar el email de confirmación. Comprueba la configuración de email e intenta reenviar.',
    },
  }

  const t = $derived(copyByLanguage[data.language] ?? copyByLanguage.pt)
  const firstName = $derived(data.customer.name.trim().split(/\s+/)[0] ?? '')
  const typeLabel = $derived(
    data.customer.purchaseType === 'company' ? t.company : t.individual,
  )

  let editing = $state(false)
  let saved = $state(false)
  const fields = $state({
    firstName: '',
    lastName: '',
    phone: '',
    nif: '',
    purchaseType: 'individual',
    address: '',
    postalCode: '',
    locality: '',
  })

  const startEdit = () => {
    const parts = data.customer.name.trim().split(/\s+/)
    fields.firstName = parts[0] ?? ''
    fields.lastName = parts.slice(1).join(' ')
    fields.phone = data.customer.phone ?? ''
    fields.nif = data.customer.nif ?? ''
    fields.purchaseType = data.customer.purchaseType === 'company' ? 'company' : 'individual'
    fields.address = data.deliveryAddress?.addressLine1 ?? ''
    fields.postalCode = data.deliveryAddress?.postalCode ?? ''
    fields.locality = data.deliveryAddress?.locality ?? ''
    saved = false
    editing = true
  }
</script>

<svelte:head>
  <title>{t.title} | DaFábrica4You</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="account-page">
  <section class="account-shell">
    <header class="account-head">
      <div>
        <p class="kicker">{t.kicker}</p>
        <h1>{firstName ? `${t.greeting}, ${firstName}` : t.title}</h1>
      </div>
      <form method="POST" action="/conta/sair?/logout">
        <input type="hidden" name="csrfToken" value={data.csrfToken} />
        <button class="button subtle" type="submit">{t.logout}</button>
      </form>
    </header>

    {#if !data.customer.emailVerifiedAt}
      <Reveal class="account-verify" variant="panel" priority>
        <div class="account-verify-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24"><path d="M4 6h16v12H4z" /><path d="m4 7 8 6 8-6" /></svg>
        </div>
        <div class="account-verify-body">
          <strong>{t.verifyTitle}</strong>
          <p>{t.verifyBody}</p>
          {#if form?.resend === 'sent'}
            <p class="account-verify-note success" role="status">{t.resent}</p>
          {:else if form?.resend === 'already'}
            <p class="account-verify-note success" role="status">{t.already}</p>
          {:else if form?.resend === 'error' && form?.message}
            <p class="account-verify-note" role="alert">{form.message}</p>
          {:else if data.emailDelivery === 'failed'}
            <p class="account-verify-note" role="alert">{t.emailFailed}</p>
          {/if}
        </div>
        <form method="POST" action="?/resendVerification">
          <input type="hidden" name="csrfToken" value={data.csrfToken} />
          <button class="button subtle" type="submit">{t.resend}</button>
        </form>
      </Reveal>
    {/if}

    <div class="account-grid">
      <Reveal class="account-card account-details-card" variant="card">
        <div class="account-card-head">
          <h2>{t.details}</h2>
          {#if !editing}
            <button class="account-edit-btn" type="button" onclick={startEdit}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3Z" /><path d="M13.5 6.5l3 3" /></svg>
              {t.edit}
            </button>
          {/if}
        </div>

        {#if saved && !editing}
          <p class="form-feedback success" role="status">{t.saved}</p>
        {/if}

        {#if editing}
          <form
            method="POST"
            action="?/updateProfile"
            class="account-form account-edit-form"
            use:enhance={() =>
              async ({result, update}) => {
                await update({reset: false})
                if (result.type === 'success') {
                  editing = false
                  saved = true
                }
              }}
          >
            <input type="hidden" name="csrfToken" value={data.csrfToken} />

            {#if form?.profile === 'error' && form?.message}
              <p class="form-feedback" role="alert">{form.message}</p>
            {/if}

            <p class="account-form-group">{t.personal}</p>
            <div class="account-form-row">
              <label>
                <span>{t.firstName}</span>
                <input name="firstName" autocomplete="given-name" required bind:value={fields.firstName} />
              </label>
              <label>
                <span>{t.lastName}</span>
                <input name="lastName" autocomplete="family-name" required bind:value={fields.lastName} />
              </label>
            </div>
            <div class="account-form-row">
              <label>
                <span>{t.phone} <em>({t.optional})</em></span>
                <input name="phone" type="tel" autocomplete="tel" bind:value={fields.phone} />
              </label>
              <label>
                <span>{t.nif} <em>({t.optional})</em></span>
                <input name="nif" inputmode="numeric" bind:value={fields.nif} />
              </label>
            </div>
            <label>
              <span>{t.type}</span>
              <select name="purchaseType" bind:value={fields.purchaseType}>
                <option value="individual">{t.individual}</option>
                <option value="company">{t.company}</option>
              </select>
            </label>

            <p class="account-form-group">{t.delivery} <em>({t.optional})</em></p>
            <label>
              <span>{t.address}</span>
              <input name="addressLine1" autocomplete="street-address" bind:value={fields.address} />
            </label>
            <div class="account-form-row">
              <label>
                <span>{t.postalCode}</span>
                <input name="postalCode" autocomplete="postal-code" bind:value={fields.postalCode} />
              </label>
              <label>
                <span>{t.locality}</span>
                <input name="locality" autocomplete="address-level2" bind:value={fields.locality} />
              </label>
            </div>

            <div class="account-edit-actions">
              <button class="button primary" type="submit">{t.save}</button>
              <button class="button subtle" type="button" onclick={() => (editing = false)}>
                {t.cancel}
              </button>
            </div>
          </form>
        {:else}
          <dl class="account-details">
            <div>
              <dt>{t.name}</dt>
              <dd>{data.customer.name || t.empty}</dd>
            </div>
            <div>
              <dt>{t.email}</dt>
              <dd>{data.customer.email}</dd>
            </div>
            <div>
              <dt>{t.phone}</dt>
              <dd>{data.customer.phone || t.empty}</dd>
            </div>
            <div>
              <dt>{t.nif}</dt>
              <dd>{data.customer.nif || t.empty}</dd>
            </div>
            <div>
              <dt>{t.type}</dt>
              <dd>{typeLabel}</dd>
            </div>
            <div>
              <dt>{t.emailStatus}</dt>
              <dd>
                <span class="account-chip" class:is-verified={data.customer.emailVerifiedAt}>
                  {data.customer.emailVerifiedAt ? t.verified : t.pending}
                </span>
              </dd>
            </div>
          </dl>

          <div class="account-subsection">
            <h3>{t.delivery}</h3>
            {#if data.deliveryAddress?.addressLine1}
              <p class="account-address">
                {data.deliveryAddress.addressLine1}<br />
                {data.deliveryAddress.postalCode}
                {data.deliveryAddress.locality}
              </p>
            {:else}
              <p class="account-empty">{t.empty}</p>
            {/if}
          </div>
        {/if}
      </Reveal>

      <Reveal class="account-card account-orders" variant="card" delay={80}>
        <h2>{t.orders}</h2>
        {#if data.orders.length}
          <div class="account-order-list">
            {#each data.orders as order}
              <article>
                <div>
                  <strong>{order.orderNumber}</strong>
                  <span>{new Date(order.createdAt).toLocaleDateString(locale)}</span>
                </div>
                <span class="account-order-status">{order.status}</span>
                <strong>{money.format(order.totalGross)}</strong>
              </article>
            {/each}
          </div>
        {:else}
          <p class="account-empty">{t.noOrders}</p>
        {/if}
      </Reveal>
    </div>
  </section>
</main>

<script lang="ts">
  import {enhance} from '$app/forms'
  import Reveal from '$lib/components/Reveal.svelte'
  import {showToast} from '$lib/toast'

  let {data, form} = $props()

  type Copy = {
    title: string
    personal: string
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
    emailStatus: string
    verified: string
    pending: string
    empty: string
    edit: string
    save: string
    cancel: string
    saved: string
    verifyTitle: string
    verifyBody: string
    resend: string
    resent: string
    already: string
    emailFailed: string
  }

  const copyByLanguage: Record<string, Copy> = {
    pt: {
      title: 'Dados',
      personal: 'Dados pessoais',
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
      emailStatus: 'Email',
      verified: 'Confirmado',
      pending: 'Por confirmar',
      empty: 'Por preencher',
      edit: 'Editar dados',
      save: 'Guardar',
      cancel: 'Cancelar',
      saved: 'Dados atualizados.',
      verifyTitle: 'Confirme o seu email',
      verifyBody: 'Enviámos um link de confirmação para o seu email. Confirme para proteger a sua conta.',
      resend: 'Reenviar email',
      resent: 'Email de confirmação reenviado. Verifique a sua caixa de entrada.',
      already: 'O seu email já está confirmado.',
      emailFailed: 'Não foi possível enviar o email de confirmação. Confirme a configuração de email e tente reenviar.',
    },
    en: {
      title: 'Details',
      personal: 'Personal details',
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
      emailStatus: 'Email',
      verified: 'Confirmed',
      pending: 'Unconfirmed',
      empty: 'Not set',
      edit: 'Edit details',
      save: 'Save',
      cancel: 'Cancel',
      saved: 'Details updated.',
      verifyTitle: 'Confirm your email',
      verifyBody: 'We sent a confirmation link to your email. Confirm it to protect your account.',
      resend: 'Resend email',
      resent: 'Confirmation email sent again. Check your inbox.',
      already: 'Your email is already confirmed.',
      emailFailed: 'The confirmation email could not be sent. Check the email configuration and try resending.',
    },
    es: {
      title: 'Datos',
      personal: 'Datos personales',
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
      emailStatus: 'Email',
      verified: 'Confirmado',
      pending: 'Sin confirmar',
      empty: 'Sin definir',
      edit: 'Editar datos',
      save: 'Guardar',
      cancel: 'Cancelar',
      saved: 'Datos actualizados.',
      verifyTitle: 'Confirma tu email',
      verifyBody: 'Enviamos un enlace de confirmación a tu email. Confírmalo para proteger tu cuenta.',
      resend: 'Reenviar email',
      resent: 'Email de confirmación reenviado. Revisa tu bandeja de entrada.',
      already: 'Tu email ya está confirmado.',
      emailFailed: 'No fue posible enviar el email de confirmación. Comprueba la configuración de email e intenta reenviar.',
    },
  }

  const t = $derived(copyByLanguage[data.language] ?? copyByLanguage.pt)
  // Local, optimistic view of the editable fields so saving reflects instantly
  // without invalidateAll() (which re-runs every load and remounts the page).
  const profile = $state({
    name: '',
    phone: '',
    nif: '',
    purchaseType: 'individual',
  })
  let profileLoadedFor = $state('')
  const typeLabel = $derived(profile.purchaseType === 'company' ? t.company : t.individual)
  let editing = $state(false)
  let toastKey = $state('')
  const fields = $state({
    firstName: '',
    lastName: '',
    phone: '',
    nif: '',
    purchaseType: 'individual',
  })

  const startEdit = () => {
    const parts = profile.name.trim().split(/\s+/)
    fields.firstName = parts[0] ?? ''
    fields.lastName = parts.slice(1).join(' ')
    fields.phone = profile.phone ?? ''
    fields.nif = profile.nif ?? ''
    fields.purchaseType = profile.purchaseType === 'company' ? 'company' : 'individual'
    editing = true
  }

  $effect(() => {
    const customer = data.customer
    if (profileLoadedFor === customer.id) return

    profile.name = customer.name
    profile.phone = customer.phone
    profile.nif = customer.nif
    profile.purchaseType = customer.purchaseType
    profileLoadedFor = customer.id
  })

  // Profile + resend feedback is handled inline via enhance (no reload); this
  // only covers the load-time "email delivery failed" query flag.
  $effect(() => {
    if (data.emailDelivery === 'failed' && toastKey !== 'email-failed') {
      toastKey = 'email-failed'
      showToast(t.emailFailed, 'error')
    }
  })
</script>

<svelte:head>
  <title>{t.title} | DaFábrica4You</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

{#if !data.customer.emailVerifiedAt}
    <Reveal class="account-verify" variant="panel" priority>
      <div class="account-verify-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24"><path d="M4 6h16v12H4z" /><path d="m4 7 8 6 8-6" /></svg>
      </div>
      <div class="account-verify-body">
        <strong>{t.verifyTitle}</strong>
        <p>{t.verifyBody}</p>
      </div>
      <form
        method="POST"
        action="?/resendVerification"
        use:enhance={() =>
          async ({result}) => {
            if (result.type === 'success') {
              const state = (result.data as {resend?: string} | undefined)?.resend
              showToast(state === 'already' ? t.already : t.resent, state === 'already' ? 'info' : 'success')
            } else if (result.type === 'failure') {
              const message = (result.data as {message?: string} | undefined)?.message
              showToast(message || t.emailFailed, 'error')
            }
          }}
      >
        <input type="hidden" name="csrfToken" value={data.csrfToken} />
        <button class="button subtle" type="submit">{t.resend}</button>
      </form>
    </Reveal>
  {/if}

  <Reveal class="account-card account-details-card" variant="card">
    <div class="account-card-head">
      <h2>{t.title}</h2>
      {#if !editing}
        <button class="account-edit-btn" type="button" onclick={startEdit}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3Z" /><path d="M13.5 6.5l3 3" /></svg>
          {t.edit}
        </button>
      {/if}
    </div>

    {#if editing}
      <form
        method="POST"
        action="?/updateProfile"
        class="account-form account-edit-form"
        use:enhance={() =>
          async ({result}) => {
            if (result.type === 'success') {
              profile.name = `${fields.firstName} ${fields.lastName}`.trim()
              profile.phone = fields.phone
              profile.nif = fields.nif
              profile.purchaseType = fields.purchaseType
              editing = false
              showToast(t.saved)
            } else if (result.type === 'failure') {
              const message = (result.data as {message?: string} | undefined)?.message
              showToast(message || t.saved, 'error')
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
          <dd>{profile.name || t.empty}</dd>
        </div>
        <div>
          <dt>{t.email}</dt>
          <dd>{data.customer.email}</dd>
        </div>
        <div>
          <dt>{t.phone}</dt>
          <dd>{profile.phone || t.empty}</dd>
        </div>
        <div>
          <dt>{t.nif}</dt>
          <dd>{profile.nif || t.empty}</dd>
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
    {/if}
  </Reveal>

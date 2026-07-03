<script lang="ts">
  import AccountAuthLayout from '$lib/components/AccountAuthLayout.svelte'

  let {data, form} = $props()
  const token = $derived(form?.token ?? data.token)

  type Copy = {
    kicker: string
    title: string
    lead: string
    password: string
    passwordHint: string
    submit: string
    notConfigured: string
  }

  const copyByLanguage: Record<string, Copy> = {
    pt: {
      kicker: 'Conta',
      title: 'Definir nova password',
      lead: 'Escolha uma password segura para a sua conta.',
      password: 'Nova password',
      passwordHint: 'Pelo menos 10 caracteres.',
      submit: 'Guardar password',
      notConfigured: 'A área de cliente ainda não está configurada neste ambiente.',
    },
    en: {
      kicker: 'Account',
      title: 'Set a new password',
      lead: 'Choose a secure password for your account.',
      password: 'New password',
      passwordHint: 'At least 10 characters.',
      submit: 'Save password',
      notConfigured: 'The customer area is not configured in this environment yet.',
    },
    es: {
      kicker: 'Cuenta',
      title: 'Definir nueva contraseña',
      lead: 'Elige una contraseña segura para tu cuenta.',
      password: 'Nueva contraseña',
      passwordHint: 'Al menos 10 caracteres.',
      submit: 'Guardar contraseña',
      notConfigured: 'El área de cliente aún no está configurada en este entorno.',
    },
  }

  const t = $derived(copyByLanguage[data.language] ?? copyByLanguage.pt)
</script>

<svelte:head>
  <title>{t.title} | DaFábrica4You</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<AccountAuthLayout language={data.language} kicker={t.kicker} title={t.title} lead={t.lead}>
  {#if form?.message}
    <p class="form-feedback" role="alert">{form.message}</p>
  {/if}
  {#if !data.databaseReady}
    <p class="form-feedback">{t.notConfigured}</p>
  {/if}

  <form method="POST" class="account-form">
    <input type="hidden" name="csrfToken" value={data.csrfToken} />
    <input type="hidden" name="token" value={token} />
    <label>
      <span>{t.password}</span>
      <input name="password" type="password" autocomplete="new-password" minlength="10" required />
      <small class="account-hint">{t.passwordHint}</small>
    </label>
    <button class="button primary" type="submit" disabled={!token}>{t.submit}</button>
  </form>
</AccountAuthLayout>

<script lang="ts">
  import AccountAuthLayout from '$lib/components/AccountAuthLayout.svelte'

  let {data, form} = $props()

  type Copy = {
    kicker: string
    title: string
    lead: string
    email: string
    submit: string
    back: string
    signIn: string
    notConfigured: string
  }

  const copyByLanguage: Record<string, Copy> = {
    pt: {
      kicker: 'Conta',
      title: 'Recuperar password',
      lead: '',
      email: 'Email',
      submit: 'Enviar link',
      back: 'Lembrou-se?',
      signIn: 'Entrar',
      notConfigured: 'A área de cliente ainda não está configurada neste ambiente.',
    },
    en: {
      kicker: 'Account',
      title: 'Reset password',
      lead: '',
      email: 'Email',
      submit: 'Send link',
      back: 'Remembered it?',
      signIn: 'Sign in',
      notConfigured: 'The customer area is not configured in this environment yet.',
    },
    es: {
      kicker: 'Cuenta',
      title: 'Recuperar contraseña',
      lead: '',
      email: 'Email',
      submit: 'Enviar enlace',
      back: '¿Ya la recuerdas?',
      signIn: 'Entrar',
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
    <p class="form-feedback" class:success={form.success} role={form?.success ? 'status' : 'alert'}>
      {form.message}
    </p>
  {/if}
  {#if !data.databaseReady}
    <p class="form-feedback">{t.notConfigured}</p>
  {/if}

  <form method="POST" class="account-form">
    <input type="hidden" name="csrfToken" value={data.csrfToken} />
    <label>
      <span>{t.email}</span>
      <input name="email" type="email" autocomplete="email" required value={form?.email ?? ''} />
    </label>
    <button class="button primary" type="submit">{t.submit}</button>
  </form>

  <div class="auth-alt">
    <p>{t.back} <a href={`/conta/entrar?lang=${data.language}`}>{t.signIn}</a></p>
  </div>
</AccountAuthLayout>

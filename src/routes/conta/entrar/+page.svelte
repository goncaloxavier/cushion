<script lang="ts">
  import AccountAuthLayout from '$lib/components/AccountAuthLayout.svelte'

  let {data, form} = $props()

  type Copy = {
    kicker: string
    title: string
    lead: string
    email: string
    password: string
    submit: string
    noAccount: string
    createAccount: string
    forgot: string
    notConfigured: string
    verified: string
    reset: string
  }

  const copyByLanguage: Record<string, Copy> = {
    pt: {
      kicker: 'Conta',
      title: 'Entrar',
      lead: 'Aceda à sua área de cliente.',
      email: 'Email',
      password: 'Password',
      submit: 'Entrar',
      noAccount: 'Ainda não tem conta?',
      createAccount: 'Criar conta',
      forgot: 'Esqueceu-se da password?',
      notConfigured: 'A área de cliente ainda não está configurada neste ambiente.',
      verified: 'Email confirmado. Já pode entrar.',
      reset: 'Password atualizada. Entre com a nova password.',
    },
    en: {
      kicker: 'Account',
      title: 'Sign in',
      lead: 'Access your customer area.',
      email: 'Email',
      password: 'Password',
      submit: 'Sign in',
      noAccount: "Don't have an account yet?",
      createAccount: 'Create account',
      forgot: 'Forgot your password?',
      notConfigured: 'The customer area is not configured in this environment yet.',
      verified: 'Email confirmed. You can sign in now.',
      reset: 'Password updated. Sign in with your new password.',
    },
    es: {
      kicker: 'Cuenta',
      title: 'Entrar',
      lead: 'Accede a tu área de cliente.',
      email: 'Email',
      password: 'Contraseña',
      submit: 'Entrar',
      noAccount: '¿Aún no tienes cuenta?',
      createAccount: 'Crear cuenta',
      forgot: '¿Olvidaste tu contraseña?',
      notConfigured: 'El área de cliente aún no está configurada en este entorno.',
      verified: 'Email confirmado. Ya puedes entrar.',
      reset: 'Contraseña actualizada. Entra con la nueva contraseña.',
    },
  }

  const t = $derived(copyByLanguage[data.language] ?? copyByLanguage.pt)
</script>

<svelte:head>
  <title>{t.title} | DaFábrica4You</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<AccountAuthLayout language={data.language} kicker={t.kicker} title={t.title} lead={t.lead}>
  {#if data.justVerified}
    <p class="form-feedback success" role="status">{t.verified}</p>
  {/if}
  {#if data.justReset}
    <p class="form-feedback success" role="status">{t.reset}</p>
  {/if}
  {#if !data.databaseReady}
    <p class="form-feedback">{t.notConfigured}</p>
  {/if}
  {#if form?.message}
    <p class="form-feedback" role="alert">{form.message}</p>
  {/if}

  <form method="POST" class="account-form">
    <input type="hidden" name="csrfToken" value={data.csrfToken} />
    <input type="hidden" name="language" value={data.language} />
    <label>
      <span>{t.email}</span>
      <input name="email" type="email" autocomplete="email" required value={form?.email ?? ''} />
    </label>
    <label>
      <span>{t.password}</span>
      <input name="password" type="password" autocomplete="current-password" required />
    </label>
    <button class="button primary" type="submit">{t.submit}</button>
  </form>

  <div class="auth-alt">
    <p>{t.noAccount} <a href={`/conta/registar?lang=${data.language}`}>{t.createAccount}</a></p>
    <p><a href={`/conta/recuperar-password?lang=${data.language}`}>{t.forgot}</a></p>
  </div>
</AccountAuthLayout>

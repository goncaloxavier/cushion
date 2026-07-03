<script lang="ts">
  import AccountAuthLayout from '$lib/components/AccountAuthLayout.svelte'

  let {data, form} = $props()
  const values = $derived(form?.values ?? {})

  type Copy = {
    kicker: string
    title: string
    lead: string
    firstName: string
    lastName: string
    email: string
    phone: string
    optional: string
    nif: string
    password: string
    passwordConfirm: string
    passwordHint: string
    submit: string
    haveAccount: string
    signIn: string
    notConfigured: string
    strength: {weak: string; medium: string; strong: string; veryStrong: string}
    match: string
    noMatch: string
  }

  const copyByLanguage: Record<string, Copy> = {
    pt: {
      kicker: 'Conta',
      title: 'Criar conta',
      lead: 'Leva menos de um minuto.',
      firstName: 'Primeiro nome',
      lastName: 'Apelido',
      email: 'Email',
      phone: 'Telemóvel',
      optional: 'opcional',
      nif: 'NIF',
      password: 'Password',
      passwordConfirm: 'Repita a password',
      passwordHint: 'Pelo menos 10 caracteres.',
      submit: 'Criar conta',
      haveAccount: 'Já tem conta?',
      signIn: 'Entrar',
      notConfigured: 'A área de cliente ainda não está configurada neste ambiente.',
      strength: {weak: 'Fraca', medium: 'Média', strong: 'Forte', veryStrong: 'Muito forte'},
      match: 'As passwords coincidem.',
      noMatch: 'As passwords não coincidem.',
    },
    en: {
      kicker: 'Account',
      title: 'Create account',
      lead: 'Takes less than a minute.',
      firstName: 'First name',
      lastName: 'Last name',
      email: 'Email',
      phone: 'Phone',
      optional: 'optional',
      nif: 'Tax number',
      password: 'Password',
      passwordConfirm: 'Repeat password',
      passwordHint: 'At least 10 characters.',
      submit: 'Create account',
      haveAccount: 'Already have an account?',
      signIn: 'Sign in',
      notConfigured: 'The customer area is not configured in this environment yet.',
      strength: {weak: 'Weak', medium: 'Medium', strong: 'Strong', veryStrong: 'Very strong'},
      match: 'Passwords match.',
      noMatch: "Passwords don't match.",
    },
    es: {
      kicker: 'Cuenta',
      title: 'Crear cuenta',
      lead: 'Tardas menos de un minuto.',
      firstName: 'Nombre',
      lastName: 'Apellidos',
      email: 'Email',
      phone: 'Teléfono',
      optional: 'opcional',
      nif: 'NIF',
      password: 'Contraseña',
      passwordConfirm: 'Repite la contraseña',
      passwordHint: 'Al menos 10 caracteres.',
      submit: 'Crear cuenta',
      haveAccount: '¿Ya tienes cuenta?',
      signIn: 'Entrar',
      notConfigured: 'El área de cliente aún no está configurada en este entorno.',
      strength: {weak: 'Débil', medium: 'Media', strong: 'Fuerte', veryStrong: 'Muy fuerte'},
      match: 'Las contraseñas coinciden.',
      noMatch: 'Las contraseñas no coinciden.',
    },
  }

  const t = $derived(copyByLanguage[data.language] ?? copyByLanguage.pt)

  // Curated dial codes — Portugal first, then the markets that matter, then a
  // broad fallback set. Value is the E.164 dial prefix.
  const countries = [
    {code: '+351', label: 'Portugal', flag: '🇵🇹'},
    {code: '+34', label: 'España', flag: '🇪🇸'},
    {code: '+33', label: 'France', flag: '🇫🇷'},
    {code: '+44', label: 'United Kingdom', flag: '🇬🇧'},
    {code: '+49', label: 'Deutschland', flag: '🇩🇪'},
    {code: '+39', label: 'Italia', flag: '🇮🇹'},
    {code: '+31', label: 'Nederland', flag: '🇳🇱'},
    {code: '+32', label: 'België', flag: '🇧🇪'},
    {code: '+41', label: 'Schweiz', flag: '🇨🇭'},
    {code: '+353', label: 'Ireland', flag: '🇮🇪'},
    {code: '+352', label: 'Luxembourg', flag: '🇱🇺'},
    {code: '+43', label: 'Österreich', flag: '🇦🇹'},
    {code: '+45', label: 'Danmark', flag: '🇩🇰'},
    {code: '+46', label: 'Sverige', flag: '🇸🇪'},
    {code: '+1', label: 'USA / Canada', flag: '🇺🇸'},
    {code: '+55', label: 'Brasil', flag: '🇧🇷'},
    {code: '+244', label: 'Angola', flag: '🇦🇴'},
    {code: '+258', label: 'Moçambique', flag: '🇲🇿'},
    {code: '+238', label: 'Cabo Verde', flag: '🇨🇻'},
  ]

  let phoneCountry = $state((values.phoneCountry as string) || '+351')
  let password = $state('')
  let passwordConfirm = $state('')

  const strength = $derived.by(() => {
    const pw = password
    if (!pw) return {score: 0, pct: 0, label: '', klass: ''}
    let score = 0
    if (pw.length >= 10) score++
    if (pw.length >= 14) score++
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++
    if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) score++
    score = Math.min(score, 4)
    if (score <= 1) return {score, pct: 28, label: t.strength.weak, klass: 'weak'}
    if (score === 2) return {score, pct: 58, label: t.strength.medium, klass: 'medium'}
    if (score === 3) return {score, pct: 82, label: t.strength.strong, klass: 'strong'}
    return {score, pct: 100, label: t.strength.veryStrong, klass: 'strong'}
  })

  const confirmState = $derived(
    passwordConfirm.length === 0 ? '' : passwordConfirm === password ? 'ok' : 'bad',
  )
</script>

<svelte:head>
  <title>{t.title} | DaFábrica4You</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<AccountAuthLayout kicker={t.kicker} title={t.title} lead={t.lead}>
  {#if !data.databaseReady}
    <p class="form-feedback">{t.notConfigured}</p>
  {/if}
  {#if form?.message}
    <p class="form-feedback" role="alert">{form.message}</p>
  {/if}

  <form method="POST" class="account-form">
    <input type="hidden" name="csrfToken" value={data.csrfToken} />
    <input type="hidden" name="language" value={data.language} />

    <div class="account-form-row">
      <label>
        <span>{t.firstName}</span>
        <input name="firstName" autocomplete="given-name" required value={values.firstName ?? ''} />
      </label>
      <label>
        <span>{t.lastName}</span>
        <input name="lastName" autocomplete="family-name" required value={values.lastName ?? ''} />
      </label>
    </div>

    <label>
      <span>{t.email}</span>
      <input name="email" type="email" autocomplete="email" required value={values.email ?? ''} />
    </label>

    <label>
      <span>{t.phone} <em>({t.optional})</em></span>
      <div class="phone-field">
        <select class="phone-cc" name="phoneCountry" bind:value={phoneCountry} aria-label="{t.phone} — país">
          {#each countries as country}
            <option value={country.code}>{country.flag} {country.code}</option>
          {/each}
        </select>
        <input
          class="phone-num"
          name="phone"
          type="tel"
          autocomplete="tel-national"
          inputmode="tel"
          value={values.phone ?? ''}
        />
      </div>
    </label>

    <label>
      <span>{t.nif} <em>({t.optional})</em></span>
      <input name="nif" inputmode="numeric" value={values.nif ?? ''} />
    </label>

    <label>
      <span>{t.password}</span>
      <input
        name="password"
        type="password"
        autocomplete="new-password"
        minlength="10"
        required
        bind:value={password}
      />
      {#if password}
        <span class="pw-meter" aria-hidden="true">
          <span class="pw-meter-track">
            <span class="pw-meter-fill {strength.klass}" style={`width:${strength.pct}%`}></span>
          </span>
          <span class="pw-meter-label {strength.klass}">{strength.label}</span>
        </span>
      {:else}
        <small class="account-hint">{t.passwordHint}</small>
      {/if}
    </label>

    <label>
      <span>{t.passwordConfirm}</span>
      <input
        name="passwordConfirm"
        type="password"
        autocomplete="new-password"
        minlength="10"
        required
        bind:value={passwordConfirm}
      />
      {#if confirmState}
        <small class="pw-match {confirmState}" role="status">
          {confirmState === 'ok' ? t.match : t.noMatch}
        </small>
      {/if}
    </label>

    <button class="button primary" type="submit" disabled={confirmState === 'bad'}>
      {t.submit}
    </button>
  </form>

  <div class="auth-alt">
    <p>{t.haveAccount} <a href={`/conta/entrar?lang=${data.language}`}>{t.signIn}</a></p>
  </div>
</AccountAuthLayout>

<script lang="ts">
  import AccountAuthLayout from '$lib/components/AccountAuthLayout.svelte'
  import {untrack} from 'svelte'

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
      lead: '',
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
      lead: '',
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
      lead: '',
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

  const countries = [
    {code: '+351', label: 'Portugal', flag: '🇵🇹'},
    {code: '+93', label: 'Afghanistan', flag: '🇦🇫'},
    {code: '+355', label: 'Albania', flag: '🇦🇱'},
    {code: '+213', label: 'Algeria', flag: '🇩🇿'},
    {code: '+1-684', label: 'American Samoa', flag: '🇦🇸'},
    {code: '+376', label: 'Andorra', flag: '🇦🇩'},
    {code: '+244', label: 'Angola', flag: '🇦🇴'},
    {code: '+1-264', label: 'Anguilla', flag: '🇦🇮'},
    {code: '+1-268', label: 'Antigua and Barbuda', flag: '🇦🇬'},
    {code: '+54', label: 'Argentina', flag: '🇦🇷'},
    {code: '+374', label: 'Armenia', flag: '🇦🇲'},
    {code: '+297', label: 'Aruba', flag: '🇦🇼'},
    {code: '+61', label: 'Australia', flag: '🇦🇺'},
    {code: '+43', label: 'Austria', flag: '🇦🇹'},
    {code: '+994', label: 'Azerbaijan', flag: '🇦🇿'},
    {code: '+1-242', label: 'Bahamas', flag: '🇧🇸'},
    {code: '+973', label: 'Bahrain', flag: '🇧🇭'},
    {code: '+880', label: 'Bangladesh', flag: '🇧🇩'},
    {code: '+1-246', label: 'Barbados', flag: '🇧🇧'},
    {code: '+375', label: 'Belarus', flag: '🇧🇾'},
    {code: '+32', label: 'Belgium', flag: '🇧🇪'},
    {code: '+501', label: 'Belize', flag: '🇧🇿'},
    {code: '+229', label: 'Benin', flag: '🇧🇯'},
    {code: '+1-441', label: 'Bermuda', flag: '🇧🇲'},
    {code: '+975', label: 'Bhutan', flag: '🇧🇹'},
    {code: '+591', label: 'Bolivia', flag: '🇧🇴'},
    {code: '+387', label: 'Bosnia and Herzegovina', flag: '🇧🇦'},
    {code: '+267', label: 'Botswana', flag: '🇧🇼'},
    {code: '+55', label: 'Brazil', flag: '🇧🇷'},
    {code: '+246', label: 'British Indian Ocean Territory', flag: '🇮🇴'},
    {code: '+1-284', label: 'British Virgin Islands', flag: '🇻🇬'},
    {code: '+673', label: 'Brunei', flag: '🇧🇳'},
    {code: '+359', label: 'Bulgaria', flag: '🇧🇬'},
    {code: '+226', label: 'Burkina Faso', flag: '🇧🇫'},
    {code: '+257', label: 'Burundi', flag: '🇧🇮'},
    {code: '+855', label: 'Cambodia', flag: '🇰🇭'},
    {code: '+237', label: 'Cameroon', flag: '🇨🇲'},
    {code: '+1', label: 'Canada', flag: '🇨🇦'},
    {code: '+238', label: 'Cape Verde', flag: '🇨🇻'},
    {code: '+1-345', label: 'Cayman Islands', flag: '🇰🇾'},
    {code: '+236', label: 'Central African Republic', flag: '🇨🇫'},
    {code: '+235', label: 'Chad', flag: '🇹🇩'},
    {code: '+56', label: 'Chile', flag: '🇨🇱'},
    {code: '+86', label: 'China', flag: '🇨🇳'},
    {code: '+57', label: 'Colombia', flag: '🇨🇴'},
    {code: '+269', label: 'Comoros', flag: '🇰🇲'},
    {code: '+682', label: 'Cook Islands', flag: '🇨🇰'},
    {code: '+506', label: 'Costa Rica', flag: '🇨🇷'},
    {code: '+385', label: 'Croatia', flag: '🇭🇷'},
    {code: '+53', label: 'Cuba', flag: '🇨🇺'},
    {code: '+599', label: 'Curacao', flag: '🇨🇼'},
    {code: '+357', label: 'Cyprus', flag: '🇨🇾'},
    {code: '+420', label: 'Czechia', flag: '🇨🇿'},
    {code: '+243', label: 'DR Congo', flag: '🇨🇩'},
    {code: '+45', label: 'Denmark', flag: '🇩🇰'},
    {code: '+253', label: 'Djibouti', flag: '🇩🇯'},
    {code: '+1-767', label: 'Dominica', flag: '🇩🇲'},
    {code: '+1-809', label: 'Dominican Republic', flag: '🇩🇴'},
    {code: '+593', label: 'Ecuador', flag: '🇪🇨'},
    {code: '+20', label: 'Egypt', flag: '🇪🇬'},
    {code: '+503', label: 'El Salvador', flag: '🇸🇻'},
    {code: '+240', label: 'Equatorial Guinea', flag: '🇬🇶'},
    {code: '+291', label: 'Eritrea', flag: '🇪🇷'},
    {code: '+372', label: 'Estonia', flag: '🇪🇪'},
    {code: '+268', label: 'Eswatini', flag: '🇸🇿'},
    {code: '+251', label: 'Ethiopia', flag: '🇪🇹'},
    {code: '+500', label: 'Falkland Islands', flag: '🇫🇰'},
    {code: '+298', label: 'Faroe Islands', flag: '🇫🇴'},
    {code: '+679', label: 'Fiji', flag: '🇫🇯'},
    {code: '+358', label: 'Finland', flag: '🇫🇮'},
    {code: '+33', label: 'France', flag: '🇫🇷'},
    {code: '+594', label: 'French Guiana', flag: '🇬🇫'},
    {code: '+689', label: 'French Polynesia', flag: '🇵🇫'},
    {code: '+241', label: 'Gabon', flag: '🇬🇦'},
    {code: '+220', label: 'Gambia', flag: '🇬🇲'},
    {code: '+995', label: 'Georgia', flag: '🇬🇪'},
    {code: '+49', label: 'Germany', flag: '🇩🇪'},
    {code: '+233', label: 'Ghana', flag: '🇬🇭'},
    {code: '+350', label: 'Gibraltar', flag: '🇬🇮'},
    {code: '+30', label: 'Greece', flag: '🇬🇷'},
    {code: '+299', label: 'Greenland', flag: '🇬🇱'},
    {code: '+1-473', label: 'Grenada', flag: '🇬🇩'},
    {code: '+590', label: 'Guadeloupe', flag: '🇬🇵'},
    {code: '+1-671', label: 'Guam', flag: '🇬🇺'},
    {code: '+502', label: 'Guatemala', flag: '🇬🇹'},
    {code: '+44-1481', label: 'Guernsey', flag: '🇬🇬'},
    {code: '+224', label: 'Guinea', flag: '🇬🇳'},
    {code: '+245', label: 'Guinea-Bissau', flag: '🇬🇼'},
    {code: '+592', label: 'Guyana', flag: '🇬🇾'},
    {code: '+509', label: 'Haiti', flag: '🇭🇹'},
    {code: '+504', label: 'Honduras', flag: '🇭🇳'},
    {code: '+852', label: 'Hong Kong', flag: '🇭🇰'},
    {code: '+36', label: 'Hungary', flag: '🇭🇺'},
    {code: '+354', label: 'Iceland', flag: '🇮🇸'},
    {code: '+91', label: 'India', flag: '🇮🇳'},
    {code: '+62', label: 'Indonesia', flag: '🇮🇩'},
    {code: '+98', label: 'Iran', flag: '🇮🇷'},
    {code: '+964', label: 'Iraq', flag: '🇮🇶'},
    {code: '+353', label: 'Ireland', flag: '🇮🇪'},
    {code: '+44-1624', label: 'Isle of Man', flag: '🇮🇲'},
    {code: '+972', label: 'Israel', flag: '🇮🇱'},
    {code: '+39', label: 'Italy', flag: '🇮🇹'},
    {code: '+225', label: 'Ivory Coast', flag: '🇨🇮'},
    {code: '+1-876', label: 'Jamaica', flag: '🇯🇲'},
    {code: '+81', label: 'Japan', flag: '🇯🇵'},
    {code: '+44-1534', label: 'Jersey', flag: '🇯🇪'},
    {code: '+962', label: 'Jordan', flag: '🇯🇴'},
    {code: '+7', label: 'Kazakhstan', flag: '🇰🇿'},
    {code: '+254', label: 'Kenya', flag: '🇰🇪'},
    {code: '+686', label: 'Kiribati', flag: '🇰🇮'},
    {code: '+383', label: 'Kosovo', flag: '🇽🇰'},
    {code: '+965', label: 'Kuwait', flag: '🇰🇼'},
    {code: '+996', label: 'Kyrgyzstan', flag: '🇰🇬'},
    {code: '+856', label: 'Laos', flag: '🇱🇦'},
    {code: '+371', label: 'Latvia', flag: '🇱🇻'},
    {code: '+961', label: 'Lebanon', flag: '🇱🇧'},
    {code: '+266', label: 'Lesotho', flag: '🇱🇸'},
    {code: '+231', label: 'Liberia', flag: '🇱🇷'},
    {code: '+218', label: 'Libya', flag: '🇱🇾'},
    {code: '+423', label: 'Liechtenstein', flag: '🇱🇮'},
    {code: '+370', label: 'Lithuania', flag: '🇱🇹'},
    {code: '+352', label: 'Luxembourg', flag: '🇱🇺'},
    {code: '+853', label: 'Macao', flag: '🇲🇴'},
    {code: '+261', label: 'Madagascar', flag: '🇲🇬'},
    {code: '+265', label: 'Malawi', flag: '🇲🇼'},
    {code: '+60', label: 'Malaysia', flag: '🇲🇾'},
    {code: '+960', label: 'Maldives', flag: '🇲🇻'},
    {code: '+223', label: 'Mali', flag: '🇲🇱'},
    {code: '+356', label: 'Malta', flag: '🇲🇹'},
    {code: '+692', label: 'Marshall Islands', flag: '🇲🇭'},
    {code: '+596', label: 'Martinique', flag: '🇲🇶'},
    {code: '+222', label: 'Mauritania', flag: '🇲🇷'},
    {code: '+230', label: 'Mauritius', flag: '🇲🇺'},
    {code: '+262', label: 'Mayotte', flag: '🇾🇹'},
    {code: '+52', label: 'Mexico', flag: '🇲🇽'},
    {code: '+691', label: 'Micronesia', flag: '🇫🇲'},
    {code: '+373', label: 'Moldova', flag: '🇲🇩'},
    {code: '+377', label: 'Monaco', flag: '🇲🇨'},
    {code: '+976', label: 'Mongolia', flag: '🇲🇳'},
    {code: '+382', label: 'Montenegro', flag: '🇲🇪'},
    {code: '+1-664', label: 'Montserrat', flag: '🇲🇸'},
    {code: '+212', label: 'Morocco', flag: '🇲🇦'},
    {code: '+258', label: 'Mozambique', flag: '🇲🇿'},
    {code: '+95', label: 'Myanmar', flag: '🇲🇲'},
    {code: '+264', label: 'Namibia', flag: '🇳🇦'},
    {code: '+674', label: 'Nauru', flag: '🇳🇷'},
    {code: '+977', label: 'Nepal', flag: '🇳🇵'},
    {code: '+31', label: 'Netherlands', flag: '🇳🇱'},
    {code: '+687', label: 'New Caledonia', flag: '🇳🇨'},
    {code: '+64', label: 'New Zealand', flag: '🇳🇿'},
    {code: '+505', label: 'Nicaragua', flag: '🇳🇮'},
    {code: '+227', label: 'Niger', flag: '🇳🇪'},
    {code: '+234', label: 'Nigeria', flag: '🇳🇬'},
    {code: '+683', label: 'Niue', flag: '🇳🇺'},
    {code: '+672', label: 'Norfolk Island', flag: '🇳🇫'},
    {code: '+850', label: 'North Korea', flag: '🇰🇵'},
    {code: '+389', label: 'North Macedonia', flag: '🇲🇰'},
    {code: '+1-670', label: 'Northern Mariana Islands', flag: '🇲🇵'},
    {code: '+47', label: 'Norway', flag: '🇳🇴'},
    {code: '+968', label: 'Oman', flag: '🇴🇲'},
    {code: '+92', label: 'Pakistan', flag: '🇵🇰'},
    {code: '+680', label: 'Palau', flag: '🇵🇼'},
    {code: '+970', label: 'Palestine', flag: '🇵🇸'},
    {code: '+507', label: 'Panama', flag: '🇵🇦'},
    {code: '+675', label: 'Papua New Guinea', flag: '🇵🇬'},
    {code: '+595', label: 'Paraguay', flag: '🇵🇾'},
    {code: '+51', label: 'Peru', flag: '🇵🇪'},
    {code: '+63', label: 'Philippines', flag: '🇵🇭'},
    {code: '+48', label: 'Poland', flag: '🇵🇱'},
    {code: '+1-787', label: 'Puerto Rico', flag: '🇵🇷'},
    {code: '+974', label: 'Qatar', flag: '🇶🇦'},
    {code: '+242', label: 'Republic of the Congo', flag: '🇨🇬'},
    {code: '+262', label: 'Reunion', flag: '🇷🇪'},
    {code: '+40', label: 'Romania', flag: '🇷🇴'},
    {code: '+7', label: 'Russia', flag: '🇷🇺'},
    {code: '+250', label: 'Rwanda', flag: '🇷🇼'},
    {code: '+590', label: 'Saint Barthelemy', flag: '🇧🇱'},
    {code: '+290', label: 'Saint Helena', flag: '🇸🇭'},
    {code: '+1-869', label: 'Saint Kitts and Nevis', flag: '🇰🇳'},
    {code: '+1-758', label: 'Saint Lucia', flag: '🇱🇨'},
    {code: '+590', label: 'Saint Martin', flag: '🇲🇫'},
    {code: '+508', label: 'Saint Pierre and Miquelon', flag: '🇵🇲'},
    {code: '+1-784', label: 'Saint Vincent and the Grenadines', flag: '🇻🇨'},
    {code: '+685', label: 'Samoa', flag: '🇼🇸'},
    {code: '+378', label: 'San Marino', flag: '🇸🇲'},
    {code: '+239', label: 'Sao Tome and Principe', flag: '🇸🇹'},
    {code: '+966', label: 'Saudi Arabia', flag: '🇸🇦'},
    {code: '+221', label: 'Senegal', flag: '🇸🇳'},
    {code: '+381', label: 'Serbia', flag: '🇷🇸'},
    {code: '+248', label: 'Seychelles', flag: '🇸🇨'},
    {code: '+232', label: 'Sierra Leone', flag: '🇸🇱'},
    {code: '+65', label: 'Singapore', flag: '🇸🇬'},
    {code: '+1-721', label: 'Sint Maarten', flag: '🇸🇽'},
    {code: '+421', label: 'Slovakia', flag: '🇸🇰'},
    {code: '+386', label: 'Slovenia', flag: '🇸🇮'},
    {code: '+677', label: 'Solomon Islands', flag: '🇸🇧'},
    {code: '+252', label: 'Somalia', flag: '🇸🇴'},
    {code: '+27', label: 'South Africa', flag: '🇿🇦'},
    {code: '+82', label: 'South Korea', flag: '🇰🇷'},
    {code: '+211', label: 'South Sudan', flag: '🇸🇸'},
    {code: '+34', label: 'Spain', flag: '🇪🇸'},
    {code: '+94', label: 'Sri Lanka', flag: '🇱🇰'},
    {code: '+249', label: 'Sudan', flag: '🇸🇩'},
    {code: '+597', label: 'Suriname', flag: '🇸🇷'},
    {code: '+46', label: 'Sweden', flag: '🇸🇪'},
    {code: '+41', label: 'Switzerland', flag: '🇨🇭'},
    {code: '+963', label: 'Syria', flag: '🇸🇾'},
    {code: '+886', label: 'Taiwan', flag: '🇹🇼'},
    {code: '+992', label: 'Tajikistan', flag: '🇹🇯'},
    {code: '+255', label: 'Tanzania', flag: '🇹🇿'},
    {code: '+66', label: 'Thailand', flag: '🇹🇭'},
    {code: '+670', label: 'Timor-Leste', flag: '🇹🇱'},
    {code: '+228', label: 'Togo', flag: '🇹🇬'},
    {code: '+690', label: 'Tokelau', flag: '🇹🇰'},
    {code: '+676', label: 'Tonga', flag: '🇹🇴'},
    {code: '+1-868', label: 'Trinidad and Tobago', flag: '🇹🇹'},
    {code: '+216', label: 'Tunisia', flag: '🇹🇳'},
    {code: '+90', label: 'Turkey', flag: '🇹🇷'},
    {code: '+993', label: 'Turkmenistan', flag: '🇹🇲'},
    {code: '+1-649', label: 'Turks and Caicos Islands', flag: '🇹🇨'},
    {code: '+688', label: 'Tuvalu', flag: '🇹🇻'},
    {code: '+1-340', label: 'U.S. Virgin Islands', flag: '🇻🇮'},
    {code: '+256', label: 'Uganda', flag: '🇺🇬'},
    {code: '+380', label: 'Ukraine', flag: '🇺🇦'},
    {code: '+971', label: 'United Arab Emirates', flag: '🇦🇪'},
    {code: '+44', label: 'United Kingdom', flag: '🇬🇧'},
    {code: '+1', label: 'United States', flag: '🇺🇸'},
    {code: '+598', label: 'Uruguay', flag: '🇺🇾'},
    {code: '+998', label: 'Uzbekistan', flag: '🇺🇿'},
    {code: '+678', label: 'Vanuatu', flag: '🇻🇺'},
    {code: '+379', label: 'Vatican City', flag: '🇻🇦'},
    {code: '+58', label: 'Venezuela', flag: '🇻🇪'},
    {code: '+84', label: 'Vietnam', flag: '🇻🇳'},
    {code: '+681', label: 'Wallis and Futuna', flag: '🇼🇫'},
    {code: '+967', label: 'Yemen', flag: '🇾🇪'},
    {code: '+260', label: 'Zambia', flag: '🇿🇲'},
    {code: '+263', label: 'Zimbabwe', flag: '🇿🇼'},
  ]

  const countryText = (country: (typeof countries)[number]) => country.code
  const countryCodeDigits = (value: string) => value.replace(/\D/g, '')
  const countryMatches = (country: (typeof countries)[number], query: string) => {
    const queryDigits = countryCodeDigits(query)
    if (!query.trim() && !queryDigits) return true

    const countryDigits = countryCodeDigits(country.code)
    return country.code.includes(query.trim()) || Boolean(queryDigits && countryDigits.includes(queryDigits))
  }
  const findCountry = (query: string) => {
    const trimmed = query.trim()
    const queryDigits = countryCodeDigits(trimmed)

    return (
      countries.find((country) => {
        const countryDigits = countryCodeDigits(country.code)
        return country.code === trimmed || countryDigits === queryDigits
      }) ?? countries.find((country) => countryMatches(country, trimmed))
    )
  }

  let phoneCountry = $state(untrack(() => (values.phoneCountry as string) || '+351'))
  let countryQuery = $state(countryText(countries.find((country) => country.code === phoneCountry) ?? countries[0]))
  let countryOpen = $state(false)
  let password = $state('')
  let passwordConfirm = $state('')

  const selectedCountry = $derived(countries.find((country) => country.code === phoneCountry) ?? countries[0])
  const filteredCountries = $derived.by(() => countries.filter((country) => countryMatches(country, countryQuery)).slice(0, 10))
  const chooseCountry = (country: (typeof countries)[number]) => {
    phoneCountry = country.code
    countryQuery = countryText(country)
    countryOpen = false
  }
  const syncTypedCountry = () => {
    const matchedCountry = findCountry(countryQuery)
    if (matchedCountry) chooseCountry(matchedCountry)
    else {
      countryQuery = countryText(selectedCountry)
      countryOpen = false
    }
  }

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
        <div class="phone-country-picker">
          <input type="hidden" name="phoneCountry" value={selectedCountry.code} />
          <input
            class="phone-cc phone-country-input"
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={countryOpen}
            aria-controls="phone-country-list"
          autocomplete="tel-country-code"
          inputmode="search"
          bind:value={countryQuery}
            onfocus={() => (countryOpen = true)}
            oninput={() => {
              countryOpen = true
              const matchedCountry = findCountry(countryQuery)
              if (matchedCountry) phoneCountry = matchedCountry.code
            }}
            onblur={() => {
              window.setTimeout(syncTypedCountry, 120)
            }}
            onkeydown={(event) => {
              if (event.key === 'Escape') {
                countryQuery = countryText(selectedCountry)
                countryOpen = false
              }
              if (event.key === 'Enter' && countryOpen) {
                event.preventDefault()
                syncTypedCountry()
              }
            }}
            aria-label={`${t.phone} - indicativo`}
          />
          {#if countryOpen}
            <div class="phone-country-menu" id="phone-country-list" role="listbox">
              {#each filteredCountries as country}
                <button
                  type="button"
                  class="phone-country-option"
                  role="option"
                  aria-selected={country.code === selectedCountry.code}
                  onmousedown={(event) => event.preventDefault()}
                  onclick={() => chooseCountry(country)}
                >
                  <span class="phone-country-flag" aria-hidden="true">{country.flag}</span>
                  <span class="phone-country-name">{country.label}</span>
                  <span class="phone-country-code">{country.code}</span>
                </button>
              {/each}
            </div>
          {/if}
        </div>
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

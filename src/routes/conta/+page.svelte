<script lang="ts">
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
    name: string
    email: string
    phone: string
    nif: string
    emailStatus: string
    verified: string
    pending: string
    empty: string
    orders: string
    noOrders: string
    verifyTitle: string
    verifyBody: string
    resend: string
    resent: string
    already: string
  }

  const copyByLanguage: Record<string, Copy> = {
    pt: {
      kicker: 'Área de cliente',
      greeting: 'Olá',
      title: 'A sua conta',
      logout: 'Terminar sessão',
      details: 'Os seus dados',
      name: 'Nome',
      email: 'Email',
      phone: 'Telefone',
      nif: 'NIF',
      emailStatus: 'Email',
      verified: 'Confirmado',
      pending: 'Por confirmar',
      empty: 'Por preencher',
      orders: 'Encomendas',
      noOrders: 'Ainda não existem encomendas associadas a esta conta.',
      verifyTitle: 'Confirme o seu email',
      verifyBody: 'Enviámos um link de confirmação para o seu email. Confirme para proteger a sua conta.',
      resend: 'Reenviar email',
      resent: 'Email de confirmação reenviado. Verifique a sua caixa de entrada.',
      already: 'O seu email já está confirmado.',
    },
    en: {
      kicker: 'Customer area',
      greeting: 'Hi',
      title: 'Your account',
      logout: 'Sign out',
      details: 'Your details',
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      nif: 'Tax number',
      emailStatus: 'Email',
      verified: 'Confirmed',
      pending: 'Unconfirmed',
      empty: 'Not set',
      orders: 'Orders',
      noOrders: 'No orders are linked to this account yet.',
      verifyTitle: 'Confirm your email',
      verifyBody: 'We sent a confirmation link to your email. Confirm it to protect your account.',
      resend: 'Resend email',
      resent: 'Confirmation email sent again. Check your inbox.',
      already: 'Your email is already confirmed.',
    },
    es: {
      kicker: 'Área de cliente',
      greeting: 'Hola',
      title: 'Tu cuenta',
      logout: 'Cerrar sesión',
      details: 'Tus datos',
      name: 'Nombre',
      email: 'Email',
      phone: 'Teléfono',
      nif: 'NIF',
      emailStatus: 'Email',
      verified: 'Confirmado',
      pending: 'Sin confirmar',
      empty: 'Sin definir',
      orders: 'Pedidos',
      noOrders: 'Todavía no hay pedidos asociados a esta cuenta.',
      verifyTitle: 'Confirma tu email',
      verifyBody: 'Enviamos un enlace de confirmación a tu email. Confírmalo para proteger tu cuenta.',
      resend: 'Reenviar email',
      resent: 'Email de confirmación reenviado. Revisa tu bandeja de entrada.',
      already: 'Tu email ya está confirmado.',
    },
  }

  const t = $derived(copyByLanguage[data.language] ?? copyByLanguage.pt)
  const firstName = $derived(data.customer.name.trim().split(/\s+/)[0] ?? '')
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
        <button class="button secondary" type="submit">{t.logout}</button>
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
          {:else if form?.message}
            <p class="account-verify-note" role="alert">{form.message}</p>
          {/if}
        </div>
        <form method="POST" action="?/resendVerification">
          <input type="hidden" name="csrfToken" value={data.csrfToken} />
          <button class="button secondary" type="submit">{t.resend}</button>
        </form>
      </Reveal>
    {/if}

    <div class="account-grid">
      <Reveal class="account-card" variant="card">
        <h2>{t.details}</h2>
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
            <dt>{t.emailStatus}</dt>
            <dd>
              <span class="account-chip" class:is-verified={data.customer.emailVerifiedAt}>
                {data.customer.emailVerifiedAt ? t.verified : t.pending}
              </span>
            </dd>
          </div>
        </dl>
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

<script lang="ts">
  import {page} from '$app/state'
  import {prefersReducedMotion} from '$lib/motion'
  import {cubicOut} from 'svelte/easing'
  import {fly} from 'svelte/transition'

  let {children, language = 'pt', csrfToken = ''} = $props<{
    children: import('svelte').Snippet
    language?: string
    csrfToken?: string
  }>()

  const copy: Record<
    string,
    {kicker: string; title: string; logout: string; data: string; addresses: string; orders: string}
  > = {
    pt: {kicker: 'Área de cliente', title: 'A sua conta', logout: 'Terminar sessão', data: 'Dados', addresses: 'Moradas', orders: 'Encomendas'},
    en: {kicker: 'Customer area', title: 'Your account', logout: 'Sign out', data: 'Details', addresses: 'Addresses', orders: 'Orders'},
    es: {kicker: 'Área de cliente', title: 'Tu cuenta', logout: 'Cerrar sesión', data: 'Datos', addresses: 'Direcciones', orders: 'Pedidos'},
  }

  const t = $derived(copy[language] ?? copy.pt)
  const langQuery = $derived(`?lang=${language}`)

  const tabs = $derived([
    {key: 'dados', href: `/conta/dados${langQuery}`, label: t.data},
    {key: 'moradas', href: `/conta/moradas${langQuery}`, label: t.addresses},
    {key: 'encomendas', href: `/conta/encomendas${langQuery}`, label: t.orders},
  ])

  const active = $derived(
    page.url.pathname.includes('/moradas')
      ? 'moradas'
      : page.url.pathname.includes('/encomendas')
        ? 'encomendas'
        : 'dados',
  )

  // Sliding active-tab pill: measure the active link and move a single pill
  // behind it, so switching tabs glides instead of hard-swapping the highlight.
  let navEl = $state<HTMLElement | null>(null)
  let pill = $state({left: 0, width: 0, ready: false})

  $effect(() => {
    void active
    const el = navEl?.querySelector<HTMLElement>('a.active')
    if (el) pill = {left: el.offsetLeft, width: el.offsetWidth, ready: true}
  })

  const panelIn = (node: Element) =>
    prefersReducedMotion() ? {duration: 0} : fly(node, {y: 10, duration: 260, easing: cubicOut})
</script>

<main class="account-page">
  <section class="account-shell">
    <header class="account-head">
      <div>
        <p class="kicker">{t.kicker}</p>
        <h1>{t.title}</h1>
      </div>
      <form method="POST" action="/conta/sair?/logout">
        <input type="hidden" name="csrfToken" value={csrfToken} />
        <button class="button subtle" type="submit">{t.logout}</button>
      </form>
    </header>

    <nav class="account-nav" aria-label={t.title} bind:this={navEl}>
      <span
        class="account-nav-pill"
        class:ready={pill.ready}
        style={`transform: translateX(${pill.left}px); width: ${pill.width}px`}
        aria-hidden="true"
      ></span>
      {#each tabs as tab}
        <a
          class:active={active === tab.key}
          aria-current={active === tab.key ? 'page' : undefined}
          href={tab.href}
        >
          {tab.label}
        </a>
      {/each}
    </nav>

    {#key active}
      <div class="account-panel" in:panelIn>
        {@render children()}
      </div>
    {/key}
  </section>
</main>

<script lang="ts">
  import {page} from '$app/state'
  import {lineReveal} from '$lib/actions/line-reveal'
  import Reveal from '$lib/components/Reveal.svelte'
  import '$lib/styles/account.css'
  import '$lib/styles/account-checkout.css'
  import {prefersReducedMotion} from '$lib/motion'
  import {onMount, tick} from 'svelte'
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

  // One measured rule connects the three account views without turning the
  // navigation into a second row of button-shaped controls.
  let navEl = $state<HTMLElement | null>(null)
  let indicator = $state({left: 0, width: 0, ready: false})

  const measureIndicator = () => {
    const el = navEl?.querySelector<HTMLElement>('a.active')
    if (el) indicator = {left: el.offsetLeft, width: el.offsetWidth, ready: true}
  }

  $effect(() => {
    void active
    void tick().then(measureIndicator)
  })

  const panelIn = (node: Element) =>
    prefersReducedMotion()
      ? {duration: 0}
      : fly(node, {y: 14, opacity: 0, duration: 380, easing: cubicOut})

  onMount(() => {
    const observer = new ResizeObserver(measureIndicator)
    if (navEl) observer.observe(navEl)
    measureIndicator()

    return () => {
      observer.disconnect()
    }
  })
</script>

<main class="account-page">
  <section class="account-shell">
    <header class="account-head">
      <Reveal class="account-head-copy" variant="hero" priority>
        <p class="kicker">{t.kicker}</p>
        <h1 use:lineReveal>{t.title}</h1>
      </Reveal>
      <Reveal class="account-head-session" variant="scale" delay={120}>
        <form method="POST" action="/conta/sair?/logout">
          <input type="hidden" name="csrfToken" value={csrfToken} />
          <button class="button subtle" type="submit">{t.logout}</button>
        </form>
      </Reveal>
    </header>

    <Reveal class="account-nav-reveal" variant="panel" delay={80}>
      <nav class="account-nav" aria-label={t.title} bind:this={navEl}>
        <span
          class="account-nav-indicator"
          class:ready={indicator.ready}
          style={`transform: translateX(${indicator.left}px); width: ${indicator.width}px`}
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
    </Reveal>

    {#key active}
      <div class="account-panel" data-account-panel={active} in:panelIn>
        {@render children()}
      </div>
    {/key}
  </section>
</main>

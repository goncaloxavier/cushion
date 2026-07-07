<script lang="ts">
  import {afterNavigate, goto, onNavigate} from '$app/navigation'
  import {trapFocus} from '$lib/actions/trap-focus'
  import BrandIcon from '$lib/components/BrandIcon.svelte'
  import Intro from '$lib/components/Intro.svelte'
  import RouteProgress from '$lib/components/RouteProgress.svelte'
  import RouteScene from '$lib/components/RouteScene.svelte'
  import SearchOverlay, {type SearchStrings} from '$lib/components/SearchOverlay.svelte'
  import Toaster from '$lib/components/Toaster.svelte'
  import {VisualEditing} from '@sanity/visual-editing/svelte'
  import {cartEventName, cartTotalQuantity, readCart} from '$lib/cart'
  import {prefersReducedMotion} from '$lib/motion'
  import {createSmoothScroll, type SmoothScroll} from '$lib/smooth-scroll'
  import {withLanguage} from '$lib/site-content'
  import {onDestroy, onMount, untrack} from 'svelte'
  import '../app.css'

  let {data, children} = $props()

  const content = $derived(data.site[data.language])

  type NavKey =
    | 'home'
    | 'about'
    | 'products'
    | 'store'
    | 'cart'
    | 'catalogue'
    | 'cases'
    | 'blog'
    | 'contact'

  const solutionsLabel: Record<string, string> = {pt: 'Soluções', en: 'Solutions', es: 'Soluciones'}

  const navItems = $derived([
    {key: 'about' as NavKey, href: '/sobre-nos', label: content.nav.about},
    {key: 'products' as NavKey, href: '/produtos', label: solutionsLabel[data.language] ?? 'Soluções'},
    {key: 'store' as NavKey, href: '/loja', label: content.nav.store},
    {key: 'cases' as NavKey, href: '/casos-de-estudo', label: content.nav.cases},
    {key: 'blog' as NavKey, href: '/blog', label: content.nav.blog},
  ])

  const catalogueLabel = $derived(content.nav.catalogue)

  const accountLabels: Record<string, {signedOut: string; account: string}> = {
    pt: {signedOut: 'Entrar', account: 'Conta'},
    en: {signedOut: 'Sign in', account: 'Account'},
    es: {signedOut: 'Entrar', account: 'Cuenta'},
  }
  const accountStrings = $derived(accountLabels[data.language] ?? accountLabels.pt)
  const isSignedIn = $derived(Boolean(data.account))
  const accountHref = $derived(isSignedIn ? '/conta/dados' : '/conta/entrar')
  const accountLabel = $derived(
    isSignedIn ? accountStrings.account : accountStrings.signedOut,
  )
  const accountActive = $derived(data.currentPath.startsWith('/conta'))

  const isActive = (href: string) =>
    href === '/' ? data.currentPath === '/' : data.currentPath.startsWith(href)
  const currentNavKey = $derived.by<NavKey>(() => {
    if (data.currentPath === '/') return 'home'
    if (data.currentPath.startsWith('/produtos')) return 'products'
    if (data.currentPath.startsWith('/loja')) return 'store'
    if (data.currentPath.startsWith('/carrinho')) return 'cart'
    if (data.currentPath.startsWith('/catalogo')) return 'catalogue'
    if (data.currentPath.startsWith('/casos-de-estudo')) return 'cases'
    if (data.currentPath.startsWith('/blog')) return 'blog'
    if (data.currentPath.startsWith('/contacto')) return 'contact'
    if (data.currentPath.startsWith('/sobre-nos')) return 'about'
    return 'home'
  })
  const isPainel = $derived(data.currentPath === '/painel' || data.currentPath.startsWith('/painel/'))
  let cartCount = $state(0)
  let menuOpen = $state(false)
  let menuVisible = $state(false)
  let menuCloseTimer: ReturnType<typeof setTimeout> | undefined
  const mobileMenuItems = $derived([
    {key: 'home' as NavKey, href: '/', label: content.nav.home},
    {key: 'about' as NavKey, href: '/sobre-nos', label: content.nav.about},
    {key: 'products' as NavKey, href: '/produtos', label: solutionsLabel[data.language] ?? 'Soluções'},
    {key: 'store' as NavKey, href: '/loja', label: content.nav.store},
    {key: 'catalogue' as NavKey, href: '/catalogo', label: content.nav.catalogue},
    {key: 'cases' as NavKey, href: '/casos-de-estudo', label: content.nav.cases},
    {key: 'blog' as NavKey, href: '/blog', label: content.nav.blog},
    {key: 'contact' as NavKey, href: '/contacto', label: content.nav.contact},
  ])
  const menuStringsByLanguage: Record<string, {menu: string; open: string; close: string}> = {
    pt: {menu: 'Menu', open: 'Abrir menu', close: 'Fechar menu'},
    en: {menu: 'Menu', open: 'Open menu', close: 'Close menu'},
    es: {menu: 'Menú', open: 'Abrir menú', close: 'Cerrar menú'},
  }
  const menuStrings = $derived(menuStringsByLanguage[data.language] ?? menuStringsByLanguage.pt)

  const searchStringsByLanguage: Record<string, SearchStrings> = {
    pt: {
      openLabel: 'Pesquisar',
      closeLabel: 'Fechar pesquisa',
      placeholder: 'Pesquisar soluções, loja, casos e blog…',
      noResults: 'Sem resultados.',
      hint: {navigate: '↑↓ navegar', select: '↵ selecionar', close: 'Esc fechar'},
      categories: {
        products: 'Soluções',
        storeProducts: 'Loja',
        caseStudies: 'Casos de estudo',
        blogPosts: 'Blog',
      },
    },
    en: {
      openLabel: 'Search',
      closeLabel: 'Close search',
      placeholder: 'Search solutions, store, cases and blog…',
      noResults: 'No results.',
      hint: {navigate: '↑↓ navigate', select: '↵ select', close: 'Esc close'},
      categories: {
        products: 'Solutions',
        storeProducts: 'Store',
        caseStudies: 'Case studies',
        blogPosts: 'Blog',
      },
    },
    es: {
      openLabel: 'Buscar',
      closeLabel: 'Cerrar búsqueda',
      placeholder: 'Buscar soluciones, tienda, casos y blog…',
      noResults: 'Sin resultados.',
      hint: {navigate: '↑↓ navegar', select: '↵ seleccionar', close: 'Esc cerrar'},
      categories: {
        products: 'Soluciones',
        storeProducts: 'Tienda',
        caseStudies: 'Casos de estudio',
        blogPosts: 'Blog',
      },
    },
  }
  const searchStrings = $derived(searchStringsByLanguage[data.language] ?? searchStringsByLanguage.pt)
  let searchOpen = $state(false)

  const openMenu = () => {
    if (menuCloseTimer) clearTimeout(menuCloseTimer)
    menuVisible = true
    requestAnimationFrame(() => {
      menuOpen = true
    })
  }
  const closeMenu = () => {
    if (menuCloseTimer) clearTimeout(menuCloseTimer)
    if (!menuVisible && !menuOpen) return
    menuOpen = false
    menuCloseTimer = setTimeout(() => {
      menuVisible = false
      menuCloseTimer = undefined
    }, 320)
  }
  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && menuOpen) closeMenu()
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault()
      if (!searchOpen) searchOpen = true
    }
  }

  // Close the overlays whenever the route changes.
  $effect(() => {
    void data.currentPath
    untrack(closeMenu)
    untrack(() => {
      searchOpen = false
    })
  })

  // Lock background scroll while the overlay is open.
  $effect(() => {
    if (typeof document === 'undefined') return
    document.body.style.overflow = menuVisible ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  })

  const showWhatsappFloat = $derived(Boolean(content.common.whatsappUrl) && currentNavKey !== 'contact')
  const socialLinks = $derived(
    [
      {href: content.common.instagramUrl, label: 'Instagram', icon: 'instagram' as const},
      {href: content.common.facebookUrl, label: 'Facebook', icon: 'facebook' as const},
      {href: content.common.youtubeUrl, label: 'YouTube', icon: 'youtube' as const},
    ].filter((link) => link.href),
  )
  const routeKind = $derived.by(() => {
    if (data.currentPath === '/') return 'home'
    if (data.currentPath.startsWith('/produtos/')) return 'product-detail'
    if (data.currentPath.startsWith('/produtos')) return 'products'
    if (data.currentPath.startsWith('/loja')) return 'store'
    if (data.currentPath.startsWith('/carrinho')) return 'store'
    if (data.currentPath.startsWith('/catalogo')) return 'catalogue'
    if (data.currentPath.startsWith('/casos-de-estudo/')) return 'case-detail'
    if (data.currentPath.startsWith('/casos-de-estudo')) return 'cases'
    if (data.currentPath.startsWith('/blog/')) return 'blog-detail'
    if (data.currentPath.startsWith('/blog')) return 'blog'
    if (data.currentPath.startsWith('/contacto')) return 'contact'
    if (data.currentPath.startsWith('/sobre-nos')) return 'about'
    return 'default'
  })

  // The account tabs (dados/moradas/encomendas) share one scene key so the
  // RouteScene + persistent shell aren't re-created on each tab switch — only
  // the inner panel animates.
  const sceneKey = $derived(
    /^\/conta\/(dados|moradas|encomendas)/.test(data.currentPath)
      ? `conta-area-${data.language}`
      : `${data.currentPath}-${data.language}`,
  )

  let smooth: SmoothScroll | null = null

  const detailRoute = /^\/(produtos|casos-de-estudo|blog)\/[^/]+$/
  const transitionKind = (from: string, to: string) => {
    if (to === '/') return 'home'
    const toDetail = detailRoute.test(to)
    const fromDetail = detailRoute.test(from)
    if (toDetail && !fromDetail) return 'forward'
    if (fromDetail && !toDetail) return 'back'
    return 'lateral'
  }

  onNavigate((navigation) => {
    if (prefersReducedMotion()) return
    if (!document.startViewTransition) return

    const from = navigation.from?.url.pathname ?? ''
    const to = navigation.to?.url.pathname ?? ''

    // Account tab switches animate their own panel; skip the full-page view
    // transition so the shell (header + tabs) stays put instead of flashing.
    const accountArea = /^\/conta\/(dados|moradas|encomendas)/
    if (accountArea.test(from) && accountArea.test(to)) return

    document.documentElement.dataset.transition = transitionKind(from, to)

    return new Promise<void>((resolve) => {
      const transition = document.startViewTransition(async () => {
        resolve()
        await navigation.complete
      })
      transition.finished.finally(() => {
        delete document.documentElement.dataset.transition
      })
    })
  })

  afterNavigate(() => {
    if (smooth) smooth.toTop(true)
    else window.scrollTo(0, 0)
  })

  onMount(() => {
    document.documentElement.dataset.appReady = 'true'

    const resetScroll = () => {
      if (smooth) smooth.toTop(true)
      else window.scrollTo(0, 0)
    }
    const refreshCartCount = () => {
      cartCount = cartTotalQuantity(readCart())
    }

    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual'
    }

    refreshCartCount()
    window.addEventListener(cartEventName, refreshCartCount)

    let disposeSmooth = () => {}
    createSmoothScroll().then((instance) => {
      smooth = instance
      if (instance) disposeSmooth = instance.destroy
    })

    resetScroll()
    requestAnimationFrame(() => {
      resetScroll()
      window.setTimeout(resetScroll, 120)
    })

    return () => {
      window.removeEventListener(cartEventName, refreshCartCount)
      disposeSmooth()
      delete document.documentElement.dataset.appReady
    }
  })

  onDestroy(() => {
    if (menuCloseTimer) clearTimeout(menuCloseTimer)
  })
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isPainel}
  {@render children()}
{:else}
  <RouteProgress />
  <Intro />

<header class="site-header">
  <a class="brand" href={withLanguage('/', data.language)} aria-label={content.nav.home}>
    <img src="/logo/brand_mark.png" alt="DaFábrica4You" decoding="async" fetchpriority="high" />
  </a>

  <nav class="nav-links" aria-label="Main navigation">
    {#each navItems as item}
      <a
        class:active={isActive(item.href)}
        aria-current={isActive(item.href) ? 'page' : undefined}
        href={withLanguage(item.href, data.language)}
      >
        {item.label}
      </a>
    {/each}
    <button
      class="nav-search-trigger"
      type="button"
      aria-label={searchStrings.openLabel}
      onclick={() => (searchOpen = true)}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </svg>
    </button>
  </nav>

  <div class="header-actions">
    <a
      class="account-link"
      class:active={accountActive}
      class:signed-in={isSignedIn}
      aria-current={accountActive ? 'page' : undefined}
      href={withLanguage(accountHref, data.language)}
    >
      <span class="account-label">{accountLabel}</span>
    </a>
    <a
      class="cart-link"
      class:active={currentNavKey === 'cart'}
      aria-current={currentNavKey === 'cart' ? 'page' : undefined}
      aria-label={`${content.nav.cart} (${cartCount})`}
      href={withLanguage('/carrinho', data.language)}
    >
      <span class="cart-label">{content.nav.cart}</span>
      {#if cartCount > 0}
        <span class="cart-count">{cartCount}</span>
      {/if}
    </a>
    <a
      class="catalogue-link"
      class:active={currentNavKey === 'catalogue'}
      aria-current={currentNavKey === 'catalogue' ? 'page' : undefined}
      href={withLanguage('/catalogo', data.language)}
    >
      {catalogueLabel}
    </a>
    <a
      class="contact-link"
      class:active={currentNavKey === 'contact'}
      aria-current={currentNavKey === 'contact' ? 'page' : undefined}
      href={withLanguage('/contacto', data.language)}
    >
      {content.nav.contact}
    </a>
    <select
      class="language-switcher"
      aria-label="Language"
      value={data.language}
      onchange={(event) => goto(withLanguage(data.currentPath, event.currentTarget.value))}
    >
      {#each data.languages as language}
        <option value={language.code}>{language.label}</option>
      {/each}
    </select>
    <button
      class="header-search-trigger"
      type="button"
      aria-label={searchStrings.openLabel}
      onclick={() => (searchOpen = true)}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="m21 21-4.3-4.3" />
      </svg>
    </button>
    <button
      class="nav-toggle"
      type="button"
      aria-label={menuStrings.open}
      aria-expanded={menuOpen}
      aria-controls="mobile-menu"
      onclick={openMenu}
    >
      <span class="nav-toggle-bars" aria-hidden="true"></span>
    </button>
  </div>
</header>

{#if menuVisible}
  <div
    class="mobile-menu"
    class:open={menuOpen}
    id="mobile-menu"
    role="dialog"
    aria-modal="true"
    aria-label={menuStrings.menu}
    aria-hidden={!menuOpen}
    use:trapFocus
  >
    <div class="mobile-menu-bar">
      <span class="mobile-menu-brand">
        <img src="/logo/brand_mark_white.png" alt="DaFábrica4You" loading="lazy" decoding="async" />
      </span>
      <button
        class="mobile-menu-close"
        type="button"
        aria-label={menuStrings.close}
        onclick={closeMenu}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6 18 18M18 6 6 18" /></svg>
      </button>
    </div>

    <nav class="mobile-menu-nav" aria-label={menuStrings.menu}>
      {#each mobileMenuItems as item, index}
        <a
          href={withLanguage(item.href, data.language)}
          class:active={isActive(item.href)}
          aria-current={isActive(item.href) ? 'page' : undefined}
          style={`--menu-index: ${index}`}
          onclick={closeMenu}
        >
          <span class="mobile-menu-label">{item.label}</span>
        </a>
      {/each}
    </nav>

    <div class="mobile-menu-foot">
      <a
        class="account-link mobile-menu-account"
        class:active={accountActive}
        class:signed-in={isSignedIn}
        aria-current={accountActive ? 'page' : undefined}
        href={withLanguage(accountHref, data.language)}
        onclick={closeMenu}
      >
        <svg class="account-icon" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="8" r="3.4" />
          <path d="M5.5 19.5a6.5 6.5 0 0 1 13 0" />
        </svg>
        <span class="account-label">
          {accountLabel}
        </span>
      </a>
      <a
        class="cart-link mobile-menu-cart"
        class:active={currentNavKey === 'cart'}
        aria-current={currentNavKey === 'cart' ? 'page' : undefined}
        href={withLanguage('/carrinho', data.language)}
        aria-label={`${content.nav.cart} (${cartCount})`}
        onclick={closeMenu}
      >
        <span class="cart-label">{content.nav.cart}</span>
        {#if cartCount > 0}
          <span class="cart-count">{cartCount}</span>
        {/if}
      </a>
      <div class="mobile-menu-lang" aria-label="Language">
        {#each data.languages as language}
          <a
            class:active={data.language === language.code}
            aria-current={data.language === language.code ? 'true' : undefined}
            href={withLanguage(data.currentPath, language.code)}
            onclick={closeMenu}
          >
            {language.label}
          </a>
        {/each}
      </div>
      {#if socialLinks.length}
        <div class="mobile-menu-social">
          {#each socialLinks as link}
            <a href={link.href} target="_blank" rel="noreferrer" aria-label={link.label}>
              <BrandIcon name={link.icon} />
            </a>
          {/each}
        </div>
      {/if}
    </div>
  </div>
{/if}

{#key sceneKey}
  <RouteScene kind={routeKind}>
    {@render children()}
  </RouteScene>
{/key}

<footer class="site-footer">
  <div class="footer-brand">
    <img src="/logo/brand_mark.png" alt="DaFábrica4You" loading="lazy" decoding="async" />
  </div>
  <div class="footer-links">
    <a href={`mailto:${content.common.contactEmail}`}>{content.common.contactEmail}</a>
    <a href={`tel:${content.common.contactPhone.replaceAll(' ', '')}`}>{content.common.contactPhone}</a>
  </div>
  <div class="footer-legal">
    <a href={content.common.complaintsUrl} target="_blank" rel="noreferrer">
      {content.common.complaintsLabel}
    </a>
    <p>{content.common.complaintsNote}</p>
    <div class="footer-policy-links">
      <a href={content.common.privacyPolicyUrl} target="_blank" rel="noreferrer">
        {content.common.privacyPolicyLabel}
      </a>
      <a href={content.common.cookiePolicyUrl} target="_blank" rel="noreferrer">
        {content.common.cookiePolicyLabel}
      </a>
    </div>
  </div>
  <div class="footer-social" aria-label={content.common.socialLabel}>
    {#each socialLinks as link}
      <a href={link.href} target="_blank" rel="noreferrer" data-social={link.icon}>
        <BrandIcon name={link.icon} />
        <span>{link.label}</span>
      </a>
    {/each}
  </div>
</footer>

{#if showWhatsappFloat}
  <a
    class="whatsapp-float"
    href={content.common.whatsappUrl}
    target="_blank"
    rel="noreferrer"
    aria-label={content.common.whatsappLabel}
  >
    <span class="whatsapp-mark" aria-hidden="true"><BrandIcon name="whatsapp" /></span>
    <strong>{content.common.whatsappLabel}</strong>
  </a>
  {/if}

  <SearchOverlay bind:open={searchOpen} language={data.language} {content} strings={searchStrings} />
{/if}

<Toaster />

{#if data.preview}
  <VisualEditing />
{/if}

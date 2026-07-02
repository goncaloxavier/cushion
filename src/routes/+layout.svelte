<script lang="ts">
  import BrandIcon from '$lib/components/BrandIcon.svelte'
  import Intro from '$lib/components/Intro.svelte'
  import RouteProgress from '$lib/components/RouteProgress.svelte'
  import RouteScene from '$lib/components/RouteScene.svelte'
  import Toaster from '$lib/components/Toaster.svelte'
  import {VisualEditing} from '@sanity/visual-editing/svelte'
  import {afterNavigate, onNavigate} from '$app/navigation'
  import {cartEventName, cartTotalQuantity, readCart} from '$lib/cart'
  import {prefersReducedMotion} from '$lib/motion'
  import {createSmoothScroll, type SmoothScroll} from '$lib/smooth-scroll'
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

  const primaryRouteItems = $derived([
    {key: 'home' as NavKey, href: '/', label: content.nav.home},
    {key: 'about' as NavKey, href: '/sobre-nos', label: content.nav.about},
    {key: 'cases' as NavKey, href: '/casos-de-estudo', label: content.nav.cases},
    {key: 'blog' as NavKey, href: '/blog', label: content.nav.blog},
  ])

  const productNavItem = $derived({key: 'products' as NavKey, href: '/produtos', label: content.nav.products})

  const solutionsLabel: Record<string, string> = {pt: 'Soluções', en: 'Solutions', es: 'Soluciones'}

  const productMenuItems = $derived([
    {key: 'products' as NavKey, href: '/produtos', label: solutionsLabel[data.language] ?? 'Soluções'},
    {key: 'store' as NavKey, href: '/loja', label: content.nav.store},
    {key: 'catalogue' as NavKey, href: '/catalogo', label: content.nav.catalogue},
  ])

  const withLanguage = (href: string, language: string) => `${href}?lang=${language}`
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
  const productGroupActive = $derived(
    currentNavKey === 'products' || currentNavKey === 'store' || currentNavKey === 'catalogue',
  )
  let cartCount = $state(0)
  let menuOpen = $state(false)
  let menuVisible = $state(false)
  let menuCloseTimer: ReturnType<typeof setTimeout> | undefined
  const mobileMenuItems = $derived([
    {key: 'home' as NavKey, href: '/', label: content.nav.home},
    {key: 'about' as NavKey, href: '/sobre-nos', label: content.nav.about},
    {key: 'products' as NavKey, href: '/produtos', label: content.nav.products},
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
  }

  // Close the overlay whenever the route changes.
  $effect(() => {
    void data.currentPath
    untrack(closeMenu)
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
  <div class="brand">
    <img src="/logo/brand_mark.png" alt="DaFábrica4You" decoding="async" fetchpriority="high" />
  </div>

  <nav class="nav-links" aria-label="Main navigation">
    {#each primaryRouteItems.slice(0, 2) as item}
      <a
        class:active={isActive(item.href)}
        aria-current={isActive(item.href) ? 'page' : undefined}
        href={withLanguage(item.href, data.language)}
      >
        {item.label}
      </a>
    {/each}

    <div class="nav-group" class:active={productGroupActive}>
      <a
        class="nav-group-trigger"
        class:active={isActive(productNavItem.href)}
        aria-current={isActive(productNavItem.href) ? 'page' : undefined}
        href={withLanguage(productNavItem.href, data.language)}
      >
        <span>{productNavItem.label}</span>
        <span class="nav-caret" aria-hidden="true"></span>
      </a>

      <div class="nav-group-menu" aria-label={content.nav.products}>
        {#each productMenuItems as item}
          <a
            class:active={isActive(item.href)}
            aria-current={isActive(item.href) ? 'page' : undefined}
            href={withLanguage(item.href, data.language)}
          >
            {item.label}
          </a>
        {/each}
      </div>
    </div>

    {#each primaryRouteItems.slice(2) as item}
      <a
        class:active={isActive(item.href)}
        aria-current={isActive(item.href) ? 'page' : undefined}
        href={withLanguage(item.href, data.language)}
      >
        {item.label}
      </a>
    {/each}
  </nav>

  <div class="header-actions">
    <a
      class="contact-link"
      class:active={currentNavKey === 'contact'}
      aria-current={currentNavKey === 'contact' ? 'page' : undefined}
      href={withLanguage('/contacto', data.language)}
    >
      {content.nav.contact}
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
    <div class="language-switcher" aria-label="Language">
      {#each data.languages as language}
        <a
          class:active={data.language === language.code}
          aria-current={data.language === language.code ? 'true' : undefined}
          href={withLanguage(data.currentPath, language.code)}
        >
          {language.label}
        </a>
      {/each}
    </div>
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

{#key `${data.currentPath}-${data.language}`}
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
{/if}

<Toaster />

{#if data.preview}
  <VisualEditing />
{/if}

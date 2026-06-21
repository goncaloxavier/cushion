<script lang="ts">
  import BrandIcon from '$lib/components/BrandIcon.svelte'
  import RouteProgress from '$lib/components/RouteProgress.svelte'
  import RouteScene from '$lib/components/RouteScene.svelte'
  import {onMount} from 'svelte'
  import '../app.css'

  let {data, children} = $props()

  const content = $derived(data.site[data.language])

  type NavKey = 'home' | 'about' | 'products' | 'catalogue' | 'cases' | 'blog' | 'contact'

  const allRouteItems = $derived([
    {key: 'home' as NavKey, href: '/', label: content.nav.home},
    {key: 'about' as NavKey, href: '/sobre-nos', label: content.nav.about},
    {key: 'products' as NavKey, href: '/produtos', label: content.nav.products},
    {key: 'catalogue' as NavKey, href: '/catalogo', label: content.nav.catalogue},
    {key: 'cases' as NavKey, href: '/casos-de-estudo', label: content.nav.cases},
    {key: 'blog' as NavKey, href: '/blog', label: content.nav.blog},
  ])

  const allDockItems = $derived([
    {key: 'home' as NavKey, href: '/', label: content.nav.home},
    {key: 'about' as NavKey, href: '/sobre-nos', label: content.nav.about},
    {key: 'products' as NavKey, href: '/produtos', label: content.nav.products},
    {key: 'catalogue' as NavKey, href: '/catalogo', label: content.nav.catalogue},
    {key: 'cases' as NavKey, href: '/casos-de-estudo', label: content.nav.cases},
    {key: 'blog' as NavKey, href: '/blog', label: content.nav.blog},
    {key: 'contact' as NavKey, href: '/contacto', label: content.nav.contact},
  ])

  const withLanguage = (href: string, language: string) => `${href}?lang=${language}`
  const isActive = (href: string) =>
    href === '/' ? data.currentPath === '/' : data.currentPath.startsWith(href)
  const currentNavKey = $derived.by<NavKey>(() => {
    if (data.currentPath === '/') return 'home'
    if (data.currentPath.startsWith('/produtos')) return 'products'
    if (data.currentPath.startsWith('/catalogo')) return 'catalogue'
    if (data.currentPath.startsWith('/casos-de-estudo')) return 'cases'
    if (data.currentPath.startsWith('/blog')) return 'blog'
    if (data.currentPath.startsWith('/contacto')) return 'contact'
    if (data.currentPath.startsWith('/sobre-nos')) return 'about'
    return 'home'
  })
  const isPainel = $derived(data.currentPath === '/painel' || data.currentPath.startsWith('/painel/'))
  const routeItems = $derived(allRouteItems)
  const dockItems = $derived(allDockItems.filter((item) => item.key !== 'blog'))
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
    if (data.currentPath.startsWith('/catalogo')) return 'catalogue'
    if (data.currentPath.startsWith('/casos-de-estudo/')) return 'case-detail'
    if (data.currentPath.startsWith('/casos-de-estudo')) return 'cases'
    if (data.currentPath.startsWith('/blog/')) return 'blog-detail'
    if (data.currentPath.startsWith('/blog')) return 'blog'
    if (data.currentPath.startsWith('/contacto')) return 'contact'
    if (data.currentPath.startsWith('/sobre-nos')) return 'about'
    return 'default'
  })

  onMount(() => {
    const resetScroll = () => window.scrollTo(0, 0)

    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual'
    }

    resetScroll()
    requestAnimationFrame(() => {
      resetScroll()
      window.setTimeout(resetScroll, 120)
    })
  })
</script>

<svelte:head>
  <title>DaFábrica4You</title>
</svelte:head>

{#if isPainel}
  {@render children()}
{:else}
  <RouteProgress />

<header class="site-header">
  <div class="brand">
    <img src="/logo/brand_mark.png" alt="DaFábrica4You" decoding="async" fetchpriority="high" />
  </div>

  <nav class="nav-links" aria-label="Main navigation">
    {#each routeItems as item}
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
  </div>
</header>

<nav class="mobile-dock" aria-label="Mobile quick navigation">
  {#each dockItems as item}
    <a
      class:active={isActive(item.href)}
      aria-current={isActive(item.href) ? 'page' : undefined}
      href={withLanguage(item.href, data.language)}
    >
      {item.label}
    </a>
  {/each}
</nav>

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

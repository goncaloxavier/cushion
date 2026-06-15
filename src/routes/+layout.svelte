<script lang="ts">
  import RouteProgress from '$lib/components/RouteProgress.svelte'
  import RouteScene from '$lib/components/RouteScene.svelte'
  import '../app.css'

  let {data, children} = $props()

  const content = $derived(data.site[data.language])

  const routeItems = $derived([
    {href: '/', label: content.nav.home},
    {href: '/sobre-nos', label: content.nav.about},
    {href: '/produtos', label: content.nav.products},
    {href: '/catalogo', label: content.nav.catalogue},
    {href: '/casos-de-estudo', label: content.nav.cases},
    {href: '/blog', label: content.nav.blog},
  ])

  const dockItems = $derived([
    {href: '/produtos', label: content.nav.products},
    {href: '/catalogo', label: content.nav.catalogue},
    {href: '/casos-de-estudo', label: content.nav.cases},
    {href: '/blog', label: content.nav.blog},
    {href: '/contacto', label: content.nav.contact},
  ])

  const withLanguage = (href: string, language: string) => `${href}?lang=${language}`
  const isActive = (href: string) =>
    href === '/' ? data.currentPath === '/' : data.currentPath.startsWith(href)
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
</script>

<svelte:head>
  <title>DaFábrica4You</title>
</svelte:head>

<RouteProgress />

<header class="site-header">
  <a class="brand" href={withLanguage('/', data.language)} aria-label="DaFábrica4You">
    <img src="/logo/brand_mark.png" alt="DaFábrica4You" />
  </a>

  <nav class="nav-links" aria-label="Main navigation">
    {#each routeItems as item}
      <a class:active={isActive(item.href)} href={withLanguage(item.href, data.language)}>
        {item.label}
      </a>
    {/each}
  </nav>

  <div class="header-actions">
    <a class="contact-link" href={withLanguage('/contacto', data.language)}>{content.nav.contact}</a>
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
    <a class:active={isActive(item.href)} href={withLanguage(item.href, data.language)}>
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
  <div>
    <img src="/logo/brand_mark.png" alt="DaFábrica4You" />
  </div>
  <div class="footer-links">
    <a href={`mailto:${content.common.contactEmail}`}>{content.common.contactEmail}</a>
    <a href={`tel:${content.common.contactPhone.replaceAll(' ', '')}`}>{content.common.contactPhone}</a>
  </div>
  <p>{content.footer.note}</p>
</footer>

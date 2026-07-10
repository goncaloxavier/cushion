import {expect, test, type Page, type TestInfo} from '@playwright/test'
import {storeProductsForLanguage} from '../src/lib/store-fallback'

type PublicRoute = {
  path: string
  heading: string
  active: string | null
  mobile?: boolean
}

const publicRoutes: PublicRoute[] = [
  {path: '/?lang=pt', heading: 'não requerem manutenção', active: 'Início'},
  {path: '/sobre-nos?lang=pt', heading: 'Do ecoponto amarelo', active: 'Sobre'},
  {path: '/produtos?lang=pt', heading: 'Soluções para exterior', active: 'Soluções'},
  {path: '/loja?lang=pt', heading: 'Produtos com preço', active: 'Loja'},
  {path: '/loja/banco-gaviao?lang=pt', heading: 'Banco Gavião', active: 'Loja'},
  {path: '/carrinho?lang=pt', heading: 'Reveja os produtos', active: null},
  {
    path: '/produtos/decking-pavimentos-passadicos?lang=pt',
    heading: 'Decking, pavimentos e passadiços',
    active: 'Soluções',
    mobile: false,
  },
  {path: '/catalogo?lang=en', heading: 'Request the catalogue through the form', active: 'Catalogue'},
  {path: '/casos-de-estudo?lang=es', heading: 'Proyectos que muestran', active: 'Casos'},
  {
    path: '/casos-de-estudo/vedacao-piscina-moita?lang=es',
    heading: 'Valla de piscina',
    active: 'Casos',
    mobile: false,
  },
  {path: '/blog?lang=pt', heading: 'Conteúdo que vende ensinando', active: 'Blog'},
  {
    path: '/blog/mobiliario-urbano-madeira-metal?lang=pt',
    heading: 'Porque a madeira',
    active: 'Blog',
    mobile: false,
  },
  {path: '/contacto?lang=es', heading: 'Cuéntanos el espacio', active: null},
]

const desktopNavLabels = {
  pt: ['Sobre', 'Soluções', 'Loja', 'Casos', 'Blog'],
  en: ['About', 'Solutions', 'Store', 'Cases', 'Blog'],
  es: ['Sobre', 'Soluciones', 'Tienda', 'Casos', 'Blog'],
}

const mobileNavLabels = {
  pt: ['Início', 'Sobre', 'Soluções', 'Loja', 'Catálogo', 'Casos', 'Blog', 'Contacto'],
  en: ['Home', 'About', 'Solutions', 'Store', 'Catalogue', 'Cases', 'Blog', 'Contact'],
  es: ['Inicio', 'Sobre', 'Soluciones', 'Tienda', 'Catálogo', 'Casos', 'Blog', 'Contacto'],
}

const phoneViewports = [
  {name: 'iPhone SE 1', width: 320, height: 568},
  {name: 'iPhone XS', width: 375, height: 812},
  {name: 'iPhone 14', width: 390, height: 844},
  {name: 'iPhone 15 Pro Max', width: 430, height: 932},
  {name: 'Galaxy compact', width: 360, height: 800},
  {name: 'Pixel 7', width: 412, height: 915},
]

const productSlugs = [
  'decking-pavimentos-passadicos',
  'vedacoes-divisorias-resguardos',
  'mobiliario-urbano-jardim',
  'abrigos-telheiros-pergolas',
  'compostores-cultivo-bordaduras',
]

const blogSlugs = [
  'mobiliario-urbano-madeira-metal',
  'pedido-orcamento-plastico-reciclado',
  'compostagem-urbana-equipamento',
]

const caseSlugs = [
  'vedacao-piscina-moita',
  'decking-mobiliario-torres-mondego',
  'floreiras-moscavide',
]

const storeSlugs = storeProductsForLanguage('pt').map((product) => product.slug)

const storeDeliveryStorageKey = 'df4y-store-delivery-postal-code-v1'
const defaultStorePostalCode = '7000-000'

async function goToNextPage(page: Page) {
  await page.locator('.page-transition.entered').waitFor({state: 'visible'})

  const nextButton = page.getByRole('button', {name: 'Seguinte'})
  if ((await nextButton.count()) === 0) return false
  if (await nextButton.isDisabled()) return false

  const activePage = page.locator('.pagination-page.active')
  const currentLabel = (await activePage.count()) > 0 ? await activePage.textContent() : ''

  // The control is briefly disabled during the page-swap transition; click()
  // auto-waits for it to become actionable.
  try {
    await nextButton.scrollIntoViewIfNeeded()
    await nextButton.click({timeout: 5000})
  } catch {
    return false
  }

  if (currentLabel) {
    await expect(activePage).not.toHaveText(currentLabel)
  }

  return true
}

async function collectPagedCards(page: Page, cardSelector: string, imageSelector?: string) {
  const links = new Set<string>()
  const imageLinks = new Set<string>()

  for (let pageIndex = 0; pageIndex < 8; pageIndex += 1) {
    const pageCards = await page.locator(cardSelector).evaluateAll(
      (anchors, selector) =>
        anchors.map((anchor) => ({
          href: (() => {
            const rawHref = (anchor as HTMLAnchorElement).getAttribute('href') ?? ''
            if (!rawHref) return ''

            const url = new URL(rawHref, window.location.origin)
            url.searchParams.delete('fromPage')
            return `${url.pathname}${url.search}`
          })(),
          hasImage: typeof selector === 'string' ? Boolean(anchor.querySelector(selector)) : false,
        })),
      imageSelector,
    )

    for (const card of pageCards) {
      links.add(card.href)
      if (card.hasImage) imageLinks.add(card.href)
    }

    if (!(await goToNextPage(page))) break
  }

  return {links, imageLinks}
}

async function collectPagedStoreCards(page: Page) {
  const slugs = new Set<string>()

  for (let pageIndex = 0; pageIndex < 8; pageIndex += 1) {
    const pageSlugs = await page
      .locator('.store-card')
      .evaluateAll((cards) =>
        cards
          .map((card) => (card as HTMLElement).dataset.storeProduct ?? '')
          .filter(Boolean),
      )

    for (const slug of pageSlugs) slugs.add(slug)

    if (!(await goToNextPage(page))) break
  }

  return slugs
}

async function preloadStoreDelivery(page: Page, postalCode = defaultStorePostalCode) {
  await page.addInitScript(
    ([storageKey, value]) => {
      window.localStorage.setItem(storageKey, value)
    },
    [storeDeliveryStorageKey, postalCode],
  )
}

async function waitForCollectionStart(page: Page, selector: string) {
  await page.waitForFunction(
    (collectionSelector) => {
      const collection = document.querySelector(collectionSelector)
      const header = document.querySelector('.site-header')
      if (!collection || !header) return false

      const top = collection.getBoundingClientRect().top
      const headerHeight = header.getBoundingClientRect().height

      return top >= -8 && top <= Math.max(headerHeight + 160, window.innerHeight * 0.28)
    },
    selector,
    {timeout: 5000},
  )
}

async function expectRouteToRender(route: PublicRoute, page: Page, testInfo: TestInfo) {
  const isMobile = testInfo.project.name.includes('mobile')

  if (route.path.includes('/loja')) {
    await preloadStoreDelivery(page)
  }

  await page.goto(route.path, {waitUntil: 'domcontentloaded'})

  await expect(page.locator('h1')).toContainText(route.heading)
  await expect(page).toHaveTitle(/DaFábrica4You/)
  const routeLanguage = new URLSearchParams(route.path.split('?')[1]).get('lang') ?? 'pt'
  await expect(page.locator('html')).toHaveAttribute('lang', routeLanguage)
  await expect(page.locator('head meta[name="description"]')).toHaveCount(1)
  await expect(page.locator('head meta[name="description"]')).toHaveAttribute('content', /.{30,}/)
  await expect(page.locator('head link[rel="canonical"]')).toHaveCount(1)
  await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute('href', /^https?:\/\//)

  const hasHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  )
  expect(hasHorizontalOverflow).toBe(false)

  const linksWithoutLanguage = await page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href^="/"]'))
      .map((link) => link.getAttribute('href') ?? '')
      .filter((href) => !href.includes('?lang=')),
  )
  expect(linksWithoutLanguage).toEqual([])

  const labels = isMobile
    ? mobileNavLabels[routeLanguage as keyof typeof mobileNavLabels]
    : desktopNavLabels[routeLanguage as keyof typeof desktopNavLabels]

  if (isMobile) {
    // The mobile nav lives behind the hamburger: open the full-screen menu first.
    await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true')
    await expect(page.locator('.header-actions > .cart-link')).toBeHidden()
    await expect(page.locator('.header-actions > .language-switcher')).toBeHidden()
    await page.locator('.nav-toggle').click()
    const menuNav = page.locator('.mobile-menu-nav')
    await expect(menuNav).toBeVisible()
    await expect(page.locator('.mobile-menu .cart-link')).toBeVisible()
    await expect(page.locator('.mobile-menu-lang')).toBeVisible()

    for (const label of labels) {
      await expect(menuNav.getByRole('link', {name: label, exact: true})).toBeVisible()
    }

    if (route.active && labels.includes(route.active)) {
      await expect(menuNav.getByRole('link', {name: route.active, exact: true})).toHaveAttribute(
        'aria-current',
        'page',
      )
    }
    return
  }

  const contextualNavigation = page.getByRole('navigation', {name: 'Main navigation'})
  await expect(contextualNavigation).toBeVisible()

  for (const label of labels) {
    await expect(contextualNavigation.getByRole('link', {name: label, exact: true})).toBeVisible()
  }

  const catalogueLabel = {pt: 'Catálogo', en: 'Catalogue', es: 'Catálogo'}[routeLanguage]

  if (route.active && labels.includes(route.active)) {
    const currentPageLink = contextualNavigation.getByRole('link', {
      name: route.active,
      exact: true,
    })
    await expect(currentPageLink).toBeVisible()
    await expect(currentPageLink).toHaveAttribute('aria-current', 'page')
  } else if (route.active === catalogueLabel) {
    // Catálogo lives outside "Main navigation" as its own header action.
    await expect(page.locator('.catalogue-link')).toHaveAttribute('aria-current', 'page')
  }
}

test.describe('public website routes', () => {
  test('public documents expose security headers and a keyboard skip link', async ({page, request}, testInfo) => {
    test.skip(testInfo.project.name.includes('mobile'), 'Header contract runs once on desktop')

    const response = await request.get('/?lang=pt')
    expect(response.headers()['content-security-policy']).toContain("default-src 'self'")
    expect(response.headers()['x-content-type-options']).toBe('nosniff')
    expect(response.headers()['referrer-policy']).toBe('strict-origin-when-cross-origin')

    await page.goto('/?lang=pt')
    const skipLink = page.getByRole('link', {name: 'Saltar para o conteúdo'})
    await expect(skipLink).toHaveAttribute('href', '#main-content')
    await skipLink.focus()
    await expect(skipLink).toBeFocused()
  })

  test.describe('desktop route smoke', () => {
    test.skip(({isMobile}) => Boolean(isMobile), 'Desktop route smoke runs once')

    for (const route of publicRoutes) {
      test(`${route.path} renders with language-safe navigation`, async ({page}, testInfo) => {
        await expectRouteToRender(route, page, testInfo)
      })
    }
  })

  test.describe('mobile route smoke', () => {
    test.skip(({isMobile}) => !isMobile, 'Mobile route smoke runs once')

    for (const route of publicRoutes.filter((route) => route.mobile !== false)) {
      test(`${route.path} renders with language-safe navigation`, async ({page}, testInfo) => {
        await expectRouteToRender(route, page, testInfo)
      })
    }
  })

  test('mobile layout holds across common phone viewports', async ({page}, testInfo) => {
    test.skip(!testInfo.project.name.includes('mobile'), 'Phone viewport audit runs once')
    await page.emulateMedia({reducedMotion: 'no-preference'})

    for (const viewport of phoneViewports) {
      await page.setViewportSize({width: viewport.width, height: viewport.height})

      for (const path of ['/?lang=pt', '/produtos?lang=pt', '/loja?lang=pt', '/blog?lang=pt']) {
        if (path.includes('/loja')) await preloadStoreDelivery(page)
        await page.goto(path, {waitUntil: 'domcontentloaded'})
        await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true')
        await expect(page.locator('h1')).toBeVisible()

        const hasHorizontalOverflow = await page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth + 1,
        )
        expect(hasHorizontalOverflow, `${viewport.name} ${path} should not overflow`).toBe(false)

        const headerFits = await page.evaluate(() => {
          const header = document.querySelector('.site-header')
          if (!header) return false
          const rect = header.getBoundingClientRect()
          return rect.left >= -1 && rect.right <= window.innerWidth + 1
        })
        expect(headerFits, `${viewport.name} ${path} header should fit`).toBe(true)
      }

      await page.goto('/?lang=pt', {waitUntil: 'domcontentloaded'})
      await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true')
      await page.locator('.nav-toggle').click()
      await expect(page.locator('.mobile-menu-nav')).toBeVisible()

      const menuFits = await page.evaluate(() => {
        const menu = document.querySelector('.mobile-menu')
        const firstLink = document.querySelector('.mobile-menu-nav a')
        if (!menu || !firstLink) return false
        const menuRect = menu.getBoundingClientRect()
        const linkRect = firstLink.getBoundingClientRect()
        return (
          menuRect.left >= -1 &&
          menuRect.right <= window.innerWidth + 1 &&
          linkRect.left >= 0 &&
          linkRect.right <= window.innerWidth
        )
      })
      expect(menuFits, `${viewport.name} menu should fit`).toBe(true)

      await page.locator('.mobile-menu-close').click()
      await page.waitForTimeout(80)
      await expect(page.locator('.mobile-menu')).toHaveCount(1)
      await expect(page.locator('.mobile-menu')).toHaveCount(0)
    }
  })

  test.describe('desktop collection contracts', () => {
    test.skip(({isMobile}) => Boolean(isMobile), 'Collection walks are viewport independent')

    test('product index links every fallback product to a detail page', async ({page}) => {
      await page.goto('/produtos?lang=pt', {waitUntil: 'domcontentloaded'})
      const {links, imageLinks} = await collectPagedCards(
        page,
        '.product-panel',
        '.product-panel-media img',
      )

      for (const slug of productSlugs) {
        expect(links.has(`/produtos/${slug}?lang=pt`)).toBe(true)
        expect(imageLinks.has(`/produtos/${slug}?lang=pt`)).toBe(true)
      }
    })

    test('decking detail exposes the product video and deck builder tool', async ({page}) => {
      await page.goto('/produtos/decking?lang=pt&fromPage=2', {waitUntil: 'domcontentloaded'})
      await page.locator('.page-transition.entered').waitFor({state: 'visible'})

      await expect(page.locator('h1')).toContainText(/Decking/)
      await expect(page.locator('.product-support-frame iframe')).toHaveAttribute(
        'src',
        /youtube-nocookie\.com\/embed\/VIUVlk51iN0/,
      )
      await expect(page.locator('.product-support-tool')).toContainText('Planeie o seu deck')
      await expect(page.getByRole('link', {name: 'Construir o meu deck'})).toHaveAttribute(
        'href',
        'https://claculo-de-deck-production.up.railway.app/4NPPcI82N5FpJ7-iqURGm0uMdUpVBy-m',
      )
    })

    test('product CTA placement follows whether the product has video/tool support', async ({
      page,
    }) => {
      // Fallback content only has two real shapes today: a product with no
      // video/tool ("vedacoes...") and one with both ("decking..."). Video-only
      // and tool-only are additive to the same `hasProductSupport` boolean, so
      // covering these two locks the actual placement branch that regressed.
      await page.goto('/produtos/vedacoes-divisorias-resguardos?lang=pt', {
        waitUntil: 'domcontentloaded',
      })
      await page.locator('.page-transition.entered').waitFor({state: 'visible'})
      await expect(page.locator('.product-stage-cta .button')).toBeVisible()
      await expect(page.locator('.product-editorial-support')).toHaveCount(0)
      await expect(page.locator('.product-editorial-cta')).toHaveCount(0)

      await page.goto('/produtos/decking-pavimentos-passadicos?lang=pt', {
        waitUntil: 'domcontentloaded',
      })
      await page.locator('.page-transition.entered').waitFor({state: 'visible'})
      await expect(page.locator('.product-stage-cta')).toHaveCount(0)
      await expect(page.locator('.product-editorial-support')).toBeVisible()
      await expect(page.locator('.product-editorial-support')).not.toHaveClass(/is-single/)
      await expect(page.locator('.product-support-frame iframe')).toHaveCount(1)
      await expect(page.locator('.product-support-tool-link')).toHaveCount(1)
      await expect(page.locator('.product-editorial-cta .button')).toBeVisible()
    })

    test('blog index links every fallback post to a detail page', async ({page}) => {
      await page.goto('/blog?lang=pt', {waitUntil: 'domcontentloaded'})
      const {links, imageLinks} = await collectPagedCards(
        page,
        '.journal-card',
        '.journal-card-media img',
      )

      for (const slug of blogSlugs) {
        expect(links.has(`/blog/${slug}?lang=pt`)).toBe(true)
        expect(imageLinks.has(`/blog/${slug}?lang=pt`)).toBe(true)
      }
    })

    test('case-study index renders CMS-ready project images', async ({page}) => {
      await page.goto('/casos-de-estudo?lang=pt', {waitUntil: 'domcontentloaded'})
      const {imageLinks} = await collectPagedCards(page, '.case-card', '.case-card-media img')

      for (const slug of caseSlugs) {
        expect(imageLinks.has(`/casos-de-estudo/${slug}?lang=pt`)).toBe(true)
      }
    })

    test('store page exposes catalogue-priced products with filters and pagination', async ({
      page,
    }) => {
      await preloadStoreDelivery(page)
      await page.goto('/loja?lang=pt', {waitUntil: 'domcontentloaded'})

      await expect(page.locator('.store-card')).toHaveCount(9)
      const slugs = await collectPagedStoreCards(page)
      for (const slug of storeSlugs) {
        expect(slugs.has(slug)).toBe(true)
      }

      await page.getByLabel('Pesquisar na loja').fill('Gavião')
      await expect(page.locator('[data-store-product="banco-gaviao"]')).toBeVisible()
      await expect(page.locator('[data-store-product="banco-gaviao"]')).toHaveAttribute(
        'href',
        '/loja/banco-gaviao?lang=pt',
      )
      await expect(
        page.locator('[data-store-product="banco-gaviao"] .store-card-visual img'),
      ).toBeVisible()
      await expect(page.locator('[data-store-product="banco-fazenda"]')).toHaveCount(0)
      await expect(page.locator('[data-store-product="banco-gaviao"]')).toContainText('276,49')
      await expect(page.locator('[data-store-product="banco-gaviao"]')).not.toContainText('2000 mm')
      await expect(page.getByRole('link', {name: 'Pedir proposta'})).toHaveCount(0)

      await page.getByLabel('Pesquisar na loja').fill('')
      await page.getByLabel('Categoria').selectOption('residuos')
      await expect(page.locator('[data-store-product="ecoponto-4-residuos"]')).toBeVisible()
      await expect(page.locator('[data-store-product="mesa-de-cultivo"]')).toHaveCount(0)
    })

    test('store postal gate does not flash when a valid postcode is saved', async ({page}) => {
      await preloadStoreDelivery(page, '7000-000')
      await page.goto('/loja?lang=pt', {waitUntil: 'domcontentloaded'})

      await expect(page.locator('html')).toHaveAttribute('data-store-postal-ready', 'true')
      await expect(page.locator('.store-gate-layer')).toBeHidden()
      await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true')
      await expect(page.locator('.store-gate-layer')).toHaveCount(0)
      await expect(page.locator('.store-blurred-preview')).toHaveCount(0)

      await page.getByRole('button', {name: 'Alterar'}).click()
      await expect(page.locator('.store-gate-layer')).toBeVisible()
      await expect(page.getByRole('button', {name: 'Atualizar código postal'})).toBeVisible()
    })

    test('store detail lets visitors choose variant, finish and cart before requesting', async ({
      page,
    }) => {
      await preloadStoreDelivery(page)
      await page.goto('/loja/mesa-vale-do-arco?lang=pt', {waitUntil: 'domcontentloaded'})
      await page.locator('.page-transition.entered').waitFor({state: 'visible'})

      await expect(page.getByRole('heading', {name: 'Mesa Vale do Arco'})).toBeVisible()
      await expect(page.locator('.store-spec-price:not(.store-spec-total)')).toContainText('322,00')

      await page.getByRole('button', {name: '2450 mm'}).click()
      await expect(page.locator('.store-spec-price:not(.store-spec-total)')).toContainText('445,00')

      await page.getByRole('button', {name: 'Castanho / Preto'}).click()
      await expect(page.locator('.store-spec-price:not(.store-spec-total)')).toContainText('565,00')
      await expect(page.locator('.store-spec-grid')).toContainText('Comprimento 2450 mm')

      await page.getByRole('button', {name: 'Adicionar ao carrinho'}).click()
      await expect(page.getByRole('status')).toContainText('Adicionado ao carrinho')
      await expect(page.locator('.cart-count')).toHaveText('1')

      await page.getByRole('link', {name: 'Ver carrinho'}).click()
      await expect(page).toHaveURL(/\/carrinho\?lang=pt/)
      await expect(page.getByRole('heading', {name: 'Reveja os produtos antes de pedir orçamento'})).toBeVisible()
      await expect(page.locator('.cart-item')).toContainText('Mesa Vale do Arco')
      await expect(page.locator('.cart-item')).toContainText('2450 mm')
      await expect(page.locator('.cart-item')).toContainText('Castanho / Preto')
      await expect(page.locator('.cart-item')).toContainText('565,00')

      await page.locator('.cart-item').getByLabel('Quantidade').fill('2')
      await expect(page.locator('.cart-summary')).toContainText(/1.?588,21/)

      await page.getByRole('link', {name: 'Finalizar pedido'}).click()
      await expect(page).toHaveURL(/\/finalizar-compra\?lang=pt/)
      await expect(page.getByRole('heading', {name: 'Finalizar pedido'})).toBeVisible()
      await expect(page.locator('.checkout-summary')).toContainText('Mesa Vale do Arco')
      await expect(page.locator('.checkout-summary')).toContainText('2450 mm')
      await expect(page.locator('.checkout-summary')).toContainText('Castanho / Preto')
      await expect(page.locator('.checkout-summary')).toContainText(/1.?588,21/)
      await expect(page.getByLabel('Nome')).toBeVisible()
      await expect(page.getByRole('button', {name: 'Submeter pedido'})).toBeVisible()
    })

    test('checkout page mints a fresh submission token on every load and guards double-submit', async ({
      page,
    }) => {
      await preloadStoreDelivery(page)
      await page.goto('/loja/banco-gaviao?lang=pt', {waitUntil: 'domcontentloaded'})
      await page.locator('.page-transition.entered').waitFor({state: 'visible'})
      await page.getByRole('button', {name: 'Adicionar ao carrinho'}).click()
      await page.getByRole('link', {name: 'Ver carrinho'}).click()
      await page.getByRole('link', {name: 'Finalizar pedido'}).click()
      await expect(page).toHaveURL(/\/finalizar-compra\?lang=pt/)

      const tokenField = page.locator('input[name="submissionToken"]')
      const firstToken = await tokenField.getAttribute('value')
      expect(firstToken).toBeTruthy()

      await page.reload({waitUntil: 'domcontentloaded'})
      await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true')
      const secondToken = await page.locator('input[name="submissionToken"]').getAttribute('value')
      expect(secondToken).toBeTruthy()
      // A fresh token per page render is what lets the server treat a
      // same-token resubmit as the same checkout attempt (DB unique
      // constraint) rather than minting a second order.
      expect(secondToken).not.toBe(firstToken)

      // A role+name locator would stop matching once the label swaps to "A
      // enviar…" mid-submit, hiding exactly the state this test checks — use
      // a stable selector instead.
      const submit = page.locator('.checkout-final-actions button[type="submit"]')
      test.skip(
        await submit.isDisabled(),
        'Checkout requires a configured database in this environment',
      )

      await page.getByLabel('Nome').fill('Maria Silva')
      await page.getByLabel('Email').fill('maria@example.com')
      await page.getByLabel('Telefone').fill('912345678')
      // Billing and delivery fieldsets share the same field labels — fill both.
      const addressFields = page.getByLabel('Morada', {exact: true})
      const postalFields = page.getByLabel('Código postal', {exact: true})
      const localityFields = page.getByLabel('Localidade', {exact: true})
      for (const index of [0, 1]) {
        await addressFields.nth(index).fill('Rua das Flores 10')
        await postalFields.nth(index).fill('7000-000')
        await localityFields.nth(index).fill('Évora')
      }

      let checkoutRequests = 0
      await page.route('**/finalizar-compra**', async (route) => {
        if (route.request().method() !== 'POST') return route.continue()
        checkoutRequests += 1
        // Hold the response open long enough to prove the client-side guard
        // (disabled + "A enviar…") blocks a second click while the first
        // submit is still in flight, before letting it through.
        await new Promise((resolve) => setTimeout(resolve, 400))
        await route.continue()
      })

      await submit.click()
      await expect(submit).toBeDisabled()
      await expect(submit).toHaveText('A enviar…')

      // Clicking a disabled button is a no-op in the browser — these prove
      // that, not just that we chose not to retry.
      await submit.click({force: true})
      await submit.click({force: true})

      // A configured DB means this actually creates the order: the form is
      // replaced by the success panel rather than the button re-enabling.
      await expect(page.locator('.checkout-success')).toBeVisible({timeout: 3000})
      expect(checkoutRequests).toBe(1)
    })

    test('unknown CMS slugs return a not found page', async ({page}) => {
      const response = await page.goto('/produtos/not-a-real-product?lang=pt', {
        waitUntil: 'domcontentloaded',
      })

      expect(response?.status()).toBe(404)
      await expect(page.getByRole('heading', {name: 'Página não encontrada'})).toBeVisible()
    })
  })

  test('pagination returns the reader to the top of the collection', async ({page}) => {
    await page.goto('/casos-de-estudo?lang=pt', {waitUntil: 'domcontentloaded'})
    await page.locator('.page-transition.entered').waitFor({state: 'visible'})

    test.skip(
      (await page.locator('.pagination-page').count()) < 2,
      'Pagination behavior only applies when the collection has a second page',
    )

    await page.locator('.pagination').scrollIntoViewIfNeeded()
    const beforePaginationScroll = await page.evaluate(() => window.scrollY)

    await page.getByRole('button', {name: 'Seguinte'}).click()
    await expect(page.locator('.pagination-page.active')).toHaveText('2')
    await waitForCollectionStart(page, '.case-collection-section')

    const afterPaginationScroll = await page.evaluate(() => window.scrollY)
    expect(afterPaginationScroll).toBeLessThan(beforePaginationScroll)
  })

  test('collection detail links preserve the current list page', async ({page}) => {
    await preloadStoreDelivery(page)
    await page.goto('/loja?lang=pt', {waitUntil: 'domcontentloaded'})
    await page.locator('.page-transition.entered').waitFor({state: 'visible'})

    test.skip(
      (await page.locator('.pagination-page').count()) < 2,
      'Return-page behavior needs a second collection page',
    )

    await page.getByRole('button', {name: 'Seguinte'}).click()
    await expect(page.locator('.pagination-page.active')).toHaveText('2')
    await expect(page).toHaveURL(/\/loja\?lang=pt&page=2/)

    const storeCard = page.locator('.store-card').first()
    await expect(storeCard).toHaveAttribute('href', /fromPage=2/)

    await storeCard.click()
    await expect(page).toHaveURL(/\/loja\/.+fromPage=2/)
    await expect(page.getByRole('link', {name: 'Voltar à loja'})).toHaveAttribute(
      'href',
      '/loja?lang=pt&page=2',
    )

    await page.getByRole('link', {name: 'Voltar à loja'}).click()
    await expect(page).toHaveURL(/\/loja\?lang=pt&page=2/)
    await expect(page.locator('.pagination-page.active')).toHaveText('2')
  })

  test('blog cards present article context and read action', async ({page}) => {
    await page.goto('/blog?lang=pt', {waitUntil: 'domcontentloaded'})

    const article = page.locator('.journal-card').first()
    await expect(article).toContainText('Ler artigo')
    await expect(article.locator('p')).toBeVisible()
    await expect(article.locator('time')).toBeVisible()
  })

  test('blog detail exposes related articles and sharing controls', async ({page}) => {
    await page.goto('/blog/mobiliario-urbano-madeira-metal?lang=pt', {
      waitUntil: 'domcontentloaded',
    })

    const extras = page.locator('.blog-article-extras')
    await expect(extras).toBeVisible()
    await expect(extras.getByRole('heading', {name: 'Ler também'})).toBeVisible()
    await expect(extras.locator('.blog-related-panel a')).toHaveCount(2)
    await expect(extras.locator('.blog-related-panel a').first()).toHaveAttribute(
      'href',
      /\/blog\//,
    )
    await expect(extras.getByRole('link', {name: /Partilhar no WhatsApp/})).toHaveAttribute(
      'href',
      /wa\.me/,
    )
    await expect(extras.getByRole('link', {name: /Partilhar no LinkedIn/})).toHaveAttribute(
      'href',
      /linkedin\.com/,
    )
    await expect(extras.getByRole('button', {name: /Copiar link/})).toBeVisible()
  })

  test('refresh starts at the beginning of the page', async ({page}) => {
    await page.goto('/?lang=pt', {waitUntil: 'domcontentloaded'})
    await page.locator('.page-transition.entered').waitFor({state: 'visible'})
    await page.waitForFunction(
      () => document.documentElement.scrollHeight > window.innerHeight + 240,
    )
    await page.waitForTimeout(180)

    const scrollTarget = await page.evaluate(() => {
      const scroller = document.scrollingElement || document.documentElement
      return Math.min(900, scroller.scrollHeight - window.innerHeight)
    })
    test.skip(scrollTarget <= 40, 'Refresh reset needs a scrollable page')

    await page.getByRole('contentinfo').scrollIntoViewIfNeeded()
    await page.evaluate((target) => {
      const scroller = document.scrollingElement || document.documentElement
      window.scrollTo(0, target)
      document.documentElement.scrollTop = target
      document.body.scrollTop = target
      scroller.scrollTop = target
    }, scrollTarget)
    await page.waitForFunction(
      () =>
        Math.max(
          window.scrollY,
          document.documentElement.scrollTop,
          document.body.scrollTop,
          document.scrollingElement?.scrollTop || 0,
        ) > 40,
    )

    await page.reload()
    await page.waitForFunction(
      () =>
        Math.max(
          window.scrollY,
          document.documentElement.scrollTop,
          document.body.scrollTop,
          document.scrollingElement?.scrollTop || 0,
        ) <= 2,
    )
  })

  test('localized contact form keeps the message field as a textarea', async ({page}) => {
    await page.goto('/contacto?lang=es', {waitUntil: 'domcontentloaded'})
    await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true')

    await expect(page.getByText('Teléfono')).toHaveCount(2)
    await expect(page.locator('textarea')).toHaveCount(1)
    await expect(page.locator('form')).toContainText('Mensaje')
    await expect(page.locator('form input[type="checkbox"]')).toHaveCount(1)
    await expect(page.getByRole('link', {name: 'Instagram'})).toHaveCount(2)
    await expect(page.getByRole('link', {name: 'Libro de reclamaciones'})).toHaveCount(2)
    await expect(page.getByRole('link', {name: 'Política de privacidad'})).toHaveAttribute(
      'href',
      'https://www.iubenda.com/privacy-policy/56295339',
    )
    await expect(page.getByRole('link', {name: 'Política de cookies'})).toHaveAttribute(
      'href',
      'https://www.iubenda.com/privacy-policy/56295339/cookie-policy',
    )
    await expect(page.getByRole('link', {name: 'Libro de reclamaciones'}).first()).toHaveAttribute(
      'href',
      'https://www.livroreclamacoes.pt/Pedido/Reclamacao',
    )
    await expect(
      page.getByText(
        'Los litigios comerciales se resolverán en el tribunal de la comarca de Leiria.',
      ),
    ).toHaveCount(2)

    const form = page.locator('form')
    const submit = form.getByRole('button', {name: 'Pedir presupuesto'})

    await expect(submit).toBeDisabled()

    await form.getByLabel('Nombre').fill('Maria')
    await form.getByLabel('Apellidos').fill('Silva')
    await form.getByLabel('Email').fill('maria@example.com')
    await form.getByLabel('Teléfono').fill('+351 900 000 000')
    await form.getByLabel('Dirección').fill('Rua das Flores 10')
    await form.getByLabel('Código postal').fill('2400-000')
    await form.getByLabel('Localidad').fill('Leiria')
    await form.getByLabel('Mensaje').fill('Necesito presupuesto para una terraza.')

    await expect(submit).toBeDisabled()

    await form.locator('input[name="marketingConsent"]').evaluate((element) => {
      const checkbox = element as HTMLInputElement
      checkbox.checked = true
      checkbox.dispatchEvent(new Event('input', {bubbles: true}))
      checkbox.dispatchEvent(new Event('change', {bubbles: true}))
    })
    await expect(form.getByRole('checkbox')).toBeChecked()
    await expect(submit).toBeEnabled()
  })
})

test.describe('global search', () => {
  test.describe('desktop trigger', () => {
    test.skip(({isMobile}) => Boolean(isMobile), 'Desktop nav trigger only')

    test('opens via the nav trigger and focuses the input', async ({page}) => {
      await page.goto('/?lang=pt', {waitUntil: 'domcontentloaded'})
      await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true')
      await page.locator('.nav-search-trigger').click()
      await expect(page.locator('.search-overlay')).toBeVisible()
      await expect(page.locator('.search-input-row input')).toBeFocused()
    })

    test('opens via Ctrl+K from anywhere', async ({page}) => {
      await page.goto('/sobre-nos?lang=pt', {waitUntil: 'domcontentloaded'})
      await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true')
      await page.keyboard.press('Control+k')
      await expect(page.locator('.search-overlay')).toBeVisible()
    })

    test('matches across categories in a single query', async ({page}) => {
      await page.goto('/?lang=pt', {waitUntil: 'domcontentloaded'})
      await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true')
      await page.locator('.nav-search-trigger').click()

      const [response] = await Promise.all([
        page.waitForResponse((res) => res.url().includes('/api/search') && res.status() === 200),
        page.locator('.search-input-row input').fill('ved'),
      ])
      expect(response.ok()).toBe(true)

      const groupLabels = await page.locator('.search-group-label').allTextContents()
      expect(groupLabels).toContain('Soluções')
      expect(groupLabels).toContain('Casos de estudo')
    })

    test('clicking a result navigates and closes the overlay', async ({page}) => {
      await page.goto('/?lang=pt', {waitUntil: 'domcontentloaded'})
      await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true')
      await page.locator('.nav-search-trigger').click()

      await Promise.all([
        page.waitForResponse((res) => res.url().includes('/api/search') && res.status() === 200),
        page.locator('.search-input-row input').fill('gaviao'),
      ])

      const result = page.locator('.search-result').first()
      await expect(result).toBeVisible()
      await result.click()

      await expect(page).toHaveURL(/\/loja\/banco-gaviao\?lang=pt/)
      await expect(page.locator('.search-overlay')).toHaveCount(0)
    })

    test('Escape closes and restores focus to the trigger', async ({page}) => {
      await page.goto('/?lang=pt', {waitUntil: 'domcontentloaded'})
      await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true')
      const trigger = page.locator('.nav-search-trigger')
      await trigger.click()
      await expect(page.locator('.search-overlay')).toBeVisible()

      await page.keyboard.press('Escape')
      await expect(page.locator('.search-overlay')).toHaveCount(0)
      await expect(trigger).toBeFocused()
    })

    test('a single-character query does not fire a network request', async ({page}) => {
      await page.goto('/?lang=pt', {waitUntil: 'domcontentloaded'})
      await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true')
      await page.locator('.nav-search-trigger').click()

      let requested = false
      page.on('request', (request) => {
        if (request.url().includes('/api/search')) requested = true
      })

      await page.locator('.search-input-row input').fill('m')
      await page.waitForTimeout(400)
      expect(requested).toBe(false)
    })

    test('a response that lands after close-and-reopen does not overwrite fresh results', async ({
      page,
    }) => {
      await page.goto('/?lang=pt', {waitUntil: 'domcontentloaded'})
      await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true')

      // Delay only the first query's response so it resolves after the
      // overlay has been closed and reopened — the searchToken guard should
      // discard it instead of clobbering the reopened overlay's fresh state.
      let intercepted = false
      await page.route('**/api/search*', async (route) => {
        if (!intercepted && route.request().url().includes('q=gaviao')) {
          intercepted = true
          await new Promise((resolve) => setTimeout(resolve, 500))
        }
        await route.continue()
      })

      await page.locator('.nav-search-trigger').click()
      await page.locator('.search-input-row input').fill('gaviao')
      await page.keyboard.press('Escape')
      await expect(page.locator('.search-overlay')).toHaveCount(0)

      await page.locator('.nav-search-trigger').click()
      await expect(page.locator('.search-input-row input')).toHaveValue('')

      // Give the delayed "gaviao" response time to land in the background.
      await page.waitForTimeout(700)

      // The reopened overlay must still show its own (empty-query) top-items
      // state, not the stale "gaviao" results from the discarded request.
      await expect(page.locator('.search-input-row input')).toHaveValue('')
      const groupLabels = await page.locator('.search-group-label').allTextContents()
      expect(groupLabels.length).toBeGreaterThan(1)
    })
  })

  test.describe('results scrolling', () => {
    test.skip(({isMobile}) => Boolean(isMobile), 'Lenis is desktop-only')

    test('the results list scrolls with the mouse wheel', async ({page}) => {
      // Lenis keeps calling preventDefault() on wheel events even after
      // lenis.stop() runs (the lightbox-open scroll lock) — data-lenis-prevent
      // on the overlay is what actually restores native scroll. Force Lenis on
      // (config default is reducedMotion: 'reduce', which skips Lenis entirely
      // and would let this test pass for the wrong reason).
      await page.emulateMedia({reducedMotion: 'no-preference'})
      await page.goto('/?lang=pt', {waitUntil: 'domcontentloaded'})
      await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true')
      await page.locator('.nav-search-trigger').click()
      await expect(page.locator('.search-result').first()).toBeVisible()

      const results = page.locator('.search-results')
      const before = await results.evaluate((el) => el.scrollTop)
      const box = await results.boundingBox()
      if (!box) throw new Error('search results panel has no bounding box')

      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await page.mouse.wheel(0, 400)
      await expect
        .poll(() => results.evaluate((el) => el.scrollTop))
        .toBeGreaterThan(before)
    })
  })

  test.describe('mobile trigger', () => {
    test.skip(({isMobile}) => !isMobile, 'Mobile header trigger only')

    test('reaches search through the header trigger, not the collapsed nav', async ({page}) => {
      await page.goto('/?lang=pt', {waitUntil: 'domcontentloaded'})
      await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true')
      await expect(page.locator('.nav-search-trigger')).toBeHidden()
      await page.locator('.header-search-trigger').click()
      await expect(page.locator('.search-overlay')).toBeVisible()
    })
  })
})

test.describe('language switcher', () => {
  test.describe('desktop select', () => {
    test.skip(({isMobile}) => Boolean(isMobile), 'Desktop select lives in .header-actions')

    test('select changes the URL and page content', async ({page}) => {
      await page.goto('/?lang=pt', {waitUntil: 'domcontentloaded'})
      await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true')

      await page.locator('.header-actions > .language-switcher').selectOption('en')
      await expect(page).toHaveURL(/\?lang=en/)
      await expect(
        page.locator('.header-actions > .language-switcher'),
      ).toHaveValue('en')
      await expect(page.getByRole('navigation', {name: 'Main navigation'})).toContainText('Solutions')
    })

    test('select round-trips through Spanish', async ({page}) => {
      await page.goto('/?lang=pt', {waitUntil: 'domcontentloaded'})
      await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true')

      await page.locator('.header-actions > .language-switcher').selectOption('es')
      await expect(page).toHaveURL(/\?lang=es/)
      await expect(page.locator('html')).toHaveAttribute('lang', 'es')
      await expect(page.getByRole('navigation', {name: 'Main navigation'})).toContainText('Soluciones')

      await page.locator('.header-actions > .language-switcher').selectOption('pt')
      await expect(page).toHaveURL(/\?lang=pt/)
      await expect(page.locator('html')).toHaveAttribute('lang', 'pt')
      await expect(page.getByRole('navigation', {name: 'Main navigation'})).toContainText('Soluções')
    })
  })

  test.describe('mobile menu links', () => {
    test.skip(({isMobile}) => !isMobile, 'Mobile menu language links only')

    test('mobile-menu-lang links switch language and close-and-reopen keeps the active state', async ({
      page,
    }) => {
      await page.goto('/?lang=pt', {waitUntil: 'domcontentloaded'})
      await page.waitForFunction(() => document.documentElement.dataset.appReady === 'true')
      await page.locator('.nav-toggle').click()

      const langMenu = page.locator('.mobile-menu-lang')
      await expect(langMenu).toBeVisible()
      await expect(langMenu.getByRole('link', {name: 'PT'})).toHaveAttribute('aria-current', 'page')

      await langMenu.getByRole('link', {name: 'EN', exact: true}).click()
      await expect(page).toHaveURL(/\?lang=en/)
      await expect(page.locator('html')).toHaveAttribute('lang', 'en')

      await page.locator('.nav-toggle').click()
      await expect(page.locator('.mobile-menu-lang').getByRole('link', {name: 'EN'})).toHaveAttribute(
        'aria-current',
        'page',
      )
    })
  })
})

test.describe('catalogue + private backoffice', () => {
  test('catalogue page hosts its own request form with name split and a message field', async ({
    page,
  }) => {
    await page.goto('/catalogo?lang=pt')
    const form = page.locator('form.catalogue-form')
    await expect(form).toBeVisible()
    await expect(form.getByLabel('Nome', {exact: true})).toBeVisible()
    await expect(form.getByLabel('Apelido')).toBeVisible()
    await expect(form.getByLabel('Morada')).toBeVisible()
    await expect(form.locator('textarea')).toHaveCount(1)
  })

  test('unauthenticated backoffice redirects to the login page', async ({page}) => {
    await page.goto('/painel')
    await expect(page).toHaveURL(/\/painel\/login/)
    await expect(page.getByRole('heading', {name: 'Backoffice'})).toBeVisible()
  })

  test('backoffice subpages require login', async ({page}) => {
    await page.goto('/painel/contactos')
    await expect(page).toHaveURL(/\/painel\/login/)
  })
})

test.describe('SEO endpoints', () => {
  test('robots.txt allows crawling, blocks private areas and links the sitemap', async ({
    request,
  }) => {
    const response = await request.get('/robots.txt')
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('text/plain')

    const body = await response.text()
    expect(body).toContain('User-agent: *')
    expect(body).toContain('Disallow: /painel')
    expect(body).toContain('Disallow: /carrinho')
    expect(body).toMatch(/Sitemap: https?:\/\/\S+\/sitemap\.xml/)
  })

  test('sitemap.xml lists public URLs with hreflang and excludes private pages', async ({
    request,
  }) => {
    const response = await request.get('/sitemap.xml')
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('xml')

    const body = await response.text()
    expect(body).toContain('<urlset')
    expect(body).toContain('/sobre-nos')
    expect(body).toContain('/contacto')
    expect(body).toContain('hreflang="en"')
    expect(body).toContain('hreflang="x-default"')
    expect(body).not.toContain('/painel')
    expect(body).not.toContain('/carrinho')
    expect((body.match(/<loc>/g) ?? []).length).toBeGreaterThanOrEqual(8)
  })
})

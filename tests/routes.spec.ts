import {expect, test, type Page, type TestInfo} from '@playwright/test'

type PublicRoute = {
  path: string
  heading: string
  active: string | null
  mobile?: boolean
}

const publicRoutes: PublicRoute[] = [
  {path: '/?lang=pt', heading: 'não requerem manutenção', active: 'Início'},
  {path: '/sobre-nos?lang=pt', heading: 'Do ecoponto amarelo', active: 'Sobre'},
  {path: '/produtos?lang=pt', heading: 'Soluções para exterior', active: 'Produtos'},
  {path: '/loja?lang=pt', heading: 'Produtos com preço', active: 'Loja'},
  {path: '/loja/banco-gaviao?lang=pt', heading: 'Banco Gavião', active: 'Loja'},
  {path: '/carrinho?lang=pt', heading: 'Reveja os produtos', active: null},
  {
    path: '/produtos/decking-pavimentos-passadicos?lang=pt',
    heading: 'Decking, pavimentos e passadiços',
    active: 'Produtos',
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
  pt: ['Início', 'Sobre', 'Produtos', 'Casos', 'Blog'],
  en: ['Home', 'About', 'Products', 'Cases', 'Blog'],
  es: ['Inicio', 'Sobre', 'Productos', 'Casos', 'Blog'],
}

const desktopProductMenuLabels = {
  pt: ['Produtos', 'Loja', 'Catálogo'],
  en: ['Products', 'Store', 'Catalogue'],
  es: ['Productos', 'Tienda', 'Catálogo'],
}

const mobileNavLabels = {
  pt: ['Início', 'Produtos', 'Loja', 'Catálogo', 'Casos', 'Contacto'],
  en: ['Home', 'Products', 'Store', 'Catalogue', 'Cases', 'Contact'],
  es: ['Inicio', 'Productos', 'Tienda', 'Catálogo', 'Casos', 'Contacto'],
}

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

const storeSlugs = [
  'banco-gaviao',
  'banco-foros-domingao',
  'banco-fazenda',
  'banco-montargil',
  'mesa-vale-do-arco',
  'mesa-octogonal',
  'conjunto-atalia',
  'cadeira-atalaia',
  'cadeira-de-bar',
  'mesa-ervideira',
  'papeleira-reta',
  'ecoponto-triplo-com-portas',
  'ecoponto-4-residuos',
  'mesa-de-cultivo',
  'canteiro-com-trelica',
]

const storeDeliveryStorageKey = 'df4y-store-delivery-postal-code-v1'
const defaultStorePostalCode = '7000-000'

async function goToNextPage(page: Page) {
  await page.locator('.page-transition.entered').waitFor({state: 'visible'})

  const nextButton = page.getByRole('button', {name: 'Seguinte'})
  if ((await nextButton.count()) === 0) return false

  const activePage = page.locator('.pagination-page.active')
  const currentLabel = (await activePage.count()) > 0 ? await activePage.textContent() : ''

  // The control is briefly disabled during the page-swap transition; click()
  // auto-waits for it to be enabled. On the last page it stays disabled, so the
  // click times out — treat that as "no more pages".
  try {
    await nextButton.click({timeout: 1500})
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

  const contextualNavigation = page.getByRole('navigation', {
    name: isMobile ? 'Mobile quick navigation' : 'Main navigation',
  })
  const routeLanguage = new URLSearchParams(route.path.split('?')[1]).get('lang') ?? 'pt'
  const labels = isMobile
    ? mobileNavLabels[routeLanguage as keyof typeof mobileNavLabels]
    : desktopNavLabels[routeLanguage as keyof typeof desktopNavLabels]

  await expect(contextualNavigation).toBeVisible()

  for (const label of labels) {
    await expect(contextualNavigation.getByRole('link', {name: label, exact: true})).toBeVisible()
  }

  if (!isMobile) {
    const productLabels =
      desktopProductMenuLabels[routeLanguage as keyof typeof desktopProductMenuLabels]
    const productTrigger = contextualNavigation.getByRole('link', {
      name: productLabels[0],
      exact: true,
    })

    await productTrigger.hover()
    for (const label of productLabels.slice(1)) {
      await expect(contextualNavigation.getByRole('link', {name: label, exact: true})).toBeVisible()
    }
  }

  if (route.active && labels.includes(route.active)) {
    const currentPageLink = contextualNavigation.getByRole('link', {
      name: route.active,
      exact: true,
    })
    await expect(currentPageLink).toBeVisible()
    await expect(currentPageLink).toHaveAttribute('aria-current', 'page')
  } else if (!isMobile && route.active) {
    const productLabels =
      desktopProductMenuLabels[routeLanguage as keyof typeof desktopProductMenuLabels]

    if (productLabels.includes(route.active)) {
      await contextualNavigation
        .getByRole('link', {name: productLabels[0], exact: true})
        .hover()
      const currentPageLink = contextualNavigation.getByRole('link', {
        name: route.active,
        exact: true,
      })
      await expect(currentPageLink).toBeVisible()
      await expect(currentPageLink).toHaveAttribute('aria-current', 'page')
    }
  }
}

test.describe('public website routes', () => {
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

      await page.getByRole('link', {name: 'Pedir orçamento'}).click()
      await expect(page).toHaveURL(/\/contacto\?lang=pt&source=loja/)
      await expect(page.getByLabel('Mensagem')).toHaveValue(
        /Mesa Vale do Arco[\s\S]*2450 mm[\s\S]*Castanho \/ Preto[\s\S]*2 x 565,00/,
      )
    })

    test('unknown CMS slugs return a not found page', async ({page}) => {
      const response = await page.goto('/produtos/not-a-real-product?lang=pt', {
        waitUntil: 'domcontentloaded',
      })

      expect(response?.status()).toBe(404)
      await expect(page.getByText('Product not found')).toBeVisible()
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

    await expect(page.getByText('Teléfono')).toHaveCount(2)
    await expect(page.locator('textarea')).toHaveCount(1)
    await expect(page.locator('form')).toContainText('Mensaje')
    await expect(page.locator('form input[type="checkbox"]')).toHaveCount(1)
    await expect(page.getByRole('link', {name: 'Instagram'})).toHaveCount(2)
    await expect(page.getByRole('link', {name: 'Libro de reclamaciones'})).toHaveCount(2)
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

    await form.getByRole('checkbox').check()
    await expect(submit).toBeEnabled()
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

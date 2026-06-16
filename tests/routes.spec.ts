import {expect, test, type Page, type TestInfo} from '@playwright/test'

type PublicRoute = {
  path: string
  heading: string
  active: string | null
  mobile?: boolean
}

const publicRoutes: PublicRoute[] = [
  {path: '/?lang=pt', heading: 'Plástico reciclado para exteriores vivos', active: 'Início'},
  {path: '/sobre-nos?lang=pt', heading: 'Do drama dos plásticos', active: 'Sobre'},
  {path: '/produtos?lang=pt', heading: 'Soluções para exterior', active: 'Produtos'},
  {
    path: '/produtos/decking-pavimentos-passadicos?lang=pt',
    heading: 'Decking, pavimentos e passadiços',
    active: 'Produtos',
    mobile: false,
  },
  {path: '/catalogo?lang=en', heading: 'A serious price starts with context', active: 'Catalogue'},
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

const navLabels = {
  pt: {home: 'Início', about: 'Sobre', products: 'Produtos'},
  en: {home: 'Home', about: 'About', products: 'Products'},
  es: {home: 'Inicio', about: 'Sobre', products: 'Productos'},
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

async function goToNextPage(page: Page) {
  await page.locator('.page-transition.entered').waitFor({state: 'visible'})

  const nextButton = page.getByRole('button', {name: 'Seguinte'})
  if ((await nextButton.count()) === 0 || !(await nextButton.isEnabled())) return false

  const pageLabel = page.locator('.pagination span')
  const currentLabel = (await pageLabel.count()) > 0 ? await pageLabel.textContent() : ''

  await nextButton.click()

  if (currentLabel) {
    await expect(pageLabel).not.toHaveText(currentLabel)
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
          href: (anchor as HTMLAnchorElement).getAttribute('href') ?? '',
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

  if (route.active) {
    const contextualNavigation = page.getByRole('navigation', {
      name: isMobile ? 'Mobile quick navigation' : 'Main navigation',
    })
    const currentPageLink = contextualNavigation.getByRole('link', {name: route.active, exact: true})
    const routeLanguage = new URLSearchParams(route.path.split('?')[1]).get('lang') ?? 'pt'
    const labels = navLabels[routeLanguage as keyof typeof navLabels]

    await expect(contextualNavigation).toBeVisible()
    await expect(currentPageLink).toHaveCount(0)

    if (route.active === labels.home) {
      await expect(contextualNavigation.getByRole('link', {name: labels.products, exact: true})).toBeVisible()
    } else {
      await expect(contextualNavigation.getByRole('link', {name: labels.home, exact: true})).toBeVisible()
    }

    if (isMobile && route.active !== labels.about) {
      await expect(contextualNavigation.getByRole('link', {name: labels.about, exact: true})).toBeVisible()
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
      const {links, imageLinks} = await collectPagedCards(page, '.journal-card', '.journal-card-media img')

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

    test('unknown CMS slugs return a not found page', async ({page}) => {
      const response = await page.goto('/produtos/not-a-real-product?lang=pt', {
        waitUntil: 'domcontentloaded',
      })

      expect(response?.status()).toBe(404)
      await expect(page.getByText('Product not found')).toBeVisible()
    })
  })

  test('pagination returns the reader to the top of the collection', async ({page}) => {
    await page.goto('/produtos?lang=pt', {waitUntil: 'domcontentloaded'})
    await page.locator('.page-transition.entered').waitFor({state: 'visible'})
    await page.locator('.pagination').scrollIntoViewIfNeeded()

    const beforePaginationScroll = await page.evaluate(() => window.scrollY)

    await page.getByRole('button', {name: 'Seguinte'}).click()
    await expect(page.locator('.pagination span')).toHaveText('Página 2 / 2')
    await waitForCollectionStart(page, '.product-collection-section')

    const afterPaginationScroll = await page.evaluate(() => window.scrollY)
    expect(afterPaginationScroll).toBeLessThan(beforePaginationScroll)
  })

  test('refresh starts at the beginning of the page', async ({page}) => {
    await page.goto('/?lang=pt', {waitUntil: 'domcontentloaded'})
    await page.locator('.page-transition.entered').waitFor({state: 'visible'})
    await page.waitForFunction(() => document.documentElement.scrollHeight > window.innerHeight + 240)
    await page.waitForTimeout(180)

    await page.evaluate(() => window.scrollTo(0, Math.min(900, document.documentElement.scrollHeight)))
    await page.waitForFunction(() => window.scrollY > 40)

    await page.reload()
    await page.waitForFunction(() => window.scrollY <= 2)
  })

  test('localized contact form keeps the message field as a textarea', async ({page}) => {
    await page.goto('/contacto?lang=es', {waitUntil: 'domcontentloaded'})

    await expect(page.getByText('Teléfono')).toHaveCount(2)
    await expect(page.locator('textarea')).toHaveCount(1)
    await expect(page.locator('form')).toContainText('Mensaje')
  })

})

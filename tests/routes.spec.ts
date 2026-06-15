import {expect, test, type Page} from '@playwright/test'

const publicRoutes = [
  {path: '/?lang=pt', heading: 'Plástico reciclado para exteriores vivos', active: 'Início'},
  {path: '/sobre-nos?lang=pt', heading: 'Do drama dos plásticos', active: 'Sobre'},
  {path: '/produtos?lang=pt', heading: 'Soluções para exterior', active: 'Produtos'},
  {
    path: '/produtos/decking-pavimentos-passadicos?lang=pt',
    heading: 'Decking, pavimentos e passadiços',
    active: 'Produtos',
  },
  {path: '/catalogo?lang=en', heading: 'A serious price starts with context', active: 'Catalogue'},
  {path: '/casos-de-estudo?lang=es', heading: 'Proyectos que muestran', active: 'Casos'},
  {
    path: '/casos-de-estudo/vedacao-piscina-moita?lang=es',
    heading: 'Valla de piscina',
    active: 'Casos',
  },
  {path: '/blog?lang=pt', heading: 'Conteúdo que vende ensinando', active: 'Blog'},
  {
    path: '/blog/mobiliario-urbano-madeira-metal?lang=pt',
    heading: 'Porque a madeira',
    active: 'Blog',
  },
  {path: '/contacto?lang=es', heading: 'Cuéntanos el espacio', active: null},
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

async function goToNextPage(page: Page) {
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

async function collectPagedLinks(page: Page, cardSelector: string) {
  const links = new Set<string>()

  for (let pageIndex = 0; pageIndex < 8; pageIndex += 1) {
    const pageLinks = await page.locator(cardSelector).evaluateAll((anchors) =>
      anchors.map((anchor) => (anchor as HTMLAnchorElement).getAttribute('href') ?? ''),
    )

    for (const href of pageLinks) links.add(href)

    if (!(await goToNextPage(page))) break
  }

  return links
}

async function collectPagedLinksWithImages(page: Page, cardSelector: string, imageSelector: string) {
  const links = new Set<string>()

  for (let pageIndex = 0; pageIndex < 8; pageIndex += 1) {
    const pageLinks = await page.locator(cardSelector).evaluateAll(
      (anchors, selector) =>
        anchors
          .filter((anchor) => anchor.querySelector(selector))
          .map((anchor) => (anchor as HTMLAnchorElement).getAttribute('href') ?? ''),
      imageSelector,
    )

    for (const href of pageLinks) links.add(href)

    if (!(await goToNextPage(page))) break
  }

  return links
}

test.describe('public website routes', () => {
  for (const route of publicRoutes) {
    test(`${route.path} renders with language-safe navigation`, async ({page}, testInfo) => {
      await page.goto(route.path)

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
        const isMobile = testInfo.project.name.includes('mobile')
        const activeNavigation = page.getByRole('navigation', {
          name: isMobile ? 'Mobile quick navigation' : 'Main navigation',
        })
        const activeLink = activeNavigation.getByRole('link', {name: route.active, exact: true})

        if (isMobile && (await activeLink.count()) === 0) {
          await expect(activeNavigation).toBeVisible()
        } else {
          await expect(activeLink).toHaveClass(/active/)
        }
      }
    })
  }

  test('product index links every fallback product to a detail page', async ({page}) => {
    await page.goto('/produtos?lang=pt')
    const links = await collectPagedLinks(page, '.product-panel')

    for (const slug of productSlugs) {
      expect(links.has(`/produtos/${slug}?lang=pt`)).toBe(true)
    }

    await page.goto('/produtos?lang=pt')
    const linksWithImages = await collectPagedLinksWithImages(
      page,
      '.product-panel',
      '.product-panel-media img',
    )

    for (const slug of productSlugs) {
      expect(linksWithImages.has(`/produtos/${slug}?lang=pt`)).toBe(true)
    }
  })

  test('blog index links every fallback post to a detail page', async ({page}) => {
    await page.goto('/blog?lang=pt')
    const links = await collectPagedLinks(page, '.journal-card')

    for (const slug of blogSlugs) {
      expect(links.has(`/blog/${slug}?lang=pt`)).toBe(true)
    }

    await page.goto('/blog?lang=pt')
    const linksWithImages = await collectPagedLinksWithImages(page, '.journal-card', '.journal-card-media img')

    for (const slug of blogSlugs) {
      expect(linksWithImages.has(`/blog/${slug}?lang=pt`)).toBe(true)
    }
  })

  test('case-study index renders CMS-ready project images', async ({page}) => {
    await page.goto('/casos-de-estudo?lang=pt')
    const linksWithImages = await collectPagedLinksWithImages(page, '.case-card', '.case-card-media img')

    for (const slug of caseSlugs) {
      expect(linksWithImages.has(`/casos-de-estudo/${slug}?lang=pt`)).toBe(true)
    }
  })

  test('localized contact form keeps the message field as a textarea', async ({page}) => {
    await page.goto('/contacto?lang=es')

    await expect(page.getByText('Teléfono')).toHaveCount(2)
    await expect(page.locator('textarea')).toHaveCount(1)
    await expect(page.locator('form')).toContainText('Mensaje')
  })

  test('unknown CMS slugs return a not found page', async ({page}) => {
    const response = await page.goto('/produtos/not-a-real-product?lang=pt')

    expect(response?.status()).toBe(404)
    await expect(page.getByText('Product not found')).toBeVisible()
  })
})

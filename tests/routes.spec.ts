import {expect, test} from '@playwright/test'

const publicRoutes = [
  {path: '/?lang=pt', heading: 'DaFábrica4You', active: 'Início'},
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

    for (const slug of productSlugs) {
      await expect(page.locator(`a[href="/produtos/${slug}?lang=pt"]`)).toHaveCount(1)
    }

    await expect(page.locator('.product-panel-media img')).toHaveCount(productSlugs.length)
  })

  test('blog index links every fallback post to a detail page', async ({page}) => {
    await page.goto('/blog?lang=pt')

    for (const slug of blogSlugs) {
      await expect(page.locator(`a[href="/blog/${slug}?lang=pt"]`)).toHaveCount(1)
    }

    await expect(page.locator('.journal-card-media img')).toHaveCount(blogSlugs.length)
  })

  test('case-study index renders CMS-ready project images', async ({page}) => {
    await page.goto('/casos-de-estudo?lang=pt')

    await expect(page.locator('.case-card-media img')).toHaveCount(3)
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

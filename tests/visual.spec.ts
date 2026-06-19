import {expect, test, type Page} from '@playwright/test'

const primeRevealAnimations = async (page: Page) => {
  await page.addStyleTag({
    content: `
      .mobile-dock,
      .whatsapp-float {
        display: none !important;
      }
    `,
  })

  await page.evaluate(async () => {
    const pause = (duration: number) => new Promise((resolve) => setTimeout(resolve, duration))
    const step = Math.max(220, Math.floor(window.innerHeight * 0.72))
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)

    for (let y = 0; y <= maxScroll; y += step) {
      window.scrollTo(0, y)
      await pause(90)
    }

    window.scrollTo(0, maxScroll)
    await pause(140)
    window.scrollTo(0, 0)
  })

  await page.evaluate(() => {
    document.querySelectorAll('.reveal').forEach((element) => {
      element.classList.add('visible')
    })
    window.scrollTo(0, 0)
  })
}

const visualRoutes = [
  {name: 'home-pt', path: '/?lang=pt'},
  {name: 'about-pt', path: '/sobre-nos?lang=pt'},
  {name: 'products-pt', path: '/produtos?lang=pt'},
  {name: 'products-es', path: '/produtos?lang=es'},
  {name: 'catalogue-pt', path: '/catalogo?lang=pt'},
  {name: 'catalogue-en', path: '/catalogo?lang=en'},
  {name: 'cases-pt', path: '/casos-de-estudo?lang=pt'},
  {name: 'cases-es', path: '/casos-de-estudo?lang=es'},
  {name: 'blog-pt', path: '/blog?lang=pt'},
  {name: 'contact-pt', path: '/contacto?lang=pt'},
  {name: 'contact-es', path: '/contacto?lang=es'},
  {
    name: 'product-decking-pt',
    path: '/produtos/decking-pavimentos-passadicos?lang=pt',
  },
  {
    name: 'product-fencing-pt',
    path: '/produtos/vedacoes-divisorias-resguardos?lang=pt',
  },
  {
    name: 'product-furniture-pt',
    path: '/produtos/mobiliario-urbano-jardim?lang=pt',
  },
  {
    name: 'product-shelters-pt',
    path: '/produtos/abrigos-telheiros-pergolas?lang=pt',
  },
  {
    name: 'product-composters-pt',
    path: '/produtos/compostores-cultivo-bordaduras?lang=pt',
  },
  {
    name: 'case-pool-fence-pt',
    path: '/casos-de-estudo/vedacao-piscina-moita?lang=pt',
  },
  {
    name: 'case-river-decking-pt',
    path: '/casos-de-estudo/decking-mobiliario-torres-mondego?lang=pt',
  },
  {
    name: 'case-planters-pt',
    path: '/casos-de-estudo/floreiras-moscavide?lang=pt',
  },
  {
    name: 'blog-urban-furniture-pt',
    path: '/blog/mobiliario-urbano-madeira-metal?lang=pt',
  },
  {
    name: 'blog-quote-request-pt',
    path: '/blog/pedido-orcamento-plastico-reciclado?lang=pt',
  },
  {
    name: 'blog-composting-pt',
    path: '/blog/compostagem-urbana-equipamento?lang=pt',
  },
]

test.describe('visual regression', () => {
  for (const route of visualRoutes) {
    test(`${route.name} full page`, async ({page}) => {
      await page.goto(route.path)
      await expect(page.locator('h1')).toBeVisible()
      await page.evaluate(() => document.fonts.ready)
      await primeRevealAnimations(page)

      await expect(page).toHaveScreenshot(`${route.name}.png`, {
        fullPage: true,
      })
    })
  }
})

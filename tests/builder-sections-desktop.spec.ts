import {readFileSync} from 'node:fs'
import {expect, test, type FrameLocator, type Locator, type Page, type TestInfo} from '@playwright/test'

const e2eKey = 'df4y-playwright-site-editor'
const fixtureImage = readFileSync('static/images/product-materials.png')

const sectionDefinitions = [
  ['builderHeroSection', 'Destaque principal', 'Destaque principal'],
  ['builderMediaSection', 'Texto com imagem ou vídeo', 'Texto com media'],
  ['builderRichTextSection', 'Texto editorial', 'Texto editorial'],
  ['builderGallerySection', 'Galeria', 'Galeria'],
  ['builderCardsSection', 'Cartões', 'Cartões'],
  ['builderStatsSection', 'Números', 'Números de impacto'],
  ['builderCollectionSection', 'Lista automática', 'Lista automática'],
  ['builderPartnersSection', 'Parceiros', 'Parceiros'],
  ['builderCtaSection', 'Chamada para ação', 'Chamada para ação'],
  ['builderContactSection', 'Contacto', 'Bloco de contacto'],
] as const

const frameFor = (page: Page): FrameLocator => page.frameLocator('.site-editor-frame-wrap iframe')

const stubSectionMedia = async (page: Page) => {
  await page.route('https://cdn.sanity.io/images/**', (route) =>
    route.fulfill({status: 200, contentType: 'image/png', body: fixtureImage}),
  )
  await page.route('https://cdn.sanity.io/files/**', (route) => route.abort())
  await page.route('https://www.youtube-nocookie.com/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<!doctype html><body style="margin:0;background:#17657a"></body>',
    }),
  )
}

const gotoSectionFixture = async (
  page: Page,
  group: string,
  published = false,
) => {
  await stubSectionMedia(page)
  await page.goto(
    `/painel/site/e2e-preview?fixture=sections&group=${group}&lang=pt${published ? '&published=1' : ''}`,
  )
  const fixture = page.getByTestId('fixture-section-page')
  await expect(fixture).toBeVisible()
  await expect(fixture).toHaveAttribute('data-section-group', group)
  await expect(page.locator('.builder-render-section').first()).toBeVisible()
  return fixture
}

const expectDesktopGeometry = async (page: Page, sections: Locator) => {
  await expect
    .poll(() =>
      page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      })),
    )
    .toEqual({scrollWidth: 1280, clientWidth: 1280})

  const boxes = await sections.evaluateAll((nodes) =>
    nodes.map((node) => {
      const box = node.getBoundingClientRect()
      return {width: box.width, height: box.height, left: box.left, right: box.right}
    }),
  )
  for (const box of boxes) {
    expect(box.width).toBeGreaterThan(300)
    expect(box.height).toBeGreaterThan(80)
    expect(box.left).toBeGreaterThanOrEqual(-1)
    expect(box.right).toBeLessThanOrEqual(1281)
  }
}

const settleSection = async (section: Locator) => {
  await section.scrollIntoViewIfNeeded()
  const reveal = section.locator('.reveal').first()
  if (await reveal.count()) {
    await expect(reveal).toHaveClass(/\bvisible\b/)
    await reveal.evaluate(async (node) => {
      await Promise.all(
        node
          .getAnimations({subtree: true})
          .map((animation) => animation.finished.catch(() => undefined)),
      )
    })
  }
}

const openEditor = async (page: Page, testInfo: TestInfo) => {
  const scope = `section-${testInfo.title}-${Date.now()}-${Math.random()}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 46)
  await page.setExtraHTTPHeaders({
    'x-df4y-site-editor-e2e': e2eKey,
    'x-df4y-site-editor-scope': scope,
  })
  await stubSectionMedia(page)
  await page.goto('/painel/site')
  await expect(page.locator('.site-editor-shell')).toBeVisible({timeout: 15_000})
  const frame = frameFor(page)
  await expect(frame.getByTestId('fixture-hero-title')).toBeVisible()
  await expect(frame.locator('.site-editor-overlay')).toHaveAttribute('data-ready', 'true', {
    timeout: 15_000,
  })
  return frame
}

const openPageSections = async (page: Page) => {
  await page.getByRole('button', {name: 'Abrir definições'}).click()
  const settings = page.locator('.site-editor-drawer.is-settings')
  await expect(settings).toHaveClass(/is-open/)
  await settings
    .locator('.site-editor-panel-index > button')
    .filter({hasText: 'Conteúdo da página'})
    .click()
  await expect(settings.locator('.site-editor-section-list')).toBeVisible()
  return settings
}

const addSection = async (settings: Locator, type: string) => {
  await settings.getByRole('button', {name: 'Adicionar secção'}).click()
  await settings.locator(`[data-section-type="${type}"]`).click()
  await expect(settings.locator('.site-page-section-editor')).toBeVisible()
}

const backToSections = async (settings: Locator) => {
  await settings.getByRole('button', {name: /Voltar ao conteúdo/}).click()
  await expect(settings.locator('.site-editor-section-list')).toBeVisible()
}

const sectionRow = (settings: Locator, name: string) =>
  settings
    .getByRole('button', {name: `Ações de ${name}`, exact: true})
    .locator('xpath=ancestor::article')

const openSectionMenu = async (row: Locator, name: string) => {
  const button = row.getByRole('button', {name: `Ações de ${name}`, exact: true})
  await button.click()
  await expect(row.locator('.site-editor-section-menu')).toBeVisible()
}

const appearanceGroup = (settings: Locator) => settings.locator('details.is-appearance')

const openAppearance = async (settings: Locator) => {
  const details = appearanceGroup(settings).first()
  await details.locator(':scope > summary').click()
  await expect(details).toHaveAttribute('open', '')
  return details
}

const choice = (root: Locator, name: string) => root.getByRole('group', {name})

test.describe('desktop section renderer matrix', () => {
  test.beforeEach(async ({page: _page}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Desktop editor pass only')
  })

  for (const published of [false, true]) {
    test(`renders every populated section type on the ${published ? 'visitor' : 'editor'} surface`, async ({page}) => {
      const pageErrors: string[] = []
      page.on('pageerror', (error) => pageErrors.push(error.message))
      await gotoSectionFixture(page, 'types', published)

      const sections = page.locator('.builder-render-section')
      await expect(sections).toHaveCount(sectionDefinitions.length)
      await expectDesktopGeometry(page, sections)
      await expect(page.locator('.builder-empty-state')).toHaveCount(0)
      await expect(page.locator('.builder-section-empty')).toHaveCount(0)
      await expect(page.locator('.builder-section-hit-area')).toHaveCount(
        published ? 0 : sectionDefinitions.length,
      )

      const expectations = [
        ['type-hero', '.builder-hero'],
        ['type-media', '.builder-media-copy'],
        ['type-rich-text', '.builder-editorial .builder-rich-text'],
        ['type-gallery', '.builder-interactive-gallery'],
        ['type-cards', '.builder-card-grid .builder-card'],
        ['type-stats', '.builder-stats article'],
        ['type-collection', '.builder-collection .collection-card'],
        ['type-partners', '.builder-partners .builder-partner'],
        ['type-cta', '.builder-actions .builder-action'],
        ['type-contact', '.builder-contact-preview .builder-action'],
      ] as const
      for (const [key, selector] of expectations) {
        const section = page.locator(`[data-builder-section="${key}"]`)
        await settleSection(section)
        await expect(section, `${key} is missing`).toBeVisible()
        await expect(section.locator(selector).first(), `${key} did not draw ${selector}`).toBeVisible()
      }

      await expect(page.locator('[data-builder-section="type-gallery"] .image-gallery-thumbnails button')).toHaveCount(3)
      await expect(page.locator('[data-builder-section="type-cards"] .builder-card')).toHaveCount(4)
      await expect(page.locator('[data-builder-section="type-stats"] article')).toHaveCount(4)
      await expect(page.locator('[data-builder-section="type-partners"] .builder-partner')).toHaveCount(4)
      await expect(page.locator('[data-builder-section="type-rich-text"] table')).toBeVisible()
      await expect(page.locator('[data-builder-section="type-rich-text"] li')).toHaveCount(2)
      expect(pageErrors, pageErrors.join('\n')).toEqual([])
    })
  }

  for (const published of [false, true]) {
    test(`honours every hero and media composition on the ${published ? 'visitor' : 'editor'} surface`, async ({page}) => {
      await gotoSectionFixture(page, 'hero', published)
      for (const variant of ['split', 'overlay', 'editorial', 'media-first']) {
        const section = page.locator(`[data-builder-section="hero-${variant}"]`)
        await expect(section.locator(`.builder-hero.is-${variant}`)).toBeVisible()
        await expect(section.locator('.builder-media img')).toBeVisible()
      }

      await gotoSectionFixture(page, 'media', published)
      for (const side of ['left', 'right', 'top', 'bottom']) {
        const layout = page.locator(`[data-builder-section="media-${side}"] .builder-media-copy`)
        await expect(layout).toHaveClass(new RegExp(`is-${side}`))
        const shape = await layout.evaluate((node) => ({
          columns: getComputedStyle(node).gridTemplateColumns.split(' ').length,
          first: node.firstElementChild?.className || '',
        }))
        expect(shape.columns).toBe(side === 'left' || side === 'right' ? 2 : 1)
        expect(shape.first.includes('builder-media')).toBe(side === 'left' || side === 'top')
      }
      await expectDesktopGeometry(page, page.locator('.builder-render-section'))
    })
  }

  for (const published of [false, true]) {
    test(`honours every gallery and column presentation on the ${published ? 'visitor' : 'editor'} surface`, async ({page}) => {
      await gotoSectionFixture(page, 'gallery', published)
      await expect(page.locator('[data-builder-section="gallery-gallery"] .builder-interactive-gallery')).toBeVisible()
      await expect(page.locator('[data-builder-section="gallery-gallery"] .image-gallery-thumbnails button')).toHaveCount(3)
      for (const mode of ['grid', 'rail']) {
        const section = page.locator(`[data-builder-section="gallery-${mode}"]`)
        await settleSection(section)
        await expect(section.locator(`.builder-gallery.is-${mode}`)).toBeVisible()
        await expect(section.locator('.builder-media')).toHaveCount(3)
        await expect(section.locator('img')).toBeVisible()
        await expect(section.locator('video')).toBeVisible()
        await expect(section.locator('iframe')).toBeVisible()
      }

      await gotoSectionFixture(page, 'columns', published)
      for (const count of [1, 2, 3, 4]) {
        const grid = page.locator(`[data-builder-section="columns-${count}"] .builder-card-grid`)
        await expect(grid).toBeVisible()
        await expect
          .poll(() => grid.evaluate((node) => getComputedStyle(node).gridTemplateColumns.split(' ').length))
          .toBe(count)
      }
      await expectDesktopGeometry(page, page.locator('.builder-render-section'))
    })
  }

  for (const published of [false, true]) {
    test(`honours every automatic-list source and contact destination on the ${published ? 'visitor' : 'editor'} surface`, async ({page}) => {
      await gotoSectionFixture(page, 'collection', published)
      const sourcePrefixes = {
        productCategory: '/produtos/',
        storeProduct: '/loja/',
        caseStudy: '/casos-de-estudo/',
        blogPost: '/blog/',
      }
      for (const [source, prefix] of Object.entries(sourcePrefixes)) {
        const section = page.locator(`[data-builder-section="collection-${source}"]`)
        await settleSection(section)
        const cards = section.locator('.collection-card')
        await expect(cards.first(), `${source} returned no cards`).toBeVisible()
        await expect(cards.first()).toHaveAttribute('href', new RegExp(`^${prefix}`))
      }

      await gotoSectionFixture(page, 'contact', published)
      await expect(page.locator('[data-builder-section="contact-contact"] .builder-contact-action > a.builder-action')).toHaveAttribute('href', /^\/contacto/)
      await expect(page.locator('[data-builder-section="contact-quote"] .builder-contact-action > a.builder-action')).toHaveAttribute('href', /^\/contacto/)
      await expect(page.locator('[data-builder-section="contact-catalogue"] .builder-contact-action > a.builder-action')).toHaveAttribute('href', /^\/catalogo/)
      await expectDesktopGeometry(page, page.locator('.builder-render-section'))
    })
  }

  for (const published of [false, true]) {
    test(`honours every width, surface, spacing and text alignment on the ${published ? 'visitor' : 'editor'} surface`, async ({page}) => {
      await gotoSectionFixture(page, 'alignment', published)
      for (const align of ['left', 'center', 'right']) {
        const section = page.locator(`[data-builder-section="alignment-${align}"]`)
        await settleSection(section)
        const inner = section.locator('.builder-render-inner')
        const title = section.locator('.builder-responsive-title')
        await expect(title).toHaveCSS('text-align', align)
        const geometry = await Promise.all([inner.boundingBox(), title.boundingBox()])
        expect(geometry[0]).not.toBeNull()
        expect(geometry[1]).not.toBeNull()
        if (align === 'left') {
          expect(Math.abs(geometry[1]!.x - geometry[0]!.x)).toBeLessThanOrEqual(2)
        } else if (align === 'center') {
          expect(
            Math.abs(
              geometry[1]!.x + geometry[1]!.width / 2 -
                (geometry[0]!.x + geometry[0]!.width / 2),
            ),
          ).toBeLessThanOrEqual(2)
        } else {
          expect(
            Math.abs(geometry[1]!.x + geometry[1]!.width - (geometry[0]!.x + geometry[0]!.width)),
          ).toBeLessThanOrEqual(2)
        }
      }

      await gotoSectionFixture(page, 'layout', published)
      const widthValues: Record<string, number> = {}
      for (const width of ['narrow', 'content', 'wide', 'full']) {
        const inner = page.locator(`[data-builder-section="width-${width}"] .builder-render-inner`)
        await expect(inner).toHaveClass(new RegExp(`is-${width}`))
        widthValues[width] = (await inner.boundingBox())?.width ?? 0
      }
      expect(widthValues.narrow).toBeLessThan(widthValues.content)
      expect(widthValues.content).toBeLessThan(widthValues.wide)
      expect(widthValues.wide).toBeLessThanOrEqual(widthValues.full)

      for (const surface of ['white', 'fog', 'mint', 'deep', 'blue', 'transparent']) {
        await expect(page.locator(`[data-builder-section="surface-${surface}"]`)).toHaveClass(
          new RegExp(`is-${surface}`),
        )
      }
      for (const [name, amount] of [
        ['compact', 40],
        ['normal', 64],
        ['wide', 96],
      ] as const) {
        const section = page.locator(`[data-builder-section="spacing-${name}"]`)
        await expect(section).toHaveCSS('padding-top', `${amount}px`)
        await expect(section).toHaveCSS('padding-bottom', `${amount}px`)
      }
      await expectDesktopGeometry(page, page.locator('.builder-render-section'))
    })
  }

  for (const published of [false, true]) {
    test(`honours section typography across every renderer on the ${published ? 'visitor' : 'editor'} surface`, async ({page}) => {
      await gotoSectionFixture(page, 'typography', published)
      const sections = [
        ['typography-hero', 'Tipografia no destaque', true],
        ['typography-media', 'Tipografia com imagem', true],
        ['typography-rich-text', 'Tipografia editorial', false],
        ['typography-gallery', 'Tipografia na galeria', true],
        ['typography-cards', 'Tipografia nos cartoes', true],
        ['typography-stats', 'Tipografia nos numeros', true],
        ['typography-collection', 'Tipografia na lista', true],
        ['typography-partners', 'Tipografia em parceiros', true],
        ['typography-cta', 'Tipografia na chamada', true],
        ['typography-contact', 'Tipografia no contacto', true],
        ['typography-product-feature', 'Tipografia no produto', true],
        ['typography-landing-collection', 'Tipografia na lista inicial', false],
        ['typography-landing-work', 'Tipografia nos casos iniciais', false],
        ['typography-landing-impact', 'Tipografia no impacto', false],
        ['typography-landing-partners', 'Tipografia nos parceiros iniciais', true],
      ] as const

      for (const [key, heading, hasBody] of sections) {
        const title = page.locator(`[data-builder-section="${key}"] h2`).first()
        await expect(title, `${key} has no visible title`).toBeVisible()
        await expect(title).toHaveText(heading)
        await expect(title).toHaveCSS('font-family', /Georgia/)
        await expect(title).toHaveCSS('font-size', '64px')
        await expect(title).toHaveCSS('font-weight', '700')
        await expect(title).toHaveCSS('text-align', 'center')

        if (hasBody) {
          const body = page
            .locator(`[data-builder-section="${key}"]`)
            .getByText(`Texto formatado em ${heading.toLowerCase()}`, {exact: true})
          await expect(body, `${key} has no visible body`).toBeVisible()
          await expect(body).toHaveCSS('font-family', /Times New Roman/)
          await expect(body).toHaveCSS('font-size', '21px')
          await expect(body).toHaveCSS('font-weight', '700')
          await expect(body).toHaveCSS('text-align', 'right')
        }
      }

      const nested = page.locator('[data-builder-section="typography-nested-text"]')
      const eyebrow = nested.getByText('Etiqueta interna', {exact: true})
      const cardTitle = nested.getByText('Cartao interno', {exact: true})
      const cardBody = nested.getByText('Texto interno formatado', {exact: true})
      await expect(eyebrow).toHaveCSS('font-family', /Georgia/)
      await expect(eyebrow).toHaveCSS('font-size', '17px')
      await expect(eyebrow).toHaveCSS('font-weight', '700')
      await expect(eyebrow).toHaveCSS('text-align', 'right')
      await expect(cardTitle).toHaveCSS('font-family', /Times New Roman/)
      await expect(cardTitle).toHaveCSS('font-size', '28px')
      await expect(cardTitle).toHaveCSS('font-weight', '700')
      await expect(cardTitle).toHaveCSS('text-align', 'center')
      await expect(cardBody).toHaveCSS('font-family', /Georgia/)
      await expect(cardBody).toHaveCSS('font-size', '19px')
      await expect(cardBody).toHaveCSS('font-style', 'italic')
      await expect(cardBody).toHaveCSS('text-align', 'right')

      for (const key of ['typography-partners', 'typography-landing-partners']) {
        const partnerText = page
          .locator(`[data-builder-section="${key}"]`)
          .getByText('Descricao de parceiro formatada', {exact: true})
        await expect(partnerText).toHaveCSS('font-family', /Georgia/)
        await expect(partnerText).toHaveCSS('font-size', '16px')
        await expect(partnerText).toHaveCSS('font-weight', '700')
        await expect(partnerText).toHaveCSS('font-style', 'italic')
        await expect(partnerText).toHaveCSS('text-align', 'right')
      }
    })
  }
})

test.describe('desktop section editor controls and lifecycle', () => {
  test.beforeEach(async ({page: _page}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Desktop editor pass only')
  })

  for (const [type, label, rowLabel] of sectionDefinitions) {
    test(`${label} survives its complete CRUD lifecycle`, async ({page}, testInfo) => {
      test.setTimeout(90_000)
      const pageErrors: string[] = []
      page.on('pageerror', (error) => pageErrors.push(error.message))
      const frame = await openEditor(page, testInfo)
      const settings = await openPageSections(page)
      await addSection(settings, type)

      const title = `CRUD ${label}`
      await settings.getByLabel('Título').fill(title)
      const originalPreview = frame.locator('.builder-render-section').filter({hasText: title})
      await expect(originalPreview).toBeVisible()
      await backToSections(settings)

      const original = sectionRow(settings, rowLabel)
      await expect(original).toBeVisible()
      await openSectionMenu(original, rowLabel)
      await original.getByRole('button', {name: 'Duplicar'}).click()
      await expect(settings.locator('.site-page-section-editor')).toBeVisible()
      const cloneTitle = `Cópia CRUD ${label}`
      await settings.getByLabel('Título').fill(cloneTitle)
      await expect(frame.locator('.builder-render-section').filter({hasText: cloneTitle})).toBeVisible()
      await backToSections(settings)

      const cloneLabel = `${rowLabel} (cópia)`
      const clone = sectionRow(settings, cloneLabel)
      await expect(clone).toBeVisible()
      await openSectionMenu(clone, cloneLabel)
      await clone.getByRole('button', {name: 'Mover para cima'}).click()
      await expect
        .poll(async () => {
          const titles = await frame.locator('.builder-responsive-title').allInnerTexts()
          const cloneIndex = titles.indexOf(cloneTitle)
          const originalIndex = titles.indexOf(title)
          return cloneIndex >= 0 && originalIndex >= 0 && cloneIndex < originalIndex
        })
        .toBe(true)

      await openSectionMenu(clone, cloneLabel)
      await clone.getByRole('button', {name: 'Ocultar do site'}).click()
      const clonePreview = frame.locator('.builder-render-section').filter({hasText: cloneTitle})
      await expect(clonePreview).toHaveClass(/is-hidden/)
      await openSectionMenu(clone, cloneLabel)
      await clone.getByRole('button', {name: 'Mostrar no site'}).click()
      await expect(clonePreview).not.toHaveClass(/is-hidden/)

      await openSectionMenu(clone, cloneLabel)
      await clone.getByRole('button', {name: 'Eliminar'}).click()
      await page.getByRole('alertdialog').getByRole('button', {name: 'Eliminar', exact: true}).click()
      await expect(frame.getByText(cloneTitle, {exact: true})).toHaveCount(0)

      await openSectionMenu(original, rowLabel)
      await original.getByRole('button', {name: 'Eliminar'}).click()
      await page.getByRole('alertdialog').getByRole('button', {name: 'Eliminar', exact: true}).click()
      await expect(frame.getByText(title, {exact: true})).toHaveCount(0)
      await expect(page.locator('.site-editor-top-save')).toContainText('Guardado')
      expect(pageErrors, pageErrors.join('\n')).toEqual([])
    })
  }

  test('section appearance controls update the desktop preview immediately', async ({page}, testInfo) => {
    test.setTimeout(90_000)
    const frame = await openEditor(page, testInfo)
    const settings = await openPageSections(page)
    await addSection(settings, 'builderHeroSection')
    await settings.getByLabel('Título').fill('Aparência ao vivo')
    await settings.getByLabel('Etiqueta').fill('Etiqueta ao vivo')
    await settings.locator('.site-page-editor-group.is-open textarea').nth(1).fill('Texto ao vivo para validar a tipografia.')
    const section = frame.locator('.builder-render-section').filter({hasText: 'Aparência ao vivo'})
    await expect(section.getByText('Etiqueta ao vivo', {exact: true})).toBeVisible()
    await expect(section.getByText('Texto ao vivo para validar a tipografia.', {exact: true})).toBeVisible()
    const appearance = await openAppearance(settings)

    for (const [label, value] of [
      ['Branco', 'white'],
      ['Névoa', 'fog'],
      ['Verde claro', 'mint'],
      ['Verde profundo', 'deep'],
      ['Azul mineral', 'blue'],
      ['Transparente', 'transparent'],
    ] as const) {
      await appearance.getByLabel('Fundo').selectOption({label})
      await expect(section).toHaveClass(new RegExp(`is-${value}`))
    }

    for (const [label, value] of [
      ['Leitura', 'narrow'],
      ['Normal', 'content'],
      ['Larga', 'wide'],
      ['Total', 'full'],
    ] as const) {
      await choice(appearance, 'Largura').getByRole('button', {name: label, exact: true}).click()
      await expect(section.locator('.builder-render-inner')).toHaveClass(new RegExp(`is-${value}`))
    }

    for (const [label, amount] of [
      ['Compacto', 40],
      ['Normal', 64],
      ['Amplo', 96],
    ] as const) {
      await choice(appearance, 'Espaçamento').getByRole('button', {name: label, exact: true}).click()
      await expect(section).toHaveCSS('padding-top', `${amount}px`)
      await expect(section).toHaveCSS('padding-bottom', `${amount}px`)
    }

    for (const [label, value] of [
      ['Lado a lado', 'split'],
      ['Sobre imagem', 'overlay'],
      ['Editorial', 'editorial'],
      ['Imagem primeiro', 'media-first'],
    ] as const) {
      await choice(appearance, 'Composição').getByRole('button', {name: label, exact: true}).click()
      await expect(section.locator('.builder-hero')).toHaveClass(new RegExp(`is-${value}`))
    }

    for (const [label, height] of [
      ['Compacta', '480px'],
      ['Normal', '640px'],
      ['Alta', '800px'],
    ] as const) {
      await choice(appearance, 'Altura').getByRole('button', {name: label, exact: true}).click()
      await expect(section).toHaveCSS('min-height', height)
    }

    const titleOptions = appearance.locator('details.site-page-subdetails').filter({hasText: /^Título/})
    await titleOptions.locator('summary').click()
    const title = section.locator('.builder-responsive-title')
    const titleFont = titleOptions.getByRole('combobox', {name: 'Fonte', exact: true})
    for (const font of ['inherit', 'space-grotesk', 'inter', 'arial', 'georgia', 'times-new-roman']) {
      await titleFont.selectOption(font)
      await expect(titleFont).toHaveValue(font)
    }
    await expect(title).toHaveCSS('font-family', /Times New Roman/)
    for (const [label, size] of [
      ['Discreto', '36px'],
      ['Normal', '48px'],
      ['Grande', '64px'],
      ['Destaque', '80px'],
    ] as const) {
      await choice(titleOptions, 'Tamanho').getByRole('button', {name: label, exact: true}).click()
      await expect(title).toHaveCSS('font-size', size)
    }
    for (const [label, align] of [
      ['Esquerda', 'left'],
      ['Centro', 'center'],
      ['Direita', 'right'],
    ] as const) {
      await choice(titleOptions, 'Alinhamento').getByRole('button', {name: label, exact: true}).click()
      await expect(title).toHaveCSS('text-align', align)
    }
    await titleOptions.getByRole('switch', {name: 'Negrito'}).click()
    await expect(title).toHaveCSS('font-weight', '400')
    await titleOptions.getByRole('switch', {name: 'Negrito'}).click()
    await expect(title).toHaveCSS('font-weight', '700')

    const bodyOptions = appearance.locator('details.site-page-subdetails').filter({hasText: /^Texto/})
    await bodyOptions.locator('summary').click()
    const body = section.locator('.builder-responsive-body')
    const bodyFont = bodyOptions.getByRole('combobox', {name: 'Fonte', exact: true})
    for (const font of ['inherit', 'space-grotesk', 'inter', 'arial', 'georgia', 'times-new-roman']) {
      await bodyFont.selectOption(font)
      await expect(bodyFont).toHaveValue(font)
    }
    await expect(body).toHaveCSS('font-family', /Times New Roman/)
    for (const [label, size] of [
      ['Pequeno', '15px'],
      ['Normal', '18px'],
      ['Grande', '21px'],
    ] as const) {
      await choice(bodyOptions, 'Tamanho').getByRole('button', {name: label, exact: true}).click()
      await expect(body).toHaveCSS('font-size', size)
    }
    for (const [label, align] of [
      ['Esquerda', 'left'],
      ['Centro', 'center'],
      ['Direita', 'right'],
    ] as const) {
      await choice(bodyOptions, 'Alinhamento').getByRole('button', {name: label, exact: true}).click()
      await expect(body).toHaveCSS('text-align', align)
    }
    await bodyOptions.getByRole('switch', {name: 'Negrito'}).click()
    await expect(body).toHaveCSS('font-weight', '700')

    const organization = settings.locator('details.is-advanced')
    await organization.locator(':scope > summary').click()
    await organization.getByLabel('Nome no editor').fill('Destaque de campanha')
    await organization.getByLabel('Ligação direta').fill('campanha principal')
    await expect(organization.getByLabel('Ligação direta')).toHaveValue('campanha-principal')
    await expect(section).toHaveAttribute('id', 'campanha-principal')
    await backToSections(settings)
    await expect(sectionRow(settings, 'Destaque de campanha')).toBeVisible()
  })

  test('media and gallery controls update every desktop presentation immediately', async ({page}, testInfo) => {
    test.setTimeout(90_000)
    const frame = await openEditor(page, testInfo)
    const settings = await openPageSections(page)
    await addSection(settings, 'builderMediaSection')
    await settings.getByLabel('Título').fill('Posição ao vivo')
    let section = frame.locator('.builder-render-section').filter({hasText: 'Posição ao vivo'})
    await settings.getByLabel('Carregar imagem').setInputFiles({
      name: 'imagem-principal.png',
      mimeType: 'image/png',
      buffer: fixtureImage,
    })
    let media = section.locator('.builder-media')
    await settleSection(section)
    await expect(media.locator('img')).toBeVisible()
    await settings.getByLabel('Descrição acessível').fill('Imagem principal acessível')
    await settings.getByLabel('Legenda').fill('Legenda apresentada ao visitante')
    await expect(media.locator('img')).toHaveAttribute('alt', 'Imagem principal acessível')
    await expect(media.locator('figcaption')).toHaveText('Legenda apresentada ao visitante')
    let mediaOptions = settings.locator('details.site-page-subdetails').filter({hasText: /^Opções de apresentação/})
    await mediaOptions.locator(':scope > summary').click()
    await choice(mediaOptions, 'Enquadramento').getByRole('button', {name: 'Mostrar tudo'}).click()
    await expect(media.locator('img')).toHaveCSS('object-fit', 'contain')
    await choice(mediaOptions, 'Enquadramento').getByRole('button', {name: 'Preencher'}).click()
    await expect(media.locator('img')).toHaveCSS('object-fit', 'cover')

    await settings
      .locator('fieldset.site-page-choice')
      .filter({hasText: /^Tipo/})
      .getByRole('button', {name: 'Vídeo', exact: true})
      .click()
    await settings.getByLabel('Carregar vídeo').setInputFiles({
      name: 'video-principal.mp4',
      mimeType: 'video/mp4',
      buffer: Buffer.from('video-fixture'),
    })
    media = section.locator('.builder-media')
    const video = media.locator('video')
    await expect(video).toBeVisible()
    mediaOptions = settings.locator('details.site-page-subdetails').filter({hasText: /^Opções de apresentação/})
    if ((await mediaOptions.getAttribute('open')) === null) {
      await mediaOptions.locator(':scope > summary').click()
    }
    await expect(mediaOptions.getByRole('switch', {name: 'Reproduzir automaticamente'})).toHaveAttribute('aria-checked', 'true')
    await expect(mediaOptions.getByRole('switch', {name: 'Repetir vídeo'})).toHaveAttribute('aria-checked', 'true')
    await expect(mediaOptions.getByRole('switch', {name: 'Mostrar controlos'})).toHaveAttribute('aria-checked', 'true')
    await expect(mediaOptions.getByRole('switch', {name: 'Sem som'})).toHaveCount(0)
    await mediaOptions.getByRole('switch', {name: 'Reproduzir automaticamente'}).click()
    await expect(mediaOptions.getByRole('switch', {name: 'Sem som'})).toHaveAttribute('aria-checked', 'true')
    await mediaOptions.getByRole('switch', {name: 'Sem som'}).click()
    await mediaOptions.getByRole('switch', {name: 'Repetir vídeo'}).click()
    await mediaOptions.getByRole('switch', {name: 'Mostrar controlos'}).click()
    await expect.poll(() => video.evaluate((node) => ({
      autoplay: (node as HTMLVideoElement).autoplay,
      muted: (node as HTMLVideoElement).muted,
      loop: (node as HTMLVideoElement).loop,
      controls: (node as HTMLVideoElement).controls,
    }))).toEqual({autoplay: false, muted: false, loop: false, controls: false})
    await mediaOptions.getByRole('switch', {name: 'Reproduzir automaticamente'}).click()
    await expect(mediaOptions.getByRole('switch', {name: 'Sem som'})).toHaveCount(0)
    await expect.poll(() => video.evaluate((node) => ({
      autoplay: (node as HTMLVideoElement).autoplay,
      muted: (node as HTMLVideoElement).muted,
      loop: (node as HTMLVideoElement).loop,
      controls: (node as HTMLVideoElement).controls,
    }))).toEqual({autoplay: true, muted: true, loop: false, controls: false})

    let appearance = await openAppearance(settings)
    for (const [label, value] of [
      ['Esquerda', 'left'],
      ['Direita', 'right'],
      ['Acima', 'top'],
      ['Abaixo', 'bottom'],
    ] as const) {
      await choice(appearance, 'Posição da imagem').getByRole('button', {name: label, exact: true}).click()
      await expect(section.locator('.builder-media-copy')).toHaveClass(new RegExp(`is-${value}`))
    }

    await backToSections(settings)
    await addSection(settings, 'builderGallerySection')
    await settings.getByLabel('Título').fill('Galeria ao vivo')
    await settings.locator('.site-page-gallery-add input[type="file"]').setInputFiles([
      {name: 'imagem.png', mimeType: 'image/png', buffer: fixtureImage},
      {name: 'video.mp4', mimeType: 'video/mp4', buffer: Buffer.from('video-fixture')},
    ])
    section = frame.locator('.builder-render-section').filter({hasText: 'Galeria ao vivo'})
    appearance = await openAppearance(settings)
    for (const [label, value] of [
      ['Principal', 'gallery'],
      ['Grelha', 'grid'],
      ['Faixa', 'rail'],
    ] as const) {
      await choice(appearance, 'Apresentação').getByRole('button', {name: label, exact: true}).click()
      if (value === 'gallery') {
        await expect(section.locator('.builder-interactive-gallery')).toBeVisible()
      } else {
        await expect(section.locator(`.builder-gallery.is-${value}`)).toBeVisible()
      }
    }

    await expect(choice(appearance, 'Colunas')).toHaveCount(0)
    await choice(appearance, 'Apresentação').getByRole('button', {name: 'Grelha', exact: true}).click()
    await expect(choice(appearance, 'Colunas')).toBeVisible()
    for (const count of [1, 2, 3, 4]) {
      await choice(appearance, 'Colunas').getByRole('button', {name: String(count), exact: true}).click()
      await expect
        .poll(() =>
          section
            .locator('.builder-gallery')
            .evaluate((node) => getComputedStyle(node).gridTemplateColumns.split(' ').length),
        )
        .toBe(count)
    }
  })

  test('automatic-list and contact choices update their real destination immediately', async ({page}, testInfo) => {
    test.setTimeout(90_000)
    const frame = await openEditor(page, testInfo)
    const settings = await openPageSections(page)
    await addSection(settings, 'builderCollectionSection')
    await settings.getByLabel('Título').fill('Lista ao vivo')
    let section = frame.locator('.builder-render-section').filter({hasText: 'Lista ao vivo'})
    const source = settings.getByRole('combobox', {name: 'Conteúdo', exact: true})
    for (const [value, prefix] of [
      ['productCategory', '/produtos/'],
      ['storeProduct', '/loja/'],
      ['caseStudy', '/casos-de-estudo/'],
      ['blogPost', '/blog/'],
    ] as const) {
      await source.selectOption(value)
      await expect(section.locator('.collection-card').first()).toHaveAttribute('href', new RegExp(`^${prefix}`))
    }
    const quantity = settings.getByLabel('Quantidade')
    await quantity.fill('1')
    await expect(section.locator('.collection-card')).toHaveCount(1)
    await quantity.fill('2')
    await expect(section.locator('.collection-card')).toHaveCount(2)

    await backToSections(settings)
    await addSection(settings, 'builderContactSection')
    await settings.getByLabel('Título').fill('Contacto ao vivo')
    section = frame.locator('.builder-render-section').filter({hasText: 'Contacto ao vivo'})
    const destination = settings.getByLabel('Tipo')
    for (const [value, prefix] of [
      ['contact', '/contacto'],
      ['quote', '/contacto'],
      ['catalogue', '/catalogo'],
    ] as const) {
      await destination.selectOption(value)
      await expect(section.locator('.builder-contact-action > a.builder-action')).toHaveAttribute(
        'href',
        new RegExp(`^${prefix}`),
      )
    }
    const contactDetails = section.locator('.builder-contact-action > div')
    await expect(contactDetails).toBeVisible()
    await settings.getByRole('switch', {name: 'Mostrar contactos'}).click()
    await expect(contactDetails).toHaveCount(0)
    await settings.getByRole('switch', {name: 'Mostrar contactos'}).click()
    await expect(contactDetails.getByRole('link')).toHaveCount(2)
  })

  test('buttons, cards and numbers keep their complete item workflow in sync', async ({page}, testInfo) => {
    test.setTimeout(120_000)
    const frame = await openEditor(page, testInfo)
    const settings = await openPageSections(page)

    await addSection(settings, 'builderHeroSection')
    await settings.getByLabel('Título').fill('Ações ao vivo')
    let section = frame.locator('.builder-render-section').filter({hasText: 'Ações ao vivo'})
    const buttonsGroup = settings.locator('details.site-page-editor-group').filter({hasText: /^Botões/})
    await buttonsGroup.locator(':scope > summary').click()
    let actionRows = buttonsGroup.locator('.site-page-action-row')
    await expect(actionRows).toHaveCount(1)
    let firstAction = actionRows.first()
    await firstAction.locator('input').nth(0).fill('Abrir contacto')
    await firstAction.locator('input').nth(1).fill('/contacto?origem=editor')
    let previewActions = section.locator('.builder-actions .builder-action')
    await expect(previewActions.first()).toHaveText('Abrir contacto')
    await expect(previewActions.first()).toHaveAttribute('href', '/contacto?origem=editor')
    for (const [label, className] of [
      ['Principal', 'is-primary'],
      ['Secundário', 'is-secondary'],
      ['Ligação', 'is-text'],
    ] as const) {
      await choice(firstAction, 'Aspeto').getByRole('button', {name: label, exact: true}).click()
      await expect(previewActions.first()).toHaveClass(new RegExp(className))
    }
    const actionOptions = firstAction.locator('details.site-page-subdetails')
    await actionOptions.locator('summary').click()
    await actionOptions.getByRole('switch', {name: 'Abrir num novo separador'}).click()
    await actionOptions.locator('input').fill('Abrir a página de contacto')
    await expect(previewActions.first()).toHaveAttribute('target', '_blank')
    await expect(previewActions.first()).toHaveAttribute('rel', /noopener/)
    await expect(previewActions.first()).toHaveAttribute('aria-label', 'Abrir a página de contacto')

    await buttonsGroup.getByRole('button', {name: 'Adicionar botão'}).click()
    actionRows = buttonsGroup.locator('.site-page-action-row')
    await expect(actionRows).toHaveCount(2)
    const secondAction = actionRows.nth(1)
    await secondAction.locator('input').nth(0).fill('Segundo botão')
    await secondAction.getByRole('button', {name: 'Mover para cima'}).click()
    await expect(previewActions.first()).toHaveText('Segundo botão')
    await actionRows.first().getByRole('button', {name: 'Eliminar botão 1'}).click()
    await page.getByRole('alertdialog').getByRole('button', {name: 'Eliminar', exact: true}).click()
    await expect(actionRows).toHaveCount(1)
    await expect(previewActions).toHaveCount(1)
    await expect(previewActions.first()).toHaveText('Abrir contacto')

    await backToSections(settings)
    await addSection(settings, 'builderCardsSection')
    await settings.getByLabel('Título').fill('Cartões ao vivo')
    section = frame.locator('.builder-render-section').filter({hasText: 'Cartões ao vivo'})
    const cardsGroup = settings.locator('details.site-page-editor-group').filter({hasText: /^Cartões/})
    await cardsGroup.locator(':scope > summary').click()
    await cardsGroup.getByRole('button', {name: 'Adicionar cartão'}).click()
    let itemRows = cardsGroup.locator('.site-page-repeater')
    await expect(itemRows).toHaveCount(1)
    let firstItem = itemRows.first()
    await firstItem.locator('input').nth(0).fill('Vantagem')
    await firstItem.locator('input').nth(1).fill('Cartão Um')
    await firstItem.locator('textarea').first().fill('Texto do primeiro cartão.')
    const cardMedia = firstItem.locator('details.site-page-subdetails').first()
    await cardMedia.locator(':scope > summary').click()
    await cardMedia.getByLabel('Carregar imagem').setInputFiles({
      name: 'cartao.png',
      mimeType: 'image/png',
      buffer: fixtureImage,
    })
    const cards = section.locator('.builder-card')
    await expect(cards.first().locator('small')).toHaveText('Vantagem')
    await expect(cards.first().locator('h3')).toHaveText('Cartão Um')
    await expect(cards.first().locator('p')).toHaveText('Texto do primeiro cartão.')
    await settleSection(section)
    await expect(cards.first().locator('.builder-media img')).toBeVisible()

    await cardsGroup.getByRole('button', {name: 'Adicionar cartão'}).click()
    itemRows = cardsGroup.locator('.site-page-repeater')
    await expect(itemRows).toHaveCount(2)
    await itemRows.nth(1).locator('input').nth(1).fill('Cartão Dois')
    await itemRows.nth(1).getByRole('button', {name: 'Mover para cima'}).click()
    await expect(cards.locator('h3').first()).toHaveText('Cartão Dois')
    await itemRows.first().getByRole('button', {name: 'Eliminar cartão 1'}).click()
    await page.getByRole('alertdialog').getByRole('button', {name: 'Eliminar', exact: true}).click()
    await expect(itemRows).toHaveCount(1)
    await expect(cards).toHaveCount(1)
    await expect(cards.locator('h3')).toHaveText('Cartão Um')

    await backToSections(settings)
    await addSection(settings, 'builderStatsSection')
    await settings.getByLabel('Título').fill('Números ao vivo')
    section = frame.locator('.builder-render-section').filter({hasText: 'Números ao vivo'})
    const statsGroup = settings.locator('details.site-page-editor-group').filter({hasText: /^Números/})
    await statsGroup.locator(':scope > summary').click()
    await statsGroup.getByRole('button', {name: 'Adicionar número'}).click()
    itemRows = statsGroup.locator('.site-page-repeater')
    await itemRows.first().locator('input').nth(0).fill('15')
    await itemRows.first().locator('input').nth(1).fill('anos de duração')
    const stats = section.locator('.builder-stats article')
    await expect(stats.first().locator('strong')).toHaveText('15')
    await expect(stats.first().locator('span')).toHaveText('anos de duração')
    await statsGroup.getByRole('button', {name: 'Adicionar número'}).click()
    itemRows = statsGroup.locator('.site-page-repeater')
    await itemRows.nth(1).locator('input').nth(0).fill('30')
    await itemRows.nth(1).getByRole('button', {name: 'Mover para cima'}).click()
    await expect(stats.first().locator('strong')).toHaveText('30')
    await itemRows.first().getByRole('button', {name: 'Eliminar número 1'}).click()
    await page.getByRole('alertdialog').getByRole('button', {name: 'Eliminar', exact: true}).click()
    await expect(itemRows).toHaveCount(1)
    await expect(stats).toHaveCount(1)
    await expect(stats.locator('strong')).toHaveText('15')
  })

  test('partners and call-to-action media are fully manageable from the section editor', async ({page}, testInfo) => {
    test.setTimeout(90_000)
    const frame = await openEditor(page, testInfo)
    const settings = await openPageSections(page)
    await addSection(settings, 'builderPartnersSection')
    await settings.getByLabel('Título').fill('Parceiros ao vivo')
    const partnerSection = frame.locator('.builder-render-section').filter({hasText: 'Parceiros ao vivo'})

    await settings.getByRole('button', {name: 'Adicionar parceiro'}).click()
    let partnerRows = settings.locator('.site-page-repeater')
    await expect(partnerRows).toHaveCount(1)
    let firstPartner = partnerRows.first()
    await firstPartner.getByLabel('Nome').fill('Parceiro Um')
    await firstPartner.getByLabel('Ligação').fill('https://example.com/um')
    await firstPartner.locator('textarea').fill('Primeira entidade parceira.')
    await firstPartner.locator('input[placeholder="Ex.: Logótipo Eco-Escolas"]').fill('Logótipo do Parceiro Um')
    await choice(firstPartner, 'Fundo do logótipo').getByRole('button', {name: 'Escuro'}).click()
    await firstPartner.getByLabel('Adicionar logótipo').setInputFiles({
      name: 'parceiro-um.png',
      mimeType: 'image/png',
      buffer: fixtureImage,
    })
    await expect(partnerSection.locator('.builder-partner strong')).toHaveText('Parceiro Um')
    await expect(partnerSection.locator('.builder-partner-text')).toHaveText('Primeira entidade parceira.')
    await expect(partnerSection.locator('.builder-partner-logo')).toHaveAttribute('data-logo-tone', 'dark')
    await expect(partnerSection.locator('.builder-partner-logo img')).toHaveAttribute('alt', 'Logótipo do Parceiro Um')

    await settings.getByRole('button', {name: 'Adicionar parceiro'}).click()
    partnerRows = settings.locator('.site-page-repeater')
    await expect(partnerRows).toHaveCount(2)
    const secondPartner = partnerRows.nth(1)
    await secondPartner.getByLabel('Nome').fill('Parceiro Dois')
    await secondPartner.getByRole('button', {name: 'Mover para cima'}).click()
    await expect(partnerSection.locator('.builder-partner strong').first()).toHaveText('Parceiro Dois')
    await expect(partnerRows.first().getByLabel('Nome')).toHaveValue('Parceiro Dois')
    await partnerRows.first().getByRole('button', {name: 'Eliminar parceiro 1'}).click()
    await page.getByRole('alertdialog').getByRole('button', {name: 'Eliminar', exact: true}).click()
    await expect(partnerRows).toHaveCount(1)
    await expect(partnerSection.locator('.builder-partner strong')).toHaveCount(1)
    await expect(partnerSection.locator('.builder-partner strong')).toHaveText('Parceiro Um')

    await backToSections(settings)
    await addSection(settings, 'builderCtaSection')
    await settings.getByLabel('Título').fill('Vídeo na chamada')
    const ctaSection = frame.locator('.builder-render-section').filter({hasText: 'Vídeo na chamada'})
    await choice(settings, 'Tipo').getByRole('button', {name: 'YouTube', exact: true}).click()
    await settings.getByLabel('Link do YouTube').fill('https://www.youtube.com/watch?v=VIUVlk51iN0')
    await expect(ctaSection.locator('.builder-cta-media iframe')).toBeVisible()
    await expect(page.locator('.site-editor-top-save')).toContainText('Guardado')
  })

  test('managed pages keep live sections through a server refresh', async ({page}) => {
    test.setTimeout(45_000)
    await stubSectionMedia(page)
    await page.goto('/painel/site/e2e-preview?fixture=managed-sections&lang=pt')
    await expect(page.getByTestId('fixture-managed-core')).toBeVisible()
    await expect(page.locator('[data-builder-section="managed-after-gallery"] .builder-interactive-gallery')).toBeVisible()

    await page.evaluate(() => {
      const localized = (value: string) => ({_type: 'localizedString', pt: value})
      const image = (key: string) => ({
        _type: 'builderMedia',
        _key: key,
        kind: 'image',
        image: {
          _type: 'image',
          asset: {
            _type: 'reference',
            _ref: `image-live${key.padEnd(24, '0')}-1400x1000-png`,
          },
        },
        alt: localized('Imagem em edição'),
      })
      window.postMessage(
        {
          type: 'df4y:builder-state',
          page: {
            _type: 'sitePage',
            sections: [
              {
                _type: 'builderManagedSection',
                _key: 'managed-fixture-core',
                component: 'productDetailCore',
                internalLabel: 'Conteúdo principal',
                enabled: true,
              },
              {
                _type: 'builderGallerySection',
                _key: 'managed-live-gallery',
                internalLabel: 'Galeria em edição',
                enabled: true,
                title: localized('Galeria em edição'),
                presentation: 'gallery',
                layout: {_type: 'builderLayout', surface: 'white', width: 'wide', columns: 3},
                items: [image('live-one'), image('live-two')],
              },
            ],
          },
        },
        window.location.origin,
      )
    })

    const liveGallery = page.locator('[data-builder-section="managed-live-gallery"] .builder-interactive-gallery')
    await expect(liveGallery).toBeVisible()
    await page.locator('body').evaluate((body) => {
      const states: number[] = []
      const read = () => {
        const count = body.querySelectorAll('[data-builder-section="managed-live-gallery"] .builder-interactive-gallery').length
        if (states.at(-1) !== count) states.push(count)
      }
      read()
      const observer = new MutationObserver(read)
      observer.observe(body, {childList: true, subtree: true})
      ;(window as any).__managedGalleryStates = states
      ;(window as any).__managedGalleryObserver = observer
    })

    await page.getByTestId('fixture-managed-refresh').click()
    await expect(liveGallery).toBeVisible()
    const states = await page.locator('body').evaluate(() => {
      ;(window as any).__managedGalleryObserver?.disconnect()
      return (window as any).__managedGalleryStates as number[]
    })
    expect(states).toEqual([1])
    await expect(page.locator('[data-builder-section="managed-before"]')).toHaveCount(0)
    await expect(page.getByTestId('fixture-managed-core')).toBeVisible()
  })
})

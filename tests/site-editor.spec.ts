import {expect, test, type FrameLocator, type Page, type TestInfo} from '@playwright/test'

const e2eKey = 'df4y-playwright-site-editor'
const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2n9sAAAAASUVORK5CYII=',
  'base64',
)

const frameFor = (page: Page): FrameLocator =>
  page.frameLocator('.site-editor-frame-wrap iframe')

const openEditor = async (page: Page, testInfo: TestInfo) => {
  const scope = `${testInfo.project.name}-${testInfo.workerIndex}-${Date.now()}-${Math.random()}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 46)

  await page.setExtraHTTPHeaders({
    'x-df4y-site-editor-e2e': e2eKey,
    'x-df4y-site-editor-scope': scope,
  })
  await page.route('https://cdn.sanity.io/**', (route) =>
    route.fulfill({status: 200, contentType: 'image/png', body: tinyPng}),
  )
  await page.goto('/painel/site')
  await expect(page.locator('.site-editor-shell')).toBeVisible()
  const frame = frameFor(page)
  await expect(frame.getByTestId('fixture-hero-title')).toBeVisible()
  return frame
}

const expectOverlayAligned = async (
  frame: FrameLocator,
  targetTestId: string,
) => {
  await expect(frame.locator('.site-editor-outline.is-active')).toBeVisible()
  const target = await frame.getByTestId(targetTestId).boundingBox()
  const outline = await frame.locator('.site-editor-outline.is-active').boundingBox()
  expect(target).not.toBeNull()
  expect(outline).not.toBeNull()
  expect(Math.abs(outline!.x - target!.x)).toBeLessThanOrEqual(3)
  expect(Math.abs(outline!.y - target!.y)).toBeLessThanOrEqual(3)
  expect(Math.abs(outline!.width - target!.width)).toBeLessThanOrEqual(3)
  expect(Math.abs(outline!.height - target!.height)).toBeLessThanOrEqual(3)
}

test.describe('visual website editor', () => {
  test('edits one focused text field, saves without reloading, closes, and edits it again', async ({
    page,
  }, testInfo) => {
    const frame = await openEditor(page, testInfo)
    await expect(frame.locator('html')).toHaveAttribute('data-site-editor-fixture-boot', /.+/)
    const initialBootId = await frame.locator('html').getAttribute('data-site-editor-fixture-boot')
    expect(initialBootId).toBeTruthy()
    const heading = frame.getByTestId('fixture-hero-title')

    await heading.click()
    await expect(frame.locator('.site-editor-inline-toolbar')).toBeVisible()
    await expect(heading).toHaveAttribute('contenteditable', 'plaintext-only')

    await heading.fill('Um título editado sem recarregar a página')
    await heading.press('Enter')
    await expect(page.locator('.site-editor-top-save')).toContainText('Guardado')
    await expect(frame.locator('html')).toHaveAttribute('data-site-editor-fixture-boot', initialBootId!)

    await frame.locator('.site-editor-inline-more').click()
    const settings = page.locator('.site-editor-drawer.is-settings')
    await expect(settings).toHaveClass(/is-open/)
    await expect(settings.locator('.site-editor-focused-context')).toContainText('Título principal')
    await expect(settings.locator('.site-editor-focused-field')).toBeVisible()
    await expect(settings.getByText('Vídeo do topo', {exact: true})).toHaveCount(0)

    const focusedInput = settings.locator('.site-editor-focused-field textarea')
    await expect(focusedInput).toHaveValue('Um título editado sem recarregar a página')
    await focusedInput.fill('Título final guardado pelo editor')
    await expect(page.locator('.site-editor-top-save')).toContainText('Guardado')
    await expect(heading).toHaveText('Título final guardado pelo editor')
    await expect(frame.locator('html')).toHaveAttribute('data-site-editor-fixture-boot', initialBootId!)

    await settings.getByRole('button', {name: 'Fechar definições'}).click()
    await expect(settings).not.toHaveClass(/is-open/)
    await expect(frame.locator('.site-editor-inline-toolbar')).toHaveCount(0)

    await heading.click()
    await expect(frame.locator('.site-editor-inline-toolbar')).toBeVisible()
    await expect(heading).toHaveAttribute('contenteditable', 'plaintext-only')
    if (testInfo.project.name === 'mobile-chrome') {
      const iframeBox = await page.locator('.site-editor-frame-wrap iframe').boundingBox()
      const toolbarBox = await frame.locator('.site-editor-inline-toolbar').boundingBox()
      expect(iframeBox).not.toBeNull()
      expect(toolbarBox).not.toBeNull()
      expect(toolbarBox!.x).toBeGreaterThanOrEqual(iframeBox!.x)
      expect(toolbarBox!.x + toolbarBox!.width).toBeLessThanOrEqual(
        iframeBox!.x + iframeBox!.width,
      )
    }
    await frame.getByRole('button', {name: 'Fechar edição'}).click()
    await expect(frame.locator('.site-editor-inline-toolbar')).toHaveCount(0)

    if (testInfo.project.name === 'mobile-chrome') {
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true)
    }
  })

  test('keeps the selection attached while scrolling and never falls back to the full form', async ({
    page,
  }, testInfo) => {
    const frame = await openEditor(page, testInfo)
    await frame.locator('html').evaluate(() => window.scrollTo(0, 720))

    const impact = frame.getByTestId('fixture-impact-title')
    await impact.click()
    await expect(frame.locator('.site-editor-inline-toolbar')).toBeVisible()
    await expectOverlayAligned(frame, 'fixture-impact-title')

    await frame.locator('html').evaluate(() => window.scrollBy(0, 120))
    await expect.poll(async () => (await impact.boundingBox())?.y ?? -1).toBeGreaterThan(0)
    await expectOverlayAligned(frame, 'fixture-impact-title')

    await frame.locator('html').evaluate(() => window.scrollTo(0, 1500))
    await expect(frame.locator('.site-editor-outline.is-active')).toHaveCount(0)
    await frame.locator('html').evaluate(() => window.scrollTo(0, 720))
    await expect(frame.locator('.site-editor-outline.is-active')).toBeVisible()
    await expect(frame.locator('.site-editor-inline-toolbar')).toBeVisible()
    await expectOverlayAligned(frame, 'fixture-impact-title')

    await frame.getByRole('button', {name: 'Fechar edição'}).click()
    await frame.locator('html').evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    const unmatched = frame.getByTestId('fixture-unmatched-field')
    await unmatched.click()
    await frame.locator('.site-editor-inline-more').click()

    const settings = page.locator('.site-editor-drawer.is-settings')
    await expect(settings).toHaveClass(/is-open/)
    await expect(settings.getByText('Este elemento não tem um campo isolado.')).toBeVisible()
    await expect(settings.locator('.site-editor-panels')).toHaveCount(0)
    await settings.getByRole('button', {name: 'Abrir todas as definições'}).click()
    await expect(settings.locator('.site-editor-panels')).toBeVisible()
  })

  test('mouse wheel scrolls both drawers and Escape closes them cleanly', async ({page}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Mouse-wheel behavior is desktop-specific')
    await openEditor(page, testInfo)

    await page.getByRole('button', {name: 'Abrir definições'}).click()
    const settings = page.locator('.site-editor-drawer.is-settings')
    const inspectorScroll = settings.locator('.site-editor-inspector-scroll')
    await expect(inspectorScroll).toBeVisible()
    const inspectorDimensions = await inspectorScroll.evaluate((element) => ({
      clientHeight: element.clientHeight,
      offsetHeight: (element as HTMLElement).offsetHeight,
      scrollHeight: element.scrollHeight,
      parentHeight: element.parentElement?.clientHeight ?? 0,
      overflowY: getComputedStyle(element).overflowY,
    }))
    expect(
      inspectorDimensions.scrollHeight,
      JSON.stringify(inspectorDimensions),
    ).toBeGreaterThan(inspectorDimensions.clientHeight)
    const inspectorBefore = await inspectorScroll.evaluate((element) => element.scrollTop)
    await inspectorScroll.hover()
    await page.mouse.wheel(0, 900)
    await expect.poll(() => inspectorScroll.evaluate((element) => element.scrollTop)).toBeGreaterThan(
      inspectorBefore,
    )

    await page.keyboard.press('Escape')
    await expect(settings).not.toHaveClass(/is-open/)

    await page.getByRole('button', {name: 'Abrir páginas e conteúdo'}).click()
    const navigation = page.locator('.site-editor-drawer.is-navigation')
    await navigation.getByRole('tab', {name: 'Conteúdo'}).click()
    const tree = navigation.locator('.site-editor-tree')
    await expect(tree).toBeVisible()
    const treeBefore = await tree.evaluate((element) => element.scrollTop)
    await tree.hover()
    await page.mouse.wheel(0, 1_100)
    await expect.poll(() => tree.evaluate((element) => element.scrollTop)).toBeGreaterThan(treeBefore)

    await page.keyboard.press('Escape')
    await expect(navigation).not.toHaveClass(/is-open/)
  })

  test('opens structured values as typed fields and manages a product gallery', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Detailed media workflow runs once')
    let frame = await openEditor(page, testInfo)

    await page.getByRole('button', {name: 'Abrir páginas e conteúdo'}).click()
    const navigation = page.locator('.site-editor-drawer.is-navigation')
    await navigation.getByRole('tab', {name: 'Conteúdo'}).click()
    await navigation.getByRole('button', {name: /Banco editorial/}).click()
    frame = frameFor(page)
    await expect(frame.getByTestId('fixture-product-title')).toBeVisible()

    await frame.getByTestId('fixture-product-weight').click()
    const settings = page.locator('.site-editor-drawer.is-settings')
    await expect(settings.locator('.site-editor-focused-context')).toContainText('Peso (kg)')
    const weight = settings.locator('.site-editor-focused-field input[type="number"]')
    await expect(weight).toHaveValue('52')
    await weight.fill('55')
    await expect(page.locator('.site-editor-top-save')).toContainText('Guardado')
    await settings.getByRole('button', {name: 'Fechar definições'}).click()

    await frame.getByTestId('fixture-product-gallery').click()
    await expect(settings.locator('.site-editor-focused-context')).toContainText('Galeria')
    const gallery = settings.locator('.site-editor-gallery-field')
    await expect(gallery.getByRole('listitem')).toHaveCount(3)
    await gallery.getByRole('listitem', {name: 'Imagem 2'}).click()
    await gallery.locator('.site-editor-gallery-description textarea').fill('Nova vista lateral')
    await expect(page.locator('.site-editor-top-save')).toContainText('Guardado')

    await gallery.locator('.site-editor-gallery-add-tile input').setInputFiles({
      name: 'nova-imagem.png',
      mimeType: 'image/png',
      buffer: tinyPng,
    })
    await expect(gallery.getByRole('listitem')).toHaveCount(4)
    await gallery.getByRole('button', {name: 'Remover'}).click()
    await expect(gallery.getByRole('listitem')).toHaveCount(3)
    await expect(page.locator('.site-editor-top-save')).toContainText('Guardado')
  })

  test('manages navigation in one coherent list and keeps the mobile shell contained', async ({
    page,
  }, testInfo) => {
    await openEditor(page, testInfo)
    await page.getByRole('button', {name: 'Abrir páginas e conteúdo'}).click()
    const navigation = page.locator('.site-editor-drawer.is-navigation')
    await navigation.getByRole('tab', {name: 'Global'}).click()
    await navigation.getByRole('button', {name: /Cabeçalho e navegação/}).click()

    const settings = page.locator('.site-editor-drawer.is-settings')
    await expect(settings).toHaveClass(/is-open/)
    const manager = settings.locator('.site-editor-navigation-manager')
    await expect(manager.locator('article')).toHaveCount(9)
    await manager.getByRole('button', {name: 'Adicionar ligação'}).click()
    await expect(manager.locator('article')).toHaveCount(10)
    await expect(manager.getByRole('textbox', {name: 'Nome'})).toHaveValue('Nova ligação')
    await manager.getByRole('button', {name: 'Remover ligação'}).click()
    await expect(manager.locator('article')).toHaveCount(9)
    await expect(page.locator('.site-editor-top-save')).toContainText('Guardado')

    if (testInfo.project.name === 'mobile-chrome') {
      const drawerBox = await settings.boundingBox()
      expect(drawerBox).not.toBeNull()
      expect(drawerBox!.x).toBeGreaterThanOrEqual(0)
      expect(drawerBox!.x + drawerBox!.width).toBeLessThanOrEqual(390)
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true)
    }
  })

  test('rejects editor mutations that do not carry the CSRF token', async ({page}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Server guard runs once')
    await openEditor(page, testInfo)
    const status = await page.evaluate(async () => {
      const response = await fetch('/painel/site/api', {
        method: 'PUT',
        headers: {'content-type': 'application/json', 'x-csrf-token': 'invalid'},
        body: JSON.stringify({document: {_id: 'siteContent', _type: 'siteLanding'}}),
      })
      return response.status
    })
    expect(status).toBe(403)
  })
})

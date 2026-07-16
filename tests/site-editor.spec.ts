import {
  expect,
  test,
  type FrameLocator,
  type Locator,
  type Page,
  type TestInfo,
} from '@playwright/test'

const e2eKey = 'df4y-playwright-site-editor'
const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2n9sAAAAASUVORK5CYII=',
  'base64',
)
const tinyVideo = Buffer.from('site-editor-video-fixture')

const frameFor = (page: Page): FrameLocator => page.frameLocator('.site-editor-frame-wrap iframe')

const waitForVisualEditor = async (frame: FrameLocator) => {
  await expect(frame.locator('.site-editor-overlay')).toHaveAttribute('data-ready', 'true', {
    timeout: 15_000,
  })
}

const expandCollection = async (navigation: Locator, name: string | RegExp) => {
  const collection = navigation.getByRole('button', {name})
  if ((await collection.getAttribute('aria-expanded')) === 'false') await collection.click()
  return collection
}

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
  await expect(page.locator('.site-editor-shell')).toBeVisible({timeout: 15_000})
  const frame = frameFor(page)
  await expect(frame.getByTestId('fixture-hero-title')).toBeVisible()
  await waitForVisualEditor(frame)
  return frame
}

const expectOverlayAligned = async (frame: FrameLocator, targetTestId: string) => {
  await expect(frame.locator('.site-editor-outline.is-active')).toBeVisible()
  await expect
    .poll(() =>
      frame.locator('body').evaluate((body, id) => {
        const target = body.querySelector(`[data-testid="${id}"]`)
        const outline = body.querySelector('.site-editor-outline.is-active')
        if (!target || !outline) return Number.POSITIVE_INFINITY
        const targetRect = target.getBoundingClientRect()
        const outlineRect = outline.getBoundingClientRect()
        return Math.max(
          Math.abs(outlineRect.x - targetRect.x),
          Math.abs(outlineRect.y - targetRect.y),
          Math.abs(outlineRect.width - targetRect.width),
          Math.abs(outlineRect.height - targetRect.height),
        )
      }, targetTestId),
    )
    .toBeLessThanOrEqual(3)
}

const openArticleWorkspace = async (page: Page, settings: Locator) => {
  const launcher = settings.getByRole('button', {name: 'Editar artigo'})
  await expect(launcher).toBeVisible()
  await launcher.click()
  const workspace = page.locator('.site-editor-article-workspace')
  await expect(workspace).toBeVisible()
  await expect(workspace).toHaveAttribute('role', 'dialog')
  return {launcher, workspace}
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

    await heading.hover()
    await expect(frame.locator('.site-editor-outline.is-hovered > span')).toHaveText('Editar texto')
    await heading.click()
    await expect(frame.locator('.site-editor-inline-toolbar')).toBeVisible()
    await expect(heading).toHaveAttribute('contenteditable', 'plaintext-only')

    await heading.fill('Um título editado sem recarregar a página')
    await heading.press('Enter')
    await expect(page.locator('.site-editor-top-save')).toContainText('Guardado')
    await expect(frame.locator('html')).toHaveAttribute(
      'data-site-editor-fixture-boot',
      initialBootId!,
    )

    await frame.locator('.site-editor-inline-more').click()
    const settings = page.locator('.site-editor-drawer.is-settings')
    await expect(settings).toHaveClass(/is-open/)
    await expect(settings.locator('.site-editor-focused-context')).toContainText('Título principal')
    await expect(settings.locator('.site-editor-focused-field')).toBeVisible()
    await expect(settings.getByText('Vídeo do topo', {exact: true})).toHaveCount(0)

    const focusedInput = settings.locator('.site-editor-focused-field textarea')
    await expect(focusedInput).toHaveValue('Um título editado sem recarregar a página')

    const font = settings.getByRole('combobox', {name: 'Fonte'})
    await font.selectOption('georgia')
    await expect(heading).toHaveCSS('font-family', /Georgia/)
    const viewportName = testInfo.project.name === 'mobile-chrome' ? 'telemóvel' : 'computador'
    const fontSize = settings.getByRole('spinbutton', {name: `Tamanho no ${viewportName}`})
    await fontSize.fill('64')
    await expect(heading).toHaveCSS('font-size', '64px')
    await expect(page.locator('.site-editor-top-save')).toContainText('Guardado')
    await expect(heading).toHaveCSS('font-family', /Georgia/)
    await expect(heading).toHaveCSS('font-size', '64px')
    await expect(frame.locator('html')).toHaveAttribute(
      'data-site-editor-fixture-boot',
      initialBootId!,
    )

    await focusedInput.fill('Título final guardado pelo editor')
    await expect(page.locator('.site-editor-top-save')).toContainText('Guardado')
    await expect(heading).toHaveText('Título final guardado pelo editor')
    await expect(frame.locator('html')).toHaveAttribute(
      'data-site-editor-fixture-boot',
      initialBootId!,
    )

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
      expect(toolbarBox!.x + toolbarBox!.width).toBeLessThanOrEqual(iframeBox!.x + iframeBox!.width)
    }
    await frame.getByRole('button', {name: 'Fechar edição'}).click()
    await expect(frame.locator('.site-editor-inline-toolbar')).toHaveCount(0)

    if (testInfo.project.name === 'mobile-chrome') {
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
      ).toBe(true)
    }

    const savedPreviewUrl = await frame.locator('html').evaluate(() => window.location.href)
    await page.locator('.site-editor-publish-button').click()
    await expect(page.locator('.site-editor-notice')).toContainText('Alterações publicadas')

    const publishedPreviewUrl = new URL(savedPreviewUrl)
    publishedPreviewUrl.searchParams.set('published', '1')
    await page.goto(publishedPreviewUrl.toString())
    const savedHeading = page.getByTestId('fixture-hero-title')
    await expect(savedHeading).toHaveText('Título final guardado pelo editor')
    await expect(savedHeading).toHaveCSS('font-family', /Georgia/)
    await expect(savedHeading).toHaveCSS('font-size', '64px')
  })

  test('keeps the selection attached while scrolling and never falls back to the full form', async ({
    page,
  }, testInfo) => {
    const frame = await openEditor(page, testInfo)
    const impact = frame.getByTestId('fixture-impact-title')
    await impact.scrollIntoViewIfNeeded()
    await impact.click()
    await expect(frame.locator('.site-editor-inline-toolbar')).toBeVisible()
    await expectOverlayAligned(frame, 'fixture-impact-title')

    await frame.locator('html').evaluate(() => window.scrollBy(0, 120))
    await expect.poll(async () => (await impact.boundingBox())?.y ?? -1).toBeGreaterThan(0)
    await expectOverlayAligned(frame, 'fixture-impact-title')

    await frame.locator('html').evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await expect(frame.locator('.site-editor-outline.is-active')).toHaveCount(0)
    await impact.scrollIntoViewIfNeeded()
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

  test('a hidden responsive duplicate cannot steal the visible editing outline', async ({
    page,
  }, testInfo) => {
    const frame = await openEditor(page, testInfo)
    const visibleLink = frame.getByTestId('fixture-nav-link')
    const hiddenLink = frame.getByTestId('fixture-nav-hidden-duplicate')

    await visibleLink.click()
    await visibleLink.press('Enter')
    await expectOverlayAligned(frame, 'fixture-nav-link')

    await hiddenLink.evaluate((element) => {
      const encoded = element.getAttribute('data-sanity')
      element.removeAttribute('data-sanity')
      requestAnimationFrame(() => {
        if (encoded) element.setAttribute('data-sanity', encoded)
      })
    })
    await frame
      .locator('body')
      .evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
      )

    await expectOverlayAligned(frame, 'fixture-nav-link')
    await visibleLink.hover()
    await expect(frame.locator('.site-editor-inline-toolbar')).toBeVisible()
  })

  test('keeps visual editing active after navigating inside the preview', async ({
    page,
  }, testInfo) => {
    let frame = await openEditor(page, testInfo)

    await frame.getByTestId('fixture-page-navigation').click()
    await expect(frame.getByTestId('fixture-product-page')).toBeVisible()
    await expect(frame.locator('.site-editor-overlay')).toBeAttached()
    await expect
      .poll(() => frame.locator('html').evaluate(() => window.location.search))
      .toContain('__builder=1')
    await frame
      .locator('body')
      .evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
      )

    const navigatedBootId = await frame
      .locator('html')
      .getAttribute('data-site-editor-fixture-boot')
    await expect(page.locator('.site-editor-context')).toContainText('Banco editorial')
    await page.getByRole('button', {name: 'Abrir definições'}).click()
    const settings = page.locator('.site-editor-drawer.is-settings')
    await expect(settings).toHaveClass(/is-open/)
    await expect(settings.locator('.site-editor-inspector-title')).toContainText('Banco editorial')
    await expect(settings.getByText('O que quer editar?')).toBeVisible()
    await settings.getByRole('button', {name: 'Fechar definições'}).click()

    await frame.getByTestId('fixture-product-title').click()
    await expect(page.locator('.site-editor-context')).toContainText('Banco editorial')
    await expect(frame.locator('.site-editor-inline-toolbar')).toBeVisible()
    await expect(frame.getByTestId('fixture-product-title')).toHaveAttribute(
      'contenteditable',
      'plaintext-only',
    )
    await expect(frame.locator('html')).toHaveAttribute(
      'data-site-editor-fixture-boot',
      navigatedBootId!,
    )
  })

  test('mouse wheel scrolls both drawers and Escape closes them cleanly', async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== 'desktop-chrome',
      'Mouse-wheel behavior is desktop-specific',
    )
    await openEditor(page, testInfo)

    await page.getByRole('button', {name: 'Abrir definições'}).click()
    const settings = page.locator('.site-editor-drawer.is-settings')
    await settings.getByRole('button', {name: 'Página inicial'}).click()
    await expect(
      settings
        .locator('.site-editor-field-index > button')
        .filter({hasText: 'Texto para fechar o vídeo'})
        .locator('small'),
    ).toHaveText('Opcional')
    await settings.getByRole('button', {name: 'Impacto e prova'}).click()
    const inspectorScroll = settings.locator('.site-editor-inspector-scroll')
    await expect(inspectorScroll).toBeVisible()
    const inspectorDimensions = await inspectorScroll.evaluate((element) => ({
      clientHeight: element.clientHeight,
      offsetHeight: (element as HTMLElement).offsetHeight,
      scrollHeight: element.scrollHeight,
      parentHeight: element.parentElement?.clientHeight ?? 0,
      overflowY: getComputedStyle(element).overflowY,
    }))
    expect(inspectorDimensions.scrollHeight, JSON.stringify(inspectorDimensions)).toBeGreaterThan(
      inspectorDimensions.clientHeight,
    )
    const inspectorBefore = await inspectorScroll.evaluate((element) => element.scrollTop)
    await inspectorScroll.hover()
    await page.mouse.wheel(0, 900)
    await expect
      .poll(() => inspectorScroll.evaluate((element) => element.scrollTop))
      .toBeGreaterThan(inspectorBefore)

    await page.keyboard.press('Escape')
    await expect(settings).not.toHaveClass(/is-open/)

    await page.getByRole('button', {name: 'Abrir páginas e conteúdo'}).click()
    const navigation = page.locator('.site-editor-drawer.is-navigation')
    await navigation.getByRole('tab', {name: 'Conteúdo'}).click()
    await expandCollection(navigation, /Artigos do Blog/)
    const tree = navigation.locator('.site-editor-tree')
    await expect(tree).toBeVisible()
    const treeBefore = await tree.evaluate((element) => element.scrollTop)
    await tree.hover()
    await page.mouse.wheel(0, 1_100)
    await expect
      .poll(() => tree.evaluate((element) => element.scrollTop))
      .toBeGreaterThan(treeBefore)

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
    await expandCollection(navigation, /Produtos da Loja/)
    const productNode = navigation.getByRole('button', {name: /Banco editorial/})
    await expect(productNode.locator('.site-editor-tree-icon img')).toBeVisible()
    await productNode.click()
    frame = frameFor(page)
    await expect(frame.getByTestId('fixture-product-title')).toBeVisible()
    await waitForVisualEditor(frame)

    const productWeight = frame.getByTestId('fixture-product-weight')
    await productWeight.hover()
    await expect(frame.locator('.site-editor-outline.is-hovered > span')).toHaveText(
      'Editar campo: Peso',
    )
    await productWeight.click()
    await expect(frame.locator('.site-editor-inline-kind')).toHaveText('Valor')
    const settings = page.locator('.site-editor-drawer.is-settings')
    await expect(settings.locator('.site-editor-focused-context')).toContainText('Peso (kg)')
    const weight = settings.locator('.site-editor-focused-field input[type="number"]')
    await expect(weight).toHaveValue('52')
    await weight.fill('55')
    await expect(page.locator('.site-editor-top-save')).toContainText('Guardado')
    await settings.getByRole('button', {name: 'Fechar definições'}).click()

    const productPrice = frame.getByTestId('fixture-product-price')
    await productPrice.hover()
    await expect(frame.locator('.site-editor-outline.is-hovered > span')).toHaveText(
      'Editar campo: Produto s/ IVA',
    )
    await productPrice.click()
    await expect(frame.locator('.site-editor-inline-kind')).toHaveText('Valor')
    await expect(settings.locator('.site-editor-focused-context')).toContainText(
      'Natural/Cinza sem IVA',
    )
    const price = settings.locator('.site-editor-focused-field input[type="number"]')
    await expect(price).toHaveValue('185')
    await price.fill('190')
    await expect(page.locator('.site-editor-top-save')).toContainText('Guardado')
    await settings.getByRole('button', {name: 'Fechar definições'}).click()

    const galleryVideo = frame.getByTestId('fixture-product-gallery-video')
    await galleryVideo.hover()
    await expect(frame.locator('.site-editor-outline.is-hovered > span')).toHaveText('Editar vídeo')
    await galleryVideo.click()
    await expect(frame.locator('.site-editor-inline-kind')).toHaveText('Vídeo')
    await expect(settings.locator('.site-editor-focused-context')).toContainText('Galeria')
    const focusedGallery = settings.locator('.site-editor-gallery-field')
    await expect(focusedGallery.getByRole('listitem', {name: 'Vídeo 3'})).toHaveClass(/is-active/)
    await expect(focusedGallery.locator('.site-editor-gallery-active-head strong')).toHaveText(
      'Vídeo 3',
    )
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

    await gallery.locator('.site-editor-gallery-add-tile input').setInputFiles({
      name: 'demonstracao.mp4',
      mimeType: 'video/mp4',
      buffer: tinyVideo,
    })
    await expect(gallery.getByRole('listitem')).toHaveCount(4)
    await expect(gallery.getByRole('listitem', {name: 'Vídeo 4'})).toBeVisible()
    await expect(gallery.locator('.site-editor-gallery-description textarea')).toBeVisible()
    await gallery.getByRole('button', {name: 'Remover'}).click()
    await expect(gallery.getByRole('listitem')).toHaveCount(3)
  })

  test('creates Blog and free-page drafts without leaving or crashing the editor', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Creation workflow runs once')
    const pageErrors: string[] = []
    page.on('pageerror', (error) => pageErrors.push(error.message))
    await openEditor(page, testInfo)

    await page.getByRole('button', {name: 'Abrir páginas e conteúdo'}).click()
    const navigation = page.locator('.site-editor-drawer.is-navigation')
    await navigation.getByRole('tab', {name: 'Conteúdo'}).click()
    await navigation.getByRole('button', {name: 'Novo conteúdo'}).click()

    let modal = page.locator('.site-editor-modal')
    await modal.getByLabel('Tipo').selectOption('blogPost')
    expect(pageErrors, pageErrors.join('\n')).toEqual([])
    await modal.getByLabel('Nome').fill('Artigo criado no editor')
    await modal.getByRole('button', {name: 'Criar rascunho'}).click()
    await expect(modal).toHaveCount(0)
    await expect(page.locator('.site-editor-shell')).toBeVisible()
    await expect(page.locator('.site-editor-notice')).toContainText('Conteúdo criado como rascunho')
    await expandCollection(navigation, /Artigos do Blog/)
    await expect(navigation.getByRole('button', {name: /Artigo criado no editor/})).toBeVisible()

    await navigation.getByRole('tab', {name: 'Páginas'}).click()
    await navigation.getByRole('button', {name: 'Nova página'}).click()
    modal = page.locator('.site-editor-modal')
    await modal.getByLabel('Nome').fill('Página criada no editor')
    await modal.getByLabel('Endereço').fill('/pagina-criada-no-editor')
    await modal.getByRole('button', {name: 'Criar rascunho'}).click()
    await expect(modal).toHaveCount(0)
    await expect(page.locator('.site-editor-shell')).toBeVisible()
    await expect(navigation.getByRole('button', {name: /Página criada no editor/})).toBeVisible()
    expect(pageErrors, pageErrors.join('\n')).toEqual([])
  })

  test('creates every structured content type with its starter fields and keeps visual editing active', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Creation workflow runs once')
    test.setTimeout(40_000)
    const pageErrors: string[] = []
    page.on('pageerror', (error) => pageErrors.push(error.message))
    const frame = await openEditor(page, testInfo)

    await page.getByRole('button', {name: 'Abrir páginas e conteúdo'}).click()
    const navigation = page.locator('.site-editor-drawer.is-navigation')
    await navigation.getByRole('tab', {name: 'Conteúdo'}).click()

    const drafts = [
      {type: 'productCategory', title: 'Produto criado no editor'},
      {type: 'storeProduct', title: 'Produto da Loja criado no editor'},
      {type: 'caseStudy', title: 'Caso criado no editor'},
      {type: 'blogPost', title: 'Artigo completo criado no editor'},
    ] as const

    for (const [index, draft] of drafts.entries()) {
      if (index > 0) {
        await page.getByRole('button', {name: 'Abrir páginas e conteúdo'}).click()
      }
      await navigation.getByRole('button', {name: 'Novo conteúdo'}).click()
      const modal = page.locator('.site-editor-modal')
      await modal.getByLabel('Tipo').selectOption(draft.type)
      await modal.getByLabel('Nome').fill(draft.title)
      await modal.getByRole('button', {name: 'Criar rascunho'}).click()

      await expect(modal).toHaveCount(0)
      await expect(frame.getByTestId('fixture-created-page')).toBeVisible()
      await waitForVisualEditor(frame)
      await expect(page.locator('.site-editor-context')).toContainText(draft.title)
      await expect(frame.getByTestId('fixture-created-summary')).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(navigation).not.toHaveClass(/is-open/)

      const heading = frame.getByTestId('fixture-created-title')
      await heading.hover()
      await expect(frame.locator('.site-editor-outline.is-hovered > span')).toHaveText(
        'Editar texto',
      )
      await heading.click()
      await expect(frame.locator('.site-editor-inline-toolbar')).toBeVisible()
      await heading.press('Escape')

      if (draft.type === 'blogPost') {
        const article = frame.getByTestId('fixture-created-article')
        const articleBootId = await frame
          .locator('html')
          .getAttribute('data-site-editor-fixture-boot')
        await expect(article).toHaveText('')
        await article.click()
        const settings = page.locator('.site-editor-drawer.is-settings')
        await expect(settings).toHaveClass(/is-open/)
        const {launcher, workspace} = await openArticleWorkspace(page, settings)
        await expect(workspace.locator('.site-editor-rich-toolbar')).toBeVisible()
        await expect(workspace.locator('.site-editor-rich-canvas')).toBeVisible()
        await expect(
          workspace.locator('[contenteditable="true"][aria-label="Texto do artigo"]'),
        ).toHaveText('')
        const articleEditor = workspace.locator(
          '[contenteditable="true"][aria-label="Texto do artigo"]',
        )
        await articleEditor.click()
        await articleEditor.pressSequentially('Conteúdo inicial. Mais conteúdo.')
        await expect(articleEditor).toContainText('Mais conteúdo.')
        await articleEditor.press('Enter')
        await articleEditor.pressSequentially('Uma nova secção')
        await workspace.getByLabel('Formato do texto').selectOption('h2')
        await expect(workspace.locator('.site-editor-rich-canvas h2')).toContainText(
          'Uma nova secção',
        )
        await expect(article.locator('h2')).toContainText('Uma nova secção')

        await articleEditor.press('Enter')
        await articleEditor.pressSequentially('Primeiro ponto')
        await workspace.getByRole('button', {name: 'Lista com marcadores'}).click()
        await articleEditor.press('Enter')
        await articleEditor.pressSequentially('Segundo ponto')
        await expect(workspace.locator('.site-editor-rich-list-item.is-bullet')).toHaveCount(2)
        await expect(article.locator('ul li')).toHaveCount(2)
        const createdDocumentId = await frame
          .locator('html')
          .evaluate(() => new URL(window.location.href).searchParams.get('document'))
        expect(createdDocumentId).toBeTruthy()
        await expect
          .poll(async () => {
            return page.evaluate(async (documentId) => {
              const response = await fetch(
                `/painel/site/api?document=${encodeURIComponent(documentId)}`,
              )
              const payload = (await response.json()) as {
                document?: {article?: {pt?: unknown}}
              }
              const blocks = payload.document?.article?.pt
              if (!Array.isArray(blocks)) return 'INVALID_ARTICLE_SHAPE'
              return blocks
                .flatMap((block) =>
                  block && typeof block === 'object' && Array.isArray(block.children)
                    ? block.children
                    : [],
                )
                .map((child) =>
                  child && typeof child === 'object' && typeof child.text === 'string'
                    ? child.text
                    : '',
                )
                .join('')
            }, createdDocumentId!)
          })
          .toContain('Mais conteúdo.')
        await expect(page.locator('.site-editor-top-save')).toContainText('Guardado')
        await expect(article).toContainText('Mais conteúdo.')
        await expect(frame.locator('html')).toHaveAttribute(
          'data-site-editor-fixture-boot',
          articleBootId!,
        )
        await workspace.getByRole('button', {name: 'Adicionar tabela'}).click()
        const table = workspace.locator('.site-editor-rich-object[data-object-type="articleTable"]')
        await expect(table).toBeVisible()
        await expect(table.locator('.site-editor-rich-table-fields.is-embedded')).toBeVisible()
        await workspace.getByLabel('Nome da coluna 1').fill('Material')
        await workspace.getByLabel('Nome da coluna 2').fill('Quantidade')
        await workspace.getByLabel('Linha 1, Material').fill('Plástico reciclado')
        await workspace.getByLabel('Linha 1, Quantidade').fill('12 kg')
        await workspace.getByLabel('Linha 2, Material').fill('Madeira')
        await workspace.getByLabel('Linha 2, Quantidade').fill('8 kg')
        await expect(article.locator('table th').nth(0)).toHaveText('Material')
        await expect(article.locator('table td').nth(0)).toHaveText('Plástico reciclado')
        await expect(page.locator('.site-editor-top-save')).toContainText('Guardado')
        const structure = await page.evaluate(async (documentId) => {
          const response = await fetch(
            `/painel/site/api?document=${encodeURIComponent(documentId)}`,
          )
          const payload = (await response.json()) as {
            document?: {article?: {pt?: Array<Record<string, unknown>>}}
          }
          return payload.document?.article?.pt ?? []
        }, createdDocumentId!)
        expect(structure.some((block) => block.style === 'h2')).toBe(true)
        expect(structure.filter((block) => block.listItem === 'bullet')).toHaveLength(2)
        expect(structure.some((block) => block._type === 'articleTable')).toBe(true)
        await table.getByRole('button', {name: 'Concluir edição da tabela'}).click()
        await workspace.getByRole('button', {name: 'Concluir'}).click()
        await expect(workspace).toHaveCount(0)
        await expect(launcher).toBeFocused()
        await launcher.click()
        await expect(page.locator('.site-editor-article-workspace')).toContainText('Mais conteúdo.')
        await page
          .locator('.site-editor-article-workspace')
          .getByRole('button', {name: 'Concluir'})
          .click()
        await settings.getByRole('button', {name: 'Fechar definições'}).click()
      }
      if (draft.type === 'storeProduct') {
        await expect(frame.getByText('Produto s/ IVA')).toBeVisible()
        await expect(frame.getByText('Peso', {exact: true})).toBeVisible()
      }
    }

    await page.getByRole('button', {name: 'Abrir páginas e conteúdo'}).click()
    await navigation.getByRole('button', {name: 'Novo conteúdo'}).click()
    const duplicateModal = page.locator('.site-editor-modal')
    await duplicateModal.getByLabel('Tipo').selectOption('blogPost')
    await duplicateModal.getByLabel('Nome').fill('Artigo completo criado no editor')
    await duplicateModal.getByRole('button', {name: 'Criar rascunho'}).click()
    await expect(duplicateModal.locator('.site-editor-modal-error')).toContainText(
      'Já existe conteúdo deste tipo com o mesmo endereço.',
    )

    expect(pageErrors, pageErrors.join('\n')).toEqual([])
  })

  test('opens a populated article, edits it in place, and preserves every rich structure', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Rich article round trip runs once')
    test.setTimeout(35_000)
    const pageErrors: string[] = []
    page.on('pageerror', (error) => pageErrors.push(error.message))
    const frame = await openEditor(page, testInfo)

    await page.getByRole('button', {name: 'Abrir páginas e conteúdo'}).click()
    const navigation = page.locator('.site-editor-drawer.is-navigation')
    await navigation.getByRole('tab', {name: 'Conteúdo'}).click()
    await expandCollection(navigation, /Artigos do Blog/)
    await navigation.getByRole('button', {name: /Artigo estruturado completo/}).click()

    const article = frame.getByTestId('fixture-created-article')
    await expect(article).toContainText('Uma secção completa')
    await expect(frame.locator('html')).toHaveAttribute('data-site-editor-fixture-boot', /.+/)
    const bootId = await frame.locator('html').getAttribute('data-site-editor-fixture-boot')
    await expect(frame.locator('.site-editor-overlay')).toBeAttached()
    await article.hover()
    await expect(frame.locator('.site-editor-outline.is-hovered')).toBeVisible()
    await article.click({position: {x: 8, y: 8}})

    const settings = page.locator('.site-editor-drawer.is-settings')
    await expect(settings).toHaveClass(/is-open/)
    const {workspace} = await openArticleWorkspace(page, settings)
    const canvas = workspace.locator('.site-editor-rich-canvas')
    await expect(canvas.locator('h2')).toContainText('Uma secção completa')
    await expect(canvas.locator('.site-editor-rich-list-item.is-bullet')).toHaveCount(2)
    await expect(canvas.locator('.site-editor-rich-list-item.is-number')).toHaveCount(2)
    await expect(canvas.locator('blockquote')).toContainText('Uma citação preservada')
    await expect(canvas.locator('strong').filter({hasText: 'Este parágrafo'})).toHaveCount(1)
    await expect(canvas.locator('a')).toHaveAttribute('href', 'https://www.dafabrica4you.pt/')
    await expect(canvas.locator('.site-editor-rich-object[data-object-type="image"]')).toHaveCount(
      1,
    )
    await expect(
      canvas.locator('.site-editor-rich-object[data-object-type="youtubeEmbed"]'),
    ).toHaveCount(1)
    await expect(
      canvas.locator('.site-editor-rich-object[data-object-type="articleTable"]'),
    ).toHaveCount(1)

    const heading = canvas.locator('h2')
    await heading.click()
    await page.keyboard.press('End')
    await page.keyboard.type(' atualizada')
    await expect(heading).toContainText('atualizada')
    await expect(article.locator('h2')).toContainText('atualizada')
    await expect(frame.locator('html')).toHaveAttribute('data-site-editor-fixture-boot', bootId!)
    await expect(page.locator('.site-editor-top-save')).toContainText('Guardado')

    const table = canvas.locator('.site-editor-rich-object[data-object-type="articleTable"]')
    await table.getByRole('button', {name: 'Editar tabela'}).click()
    await expect(workspace.getByLabel('Nome da coluna 1')).toHaveValue('Material')
    await expect(workspace.getByLabel('Nome da coluna 2')).toHaveValue('Quantidade')
    await expect(workspace.getByLabel('Linha 1, Material')).toHaveValue('Plástico reciclado')
    await expect(workspace.getByLabel('Linha 2, Quantidade')).toHaveValue('8 kg')

    const storedShape = await page.evaluate(async () => {
      const response = await fetch('/painel/site/api?document=blogPost.rich-article-fixture')
      const payload = (await response.json()) as {
        document?: {article?: {pt?: Array<Record<string, unknown>>}}
      }
      return (payload.document?.article?.pt ?? []).map((block) => ({
        type: block._type,
        style: block.style,
        listItem: block.listItem,
        columns: block.columns,
        rows: block.rows,
        markDefs: block.markDefs,
        children: block.children,
      }))
    })

    expect(storedShape.map((block) => block.type)).toEqual([
      'block',
      'block',
      'block',
      'block',
      'block',
      'block',
      'block',
      'image',
      'youtubeEmbed',
      'articleTable',
    ])
    expect(storedShape.filter((block) => block.listItem === 'bullet')).toHaveLength(2)
    expect(storedShape.filter((block) => block.listItem === 'number')).toHaveLength(2)
    expect(storedShape[1]?.markDefs).toEqual([
      {
        _key: 'rich-link',
        _type: 'link',
        href: 'https://www.dafabrica4you.pt/',
      },
    ])
    expect(storedShape[1]?.children).toEqual(
      expect.arrayContaining([
        expect.objectContaining({marks: ['strong']}),
        expect.objectContaining({marks: ['em', 'rich-link']}),
      ]),
    )
    expect(storedShape.at(-1)?.columns).toEqual(['Material', 'Quantidade'])
    expect(storedShape.at(-1)?.rows).toHaveLength(2)
    expect(pageErrors, pageErrors.join('\n')).toEqual([])
  })

  test('keeps the article toolbar and table workflow contained on desktop and mobile', async ({
    page,
  }, testInfo) => {
    test.setTimeout(30_000)
    const frame = await openEditor(page, testInfo)

    await page.getByRole('button', {name: 'Abrir páginas e conteúdo'}).click()
    const navigation = page.locator('.site-editor-drawer.is-navigation')
    await navigation.getByRole('tab', {name: 'Conteúdo'}).click()
    await expandCollection(navigation, /Artigos do Blog/)
    await navigation.getByRole('button', {name: /Artigo estruturado completo/}).click()
    const article = frame.getByTestId('fixture-created-article')
    await expect(frame.locator('.site-editor-overlay')).toBeAttached()
    await article.hover()
    await expect(frame.locator('.site-editor-outline.is-hovered')).toBeVisible()
    await article.click({position: {x: 8, y: 8}})

    const settings = page.locator('.site-editor-drawer.is-settings')
    const firstOpen = await openArticleWorkspace(page, settings)
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe('hidden')
    await page.keyboard.press('Escape')
    await expect(firstOpen.workspace).toHaveCount(0)
    await expect(firstOpen.launcher).toBeFocused()
    await expect(settings).toHaveClass(/is-open/)
    await expect.poll(() => page.evaluate(() => document.body.style.overflow)).not.toBe('hidden')

    const {workspace} = await openArticleWorkspace(page, settings)
    const bulletButton = workspace.getByRole('button', {name: 'Lista com marcadores'})
    const numberedButton = workspace.getByRole('button', {name: 'Lista numerada'})
    await expect(bulletButton).toBeVisible()
    await expect(numberedButton).toBeVisible()
    const [bulletBox, numberedBox] = await Promise.all([
      bulletButton.boundingBox(),
      numberedButton.boundingBox(),
    ])
    expect(bulletBox).not.toBeNull()
    expect(numberedBox).not.toBeNull()
    expect(Math.abs(bulletBox!.y - numberedBox!.y)).toBeLessThanOrEqual(1)
    expect(Math.abs(bulletBox!.height - numberedBox!.height)).toBeLessThanOrEqual(1)

    const table = workspace.locator('.site-editor-rich-object[data-object-type="articleTable"]')
    await table.getByRole('button', {name: 'Editar tabela'}).click()
    await expect(workspace.locator('.site-editor-rich-table-grid-shell')).toBeVisible()
    expect(await workspace.evaluate((dialog) => dialog.scrollWidth <= dialog.clientWidth + 1)).toBe(
      true,
    )
  })

  test('supports document-style table editing and block flow from the keyboard', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Keyboard document workflow runs once')
    test.setTimeout(40_000)
    const frame = await openEditor(page, testInfo)

    await page.getByRole('button', {name: 'Abrir páginas e conteúdo'}).click()
    const navigation = page.locator('.site-editor-drawer.is-navigation')
    await navigation.getByRole('tab', {name: 'Conteúdo'}).click()
    await expandCollection(navigation, /Artigos do Blog/)
    await navigation.getByRole('button', {name: /Artigo estruturado completo/}).click()

    const article = frame.getByTestId('fixture-created-article')
    await article.hover()
    await article.click({position: {x: 8, y: 8}})
    const settings = page.locator('.site-editor-drawer.is-settings')
    const {workspace} = await openArticleWorkspace(page, settings)
    const canvas = workspace.locator('.site-editor-rich-canvas')
    const table = canvas.locator('.site-editor-rich-object[data-object-type="articleTable"]')
    const readArticleBlocks = () =>
      page.evaluate(async () => {
        const response = await fetch('/painel/site/api?document=blogPost.rich-article-fixture')
        const payload = (await response.json()) as {
          document?: {article?: {pt?: Array<Record<string, unknown>>}}
        }
        return payload.document?.article?.pt ?? []
      })

    await table.getByRole('button', {name: 'Editar tabela'}).click()
    const embeddedEditor = table.locator('.site-editor-rich-table-fields.is-embedded')
    await expect(embeddedEditor).toBeVisible()

    const firstHeading = embeddedEditor.getByLabel('Nome da coluna 1')
    const secondHeading = embeddedEditor.getByLabel('Nome da coluna 2')
    await firstHeading.focus()
    await page.keyboard.press('Tab')
    await expect(secondHeading).toBeFocused()
    await page.keyboard.press('Tab')
    await expect(embeddedEditor.getByLabel('Linha 1, Material')).toBeFocused()

    const lastExistingCell = embeddedEditor.getByLabel('Linha 2, Quantidade')
    await lastExistingCell.focus()
    await page.keyboard.press('Tab')
    const firstNewCell = embeddedEditor.getByLabel('Linha 3, Material')
    await expect(firstNewCell).toBeFocused()
    await expect(embeddedEditor.getByText('3 linhas')).toBeVisible()
    await firstNewCell.fill('Vidro')
    await page.keyboard.press('Tab')
    const lastNewCell = embeddedEditor.getByLabel('Linha 3, Quantidade')
    await expect(lastNewCell).toBeFocused()
    await lastNewCell.fill('3 kg')
    await page.keyboard.press('Shift+Tab')
    await expect(firstNewCell).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(lastExistingCell).toBeFocused()

    await expect
      .poll(async () => {
        const tableBlock = (await readArticleBlocks()).find(
          (block) => block._type === 'articleTable',
        ) as {rows?: Array<{cells?: string[]}>} | undefined
        return tableBlock?.rows?.at(-1)?.cells
      })
      .toEqual(['Vidro', '3 kg'])

    await table.getByRole('button', {name: 'Concluir edição da tabela'}).click()
    await expect(embeddedEditor).toHaveCount(0)
    await table.click({position: {x: 16, y: 16}})
    await page.keyboard.press('Enter')

    await expect
      .poll(async () => (await readArticleBlocks()).map((block) => block._type).slice(-2))
      .toEqual(['articleTable', 'block'])

    await page.keyboard.press('Backspace')
    await expect.poll(async () => (await readArticleBlocks()).at(-1)?._type).toBe('articleTable')

    await page.keyboard.press('Enter')
    await page.keyboard.type('Parágrafo com avanço')
    await page.keyboard.press('Tab')
    await expect
      .poll(async () => {
        const finalBlock = (await readArticleBlocks()).at(-1) as
          | {level?: number; children?: Array<{text?: string}>}
          | undefined
        return {
          level: finalBlock?.level,
          text: finalBlock?.children?.map((child) => child.text || '').join(''),
        }
      })
      .toEqual({level: 1, text: 'Parágrafo com avanço'})
    await expect(
      canvas.locator('.site-editor-rich-indented-block[data-indent-level="1"]'),
    ).toContainText('Parágrafo com avanço')
    await expect(
      article.locator('.article-indented-block[data-indent-level="1"]'),
    ).toContainText('Parágrafo com avanço')

    await page.keyboard.press('Tab')
    await expect.poll(async () => (await readArticleBlocks()).at(-1)?.level).toBe(2)
    await page.keyboard.press('Shift+Tab')
    await expect.poll(async () => (await readArticleBlocks()).at(-1)?.level).toBe(1)

    await page.keyboard.press('Enter')
    await page.keyboard.type('- ')
    await page.keyboard.type('Ponto criado com atalho')
    await expect(canvas.locator('.site-editor-rich-list-item.is-bullet')).toHaveCount(3)
    await expect(canvas).toContainText('Ponto criado com atalho')
    await page.keyboard.press('Tab')
    await expect.poll(async () => (await readArticleBlocks()).at(-1)?.level).toBe(2)
    await page.keyboard.press('Shift+Tab')
    await expect
      .poll(async () => {
        const finalBlock = (await readArticleBlocks()).at(-1) as
          | {listItem?: string; level?: number; children?: Array<{text?: string}>}
          | undefined
        return {
          listItem: finalBlock?.listItem,
          level: finalBlock?.level,
          text: finalBlock?.children?.map((child) => child.text || '').join(''),
        }
      })
      .toEqual({listItem: 'bullet', level: 1, text: 'Ponto criado com atalho'})
  })

  test('creates a Loja category and offers it immediately on Loja products', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Category creation workflow runs once')
    await openEditor(page, testInfo)

    await page.getByRole('button', {name: 'Abrir páginas e conteúdo'}).click()
    const navigation = page.locator('.site-editor-drawer.is-navigation')
    await navigation.getByRole('tab', {name: 'Conteúdo'}).click()
    await navigation.getByRole('button', {name: 'Adicionar categoria'}).click()

    const modal = page.locator('.site-editor-modal')
    await expect(modal.getByLabel('Tipo')).toHaveCount(0)
    await modal.getByLabel('Nome').fill('Deck modular')
    await modal.getByRole('button', {name: 'Criar rascunho'}).click()
    await expect(modal).toHaveCount(0)
    await expandCollection(navigation, /Categorias da Loja/)
    await expect(navigation.getByRole('button', {name: /Deck modular/})).toBeVisible()

    await expandCollection(navigation, /Produtos da Loja/)
    await navigation.getByRole('button', {name: /Banco editorial/}).click()
    await page.getByRole('button', {name: 'Abrir definições'}).click()
    const settings = page.locator('.site-editor-drawer.is-settings')
    await settings
      .locator('.site-editor-panel-index > button')
      .filter({hasText: 'Conteúdo'})
      .click()
    await settings
      .locator('.site-editor-field-index > button')
      .filter({hasText: 'Categoria'})
      .click()
    await expect(settings.getByRole('combobox', {name: 'Categoria'})).toContainText('Deck modular')
  })

  test('shows category assignments and only allows deleting an unused Loja category', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Category management workflow runs once')
    await openEditor(page, testInfo)

    await page.getByRole('button', {name: 'Abrir páginas e conteúdo'}).click()
    const navigation = page.locator('.site-editor-drawer.is-navigation')
    await navigation.getByRole('tab', {name: 'Conteúdo'}).click()
    await expandCollection(navigation, /Categorias da Loja/)
    await expect(navigation.getByRole('button', {name: /Bancos.*1 produto/})).toBeVisible()
    await navigation.getByRole('button', {name: /Bancos.*1 produto/}).click()

    const settings = page.locator('.site-editor-drawer.is-settings')
    await expect(navigation).toHaveClass(/is-open/)
    await expect(settings).toHaveClass(/is-open/)
    const manager = settings.locator('.site-editor-category-manager')
    await expect(manager.getByText('1 produto', {exact: true})).toBeVisible()
    await expect(
      manager.getByRole('button', {name: 'Alterar categoria de Banco editorial'}),
    ).toBeVisible()
    await expect(settings.getByText('Esta categoria está em uso')).toBeVisible()
    await expect(settings.getByRole('button', {name: 'Eliminar conteúdo'})).toHaveCount(0)

    await manager.getByRole('textbox', {name: 'Nome da categoria'}).fill('Bancos exteriores')
    await expect(page.locator('.site-editor-top-save')).toContainText('Guardado')

    await manager.getByRole('button', {name: 'Alterar categoria de Banco editorial'}).click()
    const categorySelect = settings.getByRole('combobox', {name: 'Categoria'})
    await expect(categorySelect).toHaveValue('bancos')
    await expect(categorySelect).toContainText('Bancos exteriores')
    await categorySelect.selectOption('mesas')
    await expect(page.locator('.site-editor-top-save')).toContainText('Guardado')

    await page.getByRole('button', {name: 'Abrir páginas e conteúdo'}).click()
    await expect(
      navigation.getByRole('button', {name: /Bancos exteriores.*0 produtos/}),
    ).toBeVisible()
    await navigation.getByRole('button', {name: /Bancos exteriores.*0 produtos/}).click()
    await expect(settings.getByText('Nenhum produto está atualmente nesta categoria')).toBeVisible()
    await expect(settings.getByText('Mudança por publicar')).toBeVisible()
    await expect(settings.getByText('Existem mudanças por publicar')).toBeVisible()
    await expect(settings.getByRole('button', {name: 'Eliminar conteúdo'})).toHaveCount(0)

    await settings.getByRole('button', {name: /Abrir e publicar: Banco editorial/}).click()
    await expect(settings.getByRole('combobox', {name: 'Categoria'})).toHaveValue('mesas')
    await page.locator('.site-editor-publish-button').click()
    await expect(page.locator('.site-editor-notice')).toContainText('Alterações publicadas')

    await page.getByRole('button', {name: 'Abrir páginas e conteúdo'}).click()
    await navigation.getByRole('button', {name: /Bancos exteriores.*0 produtos/}).click()
    await expect(settings.getByText('Mudança por publicar')).toHaveCount(0)

    page.once('dialog', (dialog) => dialog.accept())
    await settings.getByRole('button', {name: 'Eliminar conteúdo'}).click()
    await expect(navigation.getByRole('button', {name: /Bancos exteriores/})).toHaveCount(0)
  })

  test('starts Content collapsed and keeps Loja categories in a clear two-panel flow', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Parallel drawers are verified once')
    await openEditor(page, testInfo)

    await expect(page.getByRole('link', {name: 'Voltar ao backoffice'})).toHaveAttribute(
      'href',
      '/painel/pedidos',
    )
    await page.getByRole('button', {name: 'Abrir páginas e conteúdo'}).click()
    const navigation = page.locator('.site-editor-drawer.is-navigation')
    await navigation.getByRole('tab', {name: 'Conteúdo'}).click()

    const collections = navigation.locator('.site-editor-tree-item.is-collection')
    await expect(collections).toHaveCount(3)
    for (let index = 0; index < (await collections.count()); index += 1) {
      await expect(collections.nth(index)).toHaveAttribute('aria-expanded', 'false')
    }
    await expect(navigation.getByRole('button', {name: /Bancos.*1 produto/})).toHaveCount(0)

    await expandCollection(navigation, /Categorias da Loja/)
    await navigation.getByRole('button', {name: /Bancos.*1 produto/}).click()

    const settings = page.locator('.site-editor-drawer.is-settings')
    await expect(navigation).toHaveClass(/is-open/)
    await expect(settings).toHaveClass(/is-open/)
    await expect(settings.locator('.site-editor-category-manager')).toBeVisible()

    await navigation.getByRole('button', {name: 'Fechar páginas e conteúdo'}).click()
    await expect(navigation).not.toHaveClass(/is-open/)
    await expect(settings).toHaveClass(/is-open/)
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
    await settings
      .locator('.site-editor-panel-index > button')
      .filter({hasText: 'Cabeçalho'})
      .click()
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

  test('rejects malformed structured articles before they can corrupt Portable Text', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Server guard runs once')
    await openEditor(page, testInfo)
    const csrfToken = (await page.context().cookies()).find(
      (cookie) => cookie.name === 'df4y_painel_csrf',
    )?.value
    expect(csrfToken).toBeTruthy()

    const result = await page.evaluate(async (token) => {
      const headers = {'content-type': 'application/json', 'x-csrf-token': token}
      const createResponse = await fetch('/painel/site/api', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          action: 'create',
          documentType: 'blogPost',
          title: `Artigo protegido ${Date.now()}`,
        }),
      })
      const created = (await createResponse.json()) as {document: Record<string, unknown>}
      const saveResponse = await fetch('/painel/site/api', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          document: {...created.document, article: {pt: 'estrutura perdida'}},
        }),
      })
      return {status: saveResponse.status, body: await saveResponse.text()}
    }, csrfToken!)

    expect(result.status).toBe(400)
    expect(result.body).toContain('perdeu a estrutura')
  })
})

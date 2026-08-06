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

/**
 * The outline appears in response to a mouseover, and Playwright moves the mouse
 * exactly once. Selecting a different document reloads the preview, and the
 * overlay element survives that reload with data-ready still reading true from
 * the previous page — so the readiness check can pass against the old overlay,
 * the single hover lands while the new one is arming, and no further event is
 * ever sent. The outline then never appears, no matter how long we wait.
 *
 * Hovering again inside a poll is what actually resolves it: a re-armed listener
 * gets a fresh event. This machine wins that race and CI does not, which is why
 * it read as flakiness rather than as a missing event.
 */
const hoverEditableTarget = async (frame: FrameLocator, target: Locator, label?: string) => {
  await waitForVisualEditor(frame)
  const outline = frame.locator('.site-editor-outline.is-hovered')

  await expect(async () => {
    await frame.locator('body').hover({position: {x: 1, y: 1}})
    await target.hover()
    await expect(outline).toBeVisible({timeout: 1_500})
  }).toPass({timeout: 20_000})

  if (label) await expect(outline.locator('span')).toHaveText(label)
}

const expandCollection = async (navigation: Locator, name: string | RegExp) => {
  const collection = navigation.getByRole('button', {name})
  await collection.evaluate((element) => {
    if (element.getAttribute('aria-expanded') === 'false') {
      ;(element as HTMLButtonElement).click()
    }
  })
  await expect(collection).toHaveAttribute('aria-expanded', 'true')
  return collection
}

const returnToPanelOverview = async (settings: Locator) => {
  const overview = settings.locator('.site-editor-panel-index')
  const back = settings.locator('.site-editor-panel-workspace-head > button')
  for (let depth = 0; depth < 3; depth += 1) {
    await expect
      .poll(async () => (await overview.isVisible()) || (await back.isVisible()))
      .toBe(true)
    if (await overview.isVisible()) return
    await back.click()
  }
  await expect(overview).toBeVisible()
}

const openCategoryNameField = async (settings: Locator) => {
  await returnToPanelOverview(settings)
  await settings
    .locator('.site-editor-panel-index > button')
    .filter({hasText: /^Categoria/})
    .click()
  await settings
    .locator('.site-editor-field-index > button')
    .filter({hasText: /^Nome da categoria/})
    .click()
  const field = settings.getByRole('textbox', {name: 'Nome da categoria'})
  await expect(field).toBeVisible()
  return field
}

const openCategoryProducts = async (settings: Locator) => {
  await returnToPanelOverview(settings)
  await settings
    .locator('.site-editor-panel-index > button')
    .filter({hasText: /^Produtos associados/})
    .click()
  const manager = settings.locator('.site-editor-category-manager')
  await expect(manager).toBeVisible()
  return manager
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

/**
 * Clicks an editable region in the preview until the settings drawer actually
 * responds. The click is the event that selects the field, and a click that lands
 * mid-reload is simply gone — retrying is the only thing that recovers it.
 */
const selectEditableTarget = async (page: Page, target: Locator, settings: Locator) => {
  await expect(async () => {
    await target.click({position: {x: 8, y: 8}})
    await expect(settings.getByRole('button', {name: 'Editar artigo'})).toBeVisible({
      timeout: 2_000,
    })
  }).toPass({timeout: 25_000})
}

const openArticleWorkspace = async (page: Page, settings: Locator) => {
  const launcher = settings.getByRole('button', {name: 'Editar artigo'})
  // Same one-shot problem as the hover above: the click that selects the field in
  // the preview can land while the overlay is re-arming after a document switch,
  // and a lost click means this launcher never appears. Waiting longer cannot
  // help — only sending the click again can, which the caller does by polling.
  await expect(launcher).toBeVisible({timeout: 15_000})
  await launcher.click()
  const workspace = page.locator('.site-editor-article-workspace')
  await expect(workspace).toBeVisible()
  await expect(workspace).toHaveAttribute('role', 'dialog')
  return {launcher, workspace}
}

test.describe('visual website editor', () => {
  test('keeps a read-only session consistently non-editable in the shell and preview', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Read-only capability runs once')
    const scope = `readonly-${Date.now()}`
    await page.setExtraHTTPHeaders({
      'x-df4y-site-editor-e2e': e2eKey,
      'x-df4y-site-editor-scope': scope,
    })
    await page.route('https://cdn.sanity.io/**', (route) =>
      route.fulfill({status: 200, contentType: 'image/png', body: tinyPng}),
    )
    await page.route('**/painel/site/api', async (route) => {
      const requestUrl = new URL(route.request().url())
      if (route.request().method() !== 'GET' || requestUrl.searchParams.has('document')) {
        await route.continue()
        return
      }
      const response = await route.fetch()
      const manifest = await response.json()
      manifest.capabilities = {
        ...manifest.capabilities,
        canWrite: false,
        canPublish: false,
      }
      await route.fulfill({response, json: manifest})
    })

    await page.goto('/painel/site')
    await expect(page.locator('.site-editor-shell')).toBeVisible({timeout: 15_000})
    const frame = frameFor(page)
    const heading = frame.getByTestId('fixture-hero-title')
    await expect(heading).toBeVisible()
    await waitForVisualEditor(frame)

    await expect(page.locator('.site-editor-publish-button')).toBeDisabled()
    await hoverEditableTarget(frame, heading, 'Ver campo')
    await heading.click()
    await expect(heading).not.toHaveAttribute('contenteditable')

    const settings = page.locator('.site-editor-drawer.is-settings')
    await expect(settings.getByText('Editor em modo de leitura')).toBeVisible()
    await page.getByRole('button', {name: 'Abrir páginas e conteúdo'}).click()
    const navigation = page.locator('.site-editor-drawer.is-navigation')
    await navigation.getByRole('tab', {name: 'Conteúdo'}).click()
    await expect(navigation.getByRole('button', {name: 'Novo conteúdo'})).toHaveCount(0)
    await expect(navigation.locator('.site-editor-tree-add')).toHaveCount(0)
  })

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

    await settings.getByRole('button', {name: 'Formatação'}).click()
    const font = settings.getByRole('combobox', {name: 'Fonte'})
    await font.selectOption('georgia')
    await expect(heading).toHaveCSS('font-family', /Georgia/)
    const viewportName = testInfo.project.name === 'mobile-chrome' ? 'telemóvel' : 'computador'
    const fontSize = settings.getByRole('spinbutton', {name: `Tamanho no ${viewportName}`})
    await fontSize.fill('64')
    await expect(heading).toHaveCSS('font-size', '64px')
    await settings.getByRole('button', {name: 'Itálico', exact: true}).click()
    await settings.getByRole('combobox', {name: 'Alinhamento', exact: true}).selectOption('center')
    await settings
      .getByRole('combobox', {name: 'Espaço entre linhas', exact: true})
      .selectOption('relaxed')
    await expect(heading).toHaveCSS('font-style', 'italic')
    await expect(heading).toHaveCSS('text-align', 'center')
    await expect.poll(() => heading.evaluate((element) => element.style.lineHeight)).toBe('1.8')
    await expect(page.locator('.site-editor-top-save')).toContainText('Guardado')
    await expect(heading).toHaveCSS('font-family', /Georgia/)
    await expect(heading).toHaveCSS('font-size', '64px')
    await expect(heading).toHaveCSS('font-style', 'italic')
    await expect(heading).toHaveCSS('text-align', 'center')
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
    await page.route('**/painel/site/api', async (route) => {
      const request = route.request()
      if (request.method() === 'POST' && request.postData()?.includes('"action":"publish"')) {
        await new Promise((resolve) => setTimeout(resolve, 250))
      }
      await route.continue()
    })
    await page.locator('.site-editor-publish-button').click()
    await expect(page.locator('.site-editor-publish-button')).toContainText('A publicar…')
    await expect(page.locator('.site-editor-notice')).toContainText('Português publicado')
    await expect(page.locator('.site-editor-notice')).toContainText(
      'A versão em português já está online. Inglês e espanhol são atualizados automaticamente e podem demorar alguns minutos.',
    )
    await expect(frame.locator('html')).toHaveAttribute(
      'data-site-editor-fixture-boot',
      initialBootId!,
    )
    await page.getByRole('button', {name: 'Fechar notificação'}).click()
    await expect(page.locator('.site-editor-notice')).toHaveClass(/is-closing/)
    await expect(page.locator('.site-editor-notice')).toHaveCount(0)

    const publishedPreviewUrl = new URL(savedPreviewUrl)
    publishedPreviewUrl.searchParams.set('published', '1')
    await page.goto(publishedPreviewUrl.toString())
    const savedHeading = page.getByTestId('fixture-hero-title')
    await expect(savedHeading).toHaveText('Título final guardado pelo editor')
    await expect(savedHeading).toHaveCSS('font-family', /Georgia/)
    await expect(savedHeading).toHaveCSS('font-size', '64px')
    await expect(savedHeading).toHaveCSS('font-style', 'italic')
    await expect(savedHeading).toHaveCSS('text-align', 'center')
    await expect.poll(() => savedHeading.evaluate((element) => element.style.lineHeight)).toBe('1.8')
  })

  test('keeps a newer edit when it is made while publishing', async ({page}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Publish concurrency runs once')
    const frame = await openEditor(page, testInfo)
    const heading = frame.getByTestId('fixture-hero-title')

    await heading.click()
    await heading.fill('Versão enviada para publicação')
    await heading.press('Enter')
    await expect(page.locator('.site-editor-top-save')).toContainText('Guardado')

    let publishRequestSeen = false
    await page.route('**/painel/site/api', async (route) => {
      const request = route.request()
      if (request.method() === 'POST' && request.postData()?.includes('"action":"publish"')) {
        publishRequestSeen = true
        await new Promise((resolve) => setTimeout(resolve, 1200))
      }
      await route.continue()
    })

    await page.locator('.site-editor-publish-button').click()
    await expect.poll(() => publishRequestSeen).toBe(true)
    await heading.click()
    await heading.fill('Alteração mais recente preservada')
    await heading.press('Enter')

    await expect(page.locator('.site-editor-notice')).toContainText('Português publicado')
    await expect(page.locator('.site-editor-top-save')).toContainText('Guardado')
    await expect(heading).toHaveText('Alteração mais recente preservada')
  })

  test('never lets an older autosave refresh roll back a newer text edit', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Autosave concurrency runs once')
    const frame = await openEditor(page, testInfo)
    const heading = frame.getByTestId('fixture-hero-title')

    await heading.click()
    await frame.locator('.site-editor-inline-more').click()
    const settings = page.locator('.site-editor-drawer.is-settings')
    const input = settings.locator('.site-editor-focused-field textarea')
    await input.fill('Base estável do título')
    await expect(page.locator('.site-editor-top-save')).toContainText('Alterações por guardar')
    await expect(page.locator('.site-editor-top-save')).toContainText('Guardado automaticamente')

    await frame.locator('body').evaluate((body) => {
      const states: string[] = []
      const read = () => {
        const value = body.querySelector('[data-testid="fixture-hero-title"]')?.textContent?.trim()
        if (value && states.at(-1) !== value) states.push(value)
      }
      read()
      const observer = new MutationObserver(read)
      observer.observe(body, {childList: true, characterData: true, subtree: true})
      ;(window as any).__df4yRapidTextStates = states
      ;(window as any).__df4yRapidTextObserver = observer
    })

    let releaseFirstSave: (() => void) | undefined
    const firstSaveGate = new Promise<void>((resolve) => {
      releaseFirstSave = resolve
    })
    let firstSaveSeen = false
    await page.route('**/painel/site/api', async (route) => {
      if (route.request().method() === 'PUT' && !firstSaveSeen) {
        firstSaveSeen = true
        await firstSaveGate
      }
      await route.continue()
    })

    await input.fill('Versão intermédia ainda a guardar')
    await expect.poll(() => firstSaveSeen).toBe(true)
    await input.fill('Versão final que nunca pode recuar')
    await expect(heading).toHaveText('Versão final que nunca pode recuar')
    releaseFirstSave?.()

    await expect(page.locator('.site-editor-top-save')).toContainText('Guardado automaticamente')
    await page.waitForTimeout(900)
    await expect(input).toHaveValue('Versão final que nunca pode recuar')
    await expect(heading).toHaveText('Versão final que nunca pode recuar')
    const states = await frame.locator('body').evaluate(() => {
      ;(window as any).__df4yRapidTextObserver?.disconnect()
      return (window as any).__df4yRapidTextStates as string[]
    })
    const finalIndex = states.indexOf('Versão final que nunca pode recuar')
    expect(finalIndex).toBeGreaterThanOrEqual(0)
    expect(states.slice(finalIndex + 1)).not.toContain('Versão intermédia ainda a guardar')
  })

  test('never lets an older product save replace newer section content', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Product autosave concurrency runs once')
    test.setTimeout(45_000)
    const frame = await openEditor(page, testInfo)

    await page.getByRole('button', {name: 'Abrir páginas e conteúdo'}).click()
    const navigation = page.locator('.site-editor-drawer.is-navigation')
    await navigation.getByRole('tab', {name: 'Conteúdo'}).click()
    await navigation.getByRole('button', {name: 'Novo conteúdo'}).click()
    const modal = page.locator('.site-editor-modal')
    await modal.getByRole('button', {name: 'Produto', exact: true}).click()
    await modal.getByLabel('Nome').fill('Produto com autosave concorrente')
    await modal.getByRole('button', {name: 'Criar e editar'}).click()
    await expect(modal).toHaveCount(0)
    await expect(frame.getByTestId('fixture-created-page')).toBeVisible()

    const documentId = await frame
      .locator('html')
      .evaluate(() => new URL(window.location.href).searchParams.get('document'))
    expect(documentId).toBeTruthy()
    await page.keyboard.press('Escape')
    await page.getByRole('button', {name: 'Abrir definições'}).click()
    const settings = page.locator('.site-editor-drawer.is-settings')
    await settings
      .locator('.site-editor-panel-index > button')
      .filter({hasText: 'Conteúdo da página'})
      .click()
    await settings.getByRole('button', {name: 'Adicionar secção'}).click()
    await settings.getByRole('button', {name: /Chamada para ação/}).click()
    const title = settings.locator('.site-page-editor-group.is-open textarea').first()
    await title.fill('Secção estável antes da corrida')
    await expect(page.locator('.site-editor-top-save')).toContainText('Alterações por guardar')
    await expect(page.locator('.site-editor-top-save')).toContainText('Guardado automaticamente')
    const appearance = settings.locator('details.is-appearance')
    await appearance.locator(':scope > summary').click()
    const titleOptions = appearance
      .locator('details.site-page-subdetails')
      .filter({hasText: /^Título/})
    await titleOptions.locator('summary').click()
    const alignment = titleOptions.getByRole('group', {name: 'Alinhamento'})

    let releaseFirstSave: (() => void) | undefined
    const firstSaveGate = new Promise<void>((resolve) => {
      releaseFirstSave = resolve
    })
    let firstSaveSeen = false
    await page.route('**/painel/site/api', async (route) => {
      if (route.request().method() === 'PUT' && !firstSaveSeen) {
        firstSaveSeen = true
        await firstSaveGate
      }
      await route.continue()
    })

    await title.fill('Secção intermédia ainda a guardar')
    await alignment.getByRole('button', {name: 'Centro', exact: true}).click()
    await expect.poll(() => firstSaveSeen).toBe(true)
    await title.fill('Secção final preservada')
    await alignment.getByRole('button', {name: 'Direita', exact: true}).click()
    const previewTitle = frame.getByText('Secção final preservada', {exact: true})
    await expect(previewTitle).toBeVisible()
    await expect(previewTitle).toHaveCSS('text-align', 'right')
    releaseFirstSave?.()

    await expect(page.locator('.site-editor-top-save')).toContainText('Guardado automaticamente')
    await page.waitForTimeout(900)
    await expect(title).toHaveValue('Secção final preservada')
    await expect(previewTitle).toBeVisible()
    await expect(previewTitle).toHaveCSS('text-align', 'right')
    await expect
      .poll(() =>
        page.evaluate(async (id) => {
          const response = await fetch(`/painel/site/api?document=${encodeURIComponent(id)}`)
          const payload = (await response.json()) as {
            document?: {
              sections?: Array<{
                _type?: string
                title?: {pt?: string}
                titleStyle?: {align?: string}
              }>
            }
          }
          const section = payload.document?.sections?.find(
            (section) => section._type === 'builderCtaSection',
          )
          return {title: section?.title?.pt, alignment: section?.titleStyle?.align}
        }, documentId!),
      )
      .toEqual({title: 'Secção final preservada', alignment: 'right'})
  })

  test('finishes publishing before opening a different document', async ({page}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Publish navigation race runs once')
    await openEditor(page, testInfo)

    let releasePublish: (() => void) | undefined
    const publishGate = new Promise<void>((resolve) => {
      releasePublish = resolve
    })
    let publishRequestSeen = false
    await page.route('**/painel/site/api', async (route) => {
      const request = route.request()
      if (request.method() === 'POST' && request.postData()?.includes('"action":"publish"')) {
        publishRequestSeen = true
        await publishGate
      }
      await route.continue()
    })

    await page.locator('.site-editor-publish-button').click()
    await expect.poll(() => publishRequestSeen).toBe(true)

    const navigation = page.locator('.site-editor-drawer.is-navigation')
    await page.getByRole('button', {name: 'Abrir páginas e conteúdo'}).click()
    await navigation.getByRole('tab', {name: 'Conteúdo'}).click()
    await expandCollection(navigation, /Categorias da Loja/)
    await navigation.getByRole('button', {name: /Bancos.*1 produto/}).click()

    await expect(page.locator('.site-editor-context')).toContainText('Página inicial')
    releasePublish?.()
    const settings = page.locator('.site-editor-drawer.is-settings')
    await expect(settings.locator('.site-editor-panel-index')).toBeVisible()
    await expect(page.locator('.site-editor-context')).toContainText('Bancos')
    await openCategoryProducts(settings)
    await page.waitForTimeout(250)
    await expect(page.locator('.site-editor-context')).toContainText('Bancos')
  })

  test('flushes a pending edit instead of losing it when switching documents mid-debounce', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Autosave flush runs once')
    await openEditor(page, testInfo)

    const navigation = page.locator('.site-editor-drawer.is-navigation')
    const settings = page.locator('.site-editor-drawer.is-settings')
    await page.getByRole('button', {name: 'Abrir páginas e conteúdo'}).click()
    await navigation.getByRole('tab', {name: 'Conteúdo'}).click()
    await expandCollection(navigation, /Categorias da Loja/)
    await navigation.getByRole('button', {name: /Bancos.*1 produto/}).click()

    await expect(settings).toHaveClass(/is-open/)
    const nameField = await openCategoryNameField(settings)
    await nameField.fill('Bancos urgentes')

    // Switch to a different document immediately — well inside the 650ms autosave
    // debounce window — instead of waiting for "Guardado" like every other test.
    await page.getByRole('button', {name: 'Abrir páginas e conteúdo'}).click()
    await navigation.getByRole('tab', {name: 'Páginas'}).click()
    await navigation.getByRole('button', {name: 'Página inicial'}).click()
    await expect(settings.locator('.site-editor-inspector-title')).toContainText('Página inicial')

    // Switch back and confirm the rename was flushed rather than silently discarded.
    await page.getByRole('button', {name: 'Abrir páginas e conteúdo'}).click()
    await navigation.getByRole('tab', {name: 'Conteúdo'}).click()
    await expandCollection(navigation, /Categorias da Loja/)
    await navigation.getByRole('button', {name: /Bancos urgentes/}).click()
    await expect(await openCategoryNameField(settings)).toHaveValue('Bancos urgentes')
  })

  test('keeps the current document open when its pending edit cannot be saved', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Save failure workflow runs once')
    await openEditor(page, testInfo)

    const navigation = page.locator('.site-editor-drawer.is-navigation')
    const settings = page.locator('.site-editor-drawer.is-settings')
    await page.getByRole('button', {name: 'Abrir páginas e conteúdo'}).click()
    await navigation.getByRole('tab', {name: 'Conteúdo'}).click()
    await expandCollection(navigation, /Categorias da Loja/)
    await navigation.getByRole('button', {name: /Bancos.*1 produto/}).click()

    const nameField = await openCategoryNameField(settings)
    let rejectedSave = false
    await page.route('**/painel/site/api', async (route) => {
      if (route.request().method() === 'PUT' && !rejectedSave) {
        rejectedSave = true
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({message: 'Falha simulada ao guardar'}),
        })
        return
      }
      await route.continue()
    })

    await nameField.fill('Bancos ainda por guardar')
    await navigation.getByRole('tab', {name: 'Páginas'}).click()
    await navigation.getByRole('button', {name: 'Página inicial'}).click()

    await expect.poll(() => rejectedSave).toBe(true)
    await expect(nameField).toHaveValue('Bancos ainda por guardar')
    await expect(page.locator('.site-editor-context')).toContainText('Bancos')
    await expect(page.locator('.site-editor-notice')).toContainText('Não foi possível guardar')
  })

  test('recovers from an edit conflict without reloading the whole editor', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Conflict recovery runs once')
    await openEditor(page, testInfo)

    const navigation = page.locator('.site-editor-drawer.is-navigation')
    const settings = page.locator('.site-editor-drawer.is-settings')
    await page.getByRole('button', {name: 'Abrir páginas e conteúdo'}).click()
    await navigation.getByRole('tab', {name: 'Conteúdo'}).click()
    await expandCollection(navigation, /Categorias da Loja/)
    await navigation.getByRole('button', {name: /Bancos.*1 produto/}).click()

    const nameField = await openCategoryNameField(settings)
    await page.route('**/painel/site/api', async (route) => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Este conteúdo foi alterado noutra janela. Recarregue antes de continuar.',
          }),
        })
        return
      }
      await route.continue()
    })

    await nameField.fill('Nome local em conflito')
    const notice = page.locator('.site-editor-notice')
    await expect(notice).toContainText('editado noutra janela')
    await notice.getByRole('button', {name: 'Resolver conflito'}).click()

    const dialog = page.getByRole('alertdialog')
    await expect(dialog).toContainText('Carregar a versão mais recente?')
    await dialog.getByRole('button', {name: 'Carregar versão'}).click()

    await expect(dialog).toHaveCount(0)
    await expect(nameField).toHaveValue('Bancos')
    await expect(page.locator('.site-editor-top-save')).toContainText('Tudo guardado')
    await expect(page.locator('.site-editor-notice')).toContainText('Versão mais recente carregada')
  })

  test('keeps the latest selection when two documents load out of order', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Document race workflow runs once')
    await openEditor(page, testInfo)

    const navigation = page.locator('.site-editor-drawer.is-navigation')
    const settings = page.locator('.site-editor-drawer.is-settings')
    await page.getByRole('button', {name: 'Abrir páginas e conteúdo'}).click()
    await navigation.getByRole('tab', {name: 'Conteúdo'}).click()
    await expandCollection(navigation, /Categorias da Loja/)
    await expandCollection(navigation, /Produtos da Loja/)

    let documentReads = 0
    await page.route('**/painel/site/api**', async (route) => {
      const requestUrl = new URL(route.request().url())
      if (route.request().method() === 'GET' && requestUrl.searchParams.has('document')) {
        documentReads += 1
        if (documentReads === 1) await new Promise((resolve) => setTimeout(resolve, 500))
      }
      await route.continue()
    })

    await navigation.getByRole('button', {name: /Bancos.*1 produto/}).click()
    await navigation.getByRole('button', {name: /Banco editorial/}).click()

    await expect(settings.locator('.site-editor-inspector-title')).toContainText('Banco editorial')
    await expect.poll(() => documentReads).toBe(2)
    await page.waitForTimeout(550)
    await expect(settings.locator('.site-editor-inspector-title')).toContainText('Banco editorial')
    await expect(page.locator('.site-editor-context')).toContainText('Banco editorial')
  })

  test('saves a discrete choice immediately instead of waiting for the typing debounce', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Immediate choice save runs once')
    await openEditor(page, testInfo)

    const navigation = page.locator('.site-editor-drawer.is-navigation')
    await page.getByRole('button', {name: 'Abrir páginas e conteúdo'}).click()
    await navigation.getByRole('tab', {name: 'Conteúdo'}).click()
    await expandCollection(navigation, /Produtos da Loja/)
    await navigation.getByRole('button', {name: /Banco editorial/}).click()
    await page.getByRole('button', {name: 'Abrir definições'}).click()

    const settings = page.locator('.site-editor-drawer.is-settings')
    await settings
      .locator('.site-editor-panel-index > button')
      .filter({hasText: 'Opções, pesos e preços'})
      .click()
    await settings
      .locator('.site-editor-field-index > button')
      .filter({hasText: 'Permitir escolha de acabamento'})
      .click()

    let saveStartedAt = 0
    await page.route('**/painel/site/api', async (route) => {
      if (route.request().method() === 'PUT' && !saveStartedAt) saveStartedAt = Date.now()
      await route.continue()
    })
    const changedAt = Date.now()
    await settings.getByRole('switch', {name: 'Permitir escolha de acabamento'}).click()

    await expect
      .poll(() => (saveStartedAt ? saveStartedAt - changedAt : Number.POSITIVE_INFINITY), {
        timeout: 500,
      })
      .toBeLessThan(500)
    await expect(page.locator('.site-editor-top-save')).toContainText('Guardado')
  })

  test('serializes several rapid right-panel choices behind one in-flight save', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Immediate save queue runs once')
    await openEditor(page, testInfo)

    const navigation = page.locator('.site-editor-drawer.is-navigation')
    await page.getByRole('button', {name: 'Abrir páginas e conteúdo'}).click()
    await navigation.getByRole('tab', {name: 'Conteúdo'}).click()
    await expandCollection(navigation, /Produtos da Loja/)
    await navigation.getByRole('button', {name: /Banco editorial/}).click()
    await page.getByRole('button', {name: 'Abrir definições'}).click()

    const settings = page.locator('.site-editor-drawer.is-settings')
    await settings
      .locator('.site-editor-panel-index > button')
      .filter({hasText: 'Opções, pesos e preços'})
      .click()
    await settings
      .locator('.site-editor-field-index > button')
      .filter({hasText: 'Permitir escolha de acabamento'})
      .click()
    const finishChoice = settings.getByRole('switch', {
      name: 'Permitir escolha de acabamento',
    })
    await expect(finishChoice).toBeChecked()

    let releaseFirstSave: (() => void) | undefined
    const firstSaveGate = new Promise<void>((resolve) => {
      releaseFirstSave = resolve
    })
    let firstSaveSeen = false
    await page.route('**/painel/site/api', async (route) => {
      if (route.request().method() === 'PUT' && !firstSaveSeen) {
        firstSaveSeen = true
        await firstSaveGate
      }
      await route.continue()
    })

    await finishChoice.click()
    await expect.poll(() => firstSaveSeen).toBe(true)
    await finishChoice.click()
    await finishChoice.click()
    await expect(finishChoice).not.toBeChecked()
    releaseFirstSave?.()

    await expect(page.locator('.site-editor-top-save')).toContainText('Guardado automaticamente')
    await expect(
      page.locator('.site-editor-notice').filter({hasText: 'editado noutra janela'}),
    ).toHaveCount(0)
    await expect
      .poll(() =>
        page.evaluate(async () => {
          const response = await fetch('/painel/site/api?document=storeProduct.editor-fixture')
          const payload = (await response.json()) as {document?: {hasFinishChoice?: boolean}}
          return payload.document?.hasFinishChoice
        }),
      )
      .toBe(false)
  })

  test('creates reusable sections on fixed and detail pages without losing live preview', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Section creation workflow runs once')
    test.setTimeout(35_000)
    const pageErrors: string[] = []
    page.on('pageerror', (error) => pageErrors.push(error.message))
    const frame = await openEditor(page, testInfo)

    await page.getByRole('button', {name: 'Abrir definições'}).click()
    const settings = page.locator('.site-editor-drawer.is-settings')
    await settings
      .locator('.site-editor-panel-index > button')
      .filter({hasText: 'Conteúdo da página'})
      .click()
    // The designed block is an anchor in the same ordered stream. It remains
    // edited through its canonical fields, while the section list owns its
    // position and visibility alongside the four authored blocks.
    await expect(
      settings.locator('.site-editor-section-list > article').filter({hasText: 'Topo da página'}),
    ).toHaveCount(1)
    await expect(settings.locator('.site-editor-section-list > article')).toHaveCount(5)
    await expect(frame.locator('.builder-render-section')).toHaveCount(4)

    await settings.getByRole('button', {name: 'Adicionar secção'}).click()
    await expect(settings.getByText('Abrir a página', {exact: true})).toBeVisible()
    await expect(settings.getByText('Explicar e mostrar', {exact: true})).toBeVisible()
    await expect(settings.getByText('Concluir', {exact: true})).toBeVisible()
    await settings.getByRole('button', {name: /Chamada para ação/}).click()
    await expect(frame.locator('.builder-render-section')).toHaveCount(5)
    await expect(frame.getByRole('link', {name: 'Falar connosco'}).last()).toBeVisible()
    await settings
      .locator('.site-page-editor-group.is-open textarea')
      .first()
      .fill('Uma chamada criada sem sair da página')
    await expect(
      frame.getByText('Uma chamada criada sem sair da página', {exact: true}),
    ).toBeVisible()
    await settings.getByText('Botões', {exact: true}).click()
    await settings.getByRole('button', {name: 'Adicionar botão'}).click()
    const action = settings.locator('.site-page-action-row').last()
    await action.locator('input').nth(0).fill('Abrir contacto')
    await action.locator('input').nth(1).fill('/contacto')
    await expect(frame.getByRole('link', {name: 'Abrir contacto'})).toHaveCount(1)
    await expect(page.locator('.site-editor-top-save')).toContainText('Guardado')

    await settings.getByRole('button', {name: /Voltar ao conteúdo/}).click()
    const addedRow = settings
      .locator('.site-editor-section-list > article')
      .filter({hasText: 'Chamada para ação'})
      .last()
    await addedRow.getByRole('button', {name: /Ações de Chamada para ação/}).click()
    await addedRow.getByRole('button', {name: 'Ocultar do site'}).click()
    await expect(addedRow.getByText('Oculta', {exact: true})).toBeVisible()
    await expect(frame.getByText('Oculta no site', {exact: true})).toBeVisible()

    await addedRow.getByRole('button', {name: /Ações de Chamada para ação/}).click()
    await addedRow.getByRole('button', {name: 'Mostrar no site'}).click()
    await expect(addedRow.getByText('Oculta', {exact: true})).toHaveCount(0)
    await expect(frame.getByText('Oculta no site', {exact: true})).toHaveCount(0)
    await expect(
      frame.getByText('Uma chamada criada sem sair da página', {exact: true}),
    ).toBeVisible()

    await addedRow.getByRole('button', {name: /Ações de Chamada para ação/}).click()
    await addedRow.getByRole('button', {name: 'Duplicar'}).click()
    await settings.getByRole('button', {name: /Voltar ao conteúdo/}).click()
    const cloneRow = settings
      .locator('.site-editor-section-list > article')
      .filter({hasText: 'Chamada para ação (cópia)'})
    await expect(cloneRow).toHaveCount(1)
    const cloneIndexBefore = await settings
      .locator('.site-editor-section-list > article')
      .allTextContents()
      .then((rows) => rows.findIndex((row) => row.includes('Chamada para ação (cópia)')))
    await cloneRow.getByRole('button', {name: /Ações de Chamada para ação \(cópia\)/}).click()
    await cloneRow.getByRole('button', {name: 'Mover para cima'}).click()
    const cloneIndexAfter = await settings
      .locator('.site-editor-section-list > article')
      .allTextContents()
      .then((rows) => rows.findIndex((row) => row.includes('Chamada para ação (cópia)')))
    expect(cloneIndexAfter).toBe(cloneIndexBefore - 1)

    await cloneRow.getByRole('button', {name: /Ações de Chamada para ação \(cópia\)/}).click()
    await cloneRow.getByRole('button', {name: 'Eliminar'}).click()
    await page.getByRole('alertdialog').getByRole('button', {name: 'Eliminar', exact: true}).click()
    await expect(cloneRow).toHaveCount(0)
    await page.getByRole('button', {name: 'Desfazer'}).click()
    await expect(cloneRow).toHaveCount(1)

    await page.getByRole('button', {name: 'Abrir páginas e conteúdo'}).click()
    const navigation = page.locator('.site-editor-drawer.is-navigation')
    await navigation.getByRole('tab', {name: 'Conteúdo'}).click()
    await expandCollection(navigation, /Produtos da Loja/)
    await navigation.getByRole('button', {name: /Banco editorial/}).click()
    await page.getByRole('button', {name: 'Abrir definições'}).click()
    await settings
      .locator('.site-editor-panel-index > button')
      .filter({hasText: 'Conteúdo da página'})
      .click()
    await settings.getByRole('button', {name: 'Adicionar secção'}).click()
    await settings.getByRole('button', {name: /Chamada para ação/}).click()
    await settings
      .locator('.site-page-editor-group.is-open textarea')
      .first()
      .fill('Conteúdo da página do produto')
    await expect(frame.getByText('Conteúdo da página do produto', {exact: true})).toBeVisible()
    await expect(page.locator('.site-editor-top-save')).toContainText('Guardado')
    expect(pageErrors, pageErrors.join('\n')).toEqual([])
  })

  test('anchors the designed product area and presets new product media sections', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Product composition workflow runs once')
    test.setTimeout(45_000)
    const frame = await openEditor(page, testInfo)

    await page.getByRole('button', {name: 'Abrir páginas e conteúdo'}).click()
    const navigation = page.locator('.site-editor-drawer.is-navigation')
    await navigation.getByRole('tab', {name: 'Conteúdo'}).click()
    await navigation.getByRole('button', {name: 'Novo conteúdo'}).click()
    const modal = page.locator('.site-editor-modal')
    await modal.getByRole('button', {name: 'Produto', exact: true}).click()
    await modal.getByLabel('Nome').fill('Produto com composição editorial')
    await modal.getByRole('button', {name: 'Criar e editar'}).click()
    await expect(modal).toHaveCount(0)
    await expect(frame.getByTestId('fixture-created-page')).toBeVisible()

    const documentId = await frame
      .locator('html')
      .evaluate(() => new URL(window.location.href).searchParams.get('document'))
    expect(documentId).toBeTruthy()

    await page.keyboard.press('Escape')
    await expect(navigation).not.toHaveClass(/is-open/)
    await page.getByRole('button', {name: 'Abrir definições'}).click()
    const settings = page.locator('.site-editor-drawer.is-settings')
    await settings
      .locator('.site-editor-panel-index > button')
      .filter({hasText: 'Conteúdo da página'})
      .click()

    const rows = settings.locator('.site-editor-section-list > article')
    const managedRow = rows.filter({hasText: 'Conteúdo atual da página'})
    await expect(rows).toHaveCount(1)
    await expect(managedRow).toHaveCount(1)

    await settings.getByRole('button', {name: 'Adicionar secção'}).click()
    await settings.getByRole('button', {name: /Texto com imagem ou vídeo/}).click()
    await settings.getByRole('button', {name: /Voltar ao conteúdo/}).click()

    const featureRow = rows.filter({hasText: 'Secção do produto'})
    await expect(rows).toHaveCount(2)
    await expect(featureRow).toHaveCount(1)
    await expect(page.locator('.site-editor-top-save')).toContainText('Guardado')

    await expect
      .poll(async () => {
        return page.evaluate(async (id) => {
          const response = await fetch(`/painel/site/api?document=${encodeURIComponent(id)}`)
          const payload = (await response.json()) as {
            document?: {active?: boolean; sections?: Array<Record<string, unknown>>}
          }
          return {
            active: payload.document?.active,
            sections: payload.document?.sections ?? [],
          }
        }, documentId!)
      })
      .toMatchObject({
        active: false,
        sections: [
          {_type: 'builderManagedSection', component: 'productDetailCore'},
          {
            _type: 'builderMediaSection',
            variant: 'product-feature',
            mediaSide: 'left',
            layout: {width: 'full', surface: 'white'},
          },
        ],
      })

    await featureRow.getByRole('button', {name: /Ações de Secção do produto/}).click()
    await featureRow.getByRole('button', {name: 'Mover para cima'}).click()
    await expect(rows.nth(0)).toContainText('Secção do produto')

    await featureRow.getByRole('button', {name: /Ações de Secção do produto/}).click()
    await featureRow.getByRole('button', {name: 'Mover para baixo'}).click()
    await expect(rows.nth(0)).toContainText('Conteúdo atual da página')

    await managedRow.locator('.site-editor-section-main').click()
    await expect(settings.locator('.site-editor-panel-workspace-head strong')).toHaveText(
      'Conteúdo',
    )
    await settings
      .locator('.site-editor-field-index > button')
      .filter({hasText: 'Nome do produto'})
      .click()
    await expect(settings.getByRole('textbox', {name: 'Nome do produto'})).toBeVisible()
  })

  test('previews and publishes product-section title font and size from the appearance controls', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Product typography workflow runs once')
    test.setTimeout(60_000)
    const frame = await openEditor(page, testInfo)

    await page.getByRole('button', {name: 'Abrir páginas e conteúdo'}).click()
    const navigation = page.locator('.site-editor-drawer.is-navigation')
    await navigation.getByRole('tab', {name: 'Conteúdo'}).click()
    await navigation.getByRole('button', {name: 'Novo conteúdo'}).click()
    const modal = page.locator('.site-editor-modal')
    await modal.getByRole('button', {name: 'Produto', exact: true}).click()
    await modal.getByLabel('Nome').fill('Produto com tipografia publicada')
    await modal.getByRole('button', {name: 'Criar e editar'}).click()
    await expect(modal).toHaveCount(0)
    await expect(frame.getByTestId('fixture-created-page')).toBeVisible()

    const documentId = await frame
      .locator('html')
      .evaluate(() => new URL(window.location.href).searchParams.get('document'))
    expect(documentId).toBeTruthy()

    await page.keyboard.press('Escape')
    await page.getByRole('button', {name: 'Abrir definições'}).click()
    const settings = page.locator('.site-editor-drawer.is-settings')
    await settings
      .locator('.site-editor-panel-index > button')
      .filter({hasText: 'Conteúdo da página'})
      .click()
    await settings.getByRole('button', {name: 'Adicionar secção'}).click()
    await settings.getByRole('button', {name: /Texto com imagem ou vídeo/}).click()
    await settings.getByLabel('Título').fill('Tipografia real do produto')
    await settings.locator('.site-page-media-upload input[accept="image/*"]').first().setInputFiles({
      name: 'produto-tipografia.png',
      mimeType: 'image/png',
      buffer: tinyPng,
    })
    await expect(settings.getByRole('status', {name: /Ficheiro pronto/})).toBeVisible()

    const appearance = settings.locator('details.is-appearance')
    await appearance.locator(':scope > summary').click()
    const titleOptions = appearance
      .locator('details.site-page-subdetails')
      .filter({hasText: /^Título/})
    await titleOptions.locator('summary').click()
    await titleOptions.getByRole('combobox', {name: 'Fonte', exact: true}).selectOption('georgia')
    await titleOptions
      .getByRole('group', {name: 'Tamanho'})
      .getByRole('button', {name: 'Destaque', exact: true})
      .click()

    const title = frame.locator('.product-content-copy h2').filter({hasText: 'Tipografia real do produto'})
    await expect(title).toBeVisible()
    await expect(title).toHaveCSS('font-family', /Georgia/)
    await expect(title).toHaveCSS('font-size', '80px')
    await expect(page.locator('.site-editor-top-save')).toContainText('Guardado automaticamente')
    await expect
      .poll(() =>
        page.evaluate(async (id) => {
          const response = await fetch(`/painel/site/api?document=${encodeURIComponent(id)}`)
          const payload = (await response.json()) as {
            document?: {
              sections?: Array<{
                title?: {pt?: string}
                titleStyle?: {fontFamily?: string; fontSize?: {desktop?: number}}
              }>
            }
          }
          const section = payload.document?.sections?.find(
            (candidate) => candidate.title?.pt === 'Tipografia real do produto',
          )
          return {
            family: section?.titleStyle?.fontFamily,
            size: section?.titleStyle?.fontSize?.desktop,
          }
        }, documentId!),
      )
      .toEqual({family: 'georgia', size: 80})

    await page.getByRole('button', {name: 'Publicar', exact: true}).click()
    await expect(page.locator('.site-editor-notice')).toContainText('Português publicado')
    await expect(page.locator('.site-editor-publish-button')).toContainText('Publicado em PT')
    await page.goto(
      `/painel/site/e2e-preview?fixture=created&document=${encodeURIComponent(documentId!)}&published=1&lang=pt`,
    )
    const publishedTitle = page
      .locator('.product-content-copy h2')
      .filter({hasText: 'Tipografia real do produto'})
    await expect(publishedTitle).toBeVisible()
    await expect(publishedTitle).toHaveCSS('font-family', /Georgia/)
    await expect(publishedTitle).toHaveCSS('font-size', '80px')
  })

  test('keeps undo history intact when editing again immediately after undo', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Undo history workflow runs once')
    const frame = await openEditor(page, testInfo)
    const heading = frame.getByTestId('fixture-hero-title')
    const original = (await heading.textContent()) || ''
    const undoButton = page.getByRole('button', {name: 'Desfazer'})

    await heading.click()
    await heading.fill('Primeira versão para desfazer')
    await heading.press('Enter')
    await expect(undoButton).toBeEnabled()
    await undoButton.click()
    await expect(heading).toHaveText(original)

    await heading.click()
    await heading.fill('Segunda versão depois de desfazer')
    await heading.press('Enter')
    await expect(undoButton).toBeEnabled()
    await undoButton.click()
    await expect(heading).toHaveText(original)
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
    // The panel is named for what it holds, not for the page you already
    // selected — see the label convention in siteScopePanels.
    await settings
      .locator('.site-editor-panel-index > button')
      .filter({hasText: 'Topo da página'})
      .click()
    await expect(
      settings
        .locator('.site-editor-field-index > button')
        .filter({hasText: 'Texto para fechar o vídeo'})
        .locator('small'),
    ).toHaveText('Opcional')
    // Impacto e prova is a section now, not a field on this panel, so the
    // scrollable target is the section list. Drilling into a panel replaces the
    // index, so step back out before picking the next one.
    await settings.getByRole('button', {name: 'Todas as áreas'}).click()
    await settings
      .locator('.site-editor-panel-index > button')
      .filter({hasText: 'Conteúdo da página'})
      .click()
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
    await page.getByRole('alertdialog').getByRole('button', {name: 'Remover da galeria'}).click()
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
    await expect(gallery.getByRole('status', {name: /Ficheiro pronto/})).toBeVisible()
    await expect(gallery.getByText('Imagem de capa', {exact: true})).toBeVisible()
    await gallery.locator('.site-editor-gallery-poster input[accept="image/*"]').setInputFiles({
      name: 'capa-video.png',
      mimeType: 'image/png',
      buffer: tinyPng,
    })
    await expect(gallery.getByRole('listitem', {name: 'Vídeo 4'}).locator('img')).toBeVisible()
    await gallery.getByRole('button', {name: 'Remover'}).click()
    await page.getByRole('alertdialog').getByRole('button', {name: 'Remover da galeria'}).click()
    await expect(gallery.getByRole('listitem')).toHaveCount(3)
  })

  test('creates Blog and free-page drafts without leaving or crashing the editor', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Creation workflow runs once')
    const pageErrors: string[] = []
    page.on('pageerror', (error) => pageErrors.push(error.message))
    const frame = await openEditor(page, testInfo)

    await page.getByRole('button', {name: 'Abrir páginas e conteúdo'}).click()
    const navigation = page.locator('.site-editor-drawer.is-navigation')
    await navigation.getByRole('tab', {name: 'Conteúdo'}).click()
    await navigation.getByRole('button', {name: 'Novo conteúdo'}).click()

    let modal = page.locator('.site-editor-modal')
    expect(pageErrors, pageErrors.join('\n')).toEqual([])
    await expect(modal).toHaveAttribute('role', 'dialog')
    await expect(modal.getByText('O que quer criar?')).toBeVisible()
    await modal.getByRole('button', {name: 'Artigo do Blog'}).click()
    expect(pageErrors, pageErrors.join('\n')).toEqual([])
    await modal.getByLabel('Nome').fill('Artigo criado no editor')
    await modal.getByRole('button', {name: 'Criar e editar'}).click()
    await expect(modal).toHaveCount(0)
    await expect(page.locator('.site-editor-shell')).toBeVisible()
    await expect(page.locator('.site-editor-notice')).toContainText('Conteúdo criado')
    await expandCollection(navigation, /Artigos do Blog/)
    await expect(navigation.getByRole('button', {name: /Artigo criado no editor/})).toBeVisible()

    await navigation.getByRole('tab', {name: 'Páginas'}).click()
    await navigation.getByRole('button', {name: 'Nova página'}).click()
    modal = page.locator('.site-editor-modal')
    await modal.getByLabel('Nome').fill('Página criada no editor')
    await modal.getByLabel('Endereço').fill('/pagina-criada-no-editor')
    await expect(modal.getByText('Como quer começar?')).toBeVisible()
    await expect(modal.getByRole('button', {name: /Página essencial/})).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await modal.getByRole('button', {name: /Página visual/}).click()
    await modal.getByRole('button', {name: 'Criar e editar'}).click()
    await expect(modal).toHaveCount(0)
    await expect(page.locator('.site-editor-shell')).toBeVisible()
    await expect(navigation.getByRole('button', {name: /Página criada no editor/})).toBeVisible()
    await expect(frame.locator('.builder-render-section')).toHaveCount(4)
    const contactAction = frame.getByRole('link', {name: 'Falar connosco'}).last()
    await expect(contactAction).toBeVisible()
    await expect(contactAction).toHaveAttribute('data-sanity', /.+/)
    await expect(frame.locator('.builder-media[data-sanity]')).not.toHaveCount(0)
    await navigation.getByRole('button', {name: 'Fechar páginas e conteúdo'}).click()
    await waitForVisualEditor(frame)
    const createdPageTitle = frame.locator('.builder-responsive-title').first()
    await hoverEditableTarget(frame, createdPageTitle, 'Editar texto')
    await createdPageTitle.click()
    await expect(createdPageTitle).toHaveAttribute('contenteditable', 'plaintext-only')
    await createdPageTitle.press('Escape')
    expect(pageErrors, pageErrors.join('\n')).toEqual([])
  })

  test('keeps the guided page and section choices contained on mobile', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chrome', 'Mobile creation layout runs once')
    await openEditor(page, testInfo)

    await page.getByRole('button', {name: 'Abrir páginas e conteúdo'}).click()
    const navigation = page.locator('.site-editor-drawer.is-navigation')
    await navigation.getByRole('tab', {name: 'Páginas'}).click()
    await navigation.getByRole('button', {name: 'Nova página'}).click()
    const modal = page.locator('.site-editor-modal')
    await expect(modal.getByRole('button', {name: /Página essencial/})).toBeVisible()
    await expect(modal.getByRole('button', {name: /Página visual/})).toBeVisible()
    await expect(modal.getByRole('button', {name: /Só a abertura/})).toBeVisible()
    const modalBox = await modal.boundingBox()
    expect(modalBox).not.toBeNull()
    expect(modalBox!.x).toBeGreaterThanOrEqual(0)
    expect(modalBox!.x + modalBox!.width).toBeLessThanOrEqual(390)
    await modal.getByRole('button', {name: 'Fechar'}).click()

    await navigation.getByRole('button', {name: 'Fechar páginas e conteúdo'}).click()
    await page.getByRole('button', {name: 'Abrir definições'}).click()
    const settings = page.locator('.site-editor-drawer.is-settings')
    await settings
      .locator('.site-editor-panel-index > button')
      .filter({hasText: 'Conteúdo da página'})
      .click()
    await settings.getByRole('button', {name: 'Adicionar secção'}).click()
    await expect(settings.getByText('Abrir a página', {exact: true})).toBeVisible()
    await expect(settings.getByText('Explicar e mostrar', {exact: true})).toBeVisible()
    await expect(settings.getByText('Concluir', {exact: true})).toBeVisible()
    await expect(
      settings.getByRole('button', {
        name: /Texto com imagem ou vídeo Texto com media ao lado, acima ou abaixo/,
      }),
    ).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390)
  })

  test('updates a free-page preview immediately while autosave is still pending', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Free-page live preview runs once')
    const frame = await openEditor(page, testInfo)

    await page.getByRole('button', {name: 'Abrir páginas e conteúdo'}).click()
    const navigation = page.locator('.site-editor-drawer.is-navigation')
    await navigation.getByRole('tab', {name: 'Páginas'}).click()
    await navigation.getByRole('button', {name: 'Nova página'}).click()
    const modal = page.locator('.site-editor-modal')
    await modal.getByLabel('Nome').fill('Página com pré-visualização imediata')
    await modal.getByLabel('Endereço').fill('/pagina-preview-imediato')
    await modal.getByRole('button', {name: 'Criar e editar'}).click()

    await expect(frame.getByTestId('fixture-created-page')).toBeVisible()
    await expect(frame.locator('.builder-responsive-title').first()).toHaveText(
      'Página com pré-visualização imediata',
    )
    // The preview now paints its server-rendered content before the iframe has
    // finished mounting, so seeing the title no longer means the boot marker
    // exists yet. Wait for the marker itself: the assertion further down compares
    // it to prove the preview updated without reloading, and that comparison is
    // only meaningful once there is something to compare.
    await expect
      .poll(
        async () => frame.locator('html').getAttribute('data-site-editor-fixture-boot'),
        {timeout: 10_000},
      )
      .toBeTruthy()
    const bootId = await frame.locator('html').getAttribute('data-site-editor-fixture-boot')
    expect(bootId).toBeTruthy()

    await navigation.getByRole('button', {name: 'Fechar páginas e conteúdo'}).click()
    await expect(navigation).not.toHaveClass(/is-open/)

    await waitForVisualEditor(frame)
    const visualTitle = frame.locator('.builder-responsive-title').first()
    await visualTitle.hover()
    await expect(frame.locator('.site-editor-outline.is-hovered > span')).toHaveText('Editar texto')

    const sectionShell = frame.getByRole('button', {name: 'Editar Destaque principal'})
    const [sectionBox, shellBox] = await Promise.all([
      frame.locator('.builder-render-section').first().boundingBox(),
      sectionShell.boundingBox(),
    ])
    expect(sectionBox).not.toBeNull()
    expect(shellBox).not.toBeNull()
    expect(shellBox!.width).toBeLessThan(sectionBox!.width / 2)

    await sectionShell.click()
    const settings = page.locator('.site-editor-drawer.is-settings')
    await expect(settings).toHaveClass(/is-open/)
    await expect(
      settings.locator('.site-page-editor-group').getByText('Conteúdo', {exact: true}),
    ).toBeVisible()
    await expect(settings.getByText('Computador', {exact: true})).toHaveCount(0)
    await expect(settings.getByText('Tablet', {exact: true})).toHaveCount(0)
    await expect(settings.getByText('Telemóvel', {exact: true})).toHaveCount(0)

    let releaseSave: (() => void) | undefined
    const saveGate = new Promise<void>((resolve) => {
      releaseSave = resolve
    })
    await page.route('**/painel/site/api', async (route) => {
      if (route.request().method() === 'PUT') await saveGate
      await route.continue()
    })

    await settings.getByLabel('Título').fill('O texto aparece sem esperar pelo autosave')
    await expect(frame.locator('.builder-responsive-title').first()).toHaveText(
      'O texto aparece sem esperar pelo autosave',
      {timeout: 500},
    )
    await expect(frame.locator('html')).toHaveAttribute('data-site-editor-fixture-boot', bootId!)
    releaseSave?.()
    await expect(page.locator('.site-editor-top-save')).toContainText('Guardado')

    const beforeClose = await Promise.all([
      page.locator('.site-editor-frame-wrap iframe').boundingBox(),
      frame.locator('.builder-render-section').first().boundingBox(),
      frame.locator('html').evaluate(() => window.scrollY),
    ])
    await settings.getByRole('button', {name: 'Fechar definições'}).click()
    await expect(settings).not.toHaveClass(/is-open/)
    await page.waitForTimeout(260)
    const afterClose = await Promise.all([
      page.locator('.site-editor-frame-wrap iframe').boundingBox(),
      frame.locator('.builder-render-section').first().boundingBox(),
      frame.locator('html').evaluate(() => window.scrollY),
    ])

    expect(beforeClose[0]).not.toBeNull()
    expect(beforeClose[1]).not.toBeNull()
    expect(afterClose[0]).not.toBeNull()
    expect(afterClose[1]).not.toBeNull()
    for (const key of ['x', 'y', 'width', 'height'] as const) {
      expect(Math.abs(beforeClose[0]![key] - afterClose[0]![key])).toBeLessThanOrEqual(1)
      expect(Math.abs(beforeClose[1]![key] - afterClose[1]![key])).toBeLessThanOrEqual(1)
    }
    expect(afterClose[2]).toBe(beforeClose[2])
  })

  test('keeps a gallery rendered while a sibling section is removed and the preview refreshes', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Structural refresh workflow runs once')
    test.setTimeout(45_000)
    const frame = await openEditor(page, testInfo)

    await page.getByRole('button', {name: 'Abrir páginas e conteúdo'}).click()
    const navigation = page.locator('.site-editor-drawer.is-navigation')
    await navigation.getByRole('tab', {name: 'Conteúdo'}).click()
    await navigation.getByRole('button', {name: 'Novo conteúdo'}).click()
    const modal = page.locator('.site-editor-modal')
    await modal.getByRole('button', {name: 'Produto', exact: true}).click()
    await modal.getByLabel('Nome').fill('Produto para preservar galeria')
    await modal.getByRole('button', {name: 'Criar e editar'}).click()
    await expect(modal).toHaveCount(0)
    await expect(frame.getByTestId('fixture-created-page')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(navigation).not.toHaveClass(/is-open/)

    await page.getByRole('button', {name: 'Abrir definições'}).click()
    const settings = page.locator('.site-editor-drawer.is-settings')
    await expect(settings).toHaveClass(/is-open/)
    await settings
      .locator('.site-editor-panel-index > button')
      .filter({hasText: 'Conteúdo da página'})
      .click()
    await settings.getByRole('button', {name: 'Adicionar secção'}).click()
    await settings.getByRole('button', {name: /^Galeria/}).click()
    await settings.locator('.site-page-gallery-add input[type="file"]').setInputFiles({
      name: 'galeria-estavel.png',
      mimeType: 'image/png',
      buffer: tinyPng,
    })
    await expect(frame.locator('.builder-interactive-gallery')).toBeVisible()
    await expect(page.locator('.site-editor-top-save')).toContainText('Guardado')

    await settings.getByRole('button', {name: /Voltar ao conteúdo/}).click()
    await settings.getByRole('button', {name: 'Adicionar secção'}).click()
    await settings.getByRole('button', {name: /Texto com imagem ou vídeo/}).click()
    await settings.getByRole('button', {name: /Voltar ao conteúdo/}).click()
    const rows = settings.locator('.site-editor-section-list > article')
    const mediaRow = rows.filter({hasText: 'Secção do produto'})
    await expect(mediaRow).toHaveCount(1)

    await frame.locator('body').evaluate((body) => {
      const states: number[] = []
      const read = () => {
        const count = body.querySelectorAll('.builder-interactive-gallery').length
        if (states.at(-1) !== count) states.push(count)
      }
      read()
      const observer = new MutationObserver(read)
      observer.observe(body, {childList: true, subtree: true})
      ;(window as any).__df4yGalleryStates = states
      ;(window as any).__df4yGalleryObserver = observer
    })
    await page.evaluate(() => {
      ;(window as any).__df4yPreviewRefreshes = 0
      window.addEventListener('message', (event) => {
        if (event.data?.type === 'df4y:site-editor:preview-refreshed') {
          ;(window as any).__df4yPreviewRefreshes += 1
        }
      })
    })

    await mediaRow.getByRole('button', {name: /Ações de Secção do produto/}).click()
    await mediaRow.getByRole('button', {name: 'Eliminar'}).click()
    await page.getByRole('alertdialog').getByRole('button', {name: 'Eliminar'}).click()

    await expect(page.locator('.site-editor-top-save')).toContainText('Guardado')
    await expect
      .poll(() => page.evaluate(() => (window as any).__df4yPreviewRefreshes as number))
      .toBeGreaterThan(0)
    await expect(frame.locator('.builder-interactive-gallery')).toBeVisible()
    const galleryStates = await frame.locator('body').evaluate(() => {
      ;(window as any).__df4yGalleryObserver?.disconnect()
      return (window as any).__df4yGalleryStates as number[]
    })
    expect(galleryStates).toEqual([1])
  })

  test('creates every structured content type with its starter fields and keeps visual editing active', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Creation workflow runs once')
    test.setTimeout(60_000)
    const pageErrors: string[] = []
    page.on('pageerror', (error) => pageErrors.push(error.message))
    const frame = await openEditor(page, testInfo)

    await page.getByRole('button', {name: 'Abrir páginas e conteúdo'}).click()
    const navigation = page.locator('.site-editor-drawer.is-navigation')
    await navigation.getByRole('tab', {name: 'Conteúdo'}).click()

    const drafts = [
      {type: 'productCategory', label: 'Produto', title: 'Produto criado no editor'},
      {type: 'storeProduct', label: 'Produto da Loja', title: 'Produto da Loja criado no editor'},
      {type: 'caseStudy', label: 'Caso de estudo', title: 'Caso criado no editor'},
      {type: 'blogPost', label: 'Artigo do Blog', title: 'Artigo completo criado no editor'},
    ] as const

    for (const [index, draft] of drafts.entries()) {
      if (index > 0) {
        await page.getByRole('button', {name: 'Abrir páginas e conteúdo'}).click()
      }
      await navigation.getByRole('button', {name: 'Novo conteúdo'}).click()
      const modal = page.locator('.site-editor-modal')
      await modal.getByRole('button', {name: draft.label, exact: true}).click()
      await modal.getByLabel('Nome').fill(draft.title)
      if (draft.type === 'storeProduct') {
        // A shop product has to be filed under a category before it exists:
        // guessing one put a planter in "Bancos" without telling anybody. The
        // dialog asks, so the form does not submit until it is answered.
        const category = modal.getByLabel('Categoria', {exact: true})
        await expect(category).toHaveValue('')
        await category.selectOption('cultivo')
      }
      await modal.getByRole('button', {name: 'Criar e editar'}).click()

      await expect(modal).toHaveCount(0)
      await expect(frame.getByTestId('fixture-created-page')).toBeVisible()
      await waitForVisualEditor(frame)
      await expect(page.locator('.site-editor-context')).toContainText(draft.title)
      await expect(frame.getByTestId('fixture-created-summary')).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(navigation).not.toHaveClass(/is-open/)

      const heading = frame.getByTestId('fixture-created-title')
      await hoverEditableTarget(frame, heading, 'Editar texto')
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
    await duplicateModal.getByRole('button', {name: 'Artigo do Blog'}).click()
    await duplicateModal.getByLabel('Nome').fill('Artigo completo criado no editor')
    await duplicateModal.getByRole('button', {name: 'Criar e editar'}).click()
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
    await hoverEditableTarget(frame, article)
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

  test('keeps the selected article text while the link form has focus', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Link selection round trip runs once')
    const frame = await openEditor(page, testInfo)

    await page.getByRole('button', {name: 'Abrir páginas e conteúdo'}).click()
    const navigation = page.locator('.site-editor-drawer.is-navigation')
    await navigation.getByRole('tab', {name: 'Conteúdo'}).click()
    await expandCollection(navigation, /Artigos do Blog/)
    await navigation.getByRole('button', {name: /Artigo estruturado completo/}).click()

    const article = frame.getByTestId('fixture-created-article')
    const settings = page.locator('.site-editor-drawer.is-settings')
    await selectEditableTarget(page, article, settings)
    const {workspace} = await openArticleWorkspace(page, settings)
    const canvas = workspace.locator('.site-editor-rich-canvas')
    const heading = canvas.locator('h2').first()
    const linkText = 'ligação nova'

    await heading.click()
    await page.keyboard.press('End')
    await page.keyboard.type(` ${linkText}`)
    // Selecting by keyboard rather than by dragging between measured
    // coordinates: the phrase was just typed at the end, so shift-left over its
    // own length lands on exactly it. The drag depended on scroll position and
    // hit-testing inside a live rich-text editor, which is why it selected the
    // wrong range on a loaded machine and the link then annotated nothing.
    for (let index = 0; index < linkText.length; index += 1) {
      await page.keyboard.press('Shift+ArrowLeft')
    }
    await expect.poll(() => page.evaluate(() => window.getSelection()?.toString())).toBe(linkText)

    await workspace.getByRole('button', {name: 'Adicionar ligação'}).click()
    await workspace.getByLabel('Destino da ligação').fill('https://www.dafabrica4you.pt/produtos/')
    await workspace.getByRole('button', {name: 'Aplicar', exact: true}).click()

    await expect(heading.getByRole('link', {name: linkText})).toHaveAttribute(
      'href',
      'https://www.dafabrica4you.pt/produtos/',
    )
    await expect(page.locator('.site-editor-top-save')).toContainText('Guardado')
    await expect
      .poll(() =>
        page.evaluate(async (expectedText) => {
          const response = await fetch('/painel/site/api?document=blogPost.rich-article-fixture')
          const payload = (await response.json()) as {
            document?: {article?: {pt?: Array<Record<string, unknown>>}}
          }
          const blocks = payload.document?.article?.pt ?? []
          return blocks.some((block) => {
            const markDefs = Array.isArray(block.markDefs) ? block.markDefs : []
            const children = Array.isArray(block.children) ? block.children : []
            const linkKey = markDefs.find(
              (mark) =>
                typeof mark === 'object' &&
                mark !== null &&
                (mark as {_type?: string})._type === 'link' &&
                (mark as {href?: string}).href === 'https://www.dafabrica4you.pt/produtos/',
            ) as {_key?: string} | undefined
            return Boolean(
              linkKey?._key &&
                children.some(
                  (child) =>
                    typeof child === 'object' &&
                    child !== null &&
                    (child as {text?: string}).text === expectedText &&
                    Array.isArray((child as {marks?: unknown[]}).marks) &&
                    (child as {marks: unknown[]}).marks.includes(linkKey._key),
                ),
            )
          })
        }, linkText),
      )
      .toBe(true)
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
    await hoverEditableTarget(frame, article)

    const settings = page.locator('.site-editor-drawer.is-settings')
    await selectEditableTarget(page, article, settings)
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
    const settings = page.locator('.site-editor-drawer.is-settings')
    await selectEditableTarget(page, article, settings)
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
    await expect(article.locator('.article-indented-block[data-indent-level="1"]')).toContainText(
      'Parágrafo com avanço',
    )

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
    await expect(modal.locator('.site-editor-create-types')).toHaveCount(0)
    await modal.getByLabel('Nome').fill('Deck modular')
    await modal.getByRole('button', {name: 'Criar e editar'}).click()
    await expect(modal).toHaveCount(0)
    await expandCollection(navigation, /Categorias da Loja/)
    await expect(navigation.getByRole('button', {name: /Deck modular/})).toBeVisible()

    await expandCollection(navigation, /Produtos da Loja/)
    await navigation.getByRole('button', {name: /Banco editorial/}).click()
    await page.getByRole('button', {name: 'Abrir definições'}).click()
    const settings = page.locator('.site-editor-drawer.is-settings')
    await settings
      .locator('.site-editor-panel-index > button')
      .filter({has: page.locator('strong', {hasText: /^Conteúdo$/})})
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
    await expect(settings.locator('.site-editor-panel-index')).toBeVisible()
    await expect(settings.getByText('Esta categoria está em uso')).toBeVisible()
    await expect(settings.getByRole('button', {name: 'Eliminar conteúdo'})).toHaveCount(0)

    const nameField = await openCategoryNameField(settings)
    await nameField.fill('Bancos exteriores')
    await expect(page.locator('.site-editor-top-save')).toContainText('Guardado')

    const manager = await openCategoryProducts(settings)
    await expect(manager.getByText('1 produto', {exact: true})).toBeVisible()
    await expect(
      manager.getByRole('button', {name: 'Alterar categoria de Banco editorial'}),
    ).toBeVisible()

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
    await expect(settings.getByText('Existem mudanças por publicar')).toBeVisible()
    await expect(settings.getByRole('button', {name: 'Eliminar conteúdo'})).toHaveCount(0)

    const pendingManager = await openCategoryProducts(settings)
    await expect(settings.getByText('Nenhum produto está atualmente nesta categoria')).toBeVisible()
    await expect(settings.getByText('Mudança por publicar')).toBeVisible()

    await pendingManager.getByRole('button', {name: /Abrir e publicar: Banco editorial/}).click()
    await expect(settings.getByRole('combobox', {name: 'Categoria'})).toHaveValue('mesas')
    await page.locator('.site-editor-publish-button').click()
    await expect(page.locator('.site-editor-notice')).toContainText('Português publicado')

    await page.getByRole('button', {name: 'Abrir páginas e conteúdo'}).click()
    await navigation.getByRole('button', {name: /Bancos exteriores.*0 produtos/}).click()
    await expect(settings.getByText('Mudança por publicar')).toHaveCount(0)

    await settings.getByRole('button', {name: 'Eliminar conteúdo'}).click()
    const confirmation = page.getByRole('alertdialog', {name: /Eliminar “Bancos exteriores”/})
    await expect(confirmation).toBeVisible()
    await confirmation.getByRole('button', {name: 'Eliminar', exact: true}).click()
    await expect(navigation.getByRole('button', {name: /Bancos exteriores/})).toHaveCount(0)

    // Deleting must close the inspector on an empty state, not silently reopen it
    // on an unrelated node (e.g. the homepage), and must leave the navigation on
    // whichever tab the user was already on instead of resetting to "Páginas".
    await expect(
      settings.getByText('Clique numa página ou num elemento da pré-visualização para o editar.'),
    ).toBeVisible()
    await expect(settings.getByText('Página inicial', {exact: true})).toHaveCount(0)
    await expect(navigation.getByRole('tab', {name: 'Conteúdo'})).toHaveAttribute(
      'aria-selected',
      'true',
    )
  })

  test('starts Content collapsed and keeps Loja categories in a clear two-panel flow', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Parallel drawers are verified once')
    await openEditor(page, testInfo)

    await expect(page.getByRole('link', {name: 'Voltar ao backoffice'})).toHaveAttribute(
      'href',
      '/painel',
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
    await expect(settings.locator('.site-editor-panel-index')).toBeVisible()
    await expect(
      settings.locator('.site-editor-panel-index > button').filter({hasText: /^Categoria/}),
    ).toBeVisible()
    await expect(
      settings
        .locator('.site-editor-panel-index > button')
        .filter({hasText: /^Produtos associados/}),
    ).toBeVisible()

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
    await page
      .getByRole('alertdialog', {name: 'Remover esta ligação do menu?'})
      .getByRole('button', {name: 'Remover', exact: true})
      .click()
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

  test('surfaces a way out instead of waiting forever when the editor bundle stalls', async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Boot timeout runs once')
    test.setTimeout(30_000)

    const scope = `boot-stall-${testInfo.workerIndex}-${Date.now()}`
    await page.setExtraHTTPHeaders({
      'x-df4y-site-editor-e2e': e2eKey,
      'x-df4y-site-editor-scope': scope,
    })
    await page.addInitScript(() => {
      const nativeSetTimeout = window.setTimeout.bind(window)
      window.setTimeout = ((handler: TimerHandler, timeout?: number, ...arguments_: unknown[]) =>
        nativeSetTimeout(
          handler,
          timeout === 25_000 ? 50 : timeout,
          ...arguments_,
        )) as typeof window.setTimeout
    })
    let releaseBundle: (() => void) | undefined
    const heldBundle = new Promise<void>((resolve) => {
      releaseBundle = () => resolve()
    })
    // A chunk request that hangs rather than fails never rejects the dynamic
    // import, so nothing else on this screen can clear the boot message.
    await page.route(/SiteEditorApp|site-editor/, async (route) => {
      await heldBundle
      await route.continue()
    })

    try {
      await page.goto('/painel/site', {waitUntil: 'domcontentloaded'})
      const boot = page.locator('.standalone-builder-boot')
      await expect(boot).toContainText('A preparar o editor do site')
      await expect(boot).toContainText('demorar mais do que o normal')
      await expect(boot.getByRole('button', {name: 'Tentar novamente'})).toBeVisible()
    } finally {
      releaseBundle?.()
    }
  })

  test('keeps a stalled preview covered and offers a retry', async ({page}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Preview timeout runs once')
    const frame = await openEditor(page, testInfo)
    await expect(frame.getByTestId('fixture-hero-title')).toBeVisible()
    await page.clock.install()

    let releasePreview: (() => void) | undefined
    const heldPreview = new Promise<void>((resolve) => {
      releasePreview = () => resolve()
    })
    await page.route('**/painel/site/e2e-preview?**', async (route) => {
      await heldPreview
      await route.continue()
    })

    try {
      await page.getByRole('button', {name: 'Atualizar página'}).click()
      const overlay = page.locator('.site-editor-frame-loading')
      await expect(overlay).toContainText('A atualizar a página')
      await page.clock.fastForward(20_100)
      await expect(overlay).toContainText('A pré-visualização não respondeu')
      const retry = overlay.getByRole('button', {name: 'Tentar novamente'})
      await expect(retry).toBeVisible()
      await expect(frame.getByTestId('fixture-hero-title')).toBeVisible()
      await retry.click()
      await expect(overlay).toContainText('A atualizar a página')
    } finally {
      releasePreview?.()
    }
  })
})

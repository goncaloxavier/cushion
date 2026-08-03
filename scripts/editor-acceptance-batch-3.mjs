/* global process, console, URL */
import {chromium} from '@playwright/test'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const baseUrl = process.env.SITE_EDITOR_URL || 'http://127.0.0.1:5175'
const username = process.env.SITE_EDITOR_USER
const password = process.env.SITE_EDITOR_PASSWORD
const productTitle = 'Exemplo editorial: banco de encontro modular'
const productSlug = 'exemplo-editorial-banco-de-encontro-modular'
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const productImages = [
  path.join(repoRoot, 'static/images/store/banco-gaviao-01.jpeg'),
  path.join(repoRoot, 'static/images/store/banco-gaviao-02.jpeg'),
  path.join(repoRoot, 'static/images/store/banco-gaviao-03.jpeg'),
]

if (!username || !password) {
  throw new Error('Defina SITE_EDITOR_USER e SITE_EDITOR_PASSWORD antes de executar este lote.')
}

const browser = await chromium.launch({channel: 'chrome', headless: true})
const context = await browser.newContext({viewport: {width: 1440, height: 1000}})
const page = await context.newPage()
const step = (message) => console.log(`[batch-3] ${message}`)

const saveScreenshot = async (targetPage, name) => {
  const output = path.join(repoRoot, 'test-results', `editor-batch-3-${name}.png`)
  await targetPage.screenshot({path: output, fullPage: true})
  return output
}

const returnToPanelOverview = async (settings) => {
  const overview = settings.locator('.site-editor-panel-index')
  const back = settings.locator('.site-editor-panel-workspace-head > button')

  for (let depth = 0; depth < 5; depth += 1) {
    if (await overview.isVisible().catch(() => false)) return
    if (await back.isVisible().catch(() => false)) {
      await back.click()
      continue
    }
    await page.waitForTimeout(150)
  }

  await overview.waitFor({state: 'visible'})
}

const openPanel = async (settings, label) => {
  await returnToPanelOverview(settings)
  const panel = settings
    .locator('.site-editor-panel-index > button')
    .filter({hasText: label})
  await panel.waitFor({state: 'visible'})
  await panel.click()
  await settings.locator('.site-editor-panel-workspace-head').waitFor({state: 'visible'})
}

const openField = async (settings, label) => {
  const field = settings
    .locator('.site-editor-field-index > button')
    .filter({hasText: label})
  await field.waitFor({state: 'visible'})
  await field.click()
}

const waitForSaved = async () => {
  await page
    .locator('.site-editor-top-save')
    .filter({hasText: /Guardado|Tudo guardado/})
    .waitFor({state: 'visible', timeout: 30_000})
}

const addSimpleArrayValue = async (settings, panel, field, itemLabel, value) => {
  await openPanel(settings, panel)
  await openField(settings, field)
  await settings.locator('.site-editor-array-add').click()
  await settings.getByRole('textbox', {name: itemLabel}).last().fill(value)
  await waitForSaved()
}

const pollPublicProduct = async (targetPage, url) => {
  const heading = targetPage.locator('h1').filter({hasText: productTitle})
  for (let attempt = 0; attempt < 15; attempt += 1) {
    await targetPage.goto(`${url}${url.includes('?') ? '&' : '?'}acceptance=${Date.now()}`, {
      waitUntil: 'domcontentloaded',
      timeout: 20_000,
    })
    if (await heading.isVisible().catch(() => false)) return
    await targetPage.waitForTimeout(2_000)
  }
  await heading.waitFor({state: 'visible', timeout: 5_000})
}

try {
  await page.goto(`${baseUrl}/painel/site`, {waitUntil: 'domcontentloaded'})
  const usernameField = page.getByLabel('Utilizador')
  const loginRequired =
    new URL(page.url()).pathname === '/painel/login' ||
    (await usernameField.isVisible().catch(() => false))

  if (loginRequired) {
    await usernameField.fill(username)
    await page.getByLabel('Palavra-passe').fill(password)
    await page.getByRole('button', {name: 'Entrar', exact: true}).click()
  }

  await page.locator('.site-editor-shell').waitFor({state: 'visible', timeout: 20_000})
  step('Sessão autenticada')

  await page.getByRole('button', {name: 'Abrir páginas e conteúdo'}).click()
  const navigation = page.locator('.site-editor-drawer.is-navigation')
  await navigation.getByRole('tab', {name: 'Conteúdo', exact: true}).click()
  const productsCollection = navigation
    .locator('.site-editor-tree-item.is-collection')
    .filter({hasText: /^Produtos/})
  if ((await productsCollection.getAttribute('aria-expanded')) === 'false') {
    await productsCollection.click()
  }

  let productEntry = navigation
    .locator('.site-editor-tree-item')
    .filter({hasText: productTitle})
  if (!(await productEntry.isVisible().catch(() => false))) {
    await navigation.getByRole('button', {name: 'Novo conteúdo'}).click()
    const modal = page.locator('.site-editor-modal')
    await modal.getByRole('button', {name: 'Produto', exact: true}).click()
    await modal.getByLabel('Nome').fill(productTitle)
    await modal.getByRole('button', {name: 'Criar e editar'}).click()
    await modal.waitFor({state: 'detached'})
    step('Produto isolado criado através do editor')
  } else {
    await productEntry.click()
    step('Produto isolado existente reaberto')
  }

  if (await navigation.getByRole('button', {name: 'Fechar páginas e conteúdo'}).isVisible()) {
    await navigation.getByRole('button', {name: 'Fechar páginas e conteúdo'}).click()
  }

  const frame = page.frameLocator('.site-editor-frame-wrap iframe')
  await frame.locator('h1').filter({hasText: productTitle}).waitFor({state: 'visible', timeout: 20_000})
  const settings = page.locator('.site-editor-drawer.is-settings')
  if (!(await settings.isVisible().catch(() => false))) {
    await page.getByRole('button', {name: 'Abrir definições'}).click()
  }
  await settings.waitFor({state: 'visible'})

  await openPanel(settings, 'Conteúdo')
  await openField(settings, 'Descrição')
  await settings
    .getByRole('textbox', {name: 'Descrição'})
    .fill(
      'Demonstração editorial do construtor: um banco modular pensado para zonas de pausa, encontro e observação em espaços exteriores.',
    )
  await waitForSaved()
  step('Apresentação principal preenchida')

  await openPanel(settings, 'Imagens e vídeos')
  await openField(settings, 'Imagem principal')
  const mainImageEditor = settings.locator('.site-editor-image-field')
  await mainImageEditor.locator('input[type="file"]').setInputFiles(productImages[0])
  await mainImageEditor.locator('img').waitFor({state: 'visible', timeout: 30_000})
  await mainImageEditor
    .getByRole('textbox', {name: 'Descrição da imagem'})
    .fill('Banco modular comprido em plástico reciclado sobre relva verde.')
  await waitForSaved()

  await openPanel(settings, 'Imagens e vídeos')
  await openField(settings, 'Galeria')
  const gallery = settings.locator('.site-editor-gallery-field')
  const galleryInput = gallery.locator('.site-editor-gallery-add-tile input[type="file"]')
  const galleryDescriptions = [
    'Vista frontal do banco modular, mostrando o assento comprido e os três apoios.',
    'Vista ligeiramente elevada do banco modular instalado sobre relva verde.',
  ]
  for (let index = 0; index < 2; index += 1) {
    await galleryInput.setInputFiles(productImages[index + 1])
    await gallery.getByRole('listitem').nth(index).waitFor({state: 'visible', timeout: 30_000})
    await gallery
      .getByRole('textbox', {name: 'Descrição da imagem'})
      .fill(galleryDescriptions[index])
    await waitForSaved()
  }
  step('Imagem principal e galeria carregadas com descrições acessíveis')

  await addSimpleArrayValue(
    settings,
    'Especificações técnicas',
    'Dimensões',
    'Medida',
    '2000 × 450 × 450 mm',
  )
  await addSimpleArrayValue(
    settings,
    'Especificações técnicas',
    'Materiais',
    'Material',
    'Plástico reciclado com acabamento natural',
  )
  await addSimpleArrayValue(
    settings,
    'Especificações técnicas',
    'Vantagens',
    'Vantagem',
    'Não requer pintura nem verniz',
  )
  step('Informação técnica adicionada')

  await openPanel(settings, 'Conteúdo da página')
  const managedRow = settings
    .locator('.site-editor-section-list > article')
    .filter({hasText: 'Conteúdo atual da página'})
  await managedRow.waitFor({state: 'visible'})
  await settings.getByRole('button', {name: 'Adicionar secção'}).click()
  await settings.locator('button[data-section-type="builderMediaSection"]').click()

  await settings.getByRole('textbox', {name: 'Título'}).fill('Veja como o material ganha forma')
  await settings
    .getByRole('textbox', {name: 'Texto'})
    .fill(
      'O vídeo acompanha o processo da DaFábrica4You e mostra como os resíduos são transformados em soluções preparadas para permanecer no exterior.',
    )

  const mediaGroup = settings
    .locator('details.site-page-editor-group')
    .filter({hasText: 'Imagem ou vídeo'})
  await mediaGroup.getByRole('button', {name: 'YouTube', exact: true}).click()
  await mediaGroup
    .getByRole('textbox', {name: 'Link do YouTube'})
    .fill('https://www.youtube.com/watch?v=h1wVIZRj0Hc')
  await mediaGroup
    .getByRole('textbox', {name: 'Descrição acessível'})
    .fill('Vídeo institucional sobre o processo e os produtos da DaFábrica4You.')

  const buttonsGroup = settings
    .locator('details.site-page-editor-group')
    .filter({hasText: /^Botões/})
  await buttonsGroup.locator('summary').click()
  await buttonsGroup.getByRole('button', {name: 'Adicionar botão'}).click()
  const action = buttonsGroup.locator('.site-page-action-row').last()
  await action.getByRole('textbox', {name: 'Texto'}).fill('Falar com a equipa')
  await action.getByRole('textbox', {name: 'Destino'}).fill('/contacto')

  const appearance = settings.locator('details.site-page-editor-group.is-appearance')
  await appearance.locator('summary').click()
  await appearance.getByLabel('Fundo').selectOption('deep')
  await appearance.getByRole('button', {name: 'Direita', exact: true}).click()
  await waitForSaved()
  step('Secção editorial com vídeo, texto, botão, cor e composição criada')

  await settings.getByRole('button', {name: /Voltar ao conteúdo/}).click()
  const featureRow = settings
    .locator('.site-editor-section-list > article')
    .filter({hasText: 'Secção do produto'})
  await featureRow.getByRole('button', {name: /Ações de Secção do produto/}).click()
  await featureRow.getByRole('button', {name: 'Mover para cima'}).click()
  await frame.getByRole('heading', {name: 'Veja como o material ganha forma'}).waitFor()
  await featureRow.getByRole('button', {name: /Ações de Secção do produto/}).click()
  await featureRow.getByRole('button', {name: 'Mover para baixo'}).click()
  await waitForSaved()
  step('Secção movida acima e reposta abaixo da apresentação principal')

  await settings.getByRole('button', {name: 'Fechar definições'}).click()
  const coreShell = frame.locator('.managed-page-core')
  await coreShell.waitFor({state: 'attached'})
  await coreShell.focus()
  await coreShell.press('Enter')
  await settings.waitFor({state: 'visible'})
  await settings.getByRole('button', {name: 'Editar conteúdo principal'}).waitFor()
  await settings.getByRole('button', {name: 'Editar conteúdo principal'}).click()
  await settings.locator('.site-editor-panel-workspace-head').filter({hasText: 'Conteúdo'}).waitFor()
  step('A apresentação desenhada respondeu à edição visual do próprio invólucro')

  await waitForSaved()
  const editorScreenshot = await saveScreenshot(page, 'editor')
  const publishButton = page.locator('.site-editor-publish-button')
  await publishButton.getByText('Publicar', {exact: true}).waitFor({state: 'visible'})
  await publishButton.click()
  await publishButton.getByText('Publicado em PT', {exact: true}).waitFor({
    state: 'visible',
    timeout: 45_000,
  })
  step('Produto de demonstração publicado')

  const publicPage = await context.newPage()
  const productUrl = `${baseUrl}/produtos/${productSlug}?lang=pt`
  await pollPublicProduct(publicPage, productUrl)
  await publicPage
    .getByText('Demonstração editorial do construtor:', {exact: false})
    .waitFor()
  await publicPage.getByRole('heading', {name: 'Veja como o material ganha forma'}).waitFor()
  await publicPage.getByRole('link', {name: 'Falar com a equipa'}).waitFor()
  await publicPage.locator('iframe[title*="Vídeo institucional"]').waitFor({state: 'visible'})
  await publicPage.getByText('2000 × 450 × 450 mm', {exact: true}).waitFor()
  await publicPage.getByText('Não requer pintura nem verniz', {exact: true}).waitFor()
  const robots = await publicPage.locator('meta[name="robots"]').getAttribute('content')
  if (!robots?.includes('noindex')) {
    throw new Error(`A demonstração não ficou protegida por noindex: ${robots || 'sem meta robots'}`)
  }

  const media = publicPage.locator('.product-stage-gallery')
  await media.locator('.image-gallery-main button').click()
  await publicPage.locator('.image-lightbox').waitFor({state: 'visible'})
  await publicPage.keyboard.press('Escape')
  await publicPage.locator('.image-lightbox').waitFor({state: 'hidden'})

  const productList = await context.newPage()
  await productList.goto(`${baseUrl}/produtos?lang=pt`, {waitUntil: 'domcontentloaded'})
  if (await productList.getByText(productTitle, {exact: true}).isVisible().catch(() => false)) {
    throw new Error('O produto isolado apareceu indevidamente na página Produtos.')
  }
  const search = await context.request.get(
    `${baseUrl}/api/search?q=${encodeURIComponent('banco de encontro modular')}&lang=pt`,
  )
  const searchPayload = await search.json()
  if (JSON.stringify(searchPayload).includes(productTitle)) {
    throw new Error('O produto isolado apareceu indevidamente na pesquisa.')
  }
  const sitemap = await context.request.get(`${baseUrl}/sitemap.xml`)
  if ((await sitemap.text()).includes(productSlug)) {
    throw new Error('O produto isolado apareceu indevidamente no sitemap.')
  }
  step('Isolamento validado em Produtos, pesquisa, sitemap e motores de pesquisa')

  const desktopScreenshot = await saveScreenshot(publicPage, 'public-desktop')
  await publicPage.setViewportSize({width: 390, height: 844})
  await publicPage.reload({waitUntil: 'domcontentloaded'})
  await publicPage.getByRole('heading', {name: productTitle}).waitFor()
  await publicPage.getByRole('heading', {name: 'Veja como o material ganha forma'}).waitFor()
  const mobileScreenshot = await saveScreenshot(publicPage, 'public-mobile')
  step('Composição pública validada em computador e telemóvel')

  console.log(
    JSON.stringify(
      {
        product: productUrl,
        hiddenFromPublicCollections: true,
        screenshots: {editorScreenshot, desktopScreenshot, mobileScreenshot},
      },
      null,
      2,
    ),
  )
} finally {
  await context.close()
  await browser.close()
}

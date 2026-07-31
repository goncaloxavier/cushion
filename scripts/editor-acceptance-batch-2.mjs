/* global process, console, URL, document, NodeFilter, window, HTMLImageElement */
import {chromium} from '@playwright/test'
import path from 'node:path'
import {fileURLToPath} from 'node:url'

const baseUrl = process.env.SITE_EDITOR_URL || 'http://127.0.0.1:5174'
const username = process.env.SITE_EDITOR_USER
const password = process.env.SITE_EDITOR_PASSWORD
const articleTitle = 'Como planear um espaço exterior com menos manutenção'
const articleSlug = 'como-planear-um-espaco-exterior-com-menos-manutencao'
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const articleImage = path.join(repoRoot, 'static/images/blog-editorial.png')

if (!username || !password) {
  throw new Error('Defina SITE_EDITOR_USER e SITE_EDITOR_PASSWORD antes de executar este lote.')
}

const browser = await chromium.launch({channel: 'chrome', headless: true})
const context = await browser.newContext({viewport: {width: 1440, height: 1000}})
const page = await context.newPage()
const step = (message) => console.log(`[batch-2] ${message}`)

const requireCount = async (locator, expected, label) => {
  const actual = await locator.count()
  if (actual !== expected) {
    throw new Error(`${label}: esperava ${expected}, encontrou ${actual}.`)
  }
}

const requireNonEmptyCount = async (locator, expected, label) => {
  const values = (await locator.allTextContents()).map((value) => value.trim()).filter(Boolean)
  if (values.length !== expected) {
    throw new Error(`${label}: esperava ${expected}, encontrou ${values.length}.`)
  }
}

const selectVisibleText = async (locator, targetText) => {
  const points = await locator.evaluate((element, textToSelect) => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
    let node = walker.nextNode()
    while (node) {
      const text = node.textContent || ''
      const startOffset = text.indexOf(textToSelect)
      if (startOffset >= 0) {
        node.parentElement?.scrollIntoView({block: 'center'})
        const startRange = document.createRange()
        startRange.setStart(node, startOffset)
        startRange.collapse(true)
        const endRange = document.createRange()
        endRange.setStart(node, startOffset + textToSelect.length)
        endRange.collapse(true)
        const start = startRange.getBoundingClientRect()
        const end = endRange.getBoundingClientRect()
        const elementRect = element.getBoundingClientRect()
        return {
          start: {
            x: start.x - elementRect.x,
            y: start.y - elementRect.y + Math.max(start.height, 20) / 2,
          },
          end: {
            x: end.x - elementRect.x,
            y: end.y - elementRect.y + Math.max(end.height, 20) / 2,
          },
        }
      }
      node = walker.nextNode()
    }
    throw new Error(`Não foi possível localizar o texto “${textToSelect}”.`)
  }, targetText)

  await locator.hover({position: points.end})
  await page.mouse.down()
  await locator.hover({position: points.start})
  await page.mouse.up()
  const selectedText = await page.evaluate(() => window.getSelection()?.toString())
  if (selectedText !== targetText) {
    throw new Error(`A seleção esperada era “${targetText}”, mas ficou “${selectedText || ''}”.`)
  }
  // Portable Text commits the browser selection on its trailing microtask.
  await page.waitForTimeout(150)
}

const saveScreenshot = async (name) => {
  const output = path.join(repoRoot, 'test-results', `editor-batch-2-${name}.png`)
  await page.screenshot({path: output, fullPage: true})
  return output
}

const loadLazyArticleMedia = async (targetPage) => {
  const media = targetPage.locator('.article-embedded-image img, .article-embedded-video iframe')
  for (let index = 0; index < (await media.count()); index += 1) {
    await media.nth(index).scrollIntoViewIfNeeded()
    await targetPage.waitForTimeout(250)
  }

  const lazyImages = targetPage.locator('.article-embedded-image img')
  for (let index = 0; index < (await lazyImages.count()); index += 1) {
    await lazyImages
      .nth(index)
      .evaluate((image) => {
        if (!(image instanceof HTMLImageElement)) return Promise.resolve()
        if (image.complete && image.naturalWidth > 0) return Promise.resolve()
        return new Promise((resolve) => {
          const finish = () => resolve(undefined)
          image.addEventListener('load', finish, {once: true})
          image.addEventListener('error', finish, {once: true})
          window.setTimeout(finish, 10_000)
        })
      })
  }

  await targetPage.evaluate(() => window.scrollTo({top: 0}))
  await targetPage.waitForTimeout(250)
}

const clickThroughRerender = async (locator) => {
  let lastError
  for (let attempt = 0; attempt < 12; attempt += 1) {
    try {
      await locator.click({timeout: 2_000})
      return
    } catch (error) {
      lastError = error
      await page.waitForTimeout(150)
    }
  }
  throw lastError
}

const returnToPanelOverview = async (settings) => {
  const overview = settings.locator('.site-editor-panel-index')
  const back = settings.locator('.site-editor-panel-workspace-head > button')

  for (let depth = 0; depth < 4; depth += 1) {
    if (await overview.isVisible().catch(() => false)) return
    if (await back.isVisible().catch(() => false)) {
      await back.click()
      continue
    }
    await page.waitForTimeout(150)
  }

  await overview.waitFor({state: 'visible'})
}

try {
  await page.goto(`${baseUrl}/painel/site`, {waitUntil: 'domcontentloaded'})
  await page.waitForTimeout(500)

  const usernameField = page.getByLabel('Utilizador')
  const loginRequired =
    new URL(page.url()).pathname === '/painel/login' ||
    (await usernameField.isVisible().catch(() => false))

  if (loginRequired) {
    await usernameField.waitFor({state: 'visible', timeout: 10_000})
    await usernameField.fill(username)
    await page.getByLabel('Palavra-passe').fill(password)
    await page.getByRole('button', {name: 'Entrar', exact: true}).click()
  }

  try {
    await page.locator('.site-editor-shell').waitFor({state: 'visible', timeout: 15_000})
  } catch (error) {
    const diagnostic = path.join(repoRoot, 'test-results', 'editor-batch-2-login-failure.png')
    await page.screenshot({path: diagnostic, fullPage: true})
    throw new Error(
      `O editor não abriu em ${page.url()}. Evidência: ${diagnostic}\n${(
        await page.locator('body').innerText()
      ).slice(0, 1_500)}`,
      {cause: error},
    )
  }
  step('Sessão autenticada')
  await page.getByRole('button', {name: 'Abrir páginas e conteúdo'}).click()

  const navigation = page.locator('.site-editor-drawer.is-navigation')
  await navigation.getByRole('tab', {name: 'Conteúdo', exact: true}).click()

  const blogCollection = navigation
    .locator('.site-editor-tree-item.is-collection')
    .filter({hasText: 'Artigos do Blog'})

  if ((await blogCollection.getAttribute('aria-expanded')) === 'false') {
    await blogCollection.click()
  }

  const articleEntry = navigation
    .locator('.site-editor-tree-item')
    .filter({hasText: articleTitle})
  await articleEntry.waitFor({state: 'visible'})
  await articleEntry.click()
  step('Rascunho isolado selecionado')

  const closeNavigation = navigation.getByRole('button', {
    name: 'Fechar páginas e conteúdo',
    exact: true,
  })
  if (await closeNavigation.isVisible()) await closeNavigation.click()

  const settingsButton = page.getByRole('button', {name: 'Abrir definições'})
  const settings = page.locator('.site-editor-drawer.is-settings')
  if (!(await settings.isVisible().catch(() => false))) await settingsButton.click()
  await settings.waitFor({state: 'visible'})
  await returnToPanelOverview(settings)

  await settings
    .locator('.site-editor-panel-index > button')
    .filter({hasText: /^Texto do artigo/})
    .click()
  await settings.getByRole('button', {name: 'Editar artigo', exact: true}).click()

  const workspace = page.locator('.site-editor-article-workspace')
  await workspace.waitFor({state: 'visible'})
  step('Editor completo do artigo aberto')
  const editor = workspace.locator('[contenteditable="true"][aria-label="Texto do artigo"]')
  await editor.click()
  await page.keyboard.press('Meta+A')
  await page.keyboard.press('Backspace')

  const paragraph = async (text) => {
    await workspace.getByLabel('Formato do texto').selectOption('normal')
    await editor.pressSequentially(text)
    await editor.press('Enter')
  }
  const heading = async (text) => {
    await editor.pressSequentially(text)
    await workspace.getByLabel('Formato do texto').selectOption('h2')
    await editor.press('Enter')
    await workspace.getByLabel('Formato do texto').selectOption('normal')
  }

  await paragraph(
    'Um espaço exterior bem planeado começa pelo uso real, não pelo acabamento. Quando circulação, drenagem e manutenção são pensadas em conjunto, torna-se mais simples escolher materiais adequados e evitar correções futuras.',
  )
  await heading('Começar pelo uso real do espaço')
  await paragraph(
    'Antes de escolher um produto, vale a pena separar as zonas de passagem, descanso, estacionamento e plantação. Cada área pode pedir uma base, uma drenagem e uma resistência diferentes.',
  )

  await editor.pressSequentially('Identificar zonas de passagem e cargas previstas.')
  await workspace.getByRole('button', {name: 'Lista com marcadores'}).click()
  await editor.press('Enter')
  await editor.pressSequentially('Confirmar exposição ao sol, chuva e humidade.')
  await editor.press('Enter')
  await editor.pressSequentially('Prever acessos para limpeza e inspeção.')
  await editor.press('Enter')
  await editor.press('Enter')
  await requireNonEmptyCount(
    workspace.locator('.site-editor-rich-list-item.is-bullet'),
    3,
    'Lista com marcadores',
  )

  await heading('Comparar materiais para além do preço inicial')
  await paragraph(
    'O custo inicial é apenas uma parte da decisão. Manutenção, preparação da base, instalação, disponibilidade de peças e substituição futura também devem entrar na comparação.',
  )

  await heading('Detalhes que evitam correções futuras')
  await editor.pressSequentially('Medir a área e confirmar cotas antes da encomenda.')
  await workspace.getByRole('button', {name: 'Lista numerada'}).click()
  await editor.press('Enter')
  await editor.pressSequentially('Resolver drenagem e preparação da base antes do acabamento.')
  await editor.press('Enter')
  await editor.pressSequentially('Guardar a referência do produto e do acabamento escolhido.')
  await editor.press('Enter')
  await editor.press('Enter')
  await requireNonEmptyCount(
    workspace.locator('.site-editor-rich-list-item.is-number'),
    3,
    'Lista numerada',
  )

  const linkText = 'Conheça as soluções disponíveis.'
  await editor.pressSequentially(linkText)
  const linkParagraph = editor.locator('p').filter({hasText: linkText}).last()
  await selectVisibleText(linkParagraph, linkText)
  await workspace.getByRole('button', {name: 'Adicionar ligação'}).click()
  await workspace.getByLabel('Destino da ligação').fill('https://www.dafabrica4you.pt/produtos/')
  await workspace.getByRole('button', {name: 'Aplicar', exact: true}).click()
  await page.waitForTimeout(150)
  const editorLink = editor.getByRole('link', {name: 'Conheça as soluções disponíveis.'})
  await editorLink.waitFor({state: 'visible'})
  step('Texto, títulos, listas e ligação criados')

  await workspace.getByRole('button', {name: 'Adicionar tabela'}).click()
  const table = workspace.locator(
    '.site-editor-rich-object[data-object-type="articleTable"]',
  )
  await table.waitFor({state: 'visible'})
  await workspace.getByLabel('Nome da coluna 1').fill('Critério')
  await workspace.getByLabel('Nome da coluna 2').fill('Pergunta útil')
  await workspace.getByLabel('Linha 1, Critério').fill('Manutenção')
  await workspace
    .getByLabel('Linha 1, Pergunta útil')
    .fill('Que cuidados serão necessários ao longo do ano?')
  await workspace.getByLabel('Linha 2, Critério').fill('Instalação')
  await workspace
    .getByLabel('Linha 2, Pergunta útil')
    .fill('O suporte e a drenagem estão preparados?')
  await clickThroughRerender(
    workspace.getByRole('button', {name: '+ Linha', exact: true}),
  )
  await workspace.getByLabel('Linha 3, Critério').fill('Utilização')
  await workspace
    .getByLabel('Linha 3, Pergunta útil')
    .fill('O material suporta o uso e a carga previstos?')
  await table.getByRole('button', {name: 'Concluir edição da tabela'}).click()
  step('Tabela de decisão criada')

  const imageInput = workspace.locator('input[type="file"][accept="image/*"]')
  await imageInput.setInputFiles(articleImage)
  const imageBlock = workspace.locator('.site-editor-rich-object[data-object-type="image"]')
  await imageBlock.waitFor({state: 'visible', timeout: 30_000})
  await workspace.getByText('Descrição da imagem', {exact: true}).locator('..').locator('textarea').fill(
    'Amostras de materiais para espaços exteriores junto a plantas.',
  )
  await workspace.getByText('Legenda', {exact: true}).locator('..').locator('textarea').fill(
    'A escolha deve considerar o uso, a instalação e a manutenção prevista.',
  )
  await imageBlock.getByRole('button', {name: 'Concluir edição da imagem'}).click()
  step('Imagem editorial carregada e descrita')

  await workspace.getByRole('button', {name: 'Adicionar vídeo'}).click()
  await workspace
    .getByLabel('Link do YouTube')
    .fill('https://www.youtube.com/watch?v=h1wVIZRj0Hc')
  await workspace.getByLabel('Título', {exact: true}).fill('Conheça a DaFábrica4You')
  await workspace.getByRole('button', {name: 'Adicionar', exact: true}).click()
  await requireCount(workspace.locator('.site-editor-rich-canvas h2'), 3, 'Títulos de secção')
  await requireNonEmptyCount(
    workspace.locator('.site-editor-rich-list-item.is-bullet'),
    3,
    'Lista com marcadores final',
  )
  await requireNonEmptyCount(
    workspace.locator('.site-editor-rich-list-item.is-number'),
    3,
    'Lista numerada final',
  )
  await requireCount(editor.getByRole('link', {name: 'Conheça as soluções disponíveis.'}), 1, 'Ligação final')
  await requireCount(
    workspace.locator('.site-editor-rich-object[data-object-type="articleTable"]'),
    1,
    'Tabela final',
  )
  await requireCount(
    workspace.locator('.site-editor-rich-object[data-object-type="image"]'),
    1,
    'Imagem final',
  )
  await requireCount(
    workspace.locator('.site-editor-rich-object[data-object-type="youtubeEmbed"]'),
    1,
    'Vídeo final',
  )
  step('Estrutura completa validada antes de publicar')

  await page
    .locator('.site-editor-top-save')
    .filter({hasText: /Guardado|Tudo guardado/})
    .waitFor({state: 'visible', timeout: 20_000})
  await workspace.getByRole('button', {name: 'Concluir', exact: true}).click()

  const publishButton = page.locator('.site-editor-publish-button')
  await publishButton.getByText('Publicar', {exact: true}).waitFor({state: 'visible'})
  await publishButton.click()
  await publishButton.getByText('Publicado em PT', {exact: true}).waitFor({
    state: 'visible',
    timeout: 30_000,
  })
  step('Artigo publicado')

  const preview = await context.newPage()
  const articleUrl = `${baseUrl}/blog/${articleSlug}?lang=pt`
  const publishedHeading = preview.locator('h1').filter({hasText: articleTitle})
  for (let attempt = 0; attempt < 12; attempt += 1) {
    await preview.goto(articleUrl, {waitUntil: 'domcontentloaded', timeout: 15_000})
    if (await publishedHeading.isVisible().catch(() => false)) break
    await preview.waitForTimeout(2_000)
  }
  await publishedHeading.waitFor({state: 'visible', timeout: 5_000})
  await preview.getByRole('heading', {name: 'Começar pelo uso real do espaço'}).waitFor()
  await preview.locator('table').waitFor({state: 'visible'})
  await preview.locator('iframe[title="Conheça a DaFábrica4You"]').waitFor({state: 'visible'})
  await preview.getByRole('link', {name: 'Conheça as soluções disponíveis.'}).waitFor()
  await loadLazyArticleMedia(preview)
  step('Página pública validada')

  await page.bringToFront()
  const editorScreenshot = await saveScreenshot('editor')
  await preview.bringToFront()
  const desktopScreenshot = path.join(
    repoRoot,
    'test-results',
    'editor-batch-2-public-desktop.png',
  )
  await preview.screenshot({path: desktopScreenshot, fullPage: true})
  await preview.setViewportSize({width: 390, height: 844})
  await preview.reload({waitUntil: 'domcontentloaded'})
  await loadLazyArticleMedia(preview)
  const mobileScreenshot = path.join(repoRoot, 'test-results', 'editor-batch-2-public-mobile.png')
  await preview.screenshot({path: mobileScreenshot, fullPage: true})

  console.log(
    JSON.stringify(
      {
        article: articleUrl,
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

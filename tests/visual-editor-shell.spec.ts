import {expect, test, type Page, type TestInfo} from '@playwright/test'

/**
 * The editor's own chrome, snapshotted. The type scale and the notice were
 * raised for a client who could not read them, and "without breaking the rest
 * of it" is a claim that needs a picture rather than an argument.
 */
const e2eKey = 'df4y-playwright-site-editor'

const openEditor = async (page: Page, testInfo: TestInfo) => {
  const scope = `shell-${testInfo.project.name}-${Date.now()}`.toLowerCase()
  await page.setExtraHTTPHeaders({
    'x-df4y-site-editor-e2e': e2eKey,
    'x-df4y-site-editor-scope': scope,
  })
  await page.route('https://cdn.sanity.io/**', (route) =>
    route.fulfill({status: 200, contentType: 'image/png', body: Buffer.alloc(0)}),
  )
  await page.goto('/painel/site')
  await expect(page.locator('.site-editor-shell')).toBeVisible({timeout: 30_000})
  await page.addStyleTag({
    content: `*, *::before, *::after { animation: none !important; transition: none !important; }`,
  })
  await page.waitForTimeout(600)
}

test.describe('editor shell', () => {
  test('the editor chrome', async ({page}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Chrome snapshot runs once')
    await openEditor(page, testInfo)
    await expect(page.locator('.site-editor-shell')).toHaveScreenshot('editor-shell.png', {
      maxDiffPixelRatio: 0.01,
    })
  })

  test('the three notice tones', async ({page}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Notice snapshot runs once')
    await openEditor(page, testInfo)

    // Rendered directly rather than provoked through the UI: the point is to
    // compare the three tones side by side at a readable size, which no single
    // real interaction produces.
    await page.evaluate(() => {
      const host = document.createElement('div')
      host.id = 'notice-harness'
      host.style.cssText =
        'position:fixed;inset:0;z-index:9999;background:#eef3f1;display:grid;gap:22px;place-content:center;padding:40px;'
      host.innerHTML = ['success', 'warning', 'error']
        .map(
          (tone) => `
          <div class="site-editor-notice ${tone === 'success' ? '' : `is-${tone}`}"
               style="position:static;animation:none">
            <span>
              <strong>${
                tone === 'success'
                  ? 'Alterações publicadas'
                  : tone === 'warning'
                    ? 'Uma galeria está vazia'
                    : 'Não foi possível guardar'
              }</strong>
              <small>${
                tone === 'success'
                  ? 'O site já mostra a versão mais recente.'
                  : tone === 'warning'
                    ? 'A secção "Galeria" não tem imagens, por isso não aparece no site.'
                    : 'Verifique a ligação à internet e tente novamente.'
              }</small>
            </span>
            <button type="button" aria-label="Fechar">×</button>
          </div>`,
        )
        .join('')
      document.body.appendChild(host)
    })

    await expect(page.locator('#notice-harness')).toHaveScreenshot('editor-notices.png', {
      maxDiffPixelRatio: 0.01,
    })
  })
})

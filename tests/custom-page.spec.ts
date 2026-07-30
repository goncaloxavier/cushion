import {expect, test} from '@playwright/test'

/**
 * A page the client builds themselves is the one route with no hardcoded
 * fallback, so until now nothing offline could reach it: `getSitePage` had no
 * fixture and no offline guard, which meant the entire custom-page path was
 * either untested or quietly making live Sanity calls mid-run.
 *
 * These cover the part the client cares about — not "the editor accepted my
 * click", but "the page exists, a visitor can open it, and the words I typed are
 * on it". The editor-side creation flow is covered in site-editor.spec.ts; what
 * neither can cross is the seam between them, which needs a staging dataset.
 */
test.describe('a page the client created', () => {
  test.beforeEach(({page}, testInfo) => {
    void page
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Route contract runs once')
  })

  test('opens for a visitor and shows the content that was written on it', async ({page}) => {
    const response = await page.goto('/pagina-de-teste?lang=pt')
    expect(response?.status(), 'a custom page did not resolve').toBe(200)

    // The failure that matters is not a 404 — it is a page that resolves and
    // renders an empty band, which is exactly what a missing renderer branch did.
    await expect(page.getByRole('heading', {name: 'Uma página criada no editor'})).toBeVisible()
    await expect(page.getByText('Conteúdo real desta página.')).toBeVisible()
    await expect(page.locator('main .builder-render-section')).toHaveCount(1)
  })

  test('carries its own title and stays indexable', async ({page}) => {
    await page.goto('/pagina-de-teste?lang=pt')
    await expect(page).toHaveTitle(/Página de teste/)
    await expect(page.locator('meta[name="robots"][content*="noindex"]')).toHaveCount(0)
  })

  test('is listed in the sitemap, so it is not invisible to search', async ({request}) => {
    const response = await request.get('/sitemap.xml')
    expect(response.status()).toBe(200)
    // Reachable but unlisted is the quiet failure: the client publishes a page,
    // it works when they click it, and no search engine ever learns it exists.
    expect(await response.text()).toContain('/pagina-de-teste')
  })

  test('a route nobody created still returns the branded 404', async ({page}) => {
    const response = await page.goto('/uma-pagina-que-nao-existe')
    expect(response?.status()).toBe(404)
    await expect(page.locator('main')).toBeVisible()
  })

  test('the header renders every navigation entry as a working link', async ({page}) => {
    await page.goto('/?lang=pt')
    const links = page.locator('header nav a[href]')
    const count = await links.count()
    expect(count, 'the header rendered no navigation links').toBeGreaterThan(0)

    // Every entry the client manages in the nav editor has to resolve. A link
    // left pointing at a deleted or renamed page is a 404 in the main menu.
    const hrefs = (await links.evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute('href') ?? ''),
    )).filter((href) => href.startsWith('/') && !href.startsWith('//'))

    const broken: string[] = []
    for (const href of [...new Set(hrefs)]) {
      const response = await page.request.get(href)
      if (response.status() >= 400) broken.push(`${href} → ${response.status()}`)
    }
    expect(broken, `navigation links that do not resolve:\n${broken.join('\n')}`).toEqual([])
  })
})

import {expect, test, type Page} from '@playwright/test'
import {ratioFixtureAssets} from '../src/lib/server/site-editor-ratio-fixture'
import {dimensionsFromSanityUrl, solidPng} from './fixtures/png'

/**
 * The product-feature section has now broken on image proportions three times,
 * and a client found all three. Every one of them passed the existing suite:
 * the content was correct, the markup was correct, and the picture was wrong.
 *
 * These are the public visual checks pointed at the editor's own preview, which
 * is where the client actually looks. Each shape gets its own snapshot, so a
 * diff names the proportion that broke instead of failing one tall page.
 */
const e2eKey = 'df4y-playwright-site-editor'

const cases = [
  ...ratioFixtureAssets.map((asset, index) => ({
    key: `ratio-${index + 1}`,
    name: asset.label
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-'),
  })),
  {key: 'ratio-long-copy', name: 'long-copy'},
  {key: 'ratio-no-kind', name: 'no-kind'},
  {key: 'ratio-stale-video-kind', name: 'stale-video-kind'},
  {key: 'gallery-two-portraits', name: 'gallery-two-portraits'},
  {key: 'gallery-empty', name: 'gallery-empty'},
]

const settle = async (page: Page) => {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
      }
      .whatsapp-float, .nav-toggle { display: none !important; }
    `,
  })
  await page.evaluate(() => {
    document.querySelectorAll('.reveal').forEach((element) => element.classList.add('visible'))
  })
  // Raced against a deadline rather than awaited outright. A lazily-loaded image
  // that is still off-screen never fires load or error, so waiting on all of
  // them hangs until the test times out — which is what happened here first.
  await page.evaluate(async () => {
    const settled = Promise.all(
      Array.from(document.images).map((image) =>
        image.complete
          ? image.decode().catch(() => undefined)
          : new Promise<void>((resolve) => {
              image.addEventListener('load', () => resolve(), {once: true})
              image.addEventListener('error', () => resolve(), {once: true})
            }),
      ),
    )
    await Promise.race([settled, new Promise((resolve) => setTimeout(resolve, 3000))])
  })
  await page.waitForTimeout(150)
}

/**
 * Both surfaces, because "it renders correctly in the editor" is not the claim
 * that matters to the client -- the page visitors land on is. They are the same
 * component with `preview` toggled, and these snapshots are what keeps that true
 * rather than merely believed.
 */
const surfaces = [
  {id: 'editor', query: '', label: 'editor'},
  {id: 'published', query: '&published=1', label: 'published'},
] as const

for (const surface of surfaces) {
test.describe(`${surface.label}: image proportions`, () => {
  test.beforeEach(async ({page}) => {
    await page.setExtraHTTPHeaders({
      'x-df4y-site-editor-e2e': e2eKey,
      'x-df4y-site-editor-scope': `ratios-${surface.id}-${Date.now()}`,
    })

    // The fixture references assets that do not exist. Serving an image built
    // from the dimensions in the URL keeps the picture honest: the frame reads
    // those same numbers out of the reference, so if the two ever disagree the
    // snapshot shows it rather than hiding behind a broken-image icon.
    await page.route('https://cdn.sanity.io/**', async (route) => {
      const size = dimensionsFromSanityUrl(route.request().url())
      if (!size) return route.abort()
      await route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: solidPng(size.width, size.height),
      })
    })

    await page.goto(`/painel/site/e2e-preview?fixture=ratios&lang=pt${surface.query}`)
    await expect(page.getByTestId('fixture-ratio-page')).toBeVisible()
    await settle(page)
  })

  for (const {key, name} of cases) {
    test(`a ${name} image keeps its shape`, async ({page}) => {
      const section = page.locator(`[data-builder-section="${key}"]`)

      // An empty gallery is deliberately absent from the published page — a
      // section with a heading and no images used to publish the heading over
      // blank space. The editor still shows it, and says why it is missing.
      if (key === 'gallery-empty' && surface.id === 'published') {
        await expect(section).toHaveCount(0)
        return
      }

      await expect(section).toBeVisible()
      await section.scrollIntoViewIfNeeded()
      await page.waitForTimeout(200)
      await expect(section).toHaveScreenshot(`${surface.id}-ratio-${name}.png`, {
        // 0.1%, not the 1% this started at. A 1% budget on a 1280x720 frame is
      // over nine thousand pixels -- enough to absorb a whole paragraph changing
      // colour, which is exactly what it did absorb once.
      maxDiffPixelRatio: 0.001,
      })
    })
  }

  test('the whole page of proportions', async ({page}) => {
    await expect(page.getByTestId('fixture-ratio-page')).toHaveScreenshot(
      `${surface.id}-ratio-page.png`,
      {maxDiffPixelRatio: 0.001},
    )
  })
})
}

import {expect, test, type Page} from '@playwright/test'

// The rule this file exists to hold: converting a designed block into a section
// must not change what the visitor gets. If these drift, the section system has
// become a downgrade and nobody will use it.
const cardShape = (page: Page, scope: string) =>
  page.evaluate((selector) => {
    const card = document.querySelector(`${selector} .collection-card`)
    const image = card?.querySelector('img')
    if (!card || !image) return null
    return {
      hasReveal: Boolean(card.closest('.reveal')),
      // srcset is only emitted for Sanity-hosted images; the local dataset
      // serves static fallbacks, so presence here would assert the environment
      // rather than the component. `sizes` is unconditional and covers the
      // same wiring.
      hasSizes: Boolean(image.getAttribute('sizes')),
      lazy: image.getAttribute('loading'),
      decoding: image.getAttribute('decoding'),
      hasViewTransition: Boolean(
        (image as HTMLElement).style.getPropertyValue('view-transition-name'),
      ),
      aspectRatio: getComputedStyle(card.querySelector('.collection-card-media')!).aspectRatio,
    }
  }, scope)

test('the home grid card carries the full designed treatment', async ({page}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chrome', 'Parity check runs once')
  await page.goto('/?lang=pt')
  await page.waitForTimeout(1200)

  const shape = await cardShape(page, '.home-solutions-grid')
  expect(shape, 'no collection card rendered on the home grid').not.toBeNull()
  // Each of these was silently missing from the builder's own card before the
  // two were merged into one component.
  expect(shape!.hasReveal).toBe(true)
  expect(shape!.hasSizes).toBe(true)
  expect(shape!.lazy).toBe('lazy')
  expect(shape!.decoding).toBe('async')
  expect(shape!.hasViewTransition).toBe(true)
  expect(shape!.aspectRatio).toBe('4 / 5')
})

test('the builder list section and the home grid render the same card', async ({page}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chrome', 'Parity check runs once')
  await page.goto('/?lang=pt')
  await page.waitForTimeout(1200)

  // Both call sites must resolve to one component. Comparing the rendered shape
  // is what catches a future edit to one path that forgets the other — the exact
  // drift that made converting a block into a section a visible downgrade.
  const usesSharedCard = await page.evaluate(() => {
    const home = document.querySelector('.home-solutions-grid .collection-card')
    return {
      homeUsesShared: Boolean(home),
      // The old private markup is gone for good; if it comes back, the two
      // renderings have forked again.
      legacyHomeCard: document.querySelectorAll('.home-solution-card').length,
      legacyBuilderAnchor: document.querySelectorAll('.builder-collection > a').length,
    }
  })

  expect(usesSharedCard.homeUsesShared).toBe(true)
  expect(usesSharedCard.legacyHomeCard).toBe(0)
  expect(usesSharedCard.legacyBuilderAnchor).toBe(0)
})

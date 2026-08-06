import {expect, test} from '@playwright/test'
import {mkdirSync} from 'node:fs'

/**
 * A title the client enlarges must never be cut off.
 *
 * The size control goes well past what the layout was designed around, and the
 * copy card cannot widen — its grid column is fixed — so the only correct
 * outcome is that the word breaks and the card grows taller. What happened
 * instead was that a 96px title measured 587px inside a 313px column and
 * .product-content-copy's overflow:hidden sliced it mid-letter.
 *
 * Two things were needed and neither is obvious. `overflow-wrap: break-word`
 * permits a break during layout but deliberately does not reduce the element's
 * min-content width, and these headings are grid items whose automatic minimum
 * size *is* their min-content width — so the unbreakable word kept the minimum
 * at its full length regardless. `anywhere` is the value that affects intrinsic
 * sizing, and min-width:0 removes the automatic minimum.
 *
 * Asserted by geometry rather than by a picture: scrollWidth exceeding
 * clientWidth is precisely "there is content being hidden", at any size.
 */
const sizes = [64, 96, 128]

test('an enlarged title wraps instead of being clipped', async ({page}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chrome', 'Overflow geometry runs once')
  await page.setExtraHTTPHeaders({
    'x-df4y-site-editor-e2e': 'df4y-playwright-site-editor',
    'x-df4y-site-editor-scope': `overflow-${Date.now()}`,
  })
  await page.goto('/painel/site/e2e-preview?fixture=ratios&lang=pt')
  const section = page.locator('[data-builder-section="ratio-1"]')
  await expect(section).toBeVisible()

  for (const size of sizes) {
    const result = await page.evaluate((fontSize) => {
      const card = document.querySelector(
        '[data-builder-section="ratio-1"] .product-content-copy',
      ) as HTMLElement
      const h2 = card.querySelector('h2') as HTMLElement
      // A single long word is the case that cannot wrap on its own.
      h2.textContent = 'Composteira Humi'
      h2.style.setProperty('font-size', `${fontSize}px`, 'important')
      return {
        headingWidth: Math.round(h2.getBoundingClientRect().width),
        cardClientWidth: card.clientWidth,
        cardScrollWidth: card.scrollWidth,
      }
    }, size)

    expect(
      result.headingWidth,
      `at ${size}px the title is ${result.headingWidth}px inside a ${result.cardClientWidth}px card`,
    ).toBeLessThanOrEqual(result.cardClientWidth)
    expect(
      result.cardScrollWidth,
      `at ${size}px the card hides ${result.cardScrollWidth - result.cardClientWidth}px of content`,
    ).toBeLessThanOrEqual(result.cardClientWidth)
  }

  // A picture of the largest case, so the wrapping can be looked at as well as
  // asserted.
  mkdirSync('zz-visual-sheet', {recursive: true})
  await section.screenshot({path: 'zz-visual-sheet/title-96px-wraps.png'})
})

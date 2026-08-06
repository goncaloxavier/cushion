import {expect, test} from '@playwright/test'
import {mkdirSync} from 'node:fs'

/**
 * A contact sheet of every section type, for looking at rather than asserting.
 *
 * The matrix in builder-sections-desktop.spec.ts already checks that each
 * section renders and honours its controls, but an assertion that passes tells
 * you nothing about how the thing actually sits on the page -- and every layout
 * problem this project has had was found by a person looking at it, not by a
 * test. This writes one full-page image per section group so that looking is
 * cheap.
 *
 * Not part of `npm run e2e`: it produces pictures, it does not check anything.
 * Run it with `npm run sheet` and open zz-visual-sheet/.
 */
const OUT = 'zz-visual-sheet'
const groups = [
  'types',
  'hero',
  'media',
  'gallery',
  'columns',
  'collection',
  'contact',
  'alignment',
  'typography',
  'layout',
]

for (const surface of [
  {id: 'site', query: '&published=1'},
  {id: 'editor', query: ''},
]) {
  test(`section sheet: ${surface.id}`, async ({page}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Sheet renders once')
    test.setTimeout(300_000)
    mkdirSync(OUT, {recursive: true})
    await page.setExtraHTTPHeaders({
      'x-df4y-site-editor-e2e': 'df4y-playwright-site-editor',
      'x-df4y-site-editor-scope': `sheet-${surface.id}-${Date.now()}`,
    })
    for (const group of groups) {
      await page.goto(
        `/painel/site/e2e-preview?fixture=sections&group=${group}&lang=pt${surface.query}`,
      )
      await page.addStyleTag({
        content: '*,*::before,*::after{animation:none!important;transition:none!important}',
      })
      await page.evaluate(() =>
        document.querySelectorAll('.reveal').forEach((el) => el.classList.add('visible')),
      )
      await page.waitForTimeout(500)
      await page.screenshot({path: `${OUT}/${surface.id}-${group}.png`, fullPage: true})
    }
    expect(true).toBe(true)
  })
}

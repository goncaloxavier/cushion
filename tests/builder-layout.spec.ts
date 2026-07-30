import {expect, test, type Page} from '@playwright/test'

/**
 * Layout contract for pages built out of sections, on desktop.
 *
 * The reported problem was not a finished page looking wrong — it was what a
 * page looks like *while the client works on it*: a section added and not filled
 * in, a section hidden instead of deleted, a page reduced to one block after the
 * rest were removed. Those states never appeared in any test, so nothing checked
 * that adding and removing sections leaves the layout intact.
 *
 * Each fixture route below is one of those states. The assertions are the rules
 * a person would apply looking at the screen: nothing overflows sideways, no
 * column collapses to nothing, no band of empty colour, and the page still ends
 * where the footer begins.
 *
 * Mobile is deliberately not covered yet.
 */

const ROUTES = [
  {path: '/pagina-de-teste', label: 'one written section'},
  {path: '/pagina-composta', label: 'a full page: hero, media and call to action'},
  {path: '/pagina-reduzida', label: 'everything removed but the hero'},
  {path: '/pagina-por-preencher', label: 'a section added and not filled in'},
  {path: '/pagina-com-oculta', label: 'a section hidden rather than deleted'},
] as const

type SectionReport = {
  index: number
  type: string
  width: number
  height: number
  top: number
  bottom: number
  hasText: boolean
  hasMedia: boolean
  emptyState: boolean
  zeroWidthChildren: string[]
  overflowingChildren: string[]
}

const inspect = (page: Page) =>
  page.evaluate(`(function () {
    function box(el) { var b = el.getBoundingClientRect(); return {w: b.width, h: b.height, top: b.top + window.scrollY, bottom: b.bottom + window.scrollY} }

    var sections = [].slice.call(document.querySelectorAll('main .builder-render-section'))
    var report = sections.map(function (section, index) {
      var b = box(section)
      var type = (section.className.match(/is-builder[A-Za-z]+/) || ['unknown'])[0]

      // A grid column squeezed to nothing hides whatever was in it. Only direct
      // children of the section's own layout rows are worth measuring.
      var zero = []
      var overflow = []
      var kids = [].slice.call(section.querySelectorAll('.builder-hero > *, .builder-media-copy > *, .builder-render-inner > *'))
      kids.forEach(function (kid) {
        var kb = box(kid)
        if (kb.w < 1 && kid.textContent && kid.textContent.trim()) zero.push(kid.className || kid.tagName)
        if (kb.w - b.w > 1) overflow.push((kid.className || kid.tagName) + ' ' + Math.round(kb.w) + '>' + Math.round(b.w))
      })

      return {
        index: index,
        type: type,
        width: Math.round(b.w),
        height: Math.round(b.h),
        top: Math.round(b.top),
        bottom: Math.round(b.bottom),
        hasText: Boolean((section.innerText || '').trim()),
        hasMedia: Boolean(section.querySelector('img, video, iframe')),
        emptyState: Boolean(section.querySelector('.builder-empty-state')),
        zeroWidthChildren: zero,
        overflowingChildren: overflow
      }
    })

    var footer = document.querySelector('footer')
    var main = document.querySelector('main')
    return {
      sections: report,
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      footerTop: footer ? Math.round(box(footer).top) : null,
      mainBottom: main ? Math.round(box(main).bottom) : null
    }
  })()`) as Promise<{
    sections: SectionReport[]
    viewportWidth: number
    documentWidth: number
    footerTop: number | null
    mainBottom: number | null
  }>

test.describe('a page built from sections keeps its layout', () => {
  test.beforeEach(async ({page}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Desktop layout contract; mobile comes later')
    await page.addInitScript(() => {
      try {
        localStorage.setItem('df4y-cookie-notice-seen', '1')
      } catch {
        // private mode
      }
    })
  })

  for (const route of ROUTES) {
    test(`${route.label}`, async ({page}) => {
      await page.goto(`${route.path}?lang=pt`)
      await expect(page.locator('main .builder-render-section').first()).toBeVisible()
      const result = await inspect(page)

      expect(result.sections.length, 'the page rendered no sections at all').toBeGreaterThan(0)

      // Nothing may push the page sideways. A single overflowing section gives
      // the whole site a horizontal scrollbar.
      expect(
        result.documentWidth,
        `the page is ${result.documentWidth}px wide in a ${result.viewportWidth}px window`,
      ).toBeLessThanOrEqual(result.viewportWidth + 1)

      for (const section of result.sections) {
        const where = `${route.path} section ${section.index} (${section.type})`

        expect(section.width, `${where} is not full width`).toBeGreaterThan(result.viewportWidth * 0.9)
        expect(section.zeroWidthChildren, `${where} has a column squeezed to zero width`).toEqual([])
        expect(section.overflowingChildren, `${where} has content wider than the section`).toEqual([])

        // The one that produced the blank band on the live site: a section
        // occupying vertical space while showing the visitor nothing. An
        // explicit "add something here" placeholder counts as showing something.
        const showsSomething = section.hasText || section.hasMedia || section.emptyState
        expect(showsSomething, `${where} takes up ${section.height}px and renders nothing`).toBe(true)
      }

      // Sections must sit flush against each other and against the footer. A gap
      // here is the band of background colour the client sees above the footer.
      const ordered = [...result.sections].sort((a, b) => a.top - b.top)
      for (let index = 1; index < ordered.length; index += 1) {
        const gap = ordered[index].top - ordered[index - 1].bottom
        expect(gap, `${route.path}: ${gap}px of empty page between sections ${index - 1} and ${index}`).toBeLessThanOrEqual(1)
      }

      const tail = ordered[ordered.length - 1]
      expect(
        (result.footerTop ?? 0) - tail.bottom,
        `${route.path}: empty page between the last section and the footer`,
      ).toBeLessThanOrEqual(1)
    })
  }

  test('a hidden section takes up no space on the public page', async ({page}) => {
    await page.goto('/pagina-com-oculta?lang=pt')
    await expect(page.locator('main .builder-render-section').first()).toBeVisible()

    // Hiding is not deleting: the client expects the block to keep existing in
    // the editor while contributing nothing to the page a visitor loads.
    await expect(page.getByText('Não deve aparecer')).toHaveCount(0)
    const result = await inspect(page)
    expect(result.sections).toHaveLength(1)
  })
})

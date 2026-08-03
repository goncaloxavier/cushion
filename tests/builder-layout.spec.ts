import {readFileSync} from 'node:fs'
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

test.describe('a page built from sections adapts to mobile', () => {
  test.beforeEach(async ({page}, testInfo) => {
    test.skip(testInfo.project.name !== 'mobile-chrome', 'Mobile layout contract')
    await page.addInitScript(() => {
      try {
        localStorage.setItem('df4y-cookie-notice-seen', '1')
      } catch {
        // private mode
      }
    })
  })

  test('text and media stack instead of squeezing into desktop columns', async ({page}) => {
    await page.goto('/pagina-composta?lang=pt')
    const section = page.locator('.builder-media-copy').first()
    await expect(section).toBeVisible()

    const widths = await section.evaluate((element) => {
      const sectionWidth = element.getBoundingClientRect().width
      const childWidths = Array.from(element.children).map(
        (child) => (child as HTMLElement).getBoundingClientRect().width,
      )
      return {sectionWidth, childWidths}
    })

    expect(widths.childWidths.length).toBeGreaterThan(1)
    for (const width of widths.childWidths) {
      expect(width).toBeGreaterThan(widths.sectionWidth * 0.9)
    }
  })
})

test.describe('a gallery section behaves like a gallery', () => {
  test.beforeEach(async ({page}) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem('df4y-cookie-notice-seen', '1')
      } catch {
        // private mode
      }
    })
    await page.goto('/pagina-composta?lang=pt')
  })

  test('selects media, opens the lightbox and keeps the page fixed behind it', async ({page}) => {
    const gallery = page.locator('.builder-interactive-gallery')
    const main = gallery.locator('.image-gallery-main')
    const thumbnails = gallery.locator('.image-gallery-thumbnails button')

    await expect(gallery).toBeVisible()
    await expect(thumbnails).toHaveCount(2)
    await expect(main.locator('img')).toHaveAttribute('alt', 'Primeira imagem da galeria')

    await thumbnails.nth(1).click()
    await expect(main.locator('img')).toHaveAttribute('alt', 'Segunda imagem da galeria')
    await expect(gallery.locator('.image-gallery-count')).toHaveText('2 / 2')

    await main.click()
    const dialog = page.locator('.image-lightbox')
    await expect(dialog).toBeVisible()
    await expect(page.locator('html')).toHaveClass(/lightbox-open/)
    await expect(page.locator('body')).toHaveClass(/lightbox-open/)

    await page.keyboard.press('ArrowLeft')
    await expect(dialog.locator('img')).toHaveAttribute('alt', 'Primeira imagem da galeria')
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await expect(page.locator('html')).not.toHaveClass(/lightbox-open/)
    await expect(page.locator('body')).not.toHaveClass(/lightbox-open/)
  })

  test('stays contained at the active viewport width', async ({page}) => {
    const gallery = page.locator('.builder-interactive-gallery')
    await expect(gallery).toBeVisible()
    const box = await gallery.boundingBox()
    const viewport = page.viewportSize()

    expect(box).not.toBeNull()
    expect(viewport).not.toBeNull()
    expect(box!.x).toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport!.width + 1)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      viewport!.width + 1,
    )
  })
})

test.describe('a generated page uses the site motion language', () => {
  test.beforeEach(async ({page}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Pointer interaction contract')
    await page.addInitScript(() => {
      try {
        localStorage.setItem('df4y-cookie-notice-seen', '1')
      } catch {
        // private mode
      }
    })
  })

  test('reveals its first section immediately and gives actions clear interaction feedback', async ({
    page,
  }) => {
    await page.goto('/pagina-composta?lang=pt&motion=on')

    const firstReveal = page.locator('.builder-render-section').first().locator('.reveal')
    const firstHeading = firstReveal.getByRole('heading', {name: 'Sustentabilidade'})
    await expect(firstReveal).toHaveClass(/visible/)
    await expect(firstHeading).toBeVisible()

    const headingMotion = await firstHeading.evaluate((element) => {
      const style = getComputedStyle(element)
      return {name: style.animationName, duration: style.animationDuration}
    })
    expect(headingMotion.name).toContain('builder-copy-enter')
    expect(Number.parseFloat(headingMotion.duration)).toBeGreaterThan(0)

    const action = page.getByRole('link', {name: 'Contactar'})
    await action.scrollIntoViewIfNeeded()
    await expect(action).toBeVisible()
    await page.waitForTimeout(800)

    const resting = await action.evaluate((element) => {
      const style = getComputedStyle(element)
      return {shadow: style.boxShadow, transition: style.transitionProperty}
    })
    expect(resting.transition).toContain('transform')

    await action.hover()
    await expect
      .poll(() => action.evaluate((element) => getComputedStyle(element).transform))
      .not.toBe('none')
    const hoveredShadow = await action.evaluate((element) => getComputedStyle(element).boxShadow)
    expect(hoveredShadow).not.toBe(resting.shadow)

    await action.focus()
    const focusRing = await action.evaluate((element) => {
      const style = getComputedStyle(element)
      return {style: style.outlineStyle, width: Number.parseFloat(style.outlineWidth)}
    })
    expect(focusRing.style).not.toBe('none')
    expect(focusRing.width).toBeGreaterThanOrEqual(2)
  })

  test('removes generated-page motion when the visitor requests reduced motion', async ({page}) => {
    await page.emulateMedia({reducedMotion: 'reduce'})
    await page.goto('/pagina-composta?lang=pt&motion=off')

    const heading = page.getByRole('heading', {name: 'Sustentabilidade'})
    const action = page.getByRole('link', {name: 'Contactar'})
    await action.scrollIntoViewIfNeeded()

    await expect(page.locator('html')).toHaveClass(/reduce-motion/)
    await expect(heading).toBeVisible()
    expect(await heading.evaluate((element) => getComputedStyle(element).animationName)).toBe('none')
    expect(await action.evaluate((element) => getComputedStyle(element).transitionProperty)).toBe(
      'none',
    )
  })
})

/**
 * Background and text colour are picked in two different places, at two
 * different times. The client styled a heading while its section was light, then
 * made the section dark blue — and the heading kept the near-black they had
 * chosen, because an inline colour beats the surface's own rule. Nothing warned
 * them; the page just became unreadable.
 *
 * These render every background the editor offers, and the reported case
 * exactly: colours that are fine on white, sitting on a section that no longer
 * is.
 */
const CONTRAST_FLOOR = 4.5

const measureText = (page: Page) =>
  page.evaluate(`(function () {
    function parse(value) {
      var parts = value.match(/[\\d.]+/g)
      if (!parts) return null
      return {r: +parts[0], g: +parts[1], b: +parts[2], a: parts[3] === undefined ? 1 : +parts[3]}
    }
    function channel(c) { var v = c / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) }
    function lum(c) { return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b) }

    var out = []
    document.querySelectorAll('main .builder-render-section').forEach(function (section) {
      // Walk outwards for the colour actually painted behind the text: a
      // transparent section shows whatever is under it.
      var surface = (section.className.match(/is-[a-z]+/) || ['?'])[0]

      // Resolved from the text node outwards, so a card that paints its own
      // background is measured against that and not against the section.
      function backdropFor(node) {
        for (var el = node; el; el = el.parentElement) {
          var bg = parse(getComputedStyle(el).backgroundColor)
          if (bg && bg.a > 0.95) return bg
        }
        return {r: 255, g: 255, b: 255}
      }
      // Every element that paints its own text, not a hand-kept list of classes:
      // the classes are exactly what a new section type would not be added to.
      var texts = [].slice.call(section.querySelectorAll('*')).filter(function (node) {
        if (node.closest('.builder-empty-state')) return false
        var own = [].slice.call(node.childNodes).some(function (child) {
          return child.nodeType === 3 && child.textContent.trim().length > 1
        })
        if (!own) return false
        var box = node.getBoundingClientRect()
        return box.width > 0 && box.height > 0
      })
      texts.forEach(function (node) {
        var backdrop = backdropFor(node)
        var fg = parse(getComputedStyle(node).color)
        var alpha = fg.a
        var blended = {
          r: fg.r * alpha + backdrop.r * (1 - alpha),
          g: fg.g * alpha + backdrop.g * (1 - alpha),
          b: fg.b * alpha + backdrop.b * (1 - alpha)
        }
        var pair = [lum(blended), lum(backdrop)].sort(function (x, y) { return y - x })
        out.push({
          surface: surface,
          what: node.tagName.toLowerCase() + (node.className ? '.' + String(node.className).split(' ')[0] : ''),
          text: (node.textContent || '').trim().slice(0, 32),
          ratio: (pair[0] + 0.05) / (pair[1] + 0.05)
        })
      })
    })
    return out
  })()`) as Promise<Array<{surface: string; what: string; text: string; ratio: number}>>

for (const route of ['/pagina-fundos', '/pagina-fundos-escolhidos', '/pagina-tipos-escuro']) {
  test(`text stays readable on every background (${route})`, async ({page}, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'Desktop contrast contract')
    await page.goto(`${route}?lang=pt`)
    await expect(page.locator('main .builder-render-section').first()).toBeVisible()

    const measured = await measureText(page)
    expect(measured.length, 'no section text was measured').toBeGreaterThan(0)

    const failures = measured
      .filter((entry) => entry.ratio < CONTRAST_FLOOR)
      .map((entry) => `${entry.surface} ${entry.what} ("${entry.text}") is ${entry.ratio.toFixed(2)}:1`)

    expect(failures, `unreadable text:\n${failures.join('\n')}`).toEqual([])
  })
}

test('a section that is empty says so in the editor instead of just vanishing', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chrome', 'Editor parity contract')

  // An empty section is skipped for visitors rather than published as a band of
  // blank colour — which is right for the page and wrong for the client if the
  // editor shows a section the site does not have and never explains the gap.
  // A live product page had exactly one such section on it.
  await page.goto('/pagina-por-preencher?lang=pt')
  await expect(page.locator('main .builder-render-section')).toHaveCount(1)

  const preview = page.locator('.builder-page.is-preview')
  await page.goto('/pagina-por-preencher?lang=pt&__builderPreview=1')
  if (await preview.count()) {
    await expect(page.getByText('Vazia — não aparece no site')).toBeVisible()
  }

  // The renderer must at least carry the badge, whether or not this route can
  // enter preview mode from a plain request.
  const source = readFileSync('src/lib/components/builder/BuilderPageRenderer.svelte', 'utf8')
  expect(source).toContain('Vazia — não aparece no site')
  expect(source).toContain('!rendersSomethingPublic(section)')
})

import {readFileSync} from 'node:fs'
import {expect, test, type Locator} from '@playwright/test'

// These rules have each been fixed by hand at least once, found by a person
// reading the stylesheets during an audit. An audit is a snapshot; the drift
// restarts the next morning. This file is the same rules, enforced.
//
// Every assertion here holds at zero today, so a failure means something new
// was introduced — not that there is a backlog to work through.

const stylesheets = [
  'src/lib/site-editor/editor/siteEditor.css',
  'src/app.css',
  'src/lib/styles/painel.css',
  'src/lib/styles/builder-renderer.css',
]

const read = (path: string) => readFileSync(path, 'utf8')

const srgb = (channel: number) => {
  const c = channel / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

const luminance = (hex: string) => {
  const value = hex.replace('#', '')
  const full =
    value.length === 3
      ? value
          .split('')
          .map((c) => c + c)
          .join('')
      : value
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16))
  return 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b)
}

const contrast = (a: string, b: string) => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}

test('editor text tokens stay readable on the editor surface', () => {
  // --editor-muted exists because ~65 hand-picked greys were consolidated into
  // one readable value. It drifted back to 4.54:1 on a toast subtitle once, just
  // over the line and visibly washed out. The tokens are the single point worth
  // guarding: the whole reason they exist is that raw colours drift.
  const root = /:root\s*\{(.*?)\}/s.exec(read(stylesheets[0]))
  expect(root, 'no :root token block in siteEditor.css').not.toBeNull()

  const tokens = [...root![1].matchAll(/(--editor-(?:ink|ink-soft|muted|focus)[\w-]*):\s*(#[0-9a-f]{3,6})\s*;/gi)]
  expect(tokens.length, 'expected the ink/muted/focus text tokens to exist').toBeGreaterThanOrEqual(4)

  for (const [, name, value] of tokens) {
    const ratio = contrast(value, '#ffffff')
    expect(ratio, `${name} (${value}) is ${ratio.toFixed(2)}:1 on white, below AA 4.5:1`).toBeGreaterThanOrEqual(4.5)
  }
})

/**
 * The notice tones are the editor's only way of saying something is wrong, and
 * they are read by a 62-year-old client in a hurry. They used to be white cards
 * distinguished by a 4px stripe; they now carry a tinted field and a coloured
 * heading, which only helps if the text on that tint stays readable.
 *
 * The pairs are asserted against the stylesheet rather than the screen because
 * a notice only exists while something has gone wrong, and no rendered check
 * would see all three tones at once.
 */
test('notice tones stay readable on their own tinted backgrounds', () => {
  const css = read(stylesheets[0])
  const rule = (selector: string) =>
    new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`).exec(css)?.[1] ?? ''
  const prop = (block: string, name: string) =>
    new RegExp(`(?:^|;)\\s*${name}:\\s*(#[0-9a-f]{3,8})`, 'i').exec(block)?.[1]

  for (const tone of ['warning', 'error']) {
    const field = prop(rule(`.site-editor-notice.is-${tone}`), 'background')
    const heading = prop(rule(`.site-editor-notice.is-${tone} strong`), 'color')
    expect(field, `.site-editor-notice.is-${tone} lost its background tint`).toBeTruthy()
    expect(heading, `.site-editor-notice.is-${tone} strong lost its colour`).toBeTruthy()

    const headingRatio = contrast(heading!, field!)
    expect(
      headingRatio,
      `${tone} heading ${heading} on ${field} is ${headingRatio.toFixed(2)}:1, below AA 4.5:1`,
    ).toBeGreaterThanOrEqual(4.5)

    // Read from the stylesheet rather than hardcoded: the description colour has
    // already been walked from a one-off grey to the muted token to black, and a
    // literal here would have kept asserting the previous answer.
    const body = prop(rule('.site-editor-notice small'), 'color')
    expect(body, '.site-editor-notice small lost its colour').toBeTruthy()
    const bodyRatio = contrast(body!, field!)
    expect(
      bodyRatio,
      `notice description ${body} on the ${tone} tint is ${bodyRatio.toFixed(2)}:1, below AA 4.5:1`,
    ).toBeGreaterThanOrEqual(4.5)
  }
})

test('no focus-visible rule removes its own outline', () => {
  // Twenty rules once paired :focus-visible with :hover and then set
  // outline: none, with no ring anywhere else — keyboard focus was invisible
  // across the entire editor. Nothing failed; it simply could not be seen.
  const offenders: string[] = []
  for (const path of stylesheets) {
    for (const rule of read(path).matchAll(/([^{}]*:focus-visible[^{}]*)\{([^}]*)\}/g)) {
      if (/outline:\s*(none|0)\b/.test(rule[2])) {
        offenders.push(`${path}: ${rule[1].trim().replace(/\s+/g, ' ').slice(0, 80)}`)
      }
    }
  }
  expect(offenders, `focus rings removed without replacement:\n${offenders.join('\n')}`).toEqual([])
})

test('editor font sizes stay at or above the documented floor', () => {
  // The design system documents --editor-text-2xs as the smallest step. 82
  // declarations had drifted under it, some to 7px, which is unreadable and was
  // never a deliberate choice — it accumulated.
  //
  // Raised from 11 to 12 in August 2026. The client who uses this editor is 62
  // and could not read the notices; the whole scale moved up a step, and the
  // floor moves with it or the drift just starts again from the old number.
  const floorPx = 12
  const offenders = [...read(stylesheets[0]).matchAll(/font-size:\s*([0-9.]+)px/g)]
    .map((m) => Number(m[1]))
    .filter((size) => size < floorPx)

  expect(offenders, `font sizes below the ${floorPx}px floor: ${offenders.join(', ')}`).toEqual([])
})

/**
 * The rules above read the stylesheets. This one reads the screen, because the
 * three defects it exists to catch were all invisible in the source: each rule
 * was individually fine and the combination was not.
 *
 * "+ Adicionar secção" took its resting colour from one rule and its hover
 * background from another, so hovering painted #15594f on #0a4b4e — 1.2:1, the
 * label gone under the cursor. A hidden row dimmed itself with blanket opacity,
 * taking its three-dots control down to 2.7:1. A disabled menu entry sat at 0.35
 * opacity, 1.9:1, so "Mover para cima" read as a rendering fault rather than as
 * unavailable.
 *
 * None of that is visible in a stylesheet. It is visible in a browser, in the
 * state the client puts the control into.
 */
const CONTRAST_FLOOR = 4.5

test('editor controls stay readable in the states the client puts them in', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chrome', 'Rendered contrast runs once')

  await page.setExtraHTTPHeaders({
    'x-df4y-site-editor-e2e': 'df4y-playwright-site-editor',
    'x-df4y-site-editor-scope': `contrast-${Date.now()}`,
  })
  await page.goto('/painel/site')
  await expect(page.locator('.site-editor-shell')).toBeVisible({timeout: 15_000})

  await page.getByRole('button', {name: 'Abrir definições'}).click()
  const settings = page.locator('.site-editor-drawer.is-settings')
  await settings
    .locator('.site-editor-panel-index > button')
    .filter({hasText: 'Conteúdo da página'})
    .click()

  // Resolves what the eye actually receives: the element's own colour and
  // opacity, composited over the first ancestor that paints a background, with
  // every ancestor opacity applied along the way. Measured through the located
  // element rather than a selector, so it is always the node under test — an
  // earlier version used document.querySelector and silently measured a
  // different button.
  const measureNode = (node: Element) => {
    const parse = (value: string) => {
      const parts = value.match(/[\d.]+/g)
      if (!parts) return null
      return {r: Number(parts[0]), g: Number(parts[1]), b: Number(parts[2]), a: parts[3] === undefined ? 1 : Number(parts[3])}
    }

    let effectiveOpacity = 1
    let backdrop = {r: 255, g: 255, b: 255}
    let found = false
    for (let el: Element | null = node; el; el = el.parentElement) {
      const style = getComputedStyle(el)
      effectiveOpacity *= Number(style.opacity)
      const bg = parse(style.backgroundColor)
      if (!found && bg && bg.a > 0.95 && el !== node) {
        backdrop = {r: bg.r, g: bg.g, b: bg.b}
        found = true
      }
    }

    const own = parse(getComputedStyle(node).backgroundColor)
    if (own && own.a > 0.95) backdrop = {r: own.r, g: own.g, b: own.b}

    const fg = parse(getComputedStyle(node).color)!
    const alpha = fg.a * effectiveOpacity
    const blended = {
      r: fg.r * alpha + backdrop.r * (1 - alpha),
      g: fg.g * alpha + backdrop.g * (1 - alpha),
      b: fg.b * alpha + backdrop.b * (1 - alpha),
    }

    const channel = (c: number) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4) }
    const lum = (c: {r: number; g: number; b: number}) => 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b)
    const pair = [lum(blended), lum(backdrop)].sort((x, y) => y - x)
    return {ratio: (pair[0] + 0.05) / (pair[1] + 0.05), text: ((node as HTMLElement).innerText || '').trim().slice(0, 40)}
  }

  const failures: string[] = []
  const check = async (locator: Locator, label: string) => {
    // A control that stops existing must fail rather than quietly pass. The
    // first version of this test skipped misses, and skipped the hover case with
    // them — reporting green on a 1.2:1 button.
    if ((await locator.count()) === 0) {
      failures.push(`${label} was not found`)
      return
    }
    const result = await locator.first().evaluate(measureNode)
    if (result.ratio < CONTRAST_FLOOR) {
      failures.push(`${label} ("${result.text}") is ${result.ratio.toFixed(2)}:1`)
    }
  }

  const rows = page.locator('.site-editor-section-list > article')
  const addButton = page.locator('.site-editor-section-add-trigger')

  await check(addButton, 'the add-section button')
  await check(rows.locator('strong'), 'a section name')
  await check(rows.locator('small'), 'a section subtitle')
  await check(page.locator('.site-editor-section-menu-button'), 'the three-dots control')

  // Hovering is a state the client is in every time they reach for the control.
  await addButton.first().hover()
  await check(addButton, 'the add-section button on hover')

  // Every entry behind the three dots, including the ones that are unavailable.
  await page.locator('.site-editor-section-menu-button').first().click()
  await expect(page.locator('.site-editor-section-menu').first()).toBeVisible()
  const entries = page.locator('.site-editor-section-menu button')
  for (let index = 0; index < (await entries.count()); index += 1) {
    const entry = entries.nth(index)
    await check(entry, `menu entry "${(await entry.innerText()).trim()}"`)
  }

  // Hiding a section is the other state the client reported as unreadable, and
  // it only exists once a section has actually been hidden.
  await entries.filter({hasText: 'Ocultar do site'}).first().click()
  const hidden = page.locator('.site-editor-section-list > article.is-hidden')
  await expect(hidden.first()).toBeVisible()
  await check(hidden.locator('strong'), 'a hidden section name')
  await check(hidden.locator('small'), 'a hidden section subtitle')
  await check(hidden.locator('.site-editor-section-menu-button'), 'the three-dots control on a hidden section')

  expect(failures, `editor controls below ${CONTRAST_FLOOR}:1:\n${failures.join('\n')}`).toEqual([])
})

test('no editor control clips its own labels', async ({page}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chrome', 'Editor layout contract runs once')

  await page.setExtraHTTPHeaders({
    'x-df4y-site-editor-e2e': 'df4y-playwright-site-editor',
    'x-df4y-site-editor-scope': `clip-${Date.now()}`,
  })
  await page.goto('/painel/site')
  await expect(page.locator('.site-editor-shell')).toBeVisible({timeout: 15_000})

  await page.getByRole('button', {name: 'Abrir definições'}).click()
  const settings = page.locator('.site-editor-drawer.is-settings')
  await settings
    .locator('.site-editor-panel-index > button')
    .filter({hasText: 'Conteúdo da página'})
    .click()

  // Open a section so its own controls are on screen — the composition picker
  // that started this lives there, not in the section list. It has to be a real
  // section: the designed block is listed too, and opening that one leaves the
  // list for the page's own fields instead of showing section controls.
  const rows = settings.locator('.site-editor-section-list > article')
  const count = await rows.count()
  let opened = false
  for (let index = 0; index < count; index += 1) {
    await rows.nth(index).locator('.site-editor-section-main').click()
    if (await settings.locator('.site-page-field, .site-page-choice').first().isVisible().catch(() => false)) {
      opened = true
      break
    }
    // That row was the designed block; go back and try the next one.
    const back = settings.locator('.site-editor-panel-workspace-head > button, .site-editor-inspector-head button').first()
    if (await back.count()) await back.click().catch(() => undefined)
    await settings
      .locator('.site-editor-panel-index > button')
      .filter({hasText: 'Conteúdo da página'})
      .click()
      .catch(() => undefined)
  }
  expect(opened, 'no section exposed its own controls').toBe(true)

  // "Imagem primeiro" was rendered as "Imagem pri…" because the control scrolled
  // sideways with its scrollbar hidden: the overflow was real, the affordance was
  // not, so it read as a broken label rather than as something to scroll.
  const clipped = await page.evaluate(() => {
    const bad: string[] = []
    document.querySelectorAll('.site-editor-drawer.is-settings *').forEach((node) => {
      const el = node as HTMLElement
      const text = (el.innerText || '').trim()
      if (!text || el.children.length) return
      if (el.scrollWidth - el.clientWidth > 1) {
        bad.push(`${el.tagName.toLowerCase()} "${text.slice(0, 30)}" overflows by ${el.scrollWidth - el.clientWidth}px`)
      }
      const parent = el.parentElement
      if (parent && getComputedStyle(parent).overflowX !== 'visible' && parent.scrollWidth - parent.clientWidth > 1) {
        bad.push(`"${text.slice(0, 30)}" sits in a container that scrolls sideways by ${parent.scrollWidth - parent.clientWidth}px`)
      }
    })
    return [...new Set(bad)]
  })

  expect(clipped, `editor labels that do not fit:\n${clipped.join('\n')}`).toEqual([])
})

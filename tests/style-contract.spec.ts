import {readFileSync} from 'node:fs'
import {expect, test} from '@playwright/test'

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
  // The design system documents --editor-text-2xs (11px) as the smallest step.
  // 82 declarations had drifted under it, some to 7px, which is unreadable and
  // was never a deliberate choice — it accumulated.
  const floorPx = 11
  const offenders = [...read(stylesheets[0]).matchAll(/font-size:\s*([0-9.]+)px/g)]
    .map((m) => Number(m[1]))
    .filter((size) => size < floorPx)

  expect(offenders, `font sizes below the ${floorPx}px floor: ${offenders.join(', ')}`).toEqual([])
})

import type {BuilderSiteSettings} from './types'

/**
 * Text colour and background colour are chosen in two different places in the
 * editor, at two different times. The client styles a heading on a white section,
 * then later changes that section's background to dark blue — and the heading
 * keeps the near-black they picked, because an inline colour beats the surface's
 * own rule. The result is unreadable text that nothing warned them about.
 *
 * This resolves both choices to concrete colours so the renderer can tell whether
 * the pair is legible, and fall back to the surface's own colour when it is not.
 * The client keeps every colour that works and is protected from the ones that
 * do not.
 */

const CONTRAST_FLOOR = 4.5

const THEME_DEFAULTS = {
  text: '#10231f',
  muted: '#49605a',
  deep: '#073f45',
  green: '#2b8261',
  blue: '#17657a',
  yellow: '#d7bd35',
  fog: '#eef7f3',
  mint: '#dcefe7',
} as const

const hex6 = (value: string | undefined) =>
  value && /^#[0-9a-f]{6}$/i.test(value.trim()) ? value.trim().toLowerCase() : undefined

const channel = (value: number) => {
  const c = value / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

export const contrastRatio = (a: string, b: string) => {
  const first = hex6(a)
  const second = hex6(b)
  if (!first || !second) return 21
  const [light, dark] = [luminance(first), luminance(second)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}

const themeColor = (
  key: keyof typeof THEME_DEFAULTS,
  theme: BuilderSiteSettings['theme'] | undefined,
) => {
  const configured = hex6((theme as Record<string, string> | undefined)?.[`${key}Color`])
  return configured ?? THEME_DEFAULTS[key]
}

/**
 * What a section's background actually is once the site's theme is applied. The
 * client can repaint the palette in settings, so this cannot be a constant.
 * `transparent` sits on the page itself, which is white.
 */
export const surfaceBackground = (
  surface: string | undefined,
  theme?: BuilderSiteSettings['theme'],
) => {
  switch (surface) {
    case 'deep':
      return themeColor('deep', theme)
    case 'blue':
      return themeColor('blue', theme)
    case 'fog':
      return themeColor('fog', theme)
    case 'mint':
      return themeColor('mint', theme)
    default:
      return '#ffffff'
  }
}

/** The colour the section already uses for text it is not told otherwise about. */
export const surfaceTextColor = (
  surface: string | undefined,
  theme?: BuilderSiteSettings['theme'],
) => (surface === 'deep' || surface === 'blue' ? '#ffffff' : themeColor('text', theme))

/**
 * Resolves the colour a client picked — a named token from either colour picker,
 * or a custom hex — into something comparable. Returns undefined for a value that
 * cannot be resolved, which is treated as "leave it alone" rather than guessed at.
 */
export const resolveBuilderColor = (
  value: string | undefined,
  theme?: BuilderSiteSettings['theme'],
) => {
  const token = value?.trim().toLowerCase()
  if (!token) return undefined
  const custom = hex6(token)
  if (custom) return custom

  switch (token) {
    case 'white':
      return '#ffffff'
    case 'text':
      return themeColor('text', theme)
    case 'muted':
      return themeColor('muted', theme)
    case 'green':
      return themeColor('green', theme)
    case 'blue':
      return themeColor('blue', theme)
    case 'yellow':
      return themeColor('yellow', theme)
    default:
      return undefined
  }
}

/**
 * The colour to force, or undefined to leave the client's choice in place.
 *
 * Only a resolvable choice that genuinely fails against the surface is replaced,
 * and it is replaced with the colour that surface already uses — never with a
 * third colour nobody chose.
 */
export const correctedTextColor = (
  requested: string | undefined,
  surface: string | undefined,
  theme?: BuilderSiteSettings['theme'],
) => {
  const chosen = resolveBuilderColor(requested, theme)
  if (!chosen) return undefined

  const background = surfaceBackground(surface, theme)
  if (contrastRatio(chosen, background) >= CONTRAST_FLOOR) return undefined

  return surfaceTextColor(surface, theme)
}

export const builderContrastFloor = CONTRAST_FLOOR

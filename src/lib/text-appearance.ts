import {stegaClean} from '@sanity/client/stega'

export type TextAppearance = {
  fontFamily?: string
  fontSize?: number
  fontSizeTablet?: number
  fontSizeMobile?: number
  fontWeight?: string
  fontStyle?: string
  textAlign?: string
  lineHeight?: string | number
  color?: string
}

const fontFamilies: Record<string, string> = {
  'space-grotesk': "'Space Grotesk', Arial, sans-serif",
  inter: 'Inter, Arial, sans-serif',
  arial: 'Arial, sans-serif',
  georgia: 'Georgia, serif',
  'times-new-roman': "'Times New Roman', serif",
}

const fontWeights: Record<string, string> = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  '400': '400',
  '500': '500',
  '600': '600',
  '700': '700',
}

const lineHeights: Record<string, number> = {
  compact: 1.2,
  normal: 1.5,
  relaxed: 1.8,
}

const colorTokens: Record<string, string> = {
  text: 'var(--ink, #10231f)',
  muted: 'var(--muted, #49605a)',
  white: '#ffffff',
  green: 'var(--green, #2f8b69)',
  blue: 'var(--blue, #17657a)',
  yellow: 'var(--yellow, #d7bd35)',
}

const bounded = (value: unknown, min: number, max: number) => {
  // "Auto" is stored as null, and Number(null) is 0 — which is finite, so it used
  // to clamp to the minimum instead of meaning "no size". Setting a heading back
  // to Auto rendered it at 10px: the About timeline's "Hoje" sat tiny next to
  // "2011" and "2014", which carry no styling at all. Empty string behaves the
  // same way and is treated the same.
  if (value === null || value === undefined || value === '') return undefined

  const numeric = Number(value)
  return Number.isFinite(numeric) ? Math.min(max, Math.max(min, numeric)) : undefined
}

const customColor = (value: string | undefined) =>
  value && /^#[0-9a-f]{6}$/i.test(value) ? value : undefined

const cleanToken = (value: string | undefined) =>
  value ? stegaClean(value).trim() || undefined : undefined

export const textAppearanceStyle = (value: TextAppearance | null | undefined) => {
  if (!value) return ''

  const desktop = bounded(value.fontSize, 10, 120)
  const tablet = bounded(value.fontSizeTablet, 10, 120) ?? desktop
  const mobile = bounded(value.fontSizeMobile, 10, 120) ?? tablet
  const fontFamily = cleanToken(value.fontFamily)
  const fontWeight = cleanToken(value.fontWeight)
  const textAlign = cleanToken(value.textAlign)
  const lineHeightToken =
    typeof value.lineHeight === 'string' ? cleanToken(value.lineHeight) : value.lineHeight
  const colorToken = cleanToken(value.color)
  const fontStyleToken = cleanToken(value.fontStyle)
  const family = fontFamily ? fontFamilies[fontFamily] : undefined
  const weight = fontWeight ? fontWeights[fontWeight] : undefined
  const align = ['left', 'center', 'right'].includes(textAlign || '')
    ? textAlign
    : undefined
  const lineHeight =
    typeof lineHeightToken === 'number'
      ? bounded(lineHeightToken, 0.9, 2)
      : lineHeightToken
        ? lineHeights[lineHeightToken]
        : undefined
  const fontStyle = fontStyleToken === 'italic' ? 'italic' : undefined
  const color = colorTokens[colorToken || ''] || customColor(colorToken)

  return [
    desktop ? `--cms-text-size-desktop:${desktop}px` : '',
    tablet ? `--cms-text-size-tablet:${tablet}px` : '',
    mobile ? `--cms-text-size-mobile:${mobile}px` : '',
    family ? `font-family:${family}` : '',
    weight ? `font-weight:${weight}` : '',
    fontStyle ? `font-style:${fontStyle}` : '',
    align ? `text-align:${align}` : '',
    lineHeight ? `line-height:${lineHeight}` : '',
    color ? `color:${color}` : '',
  ]
    .filter(Boolean)
    .join(';')
}

export const textAppearanceFields = [
  'fontFamily',
  'fontSize',
  'fontSizeTablet',
  'fontSizeMobile',
  'fontWeight',
  'fontStyle',
  'textAlign',
  'lineHeight',
  'color',
] as const

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
  const numeric = Number(value)
  return Number.isFinite(numeric) ? Math.min(max, Math.max(min, numeric)) : undefined
}

const customColor = (value: string | undefined) =>
  value && /^#[0-9a-f]{6}$/i.test(value) ? value : undefined

export const textAppearanceStyle = (value: TextAppearance | null | undefined) => {
  if (!value) return ''

  const desktop = bounded(value.fontSize, 10, 120)
  const tablet = bounded(value.fontSizeTablet, 10, 120) ?? desktop
  const mobile = bounded(value.fontSizeMobile, 10, 120) ?? tablet
  const family = value.fontFamily ? fontFamilies[value.fontFamily] : undefined
  const weight = value.fontWeight ? fontWeights[value.fontWeight] : undefined
  const align = ['left', 'center', 'right'].includes(value.textAlign || '')
    ? value.textAlign
    : undefined
  const lineHeight =
    typeof value.lineHeight === 'number'
      ? bounded(value.lineHeight, 0.9, 2)
      : value.lineHeight
        ? lineHeights[value.lineHeight]
        : undefined
  const fontStyle = value.fontStyle === 'italic' ? 'italic' : undefined
  const color = colorTokens[value.color || ''] || customColor(value.color)

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

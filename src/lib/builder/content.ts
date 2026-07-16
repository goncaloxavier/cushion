import type {
  BuilderTypography,
  LocalizedValue,
} from '$lib/builder/types'
import type {LanguageCode} from '$lib/site-content'

export const builderLocalized = (
  value: LocalizedValue | undefined,
  language: LanguageCode,
) => value?.[language]?.trim() || value?.pt?.trim() || ''

export const builderLocalizedArticle = (value: unknown, language: LanguageCode): unknown[] => {
  if (Array.isArray(value)) return value
  if (!value || typeof value !== 'object') return []

  const localized = value as Partial<Record<LanguageCode, unknown>>
  if (Array.isArray(localized[language])) return localized[language] as unknown[]
  return Array.isArray(localized.pt) ? localized.pt : []
}

export const safeBuilderHref = (value: string | undefined) => {
  if (!value) return '#'
  return /^(\/|#|https?:\/\/|mailto:|tel:)/.test(value) ? value : '#'
}

const fontFamilies: Record<string, string> = {
  'space-grotesk': "'Space Grotesk', Arial, sans-serif",
  inter: 'Inter, Arial, sans-serif',
  arial: 'Arial, sans-serif',
  georgia: 'Georgia, serif',
  'times-new-roman': "'Times New Roman', serif",
}

export const builderFontFamily = (value: string | undefined, fallback: string) =>
  (value && fontFamilies[value]) || fallback

const colorTokens: Record<string, string> = {
  text: 'var(--builder-text)',
  muted: 'var(--builder-muted)',
  white: '#ffffff',
  green: 'var(--builder-green)',
  blue: 'var(--builder-blue)',
  yellow: 'var(--builder-yellow)',
}

const bounded = (value: number | undefined, min: number, max: number, fallback: number) =>
  Number.isFinite(value) ? Math.min(max, Math.max(min, Number(value))) : fallback

export const builderTypographyStyle = (
  typography: BuilderTypography | undefined,
  kind: 'title' | 'body',
) => {
  const desktop = bounded(
    typography?.fontSize?.desktop,
    10,
    120,
    kind === 'title' ? 54 : 18,
  )
  const tablet = bounded(
    typography?.fontSize?.tablet,
    10,
    120,
    kind === 'title' ? 46 : 18,
  )
  const mobile = bounded(
    typography?.fontSize?.mobile,
    10,
    120,
    kind === 'title' ? 36 : 17,
  )
  const weight = ['400', '500', '600', '700'].includes(typography?.fontWeight || '')
    ? typography?.fontWeight
    : kind === 'title'
      ? '700'
      : '400'
  const align = ['left', 'center', 'right'].includes(typography?.align || '')
    ? typography?.align
    : 'left'
  const lineHeight = bounded(typography?.lineHeight, 0.9, 2, kind === 'title' ? 1.04 : 1.55)
  const maxWidth = bounded(typography?.maxWidth, 10, 80, kind === 'title' ? 24 : 54)
  const family =
    typography?.fontFamily && typography.fontFamily !== 'inherit'
      ? builderFontFamily(typography.fontFamily, 'inherit')
      : 'inherit'
  const color = colorTokens[typography?.color || ''] || 'inherit'

  return [
    `--builder-font-desktop:${desktop}px`,
    `--builder-font-tablet:${tablet}px`,
    `--builder-font-mobile:${mobile}px`,
    `font-family:${family}`,
    `font-weight:${weight}`,
    `text-align:${align}`,
    `line-height:${lineHeight}`,
    `max-width:${maxWidth}ch`,
    `color:${color}`,
  ].join(';')
}

export const boundedBuilderNumber = bounded

import type {
  BuilderTypography,
  LocalizedValue,
} from '$lib/builder/types'
import type {LanguageCode} from '$lib/site-content'
import {textAppearanceStyle, type TextAppearance} from '$lib/text-appearance'

/**
 * Localized *text*. A rich-text field has the same shape but holds an array of
 * blocks per language, and callers cannot always tell the two apart — handing one
 * here used to throw `.trim is not a function`, which broke hydration and took
 * every section on the page down with it. Anything that is not a string reads as
 * "no text", which is what the callers actually mean.
 */
export const builderLocalized = (
  value: LocalizedValue | undefined,
  language: LanguageCode,
) => {
  const text = (candidate: unknown) => (typeof candidate === 'string' ? candidate.trim() : '')
  return text(value?.[language]) || text(value?.pt) || ''
}

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
  const marginInlineStart = align === 'right' || align === 'center' ? 'auto' : '0'
  const marginInlineEnd = align === 'center' ? 'auto' : '0'

  return [
    typography?.fontSize ? '--builder-font-size-explicit:1' : '',
    `--builder-font-desktop:${desktop}px`,
    `--builder-font-tablet:${tablet}px`,
    `--builder-font-mobile:${mobile}px`,
    `font-family:${family}`,
    `font-weight:${weight}`,
    `text-align:${align}`,
    `margin-inline-start:${marginInlineStart}`,
    `margin-inline-end:${marginInlineEnd}`,
    `line-height:${lineHeight}`,
    // Bounded by the container as well as by the reading measure. A ch cap grows
    // with the font, so a title the client enlarged reached 24ch = 1493px inside
    // a 380px card; centring adds auto inline margins, which in a flex column
    // size the element to its content instead of stretching it, so nothing held
    // the heading to the card and it simply ran out of the side and was clipped.
    // min() keeps the measure where it fits and the card where it does not,
    // which is what lets overflow-wrap break the word and the card grow taller.
    `max-width:min(100%, ${maxWidth}ch)`,
    `color:${color}`,
  ].filter(Boolean).join(';')
}

/**
 * Section typography is the source of truth once a setting is chosen in the
 * section editor. Older content can still carry the previous per-text
 * appearance fields, so retain those only for properties the section has not
 * explicitly configured. Without this merge, the old values are emitted last
 * and make the visible section controls appear to do nothing.
 */
export const builderSectionTextStyle = (
  typography: BuilderTypography | undefined,
  value: TextAppearance | null | undefined,
  kind: 'title' | 'body',
) => {
  const fallback = value ? {...value} : undefined

  if (fallback && typography) {
    if (typography.fontFamily !== undefined) delete fallback.fontFamily
    if (typography.fontSize !== undefined) {
      delete fallback.fontSize
      delete fallback.fontSizeTablet
      delete fallback.fontSizeMobile
    }
    if (typography.fontWeight !== undefined) delete fallback.fontWeight
    if (typography.align !== undefined) delete fallback.textAlign
    if (typography.lineHeight !== undefined) delete fallback.lineHeight
    if (typography.color !== undefined) delete fallback.color
  }

  return [builderTypographyStyle(typography, kind), textAppearanceStyle(fallback)]
    .filter(Boolean)
    .join(';')
}

export const boundedBuilderNumber = bounded

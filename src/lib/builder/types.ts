import type {SanityDocument} from '@sanity/client'
import type {TextAppearance} from '$lib/text-appearance'

export type LocalizedValue = TextAppearance & {
  _type?: 'localizedString' | 'localizedText'
  pt?: string
  en?: string
  es?: string
  translationHash?: string
}

export type BuilderTypography = {
  _type?: 'builderTypography'
  fontFamily?: string
  fontSize?: {desktop?: number; tablet?: number; mobile?: number}
  fontWeight?: string
  align?: string
  lineHeight?: number
  color?: string
  maxWidth?: number
}

export type BuilderLayout = {
  _type?: 'builderLayout'
  width?: 'narrow' | 'content' | 'wide' | 'full'
  columns?: number
  mobileColumns?: number
  gap?: number
  surface?: 'white' | 'fog' | 'mint' | 'deep' | 'blue' | 'transparent'
  verticalAlign?: 'start' | 'center' | 'end'
  reverseOnMobile?: boolean
  spacing?: {
    _type?: 'builderSpacing'
    top?: number
    bottom?: number
    sides?: number
  }
}

export type SanityAssetValue = {
  _type?: 'image' | 'file'
  asset?: {_type?: 'reference'; _ref?: string}
  hotspot?: {x?: number; y?: number; height?: number; width?: number}
  crop?: {top?: number; right?: number; bottom?: number; left?: number}
}

export type BuilderMedia = {
  _type?: 'builderMedia'
  _key?: string
  kind?: 'image' | 'video' | 'youtube'
  image?: SanityAssetValue
  videoFile?: SanityAssetValue
  youtubeUrl?: string
  alt?: LocalizedValue
  caption?: LocalizedValue
  fit?: 'cover' | 'contain'
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right'
  autoplay?: boolean
  muted?: boolean
  loop?: boolean
  controls?: boolean
}

export type BuilderLink = {
  _type?: 'builderLink'
  _key?: string
  label?: LocalizedValue
  href?: string
  style?: 'primary' | 'secondary' | 'text'
  newTab?: boolean
  ariaLabel?: LocalizedValue
}

export type BuilderCard = {
  _type?: 'builderCard'
  _key?: string
  eyebrow?: LocalizedValue
  title?: LocalizedValue
  body?: LocalizedValue
  media?: BuilderMedia
  action?: BuilderLink
}

export type BuilderStat = {
  _type?: 'builderStat'
  _key?: string
  value?: LocalizedValue
  label?: LocalizedValue
}

export type BuilderSectionType =
  | 'builderHeroSection'
  | 'builderRichTextSection'
  | 'builderMediaSection'
  | 'builderGallerySection'
  | 'builderCardsSection'
  | 'builderStatsSection'
  | 'builderCollectionSection'
  | 'builderPartnersSection'
  | 'builderCtaSection'
  | 'builderContactSection'

export type BuilderSection = {
  _type: BuilderSectionType
  _key: string
  internalLabel?: string
  anchor?: string
  enabled?: boolean
  layout?: BuilderLayout
  eyebrow?: LocalizedValue
  title?: LocalizedValue
  body?: LocalizedValue | unknown[]
  titleStyle?: BuilderTypography
  bodyStyle?: BuilderTypography
  actions?: BuilderLink[]
  media?: BuilderMedia
  items?: Array<BuilderMedia | BuilderCard | BuilderStat | Record<string, unknown>>
  variant?: string
  minHeight?: number
  mediaSide?: string
  presentation?: string
  cardStyle?: string
  source?: 'productCategory' | 'storeProduct' | 'caseStudy' | 'blogPost'
  limit?: number
  showSearch?: boolean
  showPagination?: boolean
  formKind?: 'contact' | 'quote' | 'catalogue'
  showContactDetails?: boolean
}

export type BuilderSeo = {
  _type?: 'builderSeo'
  title?: LocalizedValue
  description?: LocalizedValue
  shareImage?: SanityAssetValue
  noIndex?: boolean
}

export type BuilderPage = SanityDocument & {
  _type: 'builderPage'
  builderVersion: number
  title: string
  route: string
  pageKind: 'standard' | 'home' | 'listing' | 'detail' | 'contact' | 'legal'
  active: boolean
  sections: BuilderSection[]
  seo?: BuilderSeo
  migrationSource?: string
}

export type BuilderNavItem = {
  _type?: 'builderNavItem'
  _key: string
  label?: LocalizedValue
  href?: string
  placement?: 'primary' | 'utility' | 'footer'
  visibleDesktop?: boolean
  visibleMobile?: boolean
  newTab?: boolean
}

export type BuilderTheme = {
  headingFont?: string
  bodyFont?: string
  textColor?: string
  mutedColor?: string
  deepColor?: string
  greenColor?: string
  blueColor?: string
  yellowColor?: string
  fogColor?: string
  mintColor?: string
  radius?: number
  motion?: 'reduced' | 'balanced' | 'expressive'
}

export type BuilderSiteSettings = SanityDocument & {
  _type: 'builderSiteSettings'
  builderVersion: number
  navigation?: BuilderNavItem[]
  accountLabel?: LocalizedValue
  cartLabel?: LocalizedValue
  contactLabel?: LocalizedValue
  theme?: BuilderTheme
  rendererMode?: 'legacy' | 'builder'
}

export type BuilderViewport = 'desktop' | 'tablet' | 'mobile'

export type BuilderValidationIssue = {
  level: 'error' | 'warning'
  message: string
  sectionKey?: string
  field?: string
}

export type BuilderSaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error' | 'conflict'

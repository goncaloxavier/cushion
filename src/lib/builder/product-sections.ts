import type {
  BuilderLink,
  BuilderMedia,
  BuilderSection,
  LocalizedValue,
  SanityAssetValue,
} from './types'

type UnknownRecord = Record<string, unknown>

const isRecord = (value: unknown): value is UnknownRecord =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const localizedValue = (
  value: unknown,
  type: 'localizedString' | 'localizedText',
): LocalizedValue | undefined => {
  if (!isRecord(value)) return undefined
  return {...value, _type: type} as LocalizedValue
}

const assetValue = (value: unknown): SanityAssetValue | undefined =>
  isRecord(value) && isRecord(value.asset) && typeof value.asset._ref === 'string'
    ? (value as SanityAssetValue)
    : undefined

const legacyMedia = (section: UnknownRecord): BuilderMedia | undefined => {
  const image = assetValue(section.image)
  const poster = assetValue(section.poster)
  const video = isRecord(section.video) ? section.video : undefined
  const videoFile = assetValue(video?.file)
  const captions = assetValue(video?.captions)
  const youtubeUrl =
    typeof video?.youtubeUrl === 'string' && video.youtubeUrl.trim()
      ? video.youtubeUrl.trim()
      : undefined
  const requestedKind = section.mediaKind
  const kind =
    requestedKind === 'video' || videoFile || youtubeUrl
      ? videoFile
        ? 'video'
        : youtubeUrl
          ? 'youtube'
          : undefined
      : image
        ? 'image'
        : undefined

  if (!kind) return undefined

  const videoTitle = localizedValue(section.videoTitle, 'localizedString')
  const imageAlt = image && isRecord(section.image) ? localizedValue(section.image.alt, 'localizedString') : undefined
  const posterAlt = poster && isRecord(section.poster) ? localizedValue(section.poster.alt, 'localizedString') : undefined
  return {
    _type: 'builderMedia',
    kind,
    ...(image && kind === 'image' ? {image} : {}),
    ...(videoFile && kind === 'video' ? {videoFile} : {}),
    ...(captions && kind === 'video' ? {captions} : {}),
    ...(youtubeUrl && kind === 'youtube' ? {youtubeUrl} : {}),
    ...(poster ? {poster} : {}),
    alt: kind === 'image' ? imageAlt : videoTitle ?? posterAlt,
    fit: kind === 'image' ? 'contain' : 'cover',
    position: 'center',
    autoplay: false,
    muted: false,
    loop: false,
    controls: true,
  }
}

const legacyAction = (section: UnknownRecord): BuilderLink[] => {
  const label = localizedValue(section.buttonLabel, 'localizedString')
  const href = typeof section.buttonUrl === 'string' ? section.buttonUrl.trim() : ''
  if (!label?.pt?.trim() || !href) return []

  return [
    {
      _type: 'builderLink',
      _key: `${String(section._key || 'legacy')}-action`,
      label,
      href,
      style: 'text',
    },
  ]
}

/**
 * Presents the original product-only media blocks through the shared page-section
 * editor. The legacy field remains untouched until a section is changed, so live
 * Sanity documents can migrate lazily without a destructive bulk write.
 */
export const legacyProductContentSectionsToBuilder = (value: unknown): BuilderSection[] => {
  if (!Array.isArray(value)) return []

  return value.flatMap((candidate, index) => {
    if (!isRecord(candidate)) return []
    // A block without media is still a block the client created and can see in
    // the CMS. Dropping it here made the editor list fewer sections than the
    // document holds — the block appeared to vanish on open, and the first save
    // of the section list would have erased it for good. Carry it through with
    // no media instead, so the editor and the document always agree.
    const media = legacyMedia(candidate)

    const title = localizedValue(candidate.title, 'localizedString')
    const body = localizedValue(candidate.text, 'localizedText')
    const eyebrow = localizedValue(candidate.label, 'localizedString')
    const mediaSide =
      candidate.mediaSide === 'right' || candidate.mediaSide === 'top'
        ? candidate.mediaSide
        : 'left'
    const surface = ['fog', 'mint', 'deep', 'blue'].includes(String(candidate.surface))
      ? (candidate.surface as 'fog' | 'mint' | 'deep' | 'blue')
      : 'white'
    const labelStyle =
      candidate.labelStyle === 'pill' || candidate.labelStyle === 'eyebrow'
        ? candidate.labelStyle
        : 'caption'
    const key =
      typeof candidate._key === 'string' && candidate._key.trim()
        ? candidate._key
        : `legacy-product-section-${index + 1}`

    return [
      {
        _type: 'builderMediaSection',
        _key: key,
        internalLabel: title?.pt?.trim() || `Secção do produto ${index + 1}`,
        enabled: true,
        // The full-bleed product layout is built around its media. Without one
        // it collapses, so a media-less block uses the ordinary text-and-media
        // layout, which renders fine with nothing on the media side.
        ...(media ? {variant: 'product-feature' as const} : {}),
        labelStyle,
        eyebrow,
        title,
        body,
        actions: legacyAction(candidate),
        media,
        mediaSide,
        layout: {
          _type: 'builderLayout',
          width: 'full',
          columns: 1,
          mobileColumns: 1,
          gap: 24,
          surface,
          verticalAlign: 'center',
          reverseOnMobile: false,
          spacing: {
            _type: 'builderSpacing',
            top: 0,
            bottom: 0,
            sides: 0,
          },
        },
      } satisfies BuilderSection,
    ]
  })
}

export const productBuilderSections = (
  sections: unknown,
  legacyContentSections: unknown,
): BuilderSection[] => {
  if (Array.isArray(sections) && sections.length) return sections as BuilderSection[]
  return legacyProductContentSectionsToBuilder(legacyContentSections)
}

/**
 * An empty `sections` array was added to some product drafts during rollout.
 * Treat it as implicit while legacy blocks still exist, otherwise an unrelated
 * product edit could erase live content. The section editor writes an explicit
 * array when the editor actually changes that stream.
 */
export const preserveLegacyProductSectionsOnLoad = <T extends UnknownRecord>(document: T): T => {
  if (
    document._type !== 'productCategory' ||
    !Array.isArray(document.contentSections) ||
    document.contentSections.length === 0 ||
    !Array.isArray(document.sections) ||
    document.sections.length > 0
  ) {
    return document
  }

  const prepared = {...document}
  delete prepared.sections
  return prepared as T
}

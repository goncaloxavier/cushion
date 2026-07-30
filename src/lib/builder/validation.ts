import type {
  BuilderPage,
  BuilderSection,
  BuilderSiteSettings,
  BuilderValidationIssue,
} from './types'

const routePattern = /^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*\/)*[a-z0-9]*(?:-[a-z0-9]+)*$/
const anchorPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const hexPattern = /^#[0-9a-f]{6}$/i
const sectionTypes = new Set([
  'builderManagedSection',
  'builderHeroSection',
  'builderRichTextSection',
  'builderMediaSection',
  'builderGallerySection',
  'builderCardsSection',
  'builderStatsSection',
  'builderCollectionSection',
  'builderPartnersSection',
  'builderCtaSection',
  'builderContactSection',
])
const managedSectionComponents = new Set([
  'homeCore',
  'aboutCore',
  'productsCore',
  'storeCore',
  'cartCore',
  'catalogueCore',
  'casesCore',
  'blogCore',
  'contactCore',
  'returnsCore',
  'productDetailCore',
  'storeDetailCore',
  'caseDetailCore',
  'blogDetailCore',
])
const surfaces = new Set(['white', 'fog', 'mint', 'deep', 'blue', 'transparent'])
const widths = new Set(['narrow', 'content', 'wide', 'full'])
const verticalAlignments = new Set(['start', 'center', 'end'])
const collectionSources = new Set(['productCategory', 'storeProduct', 'caseStudy', 'blogPost'])

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

const hasLocalizedText = (value: unknown) =>
  isRecord(value) && typeof value.pt === 'string' && Boolean(value.pt.trim())

const safeLink = (value: unknown) => {
  if (typeof value !== 'string' || !value.trim()) return false
  const href = value.trim()
  if (href.startsWith('/')) return !href.startsWith('//')
  if (href.startsWith('#')) return anchorPattern.test(href.slice(1))
  try {
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(new URL(href).protocol)
  } catch {
    return false
  }
}

const rangeIssue = (
  value: unknown,
  min: number,
  max: number,
  field: string,
  label: string,
  sectionKey?: string,
  integer = false,
): BuilderValidationIssue | undefined => {
  if (value === undefined) return undefined
  if (
    typeof value !== 'number' ||
    !Number.isFinite(value) ||
    value < min ||
    value > max ||
    (integer && !Number.isInteger(value))
  ) {
    return {
      level: 'error',
      sectionKey,
      field,
      message: `${label} deve ficar entre ${min} e ${max}${integer ? ' e usar um número inteiro' : ''}.`,
    }
  }
  return undefined
}

const mediaIssues = (
  media: unknown,
  sectionKey: string | undefined,
  field = 'media',
): BuilderValidationIssue[] => {
  if (!media) return []
  if (!isRecord(media)) {
    return [{level: 'error', sectionKey, field, message: 'O conteúdo visual está danificado.'}]
  }

  const issues: BuilderValidationIssue[] = []
  const hasAsset =
    media.kind === 'image'
      ? Boolean((media.image as {asset?: {_ref?: unknown}} | undefined)?.asset?._ref)
      : media.kind === 'video'
        ? Boolean((media.videoFile as {asset?: {_ref?: unknown}} | undefined)?.asset?._ref)
        : media.kind === 'youtube'
          ? Boolean(typeof media.youtubeUrl === 'string' && media.youtubeUrl.trim())
          : false

  if (media.kind && !['image', 'video', 'youtube'].includes(String(media.kind))) {
    issues.push({
      level: 'error',
      sectionKey,
      field: `${field}.kind`,
      message: 'Escolha imagem, vídeo carregado ou YouTube.',
    })
  }

  if (hasAsset && !hasLocalizedText(media.alt)) {
    issues.push({
      level: 'warning',
      sectionKey,
      field: `${field}.alt`,
      message: 'Descreva a imagem ou vídeo para leitores de ecrã.',
    })
  }

  if (media.autoplay && !media.muted) {
    issues.push({
      level: 'error',
      sectionKey,
      field: `${field}.muted`,
      message: 'Um vídeo automático tem de começar sem som.',
    })
  }

  return issues
}

const sectionIssues = (section: BuilderSection): BuilderValidationIssue[] => {
  const issues = mediaIssues(section.media, section._key)

  if (!section.internalLabel?.trim()) {
    issues.push({
      level: 'warning',
      sectionKey: section._key,
      field: 'internalLabel',
      message: 'Dê um nome interno à secção para a reconhecer no editor.',
    })
  }

  if (
    ['builderHeroSection', 'builderCtaSection', 'builderContactSection'].includes(section._type) &&
    !hasLocalizedText(section.title)
  ) {
    issues.push({
      level: 'error',
      sectionKey: section._key,
      field: 'title',
      message: 'Esta secção precisa de um título.',
    })
  }

  if (section.actions && (!Array.isArray(section.actions) || section.actions.length > 4)) {
    issues.push({
      level: 'error',
      sectionKey: section._key,
      field: 'actions',
      message: 'Uma secção pode ter no máximo quatro botões.',
    })
  }

  for (const action of Array.isArray(section.actions) ? section.actions : []) {
    if (!hasLocalizedText(action.label)) {
      issues.push({
        level: 'error',
        sectionKey: section._key,
        field: 'actions',
        message: 'Todos os botões precisam de texto.',
      })
    }
    if (!safeLink(action.href)) {
      issues.push({
        level: 'error',
        sectionKey: section._key,
        field: 'actions',
        message: 'Existe um botão sem destino válido.',
      })
    }
  }

  return issues
}

const layoutIssues = (section: BuilderSection): BuilderValidationIssue[] => {
  const layout = section.layout
  if (!layout) return []
  if (!isRecord(layout)) {
    return [
      {
        level: 'error',
        sectionKey: section._key,
        field: 'layout',
        message: 'A composição desta secção está danificada.',
      },
    ]
  }

  const issues: BuilderValidationIssue[] = []
  if (layout.width !== undefined && !widths.has(String(layout.width))) {
    issues.push({
      level: 'error',
      sectionKey: section._key,
      field: 'layout.width',
      message: 'Escolha uma largura válida para a secção.',
    })
  }
  if (layout.surface !== undefined && !surfaces.has(String(layout.surface))) {
    issues.push({
      level: 'error',
      sectionKey: section._key,
      field: 'layout.surface',
      message: 'Escolha um fundo válido para a secção.',
    })
  }
  if (layout.verticalAlign !== undefined && !verticalAlignments.has(String(layout.verticalAlign))) {
    issues.push({
      level: 'error',
      sectionKey: section._key,
      field: 'layout.verticalAlign',
      message: 'Escolha um alinhamento vertical válido.',
    })
  }

  const ranges: Array<BuilderValidationIssue | undefined> = [
    rangeIssue(layout.columns, 1, 4, 'layout.columns', 'O número de colunas', section._key, true),
    rangeIssue(
      layout.mobileColumns,
      1,
      2,
      'layout.mobileColumns',
      'O número de colunas no telemóvel',
      section._key,
      true,
    ),
    rangeIssue(layout.gap, 0, 96, 'layout.gap', 'O espaço entre elementos', section._key),
  ]

  if (layout.spacing !== undefined && !isRecord(layout.spacing)) {
    issues.push({
      level: 'error',
      sectionKey: section._key,
      field: 'layout.spacing',
      message: 'O espaçamento desta secção está danificado.',
    })
  } else if (isRecord(layout.spacing)) {
    ranges.push(
      rangeIssue(layout.spacing.top, 0, 240, 'layout.spacing.top', 'O espaço acima', section._key),
      rangeIssue(
        layout.spacing.bottom,
        0,
        240,
        'layout.spacing.bottom',
        'O espaço abaixo',
        section._key,
      ),
      rangeIssue(
        layout.spacing.sides,
        0,
        120,
        'layout.spacing.sides',
        'O espaço lateral',
        section._key,
      ),
    )
  }

  issues.push(...ranges.filter((issue): issue is BuilderValidationIssue => Boolean(issue)))
  return issues
}

const typographyIssues = (
  value: unknown,
  sectionKey: string,
  field: string,
): BuilderValidationIssue[] => {
  if (!value) return []
  if (!isRecord(value)) {
    return [{level: 'error', sectionKey, field, message: 'A formatação do texto está danificada.'}]
  }
  const issues: BuilderValidationIssue[] = []
  if (
    value.color !== undefined &&
    value.color !== 'inherit' &&
    !hexPattern.test(String(value.color))
  ) {
    const allowedTokens = new Set(['text', 'muted', 'white', 'green', 'blue', 'yellow'])
    if (!allowedTokens.has(String(value.color))) {
      issues.push({
        level: 'error',
        sectionKey,
        field: `${field}.color`,
        message: 'Escolha uma cor disponível no editor.',
      })
    }
  }
  if (isRecord(value.fontSize)) {
    for (const viewport of ['desktop', 'tablet', 'mobile'] as const) {
      const issue = rangeIssue(
        value.fontSize[viewport],
        10,
        120,
        `${field}.fontSize.${viewport}`,
        'O tamanho do texto',
        sectionKey,
      )
      if (issue) issues.push(issue)
    }
  } else if (value.fontSize !== undefined) {
    issues.push({
      level: 'error',
      sectionKey,
      field: `${field}.fontSize`,
      message: 'Os tamanhos do texto estão danificados.',
    })
  }
  const lineHeight = rangeIssue(
    value.lineHeight,
    0.9,
    2,
    `${field}.lineHeight`,
    'O espaço entre linhas',
    sectionKey,
  )
  const maxWidth = rangeIssue(
    value.maxWidth,
    10,
    80,
    `${field}.maxWidth`,
    'A largura máxima do texto',
    sectionKey,
  )
  if (lineHeight) issues.push(lineHeight)
  if (maxWidth) issues.push(maxWidth)
  return issues
}

export const validateBuilderSections = (value: unknown): BuilderValidationIssue[] => {
  if (!Array.isArray(value)) {
    return [{level: 'error', field: 'sections', message: 'O conteúdo da página está danificado.'}]
  }

  const issues: BuilderValidationIssue[] = []
  if (value.length > 30) {
    issues.push({
      level: 'error',
      field: 'sections',
      message: 'Uma página pode ter no máximo 30 secções.',
    })
  }

  const keys = new Set<string>()
  const anchors = new Set<string>()
  value.forEach((rawSection, index) => {
    if (!isRecord(rawSection)) {
      issues.push({
        level: 'error',
        field: `sections[${index}]`,
        message: `A secção ${index + 1} está danificada.`,
      })
      return
    }
    const section = rawSection as unknown as BuilderSection
    const sectionKey = typeof section._key === 'string' ? section._key.trim() : ''
    if (!sectionKey) {
      issues.push({
        level: 'error',
        field: `sections[${index}]._key`,
        message: `A secção ${index + 1} não tem um identificador estável.`,
      })
    } else if (keys.has(sectionKey)) {
      issues.push({
        level: 'error',
        sectionKey,
        field: '_key',
        message: 'Existem duas secções com o mesmo identificador.',
      })
    } else {
      keys.add(sectionKey)
    }

    if (!sectionTypes.has(String(section._type))) {
      issues.push({
        level: 'error',
        sectionKey: sectionKey || undefined,
        field: '_type',
        message: `A secção ${index + 1} tem um tipo que o site não reconhece.`,
      })
      return
    }

    if (section._type === 'builderManagedSection') {
      if (!managedSectionComponents.has(String(section.component))) {
        issues.push({
          level: 'error',
          sectionKey,
          field: 'component',
          message: 'A área principal desta página não é reconhecida.',
        })
      }
      return
    }

    if (section.anchor) {
      if (!anchorPattern.test(section.anchor)) {
        issues.push({
          level: 'error',
          sectionKey,
          field: 'anchor',
          message: 'A ligação direta deve usar letras minúsculas, números e hífen.',
        })
      } else if (anchors.has(section.anchor)) {
        issues.push({
          level: 'error',
          sectionKey,
          field: 'anchor',
          message: `A âncora “${section.anchor}” está repetida.`,
        })
      } else {
        anchors.add(section.anchor)
      }
    }

    issues.push(
      ...sectionIssues(section),
      ...layoutIssues(section),
      ...typographyIssues(section.titleStyle, sectionKey, 'titleStyle'),
      ...typographyIssues(section.bodyStyle, sectionKey, 'bodyStyle'),
    )

    const itemLimits: Partial<Record<BuilderSection['_type'], [number, number, string]>> = {
      builderGallerySection: [1, 30, 'A galeria'],
      builderCardsSection: [1, 16, 'A lista de cartões'],
      builderStatsSection: [1, 8, 'A lista de números'],
      builderPartnersSection: [1, 24, 'A lista de parceiros'],
    }
    const itemLimit = itemLimits[section._type]
    if (itemLimit) {
      const [minimum, maximum, label] = itemLimit
      if (
        !Array.isArray(section.items) ||
        section.items.length < minimum ||
        section.items.length > maximum
      ) {
        issues.push({
          level: 'error',
          sectionKey,
          field: 'items',
          message: `${label} deve ter entre ${minimum} e ${maximum} ${maximum === 1 ? 'item' : 'itens'}.`,
        })
      }
    }

    if (section._type === 'builderGallerySection' && Array.isArray(section.items)) {
      section.items.forEach((item, itemIndex) => {
        issues.push(...mediaIssues(item, sectionKey, `items[${itemIndex}]`))
      })
    }
    if (section._type === 'builderMediaSection') {
      const media = section.media
      const populated =
        isRecord(media) &&
        (Boolean((media.image as {asset?: {_ref?: unknown}} | undefined)?.asset?._ref) ||
          Boolean((media.videoFile as {asset?: {_ref?: unknown}} | undefined)?.asset?._ref) ||
          Boolean(typeof media.youtubeUrl === 'string' && media.youtubeUrl.trim()))
      if (!populated) {
        issues.push({
          level: 'error',
          sectionKey,
          field: 'media',
          message: 'Adicione uma imagem ou vídeo a esta secção.',
        })
      }
    }
    if (section._type === 'builderCollectionSection') {
      if (!collectionSources.has(String(section.source))) {
        issues.push({
          level: 'error',
          sectionKey,
          field: 'source',
          message: 'Escolha o conteúdo apresentado nesta lista.',
        })
      }
      const limitIssue = rangeIssue(
        section.limit,
        1,
        24,
        'limit',
        'A quantidade de itens',
        sectionKey,
        true,
      )
      if (limitIssue) issues.push(limitIssue)
    }
    if (section._type === 'builderHeroSection' && section.minHeight !== undefined) {
      const minHeightIssue = rangeIssue(
        section.minHeight,
        320,
        1080,
        'minHeight',
        'A altura mínima',
        sectionKey,
      )
      if (minHeightIssue) issues.push(minHeightIssue)
    }
    if (
      section._type === 'builderContactSection' &&
      section.formKind !== undefined &&
      !['contact', 'quote', 'catalogue'].includes(section.formKind)
    ) {
      issues.push({
        level: 'error',
        sectionKey,
        field: 'formKind',
        message: 'Escolha um formulário válido.',
      })
    }
  })

  return issues
}

export const validateBuilderPage = (
  page: BuilderPage,
  allPages: BuilderPage[] = [],
): BuilderValidationIssue[] => {
  const issues: BuilderValidationIssue[] = []

  if (!page.title?.trim()) {
    issues.push({level: 'error', field: 'title', message: 'A página precisa de um nome.'})
  }

  if (!routePattern.test(page.route || '')) {
    issues.push({
      level: 'error',
      field: 'route',
      message: 'O endereço deve ser / ou começar por / e usar letras minúsculas e hífen.',
    })
  }

  const publishedId = page._id.replace(/^drafts\./, '')
  if (
    allPages.some(
      (candidate) =>
        candidate._id.replace(/^drafts\./, '') !== publishedId && candidate.route === page.route,
    )
  ) {
    issues.push({
      level: 'error',
      field: 'route',
      message: 'Já existe uma página com este endereço.',
    })
  }

  if (!page.sections?.length) {
    issues.push({level: 'warning', field: 'sections', message: 'A página ainda não tem secções.'})
  }
  issues.push(...validateBuilderSections(page.sections ?? []))

  return issues
}

const luminance = (hex: string) => {
  const channels = hex
    .replace('#', '')
    .match(/.{2}/g)
    ?.map((value) => Number.parseInt(value, 16) / 255)
    .map((value) => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4))
  if (!channels || channels.length !== 3) return null
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

const contrast = (left: string, right: string) => {
  const first = luminance(left)
  const second = luminance(right)
  if (first === null || second === null) return null
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)
}

export const validateBuilderSettings = (
  settings: BuilderSiteSettings,
): BuilderValidationIssue[] => {
  const issues: BuilderValidationIssue[] = []
  const theme = settings.theme
  if (!theme) return issues

  const importantPairs: Array<[string | undefined, string | undefined, string]> = [
    [theme.textColor, theme.fogColor, 'texto principal sobre o fundo névoa'],
    [theme.textColor, theme.mintColor, 'texto principal sobre o fundo verde claro'],
    ['#ffffff', theme.deepColor, 'texto branco sobre o verde profundo'],
    ['#ffffff', theme.blueColor, 'texto branco sobre o azul mineral'],
  ]

  for (const [foreground, background, label] of importantPairs) {
    if (!foreground || !background) continue
    const ratio = contrast(foreground, background)
    if (ratio !== null && ratio < 4.5) {
      issues.push({
        level: 'error',
        field: 'theme',
        message: `O contraste de ${label} é insuficiente (${ratio.toFixed(1)}:1).`,
      })
    }
  }

  return issues
}

export const hasBuilderErrors = (issues: BuilderValidationIssue[]) =>
  issues.some((issue) => issue.level === 'error')

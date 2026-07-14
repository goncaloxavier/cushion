import type {
  BuilderPage,
  BuilderSection,
  BuilderSiteSettings,
  BuilderValidationIssue,
} from './types'

const routePattern = /^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*\/)*[a-z0-9]*(?:-[a-z0-9]+)*$/
const safeLinkPattern = /^(\/|#|https?:\/\/|mailto:|tel:)/

const mediaIssues = (section: BuilderSection): BuilderValidationIssue[] => {
  const media = section.media
  if (!media) return []

  const issues: BuilderValidationIssue[] = []
  const hasAsset =
    media.kind === 'image'
      ? Boolean(media.image?.asset?._ref)
      : media.kind === 'video'
        ? Boolean(media.videoFile?.asset?._ref)
        : Boolean(media.youtubeUrl)

  if (hasAsset && !media.alt?.pt?.trim()) {
    issues.push({
      level: 'warning',
      sectionKey: section._key,
      field: 'media.alt',
      message: 'Descreva a imagem ou vídeo para leitores de ecrã.',
    })
  }

  if (media.autoplay && !media.muted) {
    issues.push({
      level: 'error',
      sectionKey: section._key,
      field: 'media.muted',
      message: 'Um vídeo automático tem de começar sem som.',
    })
  }

  return issues
}

const sectionIssues = (section: BuilderSection): BuilderValidationIssue[] => {
  const issues = mediaIssues(section)

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
    (!section.title || Array.isArray(section.title) || !section.title.pt?.trim())
  ) {
    issues.push({
      level: 'error',
      sectionKey: section._key,
      field: 'title',
      message: 'Esta secção precisa de um título.',
    })
  }

  for (const action of section.actions ?? []) {
    if (!action.label?.pt?.trim()) {
      issues.push({
        level: 'error',
        sectionKey: section._key,
        field: 'actions',
        message: 'Todos os botões precisam de texto.',
      })
    }
    if (!action.href || !safeLinkPattern.test(action.href)) {
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

  const anchors = new Map<string, string>()
  for (const section of page.sections ?? []) {
    if (section.anchor) {
      const existing = anchors.get(section.anchor)
      if (existing) {
        issues.push({
          level: 'error',
          sectionKey: section._key,
          field: 'anchor',
          message: `A âncora “${section.anchor}” está repetida.`,
        })
      } else {
        anchors.set(section.anchor, section._key)
      }
    }
    issues.push(...sectionIssues(section))
  }

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

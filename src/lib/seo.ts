import type {LanguageCode} from '$lib/site-content'

export const siteName = 'DaFábrica4You'

export const defaultSeoDescriptions: Record<LanguageCode, string> = {
  pt: 'A DaFábrica4You transforma resíduos do ecoponto amarelo em soluções exteriores duráveis, laváveis e pensadas para pouca manutenção.',
  en: 'DaFábrica4You transforms yellow-bin waste into durable outdoor solutions designed for low maintenance.',
  es: 'DaFábrica4You transforma residuos del contenedor amarillo en soluciones exteriores duraderas y de bajo mantenimiento.',
}

const stegaMetadataPattern = /[\u200B-\u200D\uFEFF]/g

export const cleanSeoText = (value: string | undefined, maxLength = 170) => {
  const text = (value ?? '')
    .replace(stegaMetadataPattern, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (text.length <= maxLength) return text

  const clipped = text.slice(0, maxLength - 1)
  const wordBoundary = clipped.lastIndexOf(' ')

  return `${(wordBoundary > 80 ? clipped.slice(0, wordBoundary) : clipped).trim()}...`
}

export const seoDescription = (
  language: LanguageCode,
  ...values: Array<string | undefined>
) => {
  for (const value of values) {
    const description = cleanSeoText(value)
    if (description) return description
  }

  return defaultSeoDescriptions[language]
}

export const titleWithSiteName = (title: string) => {
  if (title.includes(siteName)) return cleanSeoText(title, 90)

  const titleBudget = Math.max(30, 90 - siteName.length - 3)
  return `${cleanSeoText(title, titleBudget)} | ${siteName}`
}

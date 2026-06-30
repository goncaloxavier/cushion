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

export const absoluteUrl = (origin: string, url: string | undefined): string | undefined => {
  if (!url) return undefined
  if (/^https?:\/\//i.test(url)) return url
  return `${origin}${url.startsWith('/') ? url : `/${url}`}`
}

export type JsonLd = Record<string, unknown>

export const organizationSchema = (params: {
  origin: string
  logoUrl?: string
  email?: string
  phone?: string
  sameAs?: Array<string | undefined>
}): JsonLd => {
  const sameAs = (params.sameAs ?? []).filter((value): value is string => Boolean(value))
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteName,
    url: params.origin,
    ...(params.logoUrl ? {logo: params.logoUrl} : {}),
    ...(params.email || params.phone
      ? {
          contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'customer service',
            ...(params.email ? {email: params.email} : {}),
            ...(params.phone ? {telephone: params.phone} : {}),
          },
        }
      : {}),
    ...(sameAs.length ? {sameAs} : {}),
  }
}

export const productSchema = (params: {
  name: string
  description?: string
  imageUrl?: string
  price?: number
  currency?: string
}): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: cleanSeoText(params.name, 110),
  ...(params.description ? {description: cleanSeoText(params.description)} : {}),
  ...(params.imageUrl ? {image: params.imageUrl} : {}),
  brand: {'@type': 'Brand', name: siteName},
  ...(typeof params.price === 'number' && Number.isFinite(params.price)
    ? {
        offers: {
          '@type': 'Offer',
          priceCurrency: params.currency ?? 'EUR',
          price: params.price.toFixed(2),
          availability: 'https://schema.org/InStock',
        },
      }
    : {}),
})

export const blogPostingSchema = (params: {
  title: string
  description?: string
  imageUrl?: string
  datePublished?: string
  logoUrl?: string
}): JsonLd => ({
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: cleanSeoText(params.title, 110),
  ...(params.description ? {description: cleanSeoText(params.description)} : {}),
  ...(params.imageUrl ? {image: params.imageUrl} : {}),
  ...(params.datePublished ? {datePublished: params.datePublished} : {}),
  author: {'@type': 'Organization', name: siteName},
  publisher: {
    '@type': 'Organization',
    name: siteName,
    ...(params.logoUrl ? {logo: {'@type': 'ImageObject', url: params.logoUrl}} : {}),
  },
})

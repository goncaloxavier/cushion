import {error} from '@sveltejs/kit'
import {
  getPublishedSiteEditorE2eDocument,
  getSiteEditorE2eDocument,
  siteEditorE2eEnabled,
  siteEditorE2eRequestStaff,
  siteEditorE2eScope,
} from '$lib/server/site-editor-e2e'
import {ratioFixturePage} from '$lib/server/site-editor-ratio-fixture'
import {normalizeEditorDocumentId} from '$lib/site-editor/path'
import {textAppearanceFields} from '$lib/text-appearance'
import type {PageServerLoad} from './$types'

const localized = (value: unknown) => {
  if (!value || typeof value !== 'object') return ''
  const pt = (value as {pt?: unknown}).pt
  return typeof pt === 'string' ? pt : ''
}

const appearance = (value: unknown) => {
  if (!value || typeof value !== 'object') return {}
  const source = value as Record<string, unknown>
  return Object.fromEntries(
    textAppearanceFields.flatMap((field) =>
      source[field] === undefined ? [] : [[field, source[field]]],
    ),
  )
}

const firstArticleText = (value: unknown) => {
  if (!value || typeof value !== 'object') return ''
  const blocks = (value as {pt?: unknown}).pt
  if (!Array.isArray(blocks)) return ''
  for (const block of blocks) {
    if (!block || typeof block !== 'object') continue
    const children = (block as {children?: unknown}).children
    if (!Array.isArray(children)) continue
    const text = children
      .map((child) =>
        child && typeof child === 'object' && typeof (child as {text?: unknown}).text === 'string'
          ? String((child as {text: string}).text)
          : '',
      )
      .join('')
      .trim()
    if (text) return text
  }
  return ''
}

const articleBlocks = (value: unknown) => {
  if (!value || typeof value !== 'object') return []
  const blocks = (value as {pt?: unknown}).pt
  return Array.isArray(blocks) ? blocks : []
}

export const load: PageServerLoad = ({url, request}) => {
  if (!siteEditorE2eEnabled() || !siteEditorE2eRequestStaff(request.headers)) {
    error(404, 'Página não encontrada.')
  }

  const fixture = url.searchParams.get('fixture')
  const scope = siteEditorE2eScope(request.headers)
  if (fixture === 'ratios') {
    // The same sections rendered twice: once with the editor's affordances and
    // once as a visitor sees them after publish. Both go through
    // BuilderPageRenderer, and `preview` is the only difference between them --
    // which is the claim the public snapshots exist to keep honest.
    return {
      fixture: 'ratios',
      created: null,
      home: null,
      product: null,
      page: ratioFixturePage(),
      published: url.searchParams.get('published') === '1',
    }
  }
  const getDocument = url.searchParams.get('published') === '1'
    ? getPublishedSiteEditorE2eDocument
    : getSiteEditorE2eDocument
  if (fixture === 'product') {
    const product = getDocument('storeProduct.editor-fixture', scope)
    const variants = Array.isArray(product.variants) ? product.variants : []
    const firstVariant =
      variants[0] && typeof variants[0] === 'object'
        ? (variants[0] as Record<string, unknown>)
        : undefined
    return {
      fixture: 'product',
      created: null,
      home: null,
      product: {
        title: localized(product.title),
        titleAppearance: appearance(product.title),
        summary: localized(product.summary),
        summaryAppearance: appearance(product.summary),
        weightKg: typeof firstVariant?.weightKg === 'number' ? firstVariant.weightKg : null,
        priceNatural:
          typeof firstVariant?.priceNatural === 'number' ? firstVariant.priceNatural : null,
      },
    }
  }

  if (fixture !== 'created') {
    const siteContent = getDocument('siteContent', scope)
    const home =
      siteContent.home && typeof siteContent.home === 'object'
        ? (siteContent.home as Record<string, unknown>)
        : {}
    const hero =
      home.hero && typeof home.hero === 'object'
        ? (home.hero as Record<string, unknown>)
        : {}
    const impact =
      home.impact && typeof home.impact === 'object'
        ? (home.impact as Record<string, unknown>)
        : {}
    return {
      fixture: 'home',
      created: null,
      product: null,
      home: {
        title: localized(hero.title),
        titleAppearance: appearance(hero.title),
        impactTitle: localized(impact.title),
        impactTitleAppearance: appearance(impact.title),
      },
    }
  }

  const documentId = url.searchParams.get('document')?.trim()
  if (!documentId) error(404, 'Conteúdo de teste não encontrado.')
  const document = getDocument(documentId, scope)
  const title =
    typeof document.title === 'string' ? document.title : localized(document.title) || 'Novo conteúdo'
  const variants = Array.isArray(document.variants) ? document.variants : []
  const firstVariant =
    variants[0] && typeof variants[0] === 'object'
      ? (variants[0] as Record<string, unknown>)
      : undefined

  return {
    fixture: 'created',
    home: null,
    product: null,
    created: {
      id: normalizeEditorDocumentId(document._id),
      type: document._type,
      title,
      summary:
        localized(document.summary) ||
        localized(document.excerpt) ||
        localized(document.description),
      content: firstArticleText(document.article),
      article: articleBlocks(document.article),
      location: typeof document.location === 'string' ? document.location : '',
      publishedAt: typeof document.publishedAt === 'string' ? document.publishedAt : '',
      category: typeof document.category === 'string' ? document.category : localized(document.category),
      variantKey: typeof firstVariant?._key === 'string' ? firstVariant._key : '',
      weightKg: typeof firstVariant?.weightKg === 'number' ? firstVariant.weightKg : null,
      priceNatural:
        typeof firstVariant?.priceNatural === 'number' ? firstVariant.priceNatural : null,
      page: document._type === 'sitePage' ? document : null,
    },
  }
}

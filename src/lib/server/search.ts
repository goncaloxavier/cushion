import {ROUTE_PREFIX, snippet, type SearchResults} from '$lib/search'
import {storeCategoryLabel, type SiteContent} from '$lib/site-content'

const RESULTS_PER_CATEGORY = 5
const MAX_TOKENS = 6

const diacriticRange = (start: number, end: number) => {
  let chars = String.fromCharCode(start)
  for (let code = start + 1; code <= end; code += 1) chars += String.fromCharCode(code)
  return chars
}

// Combining diacritical marks (U+0300-U+036F), built from code points so no
// literal accent glyph or escape sequence needs to live in this source file.
const DIACRITICS_RE = new RegExp(`[${diacriticRange(0x0300, 0x036f)}]`, 'g')

const fold = (value: string) =>
  value
    .normalize('NFD')
    .replace(DIACRITICS_RE, '')
    .toLowerCase()
    .trim()

const tokenize = (query: string) => fold(query).split(/\s+/).filter(Boolean).slice(0, MAX_TOKENS)

const scoreField = (token: string, fieldFolded: string): number => {
  if (!fieldFolded) return 0
  if (fieldFolded === token) return 100
  if (fieldFolded.startsWith(token)) return 50
  const boundary = new RegExp(`(^|[^a-z0-9])${token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`)
  if (boundary.test(fieldFolded)) return 30
  if (fieldFolded.includes(token)) return 10
  return 0
}

type WeightedField = {text: string; weight: number}

const scoreItem = (tokens: string[], fields: WeightedField[]): number => {
  const folded = fields.map((field) => ({folded: fold(field.text), weight: field.weight}))

  let total = 0
  for (const token of tokens) {
    let best = 0
    for (const field of folded) {
      const score = scoreField(token, field.folded) * field.weight
      if (score > best) best = score
    }
    if (best === 0) return 0
    total += best
  }
  return total
}

const rank = <T>(
  items: T[],
  tokens: string[],
  fieldsFor: (item: T) => WeightedField[],
): {item: T; score: number}[] =>
  items
    .map((item) => ({item, score: scoreItem(tokens, fieldsFor(item))}))
    .filter(({score}) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, RESULTS_PER_CATEGORY)

export const searchSite = (content: SiteContent, query: string): SearchResults => {
  const tokens = tokenize(query)
  const empty: SearchResults = {products: [], storeProducts: [], caseStudies: [], blogPosts: []}
  if (tokens.length === 0) return empty

  const products = rank(content.products, tokens, (item) => [
    {text: item.title, weight: 5},
    {text: item.summary, weight: 3},
    {text: item.description, weight: 1},
  ]).map(({item}) => ({
    category: 'products' as const,
    title: item.title,
    slug: item.slug,
    href: `${ROUTE_PREFIX.products}/${item.slug}`,
    snippet: snippet(item.summary, item.description),
  }))

  const storeProducts = rank(content.storeProducts, tokens, (item) => [
    {text: item.title, weight: 5},
    {text: item.summary, weight: 3},
    {text: storeCategoryLabel(content.storePage, item.category), weight: 2},
  ]).map(({item}) => ({
    category: 'storeProducts' as const,
    title: item.title,
    slug: item.slug,
    href: `${ROUTE_PREFIX.storeProducts}/${item.slug}`,
    snippet: snippet(item.summary),
  }))

  const caseStudies = rank(content.caseStudies, tokens, (item) => [
    {text: item.title, weight: 5},
    {text: item.summary, weight: 3},
    {text: item.location, weight: 2},
    {text: item.description ?? '', weight: 1},
  ]).map(({item}) => ({
    category: 'caseStudies' as const,
    title: item.title,
    slug: item.slug,
    href: `${ROUTE_PREFIX.caseStudies}/${item.slug}`,
    snippet: snippet(item.summary, item.description),
  }))

  const blogPosts = rank(content.blogPosts, tokens, (item) => [
    {text: item.title, weight: 5},
    {text: item.excerpt, weight: 3},
    {text: item.category, weight: 2},
    {text: item.body, weight: 1},
  ]).map(({item}) => ({
    category: 'blogPosts' as const,
    title: item.title,
    slug: item.slug,
    href: `${ROUTE_PREFIX.blogPosts}/${item.slug}`,
    snippet: snippet(item.excerpt),
  }))

  return {products, storeProducts, caseStudies, blogPosts}
}

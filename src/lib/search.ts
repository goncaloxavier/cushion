// Shared between the search UI (client) and the matching engine (server-only,
// see $lib/server/search). Kept out of $lib/server so SearchOverlay.svelte can
// import it directly for the free, zero-network empty-state.
import type {SiteContent} from '$lib/site-content'

export type SearchCategory = 'products' | 'storeProducts' | 'caseStudies' | 'blogPosts'

export type SearchResult = {
  category: SearchCategory
  title: string
  slug: string
  href: string
  snippet: string
}

export type SearchResults = Record<SearchCategory, SearchResult[]>

export const CATEGORY_ORDER: SearchCategory[] = ['products', 'storeProducts', 'caseStudies', 'blogPosts']

export const ROUTE_PREFIX: Record<SearchCategory, string> = {
  products: '/produtos',
  storeProducts: '/loja',
  caseStudies: '/casos-de-estudo',
  blogPosts: '/blog',
}

const MIN_QUERY_LENGTH = 2
const SNIPPET_LENGTH = 140

export const isQueryTooShort = (query: string) => query.trim().length < MIN_QUERY_LENGTH

export const snippet = (...candidates: (string | undefined)[]) => {
  const source = candidates.find((value) => value && value.trim())
  if (!source) return ''
  const trimmed = source.trim()
  return trimmed.length > SNIPPET_LENGTH ? `${trimmed.slice(0, SNIPPET_LENGTH).trim()}…` : trimmed
}

// Free, in-memory "recent/default" results for the empty-query state — no
// network round trip, since `content` is already loaded by the root layout.
export const topItemsPerCategory = (content: SiteContent, count = 3): SearchResults => ({
  products: content.products.slice(0, count).map((item) => ({
    category: 'products',
    title: item.title,
    slug: item.slug,
    href: `${ROUTE_PREFIX.products}/${item.slug}`,
    snippet: snippet(item.summary, item.description),
  })),
  storeProducts: content.storeProducts.slice(0, count).map((item) => ({
    category: 'storeProducts',
    title: item.title,
    slug: item.slug,
    href: `${ROUTE_PREFIX.storeProducts}/${item.slug}`,
    snippet: snippet(item.summary),
  })),
  caseStudies: content.caseStudies.slice(0, count).map((item) => ({
    category: 'caseStudies',
    title: item.title,
    slug: item.slug,
    href: `${ROUTE_PREFIX.caseStudies}/${item.slug}`,
    snippet: snippet(item.summary, item.description),
  })),
  blogPosts: content.blogPosts.slice(0, count).map((item) => ({
    category: 'blogPosts',
    title: item.title,
    slug: item.slug,
    href: `${ROUTE_PREFIX.blogPosts}/${item.slug}`,
    snippet: snippet(item.excerpt),
  })),
})

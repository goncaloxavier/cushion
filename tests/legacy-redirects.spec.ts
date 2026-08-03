import {readFileSync} from 'node:fs'
import {expect, test} from '@playwright/test'
import {legacyRedirect} from '../src/lib/server/legacy-redirects'

/**
 * Rankings attach to URLs. The previous site published 218 of them and only six
 * survive unchanged, so without these redirects the move loses almost every
 * position the client currently holds. The fixture is that site's own sitemap,
 * captured before the move.
 */
const legacyUrls = readFileSync('tests/fixtures/legacy-urls.txt', 'utf8')
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean)

test('the captured inventory is the real one', () => {
  // A truncated fixture would make every sweep below pass while covering nothing.
  expect(legacyUrls.length).toBeGreaterThan(200)
  expect(legacyUrls).toContain('/pavimento-decking/')
  expect(legacyUrls.filter((url) => url.startsWith('/l/')).length).toBeGreaterThan(100)
})

test('products moved from the root into /produtos', () => {
  expect(legacyRedirect('/vedacoes/')).toBe('/produtos/vedacoes')
  expect(legacyRedirect('/compostores')).toBe('/produtos/compostores')
  // Renamed, not just moved.
  expect(legacyRedirect('/pavimento-decking/')).toBe('/produtos/decking')
  // The old page was about fence stakes; that is the agriculture product now.
  expect(legacyRedirect('/estacas-para-vedacao/')).toBe('/produtos/agricultura')
})

test('blog posts moved from /l/ and carry their language with them', () => {
  expect(legacyRedirect('/l/consumo-de-plastico/')).toBe('/blog/consumo-de-plastico')
  // The old site folded the language into the slug rather than a path prefix.
  expect(legacyRedirect('/l/en-us-consumo-de-plastico/')).toBe(
    '/blog/consumo-de-plastico?lang=en',
  )
  expect(legacyRedirect('/l/es-cop-26/')).toBe('/blog/cop-26?lang=es')
})

test('language prefixes become the language parameter', () => {
  expect(legacyRedirect('/en-us/produtos/')).toBe('/produtos?lang=en')
  expect(legacyRedirect('/es/contacto/')).toBe('/contacto?lang=es')
  expect(legacyRedirect('/en-us/produtos/pavimento-decking/')).toBe(
    '/produtos/decking?lang=en',
  )
  // English-only pages, with no Portuguese original.
  expect(legacyRedirect('/en-us/shelters/')).toBe('/produtos/abrigos-e-telheiros?lang=en')
  expect(legacyRedirect('/en-us/ageing-grid/')).toBe('/produtos/grelha-de-enrelvamento?lang=en')
  expect(legacyRedirect('/en-us/case-studies/')).toBe('/casos-de-estudo?lang=en')
})

test('the privacy policy redirects off-site, in every language', () => {
  const iubenda = 'https://www.iubenda.com/privacy-policy/56295339'
  expect(legacyRedirect('/politica-de-privacidade/')).toBe(iubenda)
  expect(legacyRedirect('/en-us/sobre-nos/politica-de-privacidade/')).toBe(iubenda)
  expect(legacyRedirect('/es/sobre-nos/politica-de-privacidade/')).toBe(iubenda)
})

test('a path that still exists is left alone', () => {
  // No redirect: these addresses are identical on both sites, and a redirect to
  // yourself is a loop.
  for (const path of ['/', '/produtos/', '/blog/', '/contacto/', '/sobre-nos/']) {
    expect(legacyRedirect(path), `${path} redirects to itself`).toBeNull()
  }
})

test('nothing is redirected to a page that does not exist', () => {
  // The rule the whole file turns on. A redirect landing on a 404 costs a round
  // trip and still ends in a 404, and a crawler reads it as a soft 404 — so a
  // URL with no destination is left to 404 honestly instead.
  for (const slug of [
    'o-que-aconteceria-se-todas-as-arvores-do-mundo-desaparecessem',
    'overview-of-the-drought-situation-in-algarve-in-2024',
  ]) {
    expect(legacyRedirect(`/l/${slug}/`), `${slug} is redirected into a dead end`).toBeNull()
    expect(legacyRedirect(`/l/en-us-${slug}/`)).toBeNull()
  }

  // And a translated URL is not passed through on the assumption its Portuguese
  // path survived: /en-us/<removed> must not become /<removed>?lang=en.
  expect(legacyRedirect('/en-us/dados-logisticos-dos-perfis/')).toBeNull()
  expect(legacyRedirect('/es/dados-logisticos-dos-perfis/')).toBeNull()
})

test('every URL the old site published is either mapped or deliberately not', () => {
  // The sweep. Anything that falls out of both lists is a URL nobody has looked
  // at, which is exactly how a position gets lost quietly.
  const deliberate = new Set([
    // identical on both sites
    '/',
    '/blog/',
    '/casos-de-estudo/',
    '/catalogo/',
    '/contacto/',
    '/dados-de-faturacao/',
    '/produtos/',
    '/sobre-nos/',
    // content with no equivalent, pending a decision
    '/dados-logisticos-dos-perfis/',
    '/en-us/dados-logisticos-dos-perfis/',
    '/es/dados-logisticos-dos-perfis/',
  ])

  const unmapped = legacyUrls.filter((url) => !legacyRedirect(url) && !deliberate.has(url))
  const retiredPosts = unmapped.filter((url) => url.startsWith('/l/'))
  const other = unmapped.filter((url) => !url.startsWith('/l/'))

  expect(other, `these old URLs have no destination and no decision: ${other}`).toEqual([])
  // Six posts across three languages, each confirmed absent from the new site.
  expect(retiredPosts.length, `unexpected unmapped posts: ${retiredPosts}`).toBe(10)
})

test('the redirect runs before anything else can answer', () => {
  // In the hook, so it applies to every request rather than to whichever routes
  // happen to exist — an old URL has no route here by definition.
  const hooks = readFileSync('src/hooks.server.ts', 'utf8')
  expect(hooks).toContain('legacyRedirect')
  expect(hooks, 'a temporary redirect passes no ranking signal').toContain('redirect(308, legacyTarget)')
})

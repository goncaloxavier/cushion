/**
 * Where the previous site's URLs went.
 *
 * Rankings attach to URLs, not to domains. The old site put products at the root
 * (`/vedacoes`), blog posts under `/l/`, and translations behind `/en-us/` and
 * `/es/` path prefixes — 218 indexed URLs, of which only six survive unchanged.
 * Left to 404, every one of those positions is simply lost, which is the single
 * biggest risk in moving the site.
 *
 * These are permanent (308) redirects, so the ranking signal transfers. They are
 * deliberately an explicit list rather than a clever guess: a redirect that
 * lands on a page about something else is read as a soft 404 and loses the
 * position anyway, so a URL nobody has mapped is better left to 404 honestly
 * than sent somewhere plausible-looking.
 */

type Language = 'pt' | 'en' | 'es'

/** Product pages lived at the root; they are under /produtos/ now. */
const productSlugs: Record<string, string> = {
  'abrigos-e-telheiros': 'abrigos-e-telheiros',
  'bordaduras-de-canteiros': 'bordaduras-de-canteiros',
  'caixas-de-cultivo': 'caixas-de-cultivo',
  compostores: 'compostores',
  'divisorias-de-terrenos': 'divisorias-de-terrenos',
  'floreiras-e-vasos': 'floreiras-e-vasos',
  'grelha-de-enrelvamento': 'grelha-de-enrelvamento',
  hipismo: 'hipismo',
  mobiliario: 'mobiliario',
  'paineis-para-entrada-de-localidades': 'paineis-para-entrada-de-localidades',
  passadicos: 'passadicos',
  pergolas: 'pergolas',
  'resguardos-de-ecopontos': 'resguardos-de-ecopontos',
  revestimento: 'revestimento',
  'sinaletica-e-paineis-informativos': 'sinaletica-e-paineis-informativos',
  vedacoes: 'vedacoes',

  // Renamed rather than moved.
  'pavimento-decking': 'decking',
  // The old page was specifically about fence stakes; that content lives in the
  // agriculture product, whose description opens "Estacas, postes e soluções".
  'estacas-para-vedacao': 'agricultura',

  // English-only pages, with no Portuguese equivalent on the old site.
  shelters: 'abrigos-e-telheiros',
  // "Ageing grid" is a machine translation of "grelha de enrelvamento".
  'ageing-grid': 'grelha-de-enrelvamento',
}

/** Paths that keep their own address, or move somewhere that is not a product. */
const pageRedirects: Record<string, string> = {
  'case-studies': '/casos-de-estudo',
}

/**
 * Paths that exist unchanged on both sites. A translated URL like /es/contacto
 * only needs its prefix swapped for a parameter — but only for these. Anything
 * else must not be passed through on the assumption that it still exists, or
 * /en-us/<something removed> redirects to a 404, which is worse than the 404 it
 * was: it costs a round trip and reads as a soft 404 to a crawler.
 */
const sharedPaths = new Set([
  '/',
  '/sobre-nos',
  '/produtos',
  '/loja',
  '/casos-de-estudo',
  '/blog',
  '/catalogo',
  '/contacto',
  '/politica-de-devolucoes',
  '/dados-de-faturacao',
])

/**
 * Blog posts whose slug changed. Deliberately empty: three old slugs look like
 * renames of posts that exist —
 *
 *   porque-garrafas-de-plastico-sao-um-drama  ~ porque-garrafas-de-plastico-sao-uma-drama
 *   abate-de-arvores-consequencias-para-meio-ambiente ~ abate-de-arvores
 *   dafabrica4you-desenvolveu-um-processo-industrial-… ~ usar-como-materia-prima-os-residuos-do-ecoponto-amarelo
 *
 * — but "looks like" is not good enough to send a reader somewhere. Sending
 * someone to the wrong article is worse than a 404, and unlike a 404 nobody
 * notices. They stay unmapped until someone confirms they are the same posts.
 */
const blogSlugRenames: Record<string, string> = {}

/**
 * Old post slugs with nothing to point at. Listed as an exclusion rather than
 * checking the 56 posts that do exist: an inclusion list would have to be kept
 * in step with every post the client publishes or renames, and would silently
 * stop redirecting the day it fell behind. This only names what is known gone.
 *
 * The first three are the rename candidates above; the last two never made it
 * across. Each returns a plain 404, which is the honest answer — a redirect to
 * a page that does not exist costs a round trip and still ends in a 404.
 */
const retiredBlogSlugs = new Set([
  'porque-garrafas-de-plastico-sao-um-drama',
  'abate-de-arvores-consequencias-para-meio-ambiente',
  'dafabrica4you-desenvolveu-um-processo-industrial-em-que-usamos-como-materia-prima-os-residuos-do-ecoponto-amarelo',
  'o-que-aconteceria-se-todas-as-arvores-do-mundo-desaparecessem',
  'overview-of-the-drought-situation-in-algarve-in-2024',
  'portuguese-municipalities-have-to-collect-organic-waste-from-1-january-2024-onwards',
])

/**
 * The privacy policy is hosted by iubenda and linked from the footer, so the old
 * page redirects off-site. Absolute, and the only destination that leaves here.
 */
const PRIVACY_POLICY_URL = 'https://www.iubenda.com/privacy-policy/56295339'
const privacyPaths = new Set(['/politica-de-privacidade', '/sobre-nos/politica-de-privacidade'])

const withLanguage = (path: string, language: Language) =>
  language === 'pt' ? path : `${path}?lang=${language}`

/**
 * Splits a leading `/en-us` or `/es` off the path. The old site used those
 * prefixes for translations; this site uses a `lang` query parameter.
 */
const splitLanguage = (pathname: string): {path: string; language: Language} => {
  for (const [prefix, language] of [
    ['/en-us', 'en'],
    ['/es', 'es'],
  ] as const) {
    if (pathname === prefix) return {path: '/', language}
    if (pathname.startsWith(`${prefix}/`)) {
      return {path: pathname.slice(prefix.length) || '/', language}
    }
  }
  return {path: pathname, language: 'pt'}
}

/**
 * Blog posts lived at `/l/<slug>`, and their translations at `/l/en-us-<slug>`
 * and `/l/es-<slug>` — the language was folded into the slug rather than into a
 * prefix, so it has to be peeled off separately.
 */
const splitBlogSlug = (slug: string): {slug: string; language: Language} => {
  for (const [prefix, language] of [
    ['en-us-', 'en'],
    ['es-', 'es'],
  ] as const) {
    if (slug.startsWith(prefix)) return {slug: slug.slice(prefix.length), language}
  }
  return {slug, language: 'pt'}
}

export const legacyRedirect = (pathname: string): string | null => {
  // SvelteKit strips a trailing slash itself, but that happens after this runs,
  // and every URL the old site published ended in one.
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  if (!normalized || normalized === '/') return null

  const {path, language} = splitLanguage(normalized)

  if (privacyPaths.has(path)) return PRIVACY_POLICY_URL

  if (path.startsWith('/l/')) {
    const raw = path.slice('/l/'.length)
    if (!raw) return withLanguage('/blog', language)
    const post = splitBlogSlug(raw)
    const slug = blogSlugRenames[post.slug] ?? post.slug
    if (retiredBlogSlugs.has(slug)) return null
    // A slug carrying its own language marker wins: /es/l/en-us-x is not a thing
    // the old site produced, but if it appears the marker is the specific one.
    return withLanguage(`/blog/${slug}`, post.language === 'pt' ? language : post.language)
  }

  const segment = path.slice(1)
  if (Object.prototype.hasOwnProperty.call(pageRedirects, segment)) {
    return withLanguage(pageRedirects[segment], language)
  }
  if (Object.prototype.hasOwnProperty.call(productSlugs, segment)) {
    return withLanguage(`/produtos/${productSlugs[segment]}`, language)
  }

  // A translated URL whose Portuguese path is unchanged — /en-us/produtos,
  // /es/contacto — still has to lose its prefix and gain the parameter.
  if (language !== 'pt') {
    // Products under the old prefix kept their own root-level naming too:
    // /en-us/produtos/pavimento-decking.
    const nested = path.startsWith('/produtos/') ? path.slice('/produtos/'.length) : ''
    if (nested && Object.prototype.hasOwnProperty.call(productSlugs, nested)) {
      return withLanguage(`/produtos/${productSlugs[nested]}`, language)
    }
    if (sharedPaths.has(path)) return withLanguage(path, language)
  }

  return null
}

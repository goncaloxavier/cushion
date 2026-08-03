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
 * Blog posts whose slug changed.
 *
 * Mostly these are the translated URLs. The old site gave a post's English and
 * Spanish versions their own, longer slugs — /l/en-us-abate-de-arvores-
 * consequencias-para-meio-ambiente for a post whose Portuguese original was
 * simply /l/abate-de-arvores — so the translations look like missing content
 * when they are the same article under a different name.
 *
 * The last two were written in English and published on the Portuguese site,
 * then rewritten in Portuguese here. Each pair was confirmed by reading both
 * pages, not by matching strings: "Overview of the Drought Situation in Algarve
 * in 2024" and "Seca no Algarve em 2024" are the same article.
 */
const blogSlugRenames: Record<string, string> = {
  'abate-de-arvores-consequencias-para-meio-ambiente': 'abate-de-arvores',
  'porque-garrafas-de-plastico-sao-um-drama': 'porque-garrafas-de-plastico-sao-uma-drama',
  'dafabrica4you-desenvolveu-um-processo-industrial-em-que-usamos-como-materia-prima-os-residuos-do-ecoponto-amarelo':
    'usar-como-materia-prima-os-residuos-do-ecoponto-amarelo',
  'overview-of-the-drought-situation-in-algarve-in-2024': 'seca-no-algarve-em-2024',
  'portuguese-municipalities-have-to-collect-organic-waste-from-1-january-2024-onwards':
    'os-municipios-portugueses-a-partir-de-1-de-janeiro-de-2024-tem-que-recolher-residuos-organicos',
}

/**
 * Old post slugs with nothing to point at, which 404 honestly rather than being
 * redirected into a dead end.
 *
 * This one is the only piece of content genuinely lost in the move. Its
 * Portuguese original already 404s on the old site — the sitemap still lists it,
 * which is how it looked like a live post — and only the English and Spanish
 * versions still answer. Nothing here replaces it. If the client wants those two
 * URLs back, the article has to be republished; then this entry comes out and a
 * rename goes in above.
 */
const retiredBlogSlugs = new Set(['o-que-aconteceria-se-todas-as-arvores-do-mundo-desaparecessem'])

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

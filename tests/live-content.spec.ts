import {expect, test, type APIRequestContext} from '@playwright/test'
import {PREVIEW_COOKIE} from '../src/lib/server/preview'

/**
 * Every other suite in this repo runs against in-code fixtures. That keeps them
 * fast and offline, but it also means nothing ever rendered the content the
 * client actually publishes — and two bugs reached them through a green suite
 * because of it: a product page that threw a 500 whenever the product carried
 * sections (no fixture product does), and a section the editor silently dropped.
 *
 * This suite is the counterweight. It asks the running site for its own sitemap,
 * so it always covers exactly what a visitor can reach, and it renders every one
 * of those pages against the real dataset. New products, posts and pages are
 * covered the moment they exist — nothing here needs updating for them.
 *
 * It sweeps twice, because the two audiences fail differently:
 *   - published, which is what visitors get;
 *   - drafts, which is what the client sees in the editor. Both bugs above only
 *     appeared with draft content, so a published-only sweep would have shipped
 *     them exactly as the old suite did.
 *
 * Read-only throughout: GETs only, and no write token is ever provided.
 *
 *   npm run e2e:live
 */

// Below this the server is clearly serving fallback content rather than the real
// dataset (the fixtures carry only a handful of pages), so the sweep would pass
// while proving nothing. Fail loudly instead of quietly covering nothing.
const MIN_EXPECTED_PAGES = 40

// Grouped by prefix so a failure names the section that broke, and each group
// reports every bad URL at once — "these three products 500" is worth far more
// than the first one aborting the run.
const GROUPS = [
  {label: 'product', plural: 'products', prefix: '/produtos/'},
  {label: 'store product', plural: 'store products', prefix: '/loja/'},
  {label: 'case study', plural: 'case studies', prefix: '/casos-de-estudo/'},
  {label: 'blog post', plural: 'blog posts', prefix: '/blog/'},
] as const

// Presentation's preview cookie. `sec-fetch-dest: document` disqualifies preview
// by design, so a plain API request carrying the cookie is exactly the draft
// rendering path the editor's iframe uses.
const draftHeaders = {cookie: `${PREVIEW_COOKIE}=1`}

let paths: string[] = []
let draftsAvailable = false

const collectionPaths = () =>
  paths.filter((path) => GROUPS.some((group) => path.startsWith(group.prefix) && path !== group.prefix))

const pathsIn = (prefix: string) => paths.filter((path) => path.startsWith(prefix) && path !== prefix)

const listingAndStaticPaths = () => paths.filter((path) => !collectionPaths().includes(path))

test.beforeAll(async ({request}) => {
  const response = await request.get('/sitemap.xml')
  expect(response.status(), 'the site could not produce a sitemap').toBe(200)

  const xml = await response.text()
  paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((match) => {
      // The sitemap emits absolute URLs; only the path is useful against baseURL.
      const decoded = match[1].replace(/&amp;/g, '&')
      return decoded.startsWith('http') ? new URL(decoded).pathname : decoded
    })
    .filter((path, index, all) => path && all.indexOf(path) === index)

  expect(
    paths.length,
    `only ${paths.length} pages in the sitemap — the server under test is not reading the live dataset`,
  ).toBeGreaterThanOrEqual(MIN_EXPECTED_PAGES)

  // Draft rendering needs SANITY_VIEWER_TOKEN on the server. When it is absent
  // the request silently falls back to published content, so probe rather than
  // assume: the layout only hands the studio URL to the page in preview mode.
  const probe = await request.get('/', {headers: draftHeaders})
  draftsAvailable = probe.ok() && (await probe.text()).includes('/website')

  const counts = GROUPS.map((group) => `${pathsIn(group.prefix).length} ${group.plural}`).join(', ')
  console.log(
    `[live-content] ${paths.length} pages from the live dataset (${counts}); drafts ${draftsAvailable ? 'included' : 'unavailable'}`,
  )
})

/**
 * A SvelteKit render error surfaces as a 5xx, which the status check catches. A
 * page that returns 200 but rendered the error shell would not, so the body is
 * checked for the shell's own markers too.
 */
const failureFor = async (
  request: APIRequestContext,
  path: string,
  headers?: Record<string, string>,
) => {
  const response = await request.get(path, {timeout: 30_000, headers})
  const status = response.status()
  if (status !== 200) return `${path} → HTTP ${status}`

  const body = await response.text()
  if (body.includes('data-sveltekit-error') || /<h1[^>]*>\s*5\d\d\s*<\/h1>/.test(body)) {
    return `${path} → rendered the error page with a 200`
  }
  // Every real page closes a <main>. A body without one is a shell, not a page.
  if (!body.includes('</main>')) return `${path} → no page content rendered`
  return null
}

const sweep = async (
  request: APIRequestContext,
  group: string,
  groupPaths: string[],
  headers?: Record<string, string>,
) => {
  expect(groupPaths.length, `no ${group} found in the sitemap`).toBeGreaterThan(0)

  // Bounded concurrency: fast enough to sweep everything, gentle enough that a
  // single dev server serves it without queueing into timeouts.
  const failures: string[] = []
  const queue = [...groupPaths]
  await Promise.all(
    Array.from({length: 6}, async () => {
      for (let path = queue.shift(); path; path = queue.shift()) {
        const failure = await failureFor(request, path, headers)
        if (failure) failures.push(failure)
      }
    }),
  )

  expect(
    failures.sort(),
    `${failures.length} of ${groupPaths.length} ${group} failed to render`,
  ).toEqual([])
}

for (const group of GROUPS) {
  test(`every published ${group.label} page renders`, async ({request}) => {
    await sweep(request, group.plural, pathsIn(group.prefix))
  })
}

test('every listing and standalone page renders', async ({request}) => {
  await sweep(request, 'listing and standalone pages', listingAndStaticPaths())
})

test('the other two languages render every published page', async ({request}) => {
  // Translations are written by a webhook, so a malformed or missing one only
  // shows up on the translated page. Same content, both non-default locales.
  await sweep(
    request,
    'translated pages',
    paths.flatMap((path) => [`${path}?lang=en`, `${path}?lang=es`]),
  )
})

test('every page renders with the drafts the client is working on', async ({request}) => {
  test.skip(
    !draftsAvailable,
    'Requires SANITY_VIEWER_TOKEN so the server can read drafts (the editor path)',
  )

  // This is the sweep that matters most. The editor renders drafts, so a page
  // that only breaks on half-finished content breaks for the client and nobody
  // else — which is precisely how the product-page 500 reached them.
  await sweep(request, 'pages in draft', paths, draftHeaders)
})

test('a page from each collection hydrates without console errors', async ({page}) => {
  // The HTTP sweep cannot see client-side failures. A browser pass over one page
  // per collection covers hydration without paying for it on all of them.
  const samples = [
    ...GROUPS.map((group) => pathsIn(group.prefix)[0]).filter(Boolean),
    '/',
    '/produtos',
    '/loja',
    '/catalogo',
  ]

  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`${page.url()} → ${message.text()}`)
  })
  page.on('pageerror', (error) => errors.push(`${page.url()} → ${error.message}`))

  for (const path of samples) {
    await page.goto(path, {waitUntil: 'domcontentloaded'})
    await expect(page.locator('main')).toBeVisible()
  }

  // Third-party embeds (YouTube in particular) log their own noise on pages that
  // carry them; only failures coming from our own code should fail the run.
  const ours = errors.filter(
    (message) => !/youtube|doubleclick|gstatic|favicon|ERR_BLOCKED_BY_CLIENT/i.test(message),
  )
  expect(ours, `console errors on live content:\n${ours.join('\n')}`).toEqual([])
})

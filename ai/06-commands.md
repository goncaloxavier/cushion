# Commands

Keep this current and copy-pasteable.

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
npm run dev:studio
```

Sanity Studio exposes one workspace:

- `/website` edits public website content in dataset `production`. There is no private CRM workspace — leads/client profiles/staff accounts live only in Postgres, managed at `/painel`.
- `/painel/site` is the standalone visual builder. It uses the normal staff login and stores drafts/assets in the configured Sanity website dataset through server-only endpoints.

Live form submissions, the backoffice, customer accounts, checkout orders, addresses, sessions, and payment attempts all require Railway Postgres:

```bash
DATABASE_URL=...
npm run db:migrate
```

Production transactional email for checkout uses Resend:

```bash
RESEND_API_KEY=...
EMAIL_FROM=...
ORDERS_TO_EMAIL=...
APP_ORIGIN=https://example.com
```

Use an independent signing secret for the builder's short-lived iframe preview session:

```bash
BUILDER_PREVIEW_SECRET="$(openssl rand -base64 32)"
```

## Validation

```bash
npm run check
npm run lint
npm run build
npm run build:studio
npm run db:migrate
npm run e2e
npm run seed:studio:write
```

No unit-test runner is configured. Route and CMS-contract Playwright checks are the normal automated E2E path; visual Playwright checks are optional/session-only.

`npm run e2e` also runs `tests/site-editor.spec.ts`. That suite uses a request-scoped, non-production fixture and exercises the real `/painel/site` shell plus a deterministic canvas; it cannot mutate live Sanity content.

## Deployment

```bash
npm run build
npm run preview
npm run build:studio
npm run start:studio
npm run db:migrate
npm run deploy:content
npm run deploy:studio
npm run deploy-graphql
```

## Testing

```bash
npm run e2e
npm run e2e:visual
npm run e2e:visual:update
```

Use `npm run e2e:visual:update` only when you need local visual snapshots for review. The generated `tests/*-snapshots/` PNGs are ignored and should not be committed.

When Xavier explicitly asks to skip Playwright for a task, do not run `npm run e2e`, `npm run e2e:visual`, or visual updates. Use lighter validation plus targeted browser screenshots where practical, and report the skipped checks.

## Sanity Seed

```bash
npm run seed:studio:write
npm run seed:studio
npm run deploy:content
npm run import:store-products
npm run import:store-images
SANITY_ALLOW_WRITE=true npm run seed:store-categories
```

- `seed:studio:write` generates `.sanity/seed.ndjson` locally, including the `siteContent` singleton, page copy, contact/legal footer fields, homepage video URL, partner/media sections, starter product documents, and starter Loja product/price documents.
- `seed:studio` imports those starter documents into Sanity dataset `production` with `--replace`.
- `deploy:content` intentionally refreshes code-managed Sanity content by running the starter seed, historical case-study import, and historical blog import in sequence. Keep it out of Railway builds unless replacing Content Lake documents on every website deploy is intended.
- `import:store-products` creates missing Loja product documents from fallback content without replacing existing manual store products.
- `import:store-images` uploads approved Loja product photos from `static/images/store/` and patches only the configured `storeProduct` documents. Use this for incoming Loja image batches instead of rerunning the full starter seed.
- `seed:store-categories` safely creates only missing Loja category documents. It preserves every product, price, image, and existing category; use it after introducing category management to an older dataset.

## Ecommerce Database

```bash
npm run db:migrate
```

- Uses `DATABASE_URL`.
- Creates/updates the private Postgres schema for customers, sessions, verification/reset tokens, addresses, orders, order items, status events, payment attempts, and outbound email attempts.
- Migration `0004_customer_address_identity.sql` cleans historic exact address duplicates before creating the unique identity index. The command refuses to run when `DATABASE_URL` is unset; that is expected and safer than guessing a database.
- Run after provisioning Railway Postgres and before relying on `/finalizar-compra` or `/painel/encomendas`.

## Historical Blog Import

```bash
npx tsx scripts/update-old-blog-bodies.ts
npm run import:blog:write
npm run import:blog
```

- `scripts/update-old-blog-bodies.ts` refreshes `scripts/old-blog-posts.ts` from `.sanity/old-blog-raw.json` and writes cached EN/ES full-body translations to ignored `.sanity/old-blog-translations.json`.
- `import:blog:write` generates `.sanity/blog-import.ndjson` from `scripts/old-blog-posts.ts`, including both legacy `body` text and the rich `article` field for Studio editing.
- `import:blog` imports the generated blog documents into Sanity dataset `production` with `--replace`.

## Historical Case-Study Import

```bash
npm run import:cases:write
npm run import:cases
```

- `import:cases:write` generates `.sanity/case-study-import.ndjson` from `scripts/old-case-studies.ts`, with no date fields.
- `import:cases` imports the generated case-study documents and images into Sanity dataset `production` with `--replace`.
- `warm:images` (`scripts/warm-images.ts`) pre-generates the resized `fm=webp` variants the site serves on the Sanity CDN so visitors never hit a cold transform. It runs automatically: appended to `import:products`, and via `postbuild` on Railway when `WARM_ON_BUILD=true` is set (local builds skip it). Day-to-day Studio image edits self-warm — the deterministic webp URL is cached globally on first request — so no one needs to run a command.

## Useful Debug Commands

```bash
git status --short
rg --files
npm ls sanity
npm ls @sveltejs/kit svelte vite
npm ls @sanity/cli vite
npm ls @playwright/test
```

## Notes

- `npm run dev` is the SvelteKit website.
- `npm run dev:studio` is Sanity Studio on port `3333` with the `/website` workspace.
- `http://localhost:5173/painel/site` is the standalone builder; it requires local Postgres staff auth plus `SANITY_VIEWER_TOKEN` or `SANITY_WRITE_TOKEN` for drafts, and `SANITY_WRITE_TOKEN` for saves/uploads/publishing.
- `npm run build` produces the SvelteKit Node build used by Railway.
- `npm run build:studio` may need network access because Sanity fetches remote version metadata.
- The repo is on Sanity Studio 6 with Vite 7 and Svelte 5.
- Playwright tests start a local SvelteKit server on port `4173` by default and use the installed Chrome channel unless `PLAYWRIGHT_CHANNEL` is set.
- Playwright route/CMS tests are optimized so viewport-independent checks run once, while mobile/desktop route behavior is still covered where it matters.
- The CI run also uses its own disposable Postgres service. `tests/server-foundation.spec.ts` runs there and self-skips on a local machine without `DATABASE_URL`.
- Playwright tests force fallback fixtures with `SANITY_DISABLE_REMOTE=true`.
- Site-editor Playwright tests additionally set `SITE_EDITOR_E2E=true` and a per-run test key in `playwright.config.ts`. Do not use that harness as a development login shortcut or deploy those environment values.
- Generated Playwright folders are ignored by git/ESLint where relevant: `test-results/`, `playwright-report/`, and visual snapshot folders.

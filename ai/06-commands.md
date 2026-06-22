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

Sanity Studio now exposes two workspaces:

- `/website` edits public website content in dataset `production`.
- `/crm` reviews private requests and client profiles in dataset `crm`.

Live form submissions require private server environment variables:

```bash
SANITY_CRM_WRITE_TOKEN=...
CRM_HASH_SECRET=...
SANITY_CRM_DATASET=crm
```

## Validation

```bash
npm run check
npm run lint
npm run build
npm run build:studio
npm run e2e
npm run seed:studio:write
```

No unit-test runner is configured. Route and CMS-contract Playwright checks are the normal automated E2E path; visual Playwright checks are optional/session-only.

## Deployment

```bash
npm run build
npm run preview
npm run build:studio
npm run start:studio
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
```

- `seed:studio:write` generates `.sanity/seed.ndjson` locally, including the `siteContent` singleton, page copy, contact/legal footer fields, homepage video URL, partner/media sections, starter product documents, and starter Loja product/price documents.
- `seed:studio` imports those starter documents into Sanity dataset `production` with `--replace`.
- `deploy:content` intentionally refreshes code-managed Sanity content by running the starter seed, historical case-study import, and historical blog import in sequence. Keep it out of Railway builds unless replacing Content Lake documents on every website deploy is intended.

## Sanity CRM Dataset

```bash
npx sanity datasets visibility get crm
```

- The `crm` dataset should remain private.
- Do not import public seed/content data into `crm`.
- Do not add `SANITY_CRM_WRITE_TOKEN` to public/client environment variables.

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
- `npm run dev:studio` is Sanity Studio on port `3333` with `/website` and `/crm` workspaces.
- `npm run build` produces the SvelteKit Node build used by Railway.
- `npm run build:studio` may need network access because Sanity fetches remote version metadata.
- The repo is on Sanity Studio 6 with Vite 7 and Svelte 5.
- Playwright tests start a local SvelteKit server on port `4173` by default and use the installed Chrome channel unless `PLAYWRIGHT_CHANNEL` is set.
- Playwright route/CMS tests are optimized so viewport-independent checks run once, while mobile/desktop route behavior is still covered where it matters.
- Playwright tests force fallback fixtures with `SANITY_DISABLE_REMOTE=true`.
- Generated Playwright folders are ignored by git/ESLint where relevant: `test-results/`, `playwright-report/`, and visual snapshot folders.

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

## Validation

```bash
npm run check
npm run lint
npm run build
npm run build:studio
npm run e2e
npm run e2e:visual
npm run seed:studio:write
```

No unit-test runner is configured. Route, CMS-contract, and visual Playwright checks are configured.

## Deployment

```bash
npm run build
npm run preview
npm run build:studio
npm run start:studio
npm run deploy:studio
npm run deploy-graphql
```

## Testing

```bash
npm run e2e
npm run e2e:visual
npm run e2e:visual:update
```

Use `npm run e2e:visual:update` only when the current visual output is intentionally becoming the new baseline.

When Xavier explicitly asks to skip Playwright for a task, do not run `npm run e2e`, `npm run e2e:visual`, or visual updates. Use lighter validation plus targeted browser screenshots where practical, and report the skipped checks.

## Sanity Seed

```bash
npm run seed:studio:write
npm run seed:studio
```

- `seed:studio:write` generates `.sanity/seed.ndjson` locally.
- `seed:studio` imports the starter documents into Sanity dataset `production` with `--replace`.

## Historical Blog Import

```bash
npm run import:blog:write
npm run import:blog
```

- `import:blog:write` generates `.sanity/blog-import.ndjson` from `scripts/old-blog-posts.ts`.
- `import:blog` imports the generated blog documents into Sanity dataset `production` with `--replace`.

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
- `npm run dev:studio` is Sanity Studio on port `3333`.
- `npm run build` produces the SvelteKit Node build used by Railway.
- `npm run build:studio` may need network access because Sanity fetches remote version metadata.
- The repo is on Sanity Studio 6 with Vite 7 and Svelte 5.
- Playwright tests start a local SvelteKit server on port `4173` by default and use the installed Chrome channel unless `PLAYWRIGHT_CHANNEL` is set.
- Playwright route/CMS tests are optimized so viewport-independent checks run once, while mobile/desktop route behavior is still covered where it matters.
- Playwright tests force fallback fixtures with `SANITY_DISABLE_REMOTE=true`.
- Generated Playwright folders are ignored by ESLint: `test-results/` and `playwright-report/`.

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

## Sanity Seed

```bash
npm run seed:studio:write
npm run seed:studio
```

- `seed:studio:write` generates `.sanity/seed.ndjson` locally.
- `seed:studio` imports the starter documents into Sanity dataset `production` with `--replace`.

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
- `npm run build:studio` may need network access because Sanity fetches remote version metadata.
- The repo is currently pinned to Vite 7 because the installed Sanity Studio package set is the dependency constraint.
- Playwright tests start a local SvelteKit server on port `4173` by default and launch local Chrome.
- Playwright tests force fallback fixtures with `SANITY_DISABLE_REMOTE=true`.

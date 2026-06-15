# Validation map

List the checks that actually exist. Do not claim coverage that is not present.

## Commands

```bash
npm run check
npm run lint
npm run build
npm run build:studio
npm run e2e
npm run e2e:visual
npm run seed:studio:write
```

## What Is Protected

- Unit tests: none configured.
- Integration tests: `tests/sanity-contract.spec.ts` checks schema/query/image/fallback alignment.
- E2E tests: `tests/routes.spec.ts` checks public routes, language-safe links, overflow, detail links, collection images, contact form behavior, and 404 handling across desktop and mobile Playwright projects.
- Visual tests: `tests/visual.spec.ts` checks full-page desktop/mobile screenshots for public routes plus current fallback product, case-study, and blog detail pages.
- Seed generation: `scripts/write-sanity-seed.ts` generates 11 starter Sanity documents from fallback content.
- Build/type checks: `npm run check` runs SvelteKit sync and TypeScript; `npm run build` builds SvelteKit; `npm run build:studio` builds Sanity Studio.
- Lint/format: `npm run lint` runs ESLint. Prettier config exists in `package.json`; no package script exists yet.

## What Is Manual

- Sanity Studio UX/content editing review for product categories, case studies, and blog posts.
- Public SvelteKit route review across desktop and mobile: `/`, `/produtos`, `/produtos/[slug]`, `/catalogo`, `/casos-de-estudo`, `/casos-de-estudo/[slug]`, `/blog`, `/blog/[slug]`, and `/contacto`.
- Language toggle review for `?lang=pt`, `?lang=en`, and `?lang=es`.
- Sanity dataset/project changes.

## Test Data Or Fixtures

- None present.

## CI

- CI provider: none configured.
- Workflow files: none present.
- Required checks: none configured.

## Known Gaps

- Browser tests require local Chrome because `playwright.config.ts` uses `channel: 'chrome'`.
- Browser tests force `SANITY_DISABLE_REMOTE=true` for deterministic fixture content.
- Visual baselines are platform-specific screenshot files under `tests/visual.spec.ts-snapshots/`.
- `npm run build:studio` may need network access because Sanity fetches remote version metadata.

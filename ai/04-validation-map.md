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
- Integration tests: `tests/sanity-contract.spec.ts` checks schema/query/page-copy/contact/social/legal/image/media/partner/fallback alignment once in the desktop Playwright project because the file contract is viewport independent.
- E2E tests: `tests/routes.spec.ts` checks public routes, desktop navigation, the stable mobile bottom dock, language-safe links, overflow, detail links, collection images, pagination scroll, refresh scroll reset, contact form gating, contact/social/legal links, and 404 handling across desktop/mobile where the viewport matters.
- Visual tests: `tests/visual.spec.ts` checks full-page desktop/mobile screenshots for public routes plus current fallback product, case-study, and blog detail pages.
- Seed generation: `scripts/write-sanity-seed.ts` generates 11 starter Sanity documents from fallback content.
- Build/type checks: `npm run check` runs SvelteKit sync and TypeScript; `npm run build` builds SvelteKit; `npm run build:studio` builds Sanity Studio.
- Lint/format: `npm run lint` runs ESLint. Prettier config exists in `package.json`; no package script exists yet.

## What Is Manual

- Sanity Studio UX/content editing review for product categories, case studies, and blog posts.
- Public SvelteKit route review across desktop and mobile: `/`, `/produtos`, `/produtos/[slug]`, `/catalogo`, `/casos-de-estudo`, `/casos-de-estudo/[slug]`, `/blog`, `/blog/[slug]`, and `/contacto`.
- Language toggle review for `?lang=pt`, `?lang=en`, and `?lang=es`.
- Targeted browser screenshots are acceptable for small visual/UI fixes when Xavier explicitly asks to skip Playwright E2E or visual runs.
- Sanity dataset/project changes.

## Test Data Or Fixtures

- None present.

## CI

- CI provider: none configured.
- Workflow files: none present.
- Required checks: none configured.

## Known Gaps

- Browser tests default to the installed Chrome channel, with bounded workers and bounded timeouts for quicker local/CI runs. Set `PLAYWRIGHT_CHANNEL` only when a different installed/browser-cache channel is available.
- Browser tests force `SANITY_DISABLE_REMOTE=true` for deterministic fixture content.
- Visual baselines are platform-specific screenshot files under `tests/visual.spec.ts-snapshots/`.
- Playwright E2E/visual runs can be expensive locally; if skipped by explicit instruction, record that in the handoff and use the strongest lighter checks available.
- `npm run build:studio` may need network access because Sanity fetches remote version metadata.
- ESLint ignores `.svelte-kit/`, `.sanity/`, build outputs, `test-results/`, and `playwright-report/` so generated test artifacts do not crash lint.

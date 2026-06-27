# Validation map

List the checks that actually exist. Do not claim coverage that is not present.

## Commands

```bash
npm run check
npm run lint
npm run build
npm run build:studio
npm run e2e
npm run seed:studio:write
```

## What Is Protected

- Unit tests: none configured.
- Integration tests: `tests/sanity-contract.spec.ts` checks schema/query/page-copy/contact/social/legal/image/media/partner/fallback alignment, confirms the public Sanity client stays cached while Visual Editing preview uses uncached draft/stega clients and preview endpoints, plus public website workspace vs private CRM workspace separation, once in the desktop Playwright project because the file contract is viewport independent.
- E2E tests: `tests/routes.spec.ts` checks public routes, desktop navigation, the stable mobile bottom dock, language-safe links, overflow, detail links, collection images, Loja filters/pagination/detail price controls, Carrinho add/update/quote-prefill flow, pagination scroll, refresh scroll reset, contact form gating, contact/social/legal links, and 404 handling across desktop/mobile where the viewport matters.
- Visual tests: `tests/visual.spec.ts` can generate/review full-page desktop/mobile screenshots for public routes plus current fallback product, case-study, and blog detail pages. Snapshot output is ignored and session-only.
- Seed generation: `scripts/write-sanity-seed.ts` generates 21 starter Sanity documents from fallback content: the site singleton, 5 product categories, and 15 Loja products.
- Build/type checks: `npm run check` runs SvelteKit sync and TypeScript; `npm run build` builds SvelteKit; `npm run build:studio` builds Sanity Studio.
- Lint/format: `npm run lint` runs ESLint. Prettier config exists in `package.json`; no package script exists yet.

## What Is Manual

- Sanity Studio UX/content editing review for product categories, Loja products/prices, case studies, blog posts, the `Conteúdo do site` singleton, and the private CRM requests/client-profile workflow.
- Sanity Presentation/Visual Editing review: open the `/website` Studio workspace, enter Presentation, confirm preview mode enables, draft content appears before publishing, click-to-edit overlays target the expected fields, and disabling preview returns to published visitor content.
- Public SvelteKit route review across desktop and mobile: `/`, `/produtos`, `/produtos/[slug]`, `/loja`, `/loja/[slug]`, `/carrinho`, `/catalogo`, `/casos-de-estudo`, `/casos-de-estudo/[slug]`, `/blog`, `/blog/[slug]`, and `/contacto`.
- Language toggle review for `?lang=pt`, `?lang=en`, and `?lang=es`.
- Targeted browser screenshots are acceptable for small visual/UI fixes when Xavier explicitly asks to skip Playwright E2E or visual runs.
- Sanity dataset/project changes.
- Live contact-form delivery into the private `crm` dataset, because automated Playwright runs do not use a real CRM write token.
- Visual Editing token/origin setup, because automated local tests do not have a real `SANITY_VIEWER_TOKEN`, deployed Studio URL, or browser iframe session.

## Test Data Or Fixtures

- None present.

## CI

- CI provider: none configured.
- Workflow files: none present.
- Required checks: none configured.

## Known Gaps

- Browser tests default to the installed Chrome channel, with bounded workers and bounded timeouts for quicker local/CI runs. Set `PLAYWRIGHT_CHANNEL` only when a different installed/browser-cache channel is available.
- Browser tests force `SANITY_DISABLE_REMOTE=true` for deterministic fixture content.
- Contact-form security/storage tests are contract-level only for now. Manual/staging validation must confirm `SANITY_CRM_WRITE_TOKEN` and `CRM_HASH_SECRET` are configured before relying on live submissions. Carrinho is browser-local and has no server storage until the visitor submits the contact form.
- Visual snapshot output is platform-specific and generated under ignored `tests/*-snapshots/` folders for local/session review only.
- Playwright E2E/visual runs can be expensive locally; if skipped by explicit instruction, record that in the handoff and use the strongest lighter checks available.
- `npm run build:studio` may need network access because Sanity fetches remote version metadata.
- ESLint ignores `.svelte-kit/`, `.sanity/`, build outputs, `test-results/`, and `playwright-report/` so generated test artifacts do not crash lint.
- Contract tests verify the Visual Editing wiring, but they do not prove Sanity token permissions; manually confirm the token can read drafts and preview-secret documents in the target environment.

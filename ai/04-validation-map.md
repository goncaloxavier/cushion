# Validation map

List the checks that actually exist. Do not claim coverage that is not present.

## Commands

```bash
npm run check
npm run lint
npm run build
npm run build:studio
npm run db:migrate
npm run e2e
npm run seed:studio:write
```

## What Is Protected

- Unit tests: none configured.
- Integration tests: `tests/sanity-contract.spec.ts` checks schema/query/page-copy/contact/social/legal/image/media/caption/partner/fallback alignment, route-scoped Sanity collections, preview-only visual-editing imports, atomic editor document IDs, removal of the parallel `builderPage` persistence model, Loja structure/gallery/editing/import contracts, landing/free/detail-page builder validation before publish, canonical managed-page composition across every editable public route, lossless product-section compatibility and lazy migration, transport/IVA pricing, CSP/preview/staff-role contracts, and direct rate-limit boundaries. `tests/home-sections.spec.ts` validates the pure landing migration plus managed-area injection, ordering, visibility, deduplication, and validation; `tests/section-parity.spec.ts` protects shared-component parity between legacy landing content and section-driven rendering. `tests/server-foundation.spec.ts` uses CI PostgreSQL to exercise customer verification/session/password-reset behavior, real registration/login/logout routes, staff order updates, legacy password compatibility, privacy request/export behavior, operational incident deduplication/resolution, CRM lead deduplication, and editable settings.
- E2E tests: `tests/routes.spec.ts` checks public routes, desktop navigation, the stable full-screen mobile overlay menu, language-safe links, overflow, detail links, collection images, Loja filters/pagination/detail price controls, Carrinho add/update/checkout handoff flow, pagination scroll, refresh scroll reset, contact form gating, contact/social/legal links, 404 handling, global search (trigger click, Ctrl/Cmd+K, cross-category results, click-through, Escape/focus restore, desktop vs mobile trigger visibility), and the language switcher across desktop/mobile where the viewport matters. `tests/commerce.spec.ts` covers the public cart/checkout handoff and account entry routes. `tests/site-editor.spec.ts` exercises the visual editor on desktop and mobile: focused field editing, reload-free autosave and publishing, publication/document-switch races, failed-save protection, revision-conflict recovery without a full reload, out-of-order response protection, immediate discrete-field saves, undo continuity, read-only capability enforcement in both shell and iframe, guided content/free-page creation, live free/detail-page preview with a retrying canvas-ready handshake, selection close/reopen, live overlay geometry across scroll, independent side-panel scrolling, numeric/gallery editing, image and video upload with cover images, structured article/table workflows, in-app removal confirmation, unified category details/product-assignment panels, responsive containment, mutation CSRF rejection, and malformed Portable Text rejection. All are included in `npm run e2e` and CI.
- Visual tests: `tests/visual.spec.ts` can generate/review full-page desktop/mobile screenshots for public routes plus current fallback product, case-study, and blog detail pages. Snapshot output is ignored and session-only.
- Seed generation: `scripts/write-sanity-seed.ts` generates 21 starter Sanity documents from fallback content: the site singleton, 5 product categories, and 15 Loja products.
- Build/type checks: `npm run check` runs SvelteKit sync and TypeScript; `npm run build` builds SvelteKit; `npm run build:studio` builds Sanity Studio.
- Lint/format: `npm run lint` runs ESLint. Prettier config exists in `package.json`; no package script exists yet.

## What Is Manual

- Sanity Studio UX/content editing review for product categories, Loja products/prices, case studies, blog posts, and the `Conteúdo do site` singleton. The private CRM requests/client-profile workflow now lives in the Postgres-backed `/painel/pedidos` and `/painel/perfis`, not Studio.
- Sanity Presentation/Visual Editing review: open the `/website` Studio workspace, enter Presentation, confirm preview mode enables, draft content appears before publishing, click-to-edit overlays target the expected fields, and disabling preview returns to published visitor content.
- Standalone builder review against live Sanity: sign in to `/painel/site`, select real site content through the iframe, verify the overlay remains attached while scrolling, focused fields and the explicit all-settings escape hatch, desktop/tablet/mobile canvas sizing, autosave/conflict feedback, media upload, navigation editing, and admin-only publishing. Repeat page-by-page during migration; do not enable the public renderer switch early.
- Public SvelteKit route review across desktop and mobile: `/`, `/produtos`, `/produtos/[slug]`, `/loja`, `/loja/[slug]`, `/carrinho`, `/catalogo`, `/casos-de-estudo`, `/casos-de-estudo/[slug]`, `/blog`, `/blog/[slug]`, and `/contacto`.
- Language toggle review for `?lang=pt`, `?lang=en`, and `?lang=es`.
- Targeted browser screenshots are acceptable for small visual/UI fixes when Xavier explicitly asks to skip Playwright E2E or visual runs.
- Sanity dataset/project changes.
- Visual Editing token/origin setup, because automated local tests do not have a real `SANITY_VIEWER_TOKEN`, deployed Studio URL, or browser iframe session.

## Test Data Or Fixtures

- `src/lib/server/site-editor-e2e.ts` provides request-scoped site-content and Loja-product fixtures for `tests/site-editor.spec.ts`. It is available only when `NODE_ENV !== "production"`, `SITE_EDITOR_E2E=true`, and a request supplies the matching test key. It never reads from or writes to the live Sanity dataset.
- `/painel/site/e2e-preview` is the matching deterministic canvas route. It renders created free pages through the real block renderer and returns 404 outside that gated test mode.

## CI

- CI provider: GitHub Actions (`.github/workflows/ci.yml`), runs on every PR and on push to `dev`/`main`.
- Required checks: `npm audit --audit-level=high --omit=dev`, `npm run check`, `npm run lint`, `npm run build`, `npm run build:studio`, `npm run db:migrate`, and `npm run e2e`. Dependabot proposes grouped weekly non-major updates; CI remains the release gate.
- CI now provisions a real `postgres:16-alpine` service container and runs `npm run db:migrate` against it before `npm run e2e`, so the checkout server action's real order-creation path (`buildOrderDraft` → `createOrder`) actually executes in CI instead of self-skipping via `test.skip(await submit.isDisabled(), ...)`. `RESEND_API_KEY`/`EMAIL_FROM` are intentionally left unset in CI — `sendTransactionalEmail` degrades gracefully (`emailConfigured()` false → logged failure, no throw), so the order still completes and the test still passes; only the email-delivery side stays unexercised there.

## Known Gaps

- Browser tests default to the installed Chrome channel, with bounded workers and bounded timeouts for quicker local/CI runs. Set `PLAYWRIGHT_CHANNEL` only when a different installed/browser-cache channel is available.
- Browser tests force `SANITY_DISABLE_REMOTE=true` for deterministic fixture content.
- Contact-form security/storage tests are contract-level only for now. Manual/staging validation must confirm production `DATABASE_URL` is configured before relying on live submissions.
- Ecommerce checkout tests now run their real order-creation path in CI (see above). Contract coverage additionally checks server-side price rebuilding, stable cart variant identity, checkout idempotency/rate limits, address-zone and unique-address behavior, email-token invalidation, same-origin/CSRF handling, and public-response security headers. Public contact and catalogue forms also use the bounded in-process abuse limit. Manual/staging validation must still confirm production `DATABASE_URL`, Resend settings, and `/painel/encomendas` before relying on live orders — CI proves the code path works, not that production secrets are configured.
- Visual snapshot output is platform-specific and generated under ignored `tests/*-snapshots/` folders for local/session review only.
- Playwright E2E/visual runs can be expensive locally; if skipped by explicit instruction, record that in the handoff and use the strongest lighter checks available.
- `npm run build:studio` may need network access because Sanity fetches remote version metadata.
- ESLint ignores `.svelte-kit/`, `.sanity/`, build outputs, `test-results/`, and `playwright-report/` so generated test artifacts do not crash lint.
- Contract tests verify the Visual Editing wiring, but they do not prove Sanity token permissions; manually confirm the token can read drafts and preview-secret documents in the target environment.
- The deterministic site-editor suite proves interaction behavior without mutable remote content. It does not replace a final manual save/upload/publish pass against the intended Sanity project and role permissions.

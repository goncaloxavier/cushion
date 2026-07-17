# Architecture

## Stack

- Frontend: SvelteKit v2 routed presentation site.
- Frontend runtime: Svelte 5 with Vite 7 and `@sveltejs/adapter-node` for Node/Railway hosting.
- CMS/content backend: Sanity Studio v6 with two workspaces.
- Studio runtime: React 19, React DOM 19, styled-components, Sanity structure tool, Sanity Vision v6.
- Database/storage: Sanity Content Lake, project `u4uyfix8`, public website dataset `production`, plus Railway Postgres for customer accounts, sessions, addresses, orders, order items, payment attempts, order history, staff accounts/sessions, and CRM leads/client profiles. The legacy private Sanity `crm` dataset is being retired (Studio workspace/schema still present pending a post-migration verification window) and no longer receives writes.
- Build/deploy: Vite/SvelteKit scripts for the Railway public website and Sanity CLI scripts for the Studio.
- Test tools: TypeScript, ESLint, Prettier, and Playwright are installed.

## Main Flow

```text
Sanity site-content singleton + product/store/case/blog documents -> SvelteKit layout server load -> localized routed website content
```

```text
fallback multilingual content -> routed SvelteKit website when Sanity has no published collection content
```

```text
fallback multilingual content -> seed generator -> Sanity Content Lake starter documents
```

```text
contact/catalogue form -> SvelteKit server action -> Postgres crm_form_submissions/crm_client_profiles -> /painel/pedidos
```

```text
Loja cart localStorage -> /finalizar-compra server action -> trusted public store content + Postgres order snapshot -> /painel/encomendas
```

```text
visitor query -> /api/search -> src/lib/server/search.ts scoring across product/store/case/blog -> SearchOverlay
```

```text
/painel/site staff UI -> protected same-origin SvelteKit builder API -> Sanity builder drafts/assets/publish
```

```text
current public route <-> builder draft renderer comparison -> page-by-page migration -> deliberate renderer switch
```

## Key Files And Folders

- `package.json` - SvelteKit, Sanity Studio dependencies, and scripts.
- `src/routes/+layout.server.ts` - loads Sanity site content and collections, then falls back to local content.
- `src/routes/+layout.svelte` - shared header, desktop navigation, full-screen mobile overlay menu, account/cart/language controls, route progress, footer, social links, complaints/privacy/cookie links, floating WhatsApp shortcut, and the global search trigger/keyboard shortcut (Cmd/Ctrl+K).
- `src/lib/components/SearchOverlay.svelte` - global search dialog (portal-mounted lightbox pattern) covering Soluções/Loja/Casos de estudo/Blog; debounced fetch to `/api/search` with a monotonic request token so a late response after close/reopen can't overwrite fresh state.
- `src/routes/api/search/+server.ts` and `src/lib/server/search.ts` - JSON search endpoint and the hand-rolled accent-folded, weighted, cross-category scoring module behind it; reuses the same cached `getSanityCollections()`/fallback content as every other route, no separate search index.
- `src/routes/+page.svelte` - homepage; the hero uses the editable `home.heroVideoUrl` as a muted looping background YouTube embed and opens a full YouTube player from the video button; partner/project logos sit below the impact section.
- `src/routes/sobre-nos/+page.svelte` - company story route.
- `src/routes/produtos/+page.svelte` - product-category route.
- `src/routes/produtos/[slug]/+page.server.ts` and `+page.svelte` - product/category detail route with a text-first editorial layout: a short summary lead above the longer description, an optional separated resistance/maintenance paragraph, full-frame shared `ImageGallery`, and quote/catalogue CTA.
- `src/routes/loja/+page.svelte` - separate Loja route for catalogue-priced items; searchable/filterable/paginated cards show category, title, summary, and a starting price only.
- `src/routes/loja/[slug]/+page.server.ts` and `+page.svelte` - Loja item detail route with variant/measure selection, finish/color selection, live product/transport/IVA price update, dimensions/weight, shared gallery/lightbox support, no-image placeholder, and an add-to-cart action.
- `src/routes/carrinho/+page.svelte` - local cart/review route; reads product selections and the stored delivery postal code from browser localStorage, resolves details/prices/transport estimates from current site content, and sends visitors to `/finalizar-compra`.
- `src/routes/finalizar-compra/+page.server.ts` and `+page.svelte` - guest/customer checkout route; uses CSRF and same-origin checks, rebuilds prices from trusted store content, creates a Postgres order with status `pending_payment_link`, snapshots item/price/transport/VAT data, and triggers transactional email attempts.
- `src/routes/conta/**` - customer account routes for login, registration, logout, password recovery/reset, email verification, account overview, and order history. This is separate from staff `/painel` auth.
- `src/routes/catalogo/+page.svelte` and `+page.server.ts` - catalogue route with its own request form (name, email, phone, morada, código postal, localidade; no message) and a dedicated server action that stores a `source: 'catalogue'` submission, separate from contact requests.
- `src/routes/casos-de-estudo/+page.svelte` - case-study route.
- `src/routes/casos-de-estudo/[slug]/+page.server.ts` and `+page.svelte` - concise case-study detail route with the description folded into the hero lead and the shared media gallery; the retired challenge/solution/result cards are neither rendered nor exposed in the custom editor.
- `src/routes/blog/+page.svelte` - blog index route.
- `src/routes/blog/[slug]/+page.server.ts` and `+page.svelte` - blog article route.
- `src/routes/contacto/+page.svelte` - contact route with required fields, consent checkbox, stable backend field names, and server action submission.
- `src/routes/contacto/+page.server.ts` - contact form load/action: CSRF cookie, origin check, honeypot, server validation, and CRM submission.
- `src/routes/painel/**` - private, server-rendered backoffice (NOT Sanity Studio, and deliberately not styled like the public site — plain dense "Excel-esque" tables, zero animation): username+password `login`, dashboard, unified lead list/detail (`pedidos`, merging former contact + catalogue requests), client profiles (`perfis`), ecommerce order lists/details (`encomendas`), and staff-account management (`equipa`, admin-only). All backed by Postgres. `noindex`; guarded by the session check in `src/hooks.server.ts` (which sets `locals.staff`). The root `+layout.svelte` hides the public chrome for `/painel`.
- `src/routes/painel/site/**` - full-screen visual website editor. It reuses `/painel` staff authentication, serves a same-origin API for Sanity draft/save/publish/media operations, and embeds the real current route. Normal content uses optimistic DOM patches for immediate text/typography feedback and then quietly reconciles the whole preview with the saved draft, including media, prices, galleries, and arrays; free `sitePage` documents stream their complete draft state directly to the block renderer on every edit. The browser never receives a Sanity token.
- `src/lib/site-editor/editor/SitePageSectionEditor.tsx` - guided free-page section inspector. It presents named responsive presets instead of raw device matrices, supports ordered image/video galleries, uploaded video cover images, real transfer progress, and custom confirmation dialogs.
- `src/lib/builder/` and `schemaTypes/builder/` - versioned builder document contract, defaults, validation, standalone React editor, and shared Sanity schemas. Builder documents are deliberately hidden from the client-facing Studio structure; Sanity remains their storage and asset engine.
- `src/lib/components/builder/BuilderPageRenderer.svelte` - Svelte block renderer used by published free pages and their signed editor preview. Preview mode listens for same-origin full-document state messages so text, layout, media, and ordering update without waiting for autosave or publication.
- `src/lib/server/builder.ts` and `builder-preview.ts` - server-only Sanity clients plus signed, short-lived, httpOnly, iframe-only builder preview sessions.
- `playwright.config.ts` - desktop/mobile Playwright projects, bounded workers/timeouts, and local test server.
- `scripts/write-sanity-seed.ts` - generates `.sanity/seed.ndjson` from fallback content.
- `scripts/import-store-products.ts` - targeted, non-destructive Loja product starter importer; creates missing store products from fallback content and preserves existing manual documents.
- `scripts/import-store-images.ts` - targeted, non-destructive Loja image uploader; patches configured store products in Sanity `production` with one primary image and gallery images while preserving existing copy/prices.
- `scripts/old-blog-posts.ts`, `scripts/update-old-blog-bodies.ts`, and `scripts/write-blog-import.ts` - reviewable trilingual migration data for the previous Webnode blog, a raw-body/translation refresh helper, and the generator for `.sanity/blog-import.ndjson`.
- `scripts/old-case-studies.ts` and `scripts/write-case-study-import.ts` - reviewable trilingual migration data for the previous Webnode case-study page and the generator for `.sanity/case-study-import.ndjson`.
- `scripts/scrape-product-images.ts`, `scripts/product-images.json`, `scripts/old-products.ts`, and `scripts/write-product-import.ts` - the product migration: a scraper that pulls every full-resolution gallery photo per old "PRODUTOS" category into a committed JSON, the reviewable trilingual product copy/media/tool fields (one entry per category = one `productCategory`), and the generator for `.sanity/product-import.ndjson` (`npm run scrape:products`, `import:products:write`, `import:products`).
- `tests/routes.spec.ts` - route, language, link, overflow, detail-link, navigation, form gating, 404, global search, and language switcher checks.
- `tests/sanity-contract.spec.ts` - Studio schema/query/fallback contract checks plus direct rate-limit and security-header boundary checks.
- `tests/server-foundation.spec.ts` - CI-only Postgres integration coverage for customer verification/session/password-reset lifecycle and staff order status/note persistence; it self-skips locally when `DATABASE_URL` is absent.
- `tests/visual.spec.ts` - optional full-page visual screenshot checks; generated `tests/*-snapshots/` output is ignored and used only for session review.
- `src/lib/site-content.ts` - fallback multilingual selling copy, site page content, and Sanity content normalization.
- `src/lib/store-fallback.ts` - fallback Loja product list, prices extracted from `Catalogo 244.pdf`, product weights, and approved starter Loja imagery as it arrives in batches.
- `src/lib/store-shipping.ts` - delivery postal-code storage plus transport estimate logic for Loja/Carrinho/checkout, using Alto Alentejo as dispatch origin, the supplied transport table, 10% fuel surcharge, an editable/fallback transport multiplier, and 23% IVA on product plus transport.
- `src/lib/cart.ts` - browser-only localStorage helpers for the Loja cart. Stores no personal data and keys new selections by Sanity's stable variant `_key` so Studio reordering cannot silently change a saved cart; it still reads legacy positional entries during the transition.
- `src/lib/server/db.ts`, `src/lib/server/customer-auth.ts`, `src/lib/server/orders.ts`, `src/lib/server/email.ts`, and `src/lib/server/payment.ts` - server-only ecommerce foundation: Postgres connection, customer scrypt auth/session/token handling, trusted order creation, Resend email attempts, and fail-closed Ifthenpay PayByLink adapter boundary.
- `migrations/0001_commerce_foundation.sql` through `0004_customer_address_identity.sql` and `scripts/db-migrate.ts` - explicit Postgres schema and migration runner. Migration `0004` deduplicates historic exact-address rows before enforcing the canonical address identity index.
- `src/lib/components/ImageGallery.svelte` - shared product/case/blog detail gallery and lightbox; locks background scroll while open and supports keyboard navigation.
- `src/lib/components/Pagination.svelte` - shared numbered (windowed) pagination used by the product, Loja, case-study, and blog list routes; page state lives in each route, which passes `page`/`totalPages`/`onchange`.
- `src/lib/article-structure.ts` and `src/lib/components/StructuredArticleBody.svelte` - shared plain-text article parser plus renderer for Studio-authored rich blog articles, with legacy body fallback for migrated posts.
- `src/lib/scroll.ts` - `changeListPage` runs a page change as a market-standard cross-fade: fade the list grid out, swap + render while hidden, instant-reposition to the list top under the fade, then fade back in (opacity/transform only — no per-frame scroll loop). Product, Loja, case-study, and blog list routes use this behavior.
- `src/lib/media.ts` - YouTube URL parsing and no-cookie embed URL helpers; `youtubeEmbedUrl` accepts optional autoplay, controls, loop, mute, and playsinline flags for background and full-player embeds.
- `static/fonts/InterVariable*.woff2` - self-hosted Inter variable font loaded via `@font-face` in `src/app.css` and preloaded in `src/app.html`; this is why the fine-grained font weights render as intended.
- `src/lib/sanity.ts` - public cached Sanity client plus Visual Editing draft/stega clients and site/product/store/case/blog queries for dataset `production`; product-category queries expose only genuinely reusable product content.
- `src/lib/server/preview.ts` - Visual Editing preview cookie helpers; local HTTP uses a non-secure `SameSite=Lax` cookie, deployed HTTPS uses `SameSite=None; Secure` for Studio iframe preview. Local Studio and local website should use the same hostname (`localhost` by default) because `localhost` and `127.0.0.1` do not share preview cookies.
- `src/routes/preview/enable/+server.ts` and `src/routes/preview/disable/+server.ts` - Presentation tool preview-mode endpoints; validate the signed preview URL secret with a non-stega authed client before toggling draft rendering.
- `src/lib/server/crm.ts` - private server-only Postgres writer for client profiles (`crm_client_profiles`) and form submissions (`crm_form_submissions`); dedupes profiles by normalized email in one atomic `insert ... on conflict`. Validation is per-source so catalogue needs an address and contact needs a message.
- `src/lib/server/crm-postgres.ts` - server-only read/write helpers for the backoffice (list/search profiles and submissions, status + internal-note updates), all against Postgres.
- `src/lib/server/password-auth.ts` - shared scrypt password hashing (`hashPassword`/`verifyPassword`/`dummyHash`), session token hashing (`tokenHashOf`), and token generation (`randomToken`); used identically by `customer-auth.ts` and `staff-auth.ts` so the hash format is a structural guarantee, not a comment-enforced convention.
- `src/lib/server/staff-auth.ts` - Postgres-backed backoffice auth: scrypt password hashing via `password-auth.ts`, hashed-token sessions in `staff_sessions`, login with enumeration-resistant timing, an in-memory login rate limiter, and in-app staff-account management (`listStaff`/`createStaff`/`updateStaffRole`/`setStaffActive`/`resetStaffPassword`) with self-lockout guards (can't demote/deactivate yourself or drop the last active admin).
- `src/lib/server/painel-actions.ts` - shared SvelteKit form actions (status + notes) reused by the backoffice pages; each re-checks `locals.staff`.
- `src/lib/server/form-guard.ts` - shared CSRF token + same-origin helpers for the public forms.
- `src/lib/painel.ts` - client-safe backoffice constants (status lists/labels, status-to-tone mapping for the tag UI, date formatting); kept out of server modules so components don't pull in server-only code.
- `scripts/migrate-crm-to-postgres.ts` - one-off, idempotent (`legacy_sanity_id`-keyed) migration copying staff accounts, client profiles, and form submissions out of the legacy Sanity `crm` dataset into Postgres; staff password hashes copy byte-for-byte (zero forced resets). Supports `--dry-run`; run via `npm run migrate:crm`.
- `sanity.config.ts` - multi-workspace Studio config: website editing at `/website`, legacy private requests/client profiles at `/crm` (retained temporarily for reference; no longer written to).
- `sanity.structure.ts` - client-friendly Studio navigation for public website content and the legacy private CRM workspace.
- `sanity.cli.ts` - Sanity CLI project, dataset, and deployment settings for the hosted Studio at `https://dafabrica4you.sanity.studio/`.
- `schemaTypes/` - Portuguese Sanity document and object schemas for editable site content, product categories, Loja products, case studies, blog posts, and the legacy private CRM documents (`clientProfile`, `formSubmission`, `staffUser`, `staffSession`) pending deletion after the Postgres migration's verification window. Localized short copy uses a compact two-line `localizedString` textarea and longer copy uses `localizedText`; EN/ES are hidden and filled by the translation pipeline. Keeping the established object type avoids migrations for existing content.
- `static/logo/brand_mark.png` - provided brand mark.
- `static/images/recycled-products-hero.png` - generated hero image for this project.
- `static/images/product-materials.png`, `static/images/case-installation.png`, and `static/images/blog-editorial.png` - generated fallback collection images used until Sanity entries have uploaded images.
- `eslint.config.mjs` - Sanity Studio ESLint config.
- `tsconfig.json` - TypeScript compiler configuration.
- `docs/sanity-starter.md` - short guide for using the Studio in this project.
- `ai/` - project-local AI context.

## Data Boundaries

- Public source of truth: Sanity project `u4uyfix8`, dataset `production`, schema definitions committed in this repo, and fallback content in `src/lib/site-content.ts` until Sanity is populated.
- Free-page source of truth: versioned `sitePage` documents in the same public-content Sanity dataset. Staff access and authorization remain in Postgres; all editor reads/writes that require credentials cross protected SvelteKit server endpoints.
- Public visitor Sanity document queries use `useCdn: true` for speed. Published Studio edits can take a few seconds to propagate outside preview; editors should use Presentation/Visual Editing when they need immediate draft/live review.
- Visual Editing/Presentation preview uses a server-only token, `useCdn: false`, draft perspective, and stega metadata so Studio can show drafts and click-to-edit overlays without exposing the token to the browser.
- Image asset URLs still use Sanity's CDN and the warm-up script uses uncached document queries only to pre-generate transformed image variants.
- Private CRM + backoffice source of truth: Railway Postgres via `DATABASE_URL`, tables `crm_form_submissions`, `crm_client_profiles`, `staff_users`, `staff_sessions`. The legacy Sanity `crm` dataset (`formSubmission`/`clientProfile`/`staffUser`/`staffSession` document types) is read-only history pending deletion after a post-migration verification window.
- Private ecommerce source of truth: Railway Postgres via `DATABASE_URL`, with tables for customers, sessions, email verification tokens, password reset tokens, addresses, orders, order items, order status events, payment attempts, and outbound email attempts.
- Confidential data: submitted names, email addresses, phone numbers, messages, consent text, internal notes, CRM statuses, account records, addresses, sessions, payment status, and order history must not be queried by public Sanity loaders or stored in public Sanity datasets.
- Local browser data: the Loja cart stores only product slugs, stable variant keys (with a legacy positional fallback), finish keys, and quantities under `df4y-store-cart-v1`; the Loja delivery gate stores only the postal code under `df4y-store-delivery-postal-code-v1`. Neither localStorage key may store names, emails, phone numbers, addresses, payment data, or free-text messages.
- Derived data: SvelteKit build output from `npm run build` and Sanity Studio build output from `npm run build:studio`.
- Runtime/generated data: `node_modules/`, `.svelte-kit/`, `build/`, `dist/`, `.sanity/`, `test-results/`, `playwright-report/`, and `tests/*-snapshots/`.
- External services: Railway for the public website preview, Sanity Content Lake, and Sanity Studio hosting/deployment.
- Test mode: Playwright sets `SANITY_DISABLE_REMOTE=true`, forcing stable fallback fixtures instead of mutable Content Lake content.

## Routes Or Entry Points

- `npm run dev` - starts the SvelteKit website locally.
- `npm run dev:studio` - starts Sanity Studio locally on port `3333`.
- `npm run build` - builds the SvelteKit website for Node hosting.
- `npm run build:studio` - builds Sanity Studio.
- `npm run preview` - previews the built SvelteKit website.
- `npm run start:studio` - serves a built Sanity Studio.
- `npm run deploy:content` - intentionally imports code-managed Content Lake documents: the `siteContent` seed, starter Loja products, historical case studies, historical blog posts, and the migrated product catalogue (`import:products`).
- `npm run import:store-products` - creates missing Loja product documents from fallback content without replacing existing manual store products.
- `npm run import:store-images` - uploads the configured local Loja product photos and patches the matching `storeProduct` documents without replacing the full dataset.
- `npm run deploy:studio` - deploys Sanity Studio through Sanity CLI.
- `npm run deploy-graphql` - deploys Sanity GraphQL.

## Public Routes

- `/`
- `/sobre-nos`
- `/produtos`
- `/produtos/[slug]`
- `/loja`
- `/loja/[slug]`
- `/carrinho`
- `/finalizar-compra`
- `/conta`
- `/conta/entrar`
- `/conta/registar`
- `/conta/recuperar-password`
- `/conta/redefinir-password`
- `/catalogo`
- `/casos-de-estudo`
- `/casos-de-estudo/[slug]`
- `/blog`
- `/blog/[slug]`
- `/contacto`
- `/painel/site` (staff-only builder)

## Architecture Rules

- Keep `sanity.config.ts` and `sanity.cli.ts` aligned on project id. `sanity.cli.ts` defaults to the public `production` dataset; the legacy `crm` workspace targets private dataset `crm` and is retained temporarily but no longer written to (see `scripts/migrate-crm-to-postgres.ts`).
- Keep the visual builder outside Sanity Studio. Studio owns schemas/content/assets, while `/painel/site` owns the simplified client editing experience and communicates with Sanity through server-only clients.
- Keep the existing public Svelte routes active until every route has an equivalent builder document and has passed current-vs-builder desktop/tablet/mobile comparison. Builder schemas or drafts alone must never change the live renderer.
- Keep builder preview URLs iframe-only and same-origin. The signed preview cookie is httpOnly and short-lived; `SANITY_WRITE_TOKEN`, `SANITY_VIEWER_TOKEN`, and `BUILDER_PREVIEW_SECRET` must never enter browser code.
- Add content schemas through `schemaTypes/` and register them in `schemaTypes/index.ts`.
- Do not retain hidden legacy fields in client-facing schemas. Remove confirmed dead values with `scripts/cleanup-removed-website-fields.ts` so Studio stays free of unknown/ghost fields.
- Keep public website schemas in `websiteSchemaTypes`; the legacy `crmSchemaTypes` stay isolated from it pending deletion.
- Never add CRM/client profile/form submission documents to the public website GROQ query or fallback content.
- Public content in dataset `production` can be readable by the website. Editing that content happens through Sanity login/permissions in Studio.
- Private form/client/staff data belongs in Postgres (`crm_form_submissions`, `crm_client_profiles`, `staff_users`, `staff_sessions`); writes happen only through SvelteKit server code, and `DATABASE_URL` must never be exposed to the browser.
- Keep public page copy editable through the `siteContent` singleton when the copy belongs to a route rather than a collection item.
- Keep the public visitor client and preview client separate: the public client may use `useCdn: true`; the preview client must keep `useCdn: false`, `perspective: 'drafts'`, and `stega` enabled.
- Keep `SANITY_VIEWER_TOKEN` server-only. It needs enough permission to read drafts and preview-secret documents; if the Presentation secret validation fails, check token permissions before changing query code.
- Keep `/preview/enable` and `/preview/disable` cookie behavior compatible with both local HTTP Studio preview and deployed HTTPS iframe preview.
- Keep shared contact/social/legal fields editable through the `siteContent` singleton when they appear in the layout or contact route, including privacy/cookie policy links.
- Keep page video sections and partner/logo sections editable through the `siteContent` singleton when they are page-level presentation content.
- The Decking detail video and calculator block is an intentional product-specific presentation in `src/lib/site-content.ts`; it is not exposed as a generic product-category module in Sanity.
- Keep multilingual public copy synchronized between fallback content and Sanity fields until Sanity becomes the only content source.
- When adding Sanity-backed content, update `src/lib/sanity.ts`, `src/lib/site-content.ts`, seed scripts, and matching routes together.
- Loja is separate from Produtos: `productCategory` remains the broader product/category content model, while `storeProduct` is the priced item model with category, variants, dimensions, weight, finish prices, optional primary product image, optional product gallery, active flag, and order rank. The Loja list exposes only a starting price; the detail route handles variant/measure, finish/color selection, gallery inspection, and cart actions.
- The Studio Loja section must stay structured for editors: page text, all products, visible products, category buckets, products missing primary images, products missing weights, and hidden products.
- Carrinho remains browser-local and stores no personal data. Checkout/order creation happens only in `/finalizar-compra`, where the server recalculates prices from trusted store content and writes a Postgres order snapshot.
- Store variant identity must use the Sanity array item's stable `_key`, never only its visible array position. Editors may reorder variants safely; historic cart/order snapshots remain tied to the originally selected variant.
- Delivery addresses must be checked against supported transport zones both when editors save an account address and when checkout resolves a previously saved address. The unique Postgres address identity index is the final concurrency guard; surface its duplicate error as a normal form message.
- Customer accounts are public-customer auth only and must stay separate from staff `/painel` auth. Customer password hashes, sessions, email verification tokens, and password reset tokens live in Postgres.
- Store orders must snapshot product title, slug, variant, dimensions, finish, quantity, unit price, weight, transport, VAT, total, and transport multiplier so historical orders do not change when Sanity content changes.
- Ifthenpay PayByLink must fail closed until real credentials/API details/callback URLs/status mapping exist. No fake payment flow should be exposed.
- Resend transactional email is optional for local/dev but production checkout should configure `RESEND_API_KEY`, `EMAIL_FROM`, `ORDERS_TO_EMAIL`, and `APP_ORIGIN`.
- CSP is configured in `svelte.config.js` using SvelteKit nonces for the two unavoidable inline bootstrap scripts. Do not add new inline scripts/styles or third-party origins without extending and reviewing the policy.
- Product categories, Loja products, case studies, and blog posts should keep editable Sanity image fields with hotspot support and localized alt text; product/case/blog detail galleries keep their gallery fields.
- Contact/social/legal Sanity fields must stay aligned across schema definitions, GROQ projections, fallback normalization, layout/footer rendering, and contact route rendering.
- Partner Sanity fields must stay aligned across schema definitions, GROQ projections, fallback normalization, public route rendering, and tests.
- The homepage Studio model only exposes fields rendered on that page: hero title/video, impact title/numbers, and partner content. Historical hero kicker/supporting text/image, company-introduction block, and impact supporting text are intentionally removed. `home.heroVideoUrl` renders as a muted looping background and full modal player; play/close labels and fallback SEO media remain code-managed.
- Desktop navigation should expose the full primary route set, including Loja. Mobile navigation should use the stable full-screen overlay menu and must not swap links based on the current route.
- When adding public routes, fallback CMS items, or form/backend behavior, update Playwright route/CMS-contract coverage. Generate visual snapshots only for local/session review and do not commit them.
- Keep Playwright deterministic by leaving `SANITY_DISABLE_REMOTE=true` for automated route and visual tests.
- When fallback starter content changes intentionally, update the seed workflow and rerun `npm run seed:studio` or `npm run deploy:content` only when the Content Lake should receive those changes.
- Do not attach Sanity content imports to Railway website builds unless replacing Studio-managed content on every website deploy is explicitly intended.
- Do not use assets from the existing DaFábrica4You website; use the provided logo and project-local/generated assets unless Xavier confirms otherwise.
- Keep generated artifacts out of committed project context unless intentionally required; do not stage `node_modules/`, `test-results/`, visual snapshot folders, or build outputs.

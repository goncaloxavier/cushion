# Risky areas

Use this to help agents avoid accidental damage.

## High-Risk Files

- `src/lib/site-content.ts` - fallback public copy in three languages; changes affect the live page when Sanity has no document.
- `src/routes/+layout.server.ts` - shared content load for all public routes.
- `src/routes/+layout.svelte` - shared public navigation, language toggle, footer, social links, complaints link, and WhatsApp shortcut.
- `src/routes/+page.svelte` and route folders under `src/routes/` - public presentation UI.
- `src/routes/loja/+page.svelte`, `src/routes/loja/[slug]/+page.svelte`, `src/routes/carrinho/+page.svelte`, `src/routes/finalizar-compra/**`, `src/routes/conta/**`, `src/routes/painel/encomendas/**`, `src/lib/cart.ts`, `src/lib/store-shipping.ts`, `src/lib/store-fallback.ts`, and `src/lib/server/orders.ts` - Loja list/detail/cart/checkout behavior, postal-code delivery estimates, catalogue-derived starter prices, approved product imagery, account sessions, and order snapshots; avoid inventing prices, weights, names, product images, or payment behavior.
- `tests/visual.spec.ts` - optional visual screenshot coverage; generated `tests/*-snapshots/` folders are ignored session output.
- `playwright.config.ts` - local browser-test server, worker/timeouts, and desktop/mobile projects.
- `src/lib/site-editor/**`, `src/lib/components/SiteEditorOverlay.svelte`, `src/lib/server/site-editor.ts`, and `src/routes/painel/site/**` - standalone visual editor state, canvas selection protocol, protected Sanity mutations, media uploads, and draft/publish behavior.
- `src/lib/server/site-editor-e2e.ts` and `src/routes/painel/site/e2e-preview/**` - deterministic editor fixtures. Their three-part non-production/environment/header gate must remain intact so test auth and fake content can never activate in production.
- `eslint.config.mjs` - ignores generated folders; if this regresses, lint can scan Playwright output and fail while tests run.
- `scripts/write-sanity-seed.ts` - imports fallback content shape into Sanity seed documents.
- `src/lib/sanity.ts` - Sanity query and project connection.
- `src/lib/server/crm.ts`, `src/lib/server/crm-postgres.ts` - private server-side Postgres CRM writer/reader; mistakes can leak or fail customer submissions.
- `src/lib/server/password-auth.ts`, `src/lib/server/staff-auth.ts` - shared scrypt hashing and backoffice auth/session/account-management; a hash-format change here breaks both customer and staff login without a forced reset being obvious.
- `src/lib/server/db.ts`, `src/lib/server/customer-auth.ts`, `src/lib/server/orders.ts`, `src/lib/server/email.ts`, and `src/lib/server/payment.ts` - private ecommerce foundation; mistakes can leak account/order data, weaken auth, or create false payment states.
- `src/routes/contacto/+page.server.ts` - contact form validation, CSRF/origin checks, honeypot handling, and CRM submission.
- `scripts/migrate-crm-to-postgres.ts` - one-off legacy Sanity → Postgres CRM/staff migration; mistakes can duplicate leads/profiles or copy a corrupted password hash. Idempotent via `legacy_sanity_id`, but always `--dry-run` first.
- `sanity.config.ts` - contains Studio workspaces, project id, datasets, plugins, and schema registration.
- `sanity.structure.ts` - contains the client-facing Studio navigation.
- `sanity.cli.ts` - contains Sanity CLI project, dataset, and deployment settings.
- `schemaTypes/index.ts` - central schema export list; changes affect all Studio content types.
- `package-lock.json` - generated dependency lockfile; avoid churn unless dependencies actually change.

## Fragile Logic

- Multilingual fallback-to-Sanity normalization in `src/lib/site-content.ts`.
- Blog article lookup in `src/routes/blog/[slug]/+page.server.ts`.
- Product and case-study detail lookups in their `[slug]` server loads.
- Sanity schema fields and frontend query field names must stay aligned.
- Sanity site-content fields, collection fields, GROQ projections, fallback handling, and public route rendering must stay aligned.
- The public visitor Sanity client uses `useCdn: true` for speed, while the Visual Editing preview client must stay `useCdn: false` with draft perspective and stega metadata. Do not collapse those two clients into one.
- Loja schema, fallback prices, fallback imagery/galleries, seed generation, GROQ projection, route filters/pagination, transport estimates, and tests must stay aligned.
- Carrinho resolves local browser selections and the stored postal code against the current public Loja content. New cart records identify a variant by Sanity `_key`; retain the legacy index fallback only to avoid dropping existing browser carts. Checkout must then recalculate the order from trusted server-side public store content; if product slugs, variant keys, finish keys, weights, delivery-zone logic, multipliers, or price tables change, update fallback/Sanity content, order snapshots, and tests together.
- `migrations/0004_customer_address_identity.sql` removes pre-existing exact duplicates before adding the address identity index. Run it only against the intended database; account address writes must keep the `ON CONFLICT` behavior and friendly duplicate-edit response aligned with the constraint.
- A `storeProduct` can set `flatTransportPrice` (Sanity, "Preços" group) to bypass the weight/zone transport formula entirely and charge a fixed fee for every zone instead (client-requested for Placas Click, `€2`). `calculateStoreEstimate` in `src/lib/store-shipping.ts` excludes that product's weight from the shared weight-based calculation and adds its flat fee on top — every caller that builds a `StorePricingItem[]` (loja list/detail, carrinho, finalizar-compra, contacto's quote-message builder, `src/lib/server/orders.ts`) must forward `flatTransportPrice` from the product or that one surface will silently price it via the normal formula instead.
- The public `production` Sanity dataset and the private Postgres database (ecommerce + CRM + staff accounts) must remain separated. Do not query CRM/order/customer/staff data from public Sanity layout/page loads.
- Contact-form visible labels are editable, but backend field names are fixed (`name`, `email`, `phone`, `postalCode`, `locality`, `message`) for validation and CRM storage.
- Shared contact, social, WhatsApp, complaints-book, privacy/cookie policy, and consent fields must stay aligned across Sanity schema, GROQ projection, fallback normalization, footer, and contact page.
- Sanity image/gallery fields, GROQ asset projections, fallback image handling, and public route image rendering must stay aligned.
- The Decking video/tool support block is code-managed and slug-gated. Do not reintroduce generic product-category fields or let it appear on other product details.
- Homepage media and partner fields must stay aligned across Sanity schema, GROQ projection, fallback normalization, local logo assets, and the public homepage renderer.
- Schema definitions become fragile once real content exists in the Sanity dataset.
- Primary navigation should keep stable route sets instead of replacing links by current route. Desktop carries the full route set; mobile uses a stable full-screen overlay menu with account/cart/language actions inside the menu.
- Pagination scroll and refresh scroll reset depend on client-side browser behavior; keep them explicit when changing layout or route transitions.
- Public Lenis/page-reset behavior must not mount under `/painel`. The editor canvas and each side panel own separate scroll containers; reintroducing public smooth-scroll there breaks mouse-wheel ownership and can reset the selected canvas element.
- Canvas selection is identified by Sanity document id plus field path, not by a one-time DOM rectangle. The overlay must re-resolve its element and rectangle after scroll/resize and restore when an off-screen selection returns.
- Numeric Loja fields use `data-df4y-editor-field` to open their typed inspector input. Do not make them inline-editable strings or values such as `52 kg` can be written back into numeric Sanity fields.

## User-Facing Workflows

- Public visitors moving through routed pages and contacting the company.
- Editors opening Sanity Studio, creating product categories, case studies, and blog posts, filling localized fields, using structured blog article blocks where needed, and publishing.
- Editors uploading product, case-study, and blog images with localized alt text.
- Editors maintaining Loja products, variants, finish prices, primary images, and galleries in Studio.
- Visitors opening product, case-study, or blog gallery lightboxes; the page behind the modal should not scroll or change position until the lightbox closes.
- Visitors entering a postal code to unlock Loja pricing, adding Loja products to Carrinho, adjusting quantities locally, reviewing estimated transport/IVA, and continuing to checkout.
- Visitors checking out as guests or logged-in customers; the server must create a pending Postgres order and never trust client-sent prices.
- Checkout requires a fresh single-use submission token and has a bounded per-instance rate limit. Keep the database unique token constraint, server-side validation, and client double-submit guard aligned; the in-memory rate limit is a lightweight defence, not a substitute for production edge rate limiting.
- Staff reviewing ecommerce orders in `/painel/encomendas`, including status changes and internal notes.
- Admins managing backoffice staff accounts in `/painel/equipa`: creating accounts, changing roles, deactivating accounts, resetting passwords. Self-lockout guards block demoting/deactivating your own account and dropping the last active admin.
- Admins swapping the DeepL API key in `/painel/definicoes` when the free plan's 1M-lifetime-character limit is reached: a candidate key is validated against DeepL (`getUsage()`) before it's persisted to Postgres, so a bad paste is rejected with DeepL's own error message rather than silently breaking translation. Stored in plain text (`app_settings`, low-sensitivity — worst case is quota abuse, not customer/payment data); do not repurpose this table for anything more sensitive without adding encryption.
- Editors changing page copy/contact/footer content through the Portuguese `Conteúdo do site` singleton.
- Editors changing social links, WhatsApp, complaints-book link, privacy/cookie policy links, and marketing-consent copy through the Portuguese `Conteúdo do site` singleton.
- Editors changing the homepage hero title/video, impact title/numbers, and partner/project entries through the Portuguese `Conteúdo do site` singleton.
- Staff reviewing new leads in `/painel/pedidos`, changing statuses, adding internal notes, and using `/painel/perfis` client profiles for follow-up. This is a plain, dense backoffice UI deliberately not styled like the public site (no brand palette, no animation).
- Staff editing builder pages in `/painel/site`, comparing the same route in `Site atual` and `Construtor`, and publishing only validated drafts. This full-screen visual tool is the intentional exception to the otherwise plain `/painel` styling.
- Developers generating visual snapshots only for local/session review, without committing the generated PNG baselines.
- Developers seeding Content Lake starter documents with `npm run seed:studio` or intentionally refreshing code-managed content with `npm run deploy:content`.

## Performance-Sensitive Areas

- Hero image loading and mobile layout.
- Sanity query behavior if collections grow large or need ordering/filtering beyond the current simple published list.
- Above-the-fold logo/hero assets, lazy list images, page transitions, and scroll-reset scripts.
- Floating WhatsApp placement, especially on mobile where it can compete with menu affordances, toast/status UI, and forms.
- Playwright performance: keep viewport-independent checks desktop-only, avoid duplicate paginated page walks, and prefer targeted browser screenshots when Xavier explicitly asks to skip E2E for a small UI fix.

## Security Or Access-Control Areas

- Sanity project access and dataset permissions.
- The legacy private Sanity `crm` dataset — now read-only history, pending deletion after the Postgres migration's verification window.
- The private Postgres database: CRM leads/client profiles, staff accounts/sessions, customer account records, sessions, saved addresses, order history, payment attempts, and outbound email logs.
- The Carrinho localStorage key stores only non-personal product selections. The Loja delivery localStorage key stores only a postal code for transport estimates. Do not add names, emails, full addresses, phone numbers, or free-text messages to localStorage.
- `SANITY_CRM_WRITE_TOKEN` (only needed to run the one-off Sanity → Postgres CRM migration script) must only exist in server/private runtime environments.
- `DATABASE_URL`, `RESEND_API_KEY`, and future Ifthenpay credentials must only exist in server/private runtime environments.
- The CSP in `svelte.config.js` is a deliberate security boundary. SvelteKit injects a nonce for the inline bootstrap scripts; do not weaken `script-src`, `connect-src`, or `frame-ancestors` to make a feature work without reviewing the actual origin and browser requirement.
- `SANITY_VIEWER_TOKEN` is server-only too. It enables Presentation preview by reading drafts and `sanity.previewUrlSecret` documents; never expose it through public env vars, client code, logs, or generated files.
- `SANITY_WRITE_TOKEN` and `BUILDER_PREVIEW_SECRET` are server-only builder credentials. Builder mutations must retain staff auth, same-origin and CSRF checks; draft preview must retain the signed, short-lived, iframe-only cookie boundary.
- Future public/private content boundaries if non-public draft content is introduced.
- The current Railway deployment (`cushion` service, `dafab4you-website.up.railway.app`) is a dev/test preview server, not the client's final production domain (see `01-project-overview.md`'s open questions). Two infra gaps found in a security audit are real but lower urgency while that holds: `ADDRESS_HEADER`/`XFF_DEPTH` are unset, so in-process rate limiting (`src/lib/server/rate-limit.ts`) buckets by Railway's proxy IP rather than real visitor IPs; and `ORIGIN` is unset (only `APP_ORIGIN` is), so adapter-node derives `url.origin` from the raw client `Host` header, which could theoretically let a forged Host header land in a password-reset/verification email link. Revisit both before this deployment (or whatever replaces it) is treated as production-facing.
- Public Sanity documents must have root-level IDs without dots. Sanity treats any ID containing `.` as a private sub-path that anonymous website queries cannot read, even after publication. The custom editor therefore creates public content with `<type>-<uuid>` IDs; keep the contract guard in `tests/sanity-contract.spec.ts` when changing document creation.

## Common Regression Patterns

- Changing project id or dataset in one Sanity config file but not the other.
- Adding schema files without registering them in `schemaTypes/index.ts`.
- Assuming content fields exist before schemas are confirmed.
- Adding routed pages without preserving the `lang` query parameter in internal navigation.
- Adding CMS fallback items without adding matching visual or route-test coverage.
- Committing generated visual snapshot PNGs or using local snapshots to hide accidental layout regressions.
- Forgetting that Playwright uses fallback fixtures while local/dev website reads live Sanity content.
- Running lint while Playwright is creating generated output is safe only while generated test folders stay ignored.
- Rerunning `npm run seed:studio` or `npm run deploy:content` after manual Studio edits can replace deterministic/code-managed documents.
- Treating PDF catalogue crops as product photography for the Loja before the client supplies approved images.
- Showing Loja variants, dimensions, finish selectors, catalogue page badges, or proposal links on the list; those belong on the Loja detail route.
- Trusting client-side cart totals during checkout. The server must rebuild every price/transport/VAT total from trusted store content and postal code before writing an order.
- Exposing fake Ifthenpay payment behavior. PayByLink must stay fail-closed until real credentials, callbacks, and status rules are confirmed.
- Updating schema field names without updating `src/lib/sanity.ts` and `src/lib/site-content.ts`.
- Expecting visitor pages that use the cached public Sanity client to update instantly after publish. Immediate review belongs in Presentation/Visual Editing, which uses the uncached draft client.
- A leftover empty/stale `drafts.*` document can shadow published content and break click-to-edit in Presentation (the tool renders the draft perspective by default). If preview shows old/wrong content or an editable field won't map to Studio, check for a stray draft before assuming it's a code or cache bug.
- Mixing `localhost` and `127.0.0.1` during Visual Editing review. Preview mode is cookie based, and those hosts do not share cookies; keep Studio and website preview on the same hostname.
- Setting the preview cookie as always `Secure; SameSite=None`; local HTTP Studio preview may silently fail because the browser refuses that cookie.
- Validating the preview URL secret with the stega client; invisible stega metadata can corrupt the secret comparison.
- Forgetting to pass the preview flag into large per-detail fetches such as blog article bodies.
- Exposing `SANITY_VIEWER_TOKEN` to browser-visible environment variables or client-side code.
- Switching `builderSiteSettings.rendererMode` before all routes have current-vs-builder content, layout, accessibility, SEO, and responsive parity.
- Allowing copied builder preview query URLs to render drafts in normal top-level tabs, or broadening CSP framing beyond the same origin just to make the canvas load.
- Treating `data-sanity-edit-target` as a marker on the same element as `data-sanity`. Sanity interprets it as a descendant-target instruction and registration can fail; use the project's private editor marker for typed fields instead.
- Adding private CRM/staff fields to `src/lib/sanity.ts` or any public route by mistake.
- Exposing `SANITY_CRM_WRITE_TOKEN` or `DATABASE_URL` through public environment variables, logs, generated static files, or client-side code.
- Changing scrypt parameters or the hash string format in `src/lib/server/password-auth.ts` without a migration plan — existing customer and staff password hashes would stop verifying.
- Adding partner logos or media assets without local fallback assets, alt text, and matching Sanity query fields.
- Making Sanity images required before the client has uploaded approved assets.
- Removing Portuguese Studio labels/descriptions without replacing them with client-friendly wording.
- Creating language-specific copy that no longer says the same factual thing across PT/EN/ES.
- Drifting back to vague "plastic" copy when the client has clarified yellow-bin stream materials such as packaging, Tetra Pak, and cans/metal packaging.
- Letting the floating WhatsApp shortcut cover form fields or important card text.
- Committing generated build artifacts unintentionally.
- Accidentally staging tracked `node_modules/` churn; the repo currently has historical tracked dependency files/noise, so stage intentionally.

## Safe Change Guidance

- Keep early changes small and easy to explain.
- Confirm new content model decisions before encoding them in Sanity schemas.
- Keep public claims tied to confirmed facts.
- Update this `/ai` folder when architecture, commands, or business rules become real.
- Run route tests after navigation, pagination, scroll, or CMS query changes; run visual tests when the UI itself changes. If Playwright is explicitly skipped for a task, use `npm run check`, `npm run lint`, `npm run build`, and targeted browser screenshots where practical, then name the skipped checks.

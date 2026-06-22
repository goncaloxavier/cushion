# Risky areas

Use this to help agents avoid accidental damage.

## High-Risk Files

- `src/lib/site-content.ts` - fallback public copy in three languages; changes affect the live page when Sanity has no document.
- `src/routes/+layout.server.ts` - shared content load for all public routes.
- `src/routes/+layout.svelte` - shared public navigation, language toggle, footer, social links, complaints link, and WhatsApp shortcut.
- `src/routes/+page.svelte` and route folders under `src/routes/` - public presentation UI.
- `src/routes/loja/+page.svelte`, `src/routes/loja/[slug]/+page.svelte`, `src/routes/carrinho/+page.svelte`, `src/lib/cart.ts`, and `src/lib/store-fallback.ts` - Loja list/detail/cart behavior and catalogue-derived starter prices; avoid inventing prices, names, product images, or checkout semantics.
- `tests/visual.spec.ts` - optional visual screenshot coverage; generated `tests/*-snapshots/` folders are ignored session output.
- `playwright.config.ts` - local browser-test server, worker/timeouts, and desktop/mobile projects.
- `eslint.config.mjs` - ignores generated folders; if this regresses, lint can scan Playwright output and fail while tests run.
- `scripts/write-sanity-seed.ts` - imports fallback content shape into Sanity seed documents.
- `src/lib/sanity.ts` - Sanity query and project connection.
- `src/lib/server/crm.ts` - private server-side CRM writer; mistakes can leak or fail customer submissions.
- `src/routes/contacto/+page.server.ts` - contact form validation, CSRF/origin checks, honeypot handling, and CRM submission.
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
- The public Sanity document client must stay `useCdn: false`; otherwise Studio edits can look unpublished/stale on the website even when renderers are wired correctly.
- Loja schema, fallback prices, seed generation, GROQ projection, route filters/pagination, and tests must stay aligned.
- Carrinho resolves local browser selections against the current public Loja content. If product slugs, variant order, or finish keys change, update fallback/Sanity content and tests together.
- The public `production` dataset and private `crm` dataset must remain separated. Do not query CRM documents from public layout/page loads.
- Contact-form visible labels are editable, but backend field names are fixed (`name`, `email`, `phone`, `postalCode`, `locality`, `message`) for validation and CRM storage.
- Shared contact, social, WhatsApp, complaints-book, and consent fields must stay aligned across Sanity schema, GROQ projection, fallback normalization, footer, and contact page.
- Sanity image/gallery fields, GROQ asset projections, fallback image handling, and public route image rendering must stay aligned.
- Homepage media and partner fields must stay aligned across Sanity schema, GROQ projection, fallback normalization, local logo assets, and the public homepage renderer.
- Schema definitions become fragile once real content exists in the Sanity dataset.
- Primary navigation should keep stable route sets instead of replacing links by current route. Desktop carries the full route set; mobile uses a stable high-value bottom dock and marks the current route when that route is present in the dock.
- Pagination scroll and refresh scroll reset depend on client-side browser behavior; keep them explicit when changing layout or route transitions.

## User-Facing Workflows

- Public visitors moving through routed pages and contacting the company.
- Editors opening Sanity Studio, creating product categories, case studies, and blog posts, filling localized fields, using structured blog article blocks where needed, and publishing.
- Editors uploading product, case-study, and blog images with localized alt text.
- Editors maintaining Loja products, variants, finish prices, and future approved product images in Studio.
- Visitors opening product, case-study, or blog gallery lightboxes; the page behind the modal should not scroll or change position until the lightbox closes.
- Visitors adding Loja products to Carrinho, adjusting quantities locally, and continuing to Contacto with a prefilled quote message.
- Editors changing page copy/contact/footer content through the Portuguese `Conteúdo do site` singleton.
- Editors changing social links, WhatsApp, complaints-book link, and marketing-consent copy through the Portuguese `Conteúdo do site` singleton.
- Editors changing homepage institutional video, mixed media items, and partner/project logo entries through the Portuguese `Conteúdo do site` singleton.
- Editors reviewing new private requests in the CRM Studio workspace, changing statuses, adding internal notes, and using client profiles for follow-up.
- Developers generating visual snapshots only for local/session review, without committing the generated PNG baselines.
- Developers seeding Content Lake starter documents with `npm run seed:studio` or intentionally refreshing code-managed content with `npm run deploy:content`.

## Performance-Sensitive Areas

- Hero image loading and mobile layout.
- Sanity query behavior if collections grow large or need ordering/filtering beyond the current simple published list.
- Above-the-fold logo/hero assets, lazy list images, page transitions, and scroll-reset scripts.
- Floating WhatsApp placement, especially on mobile where it can compete with the bottom dock and forms.
- Playwright performance: keep viewport-independent checks desktop-only, avoid duplicate paginated page walks, and prefer targeted browser screenshots when Xavier explicitly asks to skip E2E for a small UI fix.

## Security Or Access-Control Areas

- Sanity project access and dataset permissions.
- The private Sanity `crm` dataset, submitted personal data, internal notes, and client profile records.
- The Carrinho localStorage key stores only non-personal product selections. Do not add names, emails, addresses, phone numbers, or free-text messages to localStorage.
- `SANITY_CRM_WRITE_TOKEN` and `CRM_HASH_SECRET` must only exist in server/private runtime environments.
- Future public/private content boundaries if non-public draft content is introduced.

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
- Turning Carrinho into checkout by accident. It is only a quote builder: no payments, login, registration, stock, shipping, or final order records.
- Updating schema field names without updating `src/lib/sanity.ts` and `src/lib/site-content.ts`.
- Switching public Sanity document fetches to the cached CDN while expecting live CMS edits to appear immediately.
- Adding private CRM fields to `src/lib/sanity.ts` or any public route by mistake.
- Exposing `SANITY_CRM_WRITE_TOKEN` through public environment variables, logs, generated static files, or client-side code.
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

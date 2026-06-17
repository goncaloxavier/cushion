# Risky areas

Use this to help agents avoid accidental damage.

## High-Risk Files

- `src/lib/site-content.ts` - fallback public copy in three languages; changes affect the live page when Sanity has no document.
- `src/routes/+layout.server.ts` - shared content load for all public routes.
- `src/routes/+layout.svelte` - shared public navigation, language toggle, footer, social links, complaints link, and WhatsApp shortcut.
- `src/routes/+page.svelte` and route folders under `src/routes/` - public presentation UI.
- `tests/visual.spec.ts` and `tests/visual.spec.ts-snapshots/` - visual regression coverage and baselines.
- `playwright.config.ts` - local browser-test server, worker/timeouts, and desktop/mobile projects.
- `eslint.config.mjs` - ignores generated folders; if this regresses, lint can scan Playwright output and fail while tests run.
- `scripts/write-sanity-seed.ts` - imports fallback content shape into Sanity seed documents.
- `src/lib/sanity.ts` - Sanity query and project connection.
- `sanity.config.ts` - contains Studio title, project id, dataset, plugins, and schema registration.
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
- Shared contact, social, WhatsApp, complaints-book, and consent fields must stay aligned across Sanity schema, GROQ projection, fallback normalization, footer, and contact page.
- Sanity image/gallery fields, GROQ asset projections, fallback image handling, and public route image rendering must stay aligned.
- Schema definitions become fragile once real content exists in the Sanity dataset.
- Dynamic navigation hides the current route and changes between desktop and mobile; tests should cover both the hidden current link and the replacement link.
- Pagination scroll and refresh scroll reset depend on client-side browser behavior; keep them explicit when changing layout or route transitions.

## User-Facing Workflows

- Public visitors moving through routed pages and contacting the company.
- Editors opening Sanity Studio, creating product categories, case studies, and blog posts, filling localized fields, and publishing.
- Editors uploading product, case-study, and blog images with localized alt text.
- Editors changing page copy/contact/footer content through the Portuguese `Conteúdo do site` singleton.
- Editors changing social links, WhatsApp, complaints-book link, and marketing-consent copy through the Portuguese `Conteúdo do site` singleton.
- Developers updating visual snapshots only when the visual change is intentional.
- Developers seeding Content Lake starter documents with `npm run seed:studio`.

## Performance-Sensitive Areas

- Hero image loading and mobile layout.
- Sanity query behavior if collections grow large or need ordering/filtering beyond the current simple published list.
- Above-the-fold logo/hero assets, lazy list images, page transitions, and scroll-reset scripts.
- Floating WhatsApp placement, especially on mobile where it can compete with the bottom dock and forms.
- Playwright performance: keep viewport-independent checks desktop-only and avoid duplicate paginated page walks.

## Security Or Access-Control Areas

- Sanity project access and dataset permissions.
- Future public/private content boundaries if non-public draft content is introduced.

## Common Regression Patterns

- Changing project id or dataset in one Sanity config file but not the other.
- Adding schema files without registering them in `schemaTypes/index.ts`.
- Assuming content fields exist before schemas are confirmed.
- Adding routed pages without preserving the `lang` query parameter in internal navigation.
- Adding CMS fallback items without adding matching visual or route-test coverage.
- Refreshing visual baselines to hide accidental layout regressions.
- Forgetting that Playwright uses fallback fixtures while local/dev website reads live Sanity content.
- Running lint while Playwright is creating generated output is safe only while generated test folders stay ignored.
- Rerunning `npm run seed:studio` after manual Studio edits can replace the deterministic starter documents.
- Updating schema field names without updating `src/lib/sanity.ts` and `src/lib/site-content.ts`.
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
- Run route tests after navigation, pagination, scroll, or CMS query changes; run visual tests when the UI itself changes.

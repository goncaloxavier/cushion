# Risky areas

Use this to help agents avoid accidental damage.

## High-Risk Files

- `src/lib/site-content.ts` - fallback public copy in three languages; changes affect the live page when Sanity has no document.
- `src/routes/+layout.server.ts` - shared content load for all public routes.
- `src/routes/+layout.svelte` - shared public navigation, language toggle, and footer.
- `src/routes/+page.svelte` and route folders under `src/routes/` - public presentation UI.
- `tests/visual.spec.ts` and `tests/visual.spec.ts-snapshots/` - visual regression coverage and baselines.
- `playwright.config.ts` - local browser-test server, Chrome channel, and desktop/mobile projects.
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
- Sanity image fields, GROQ asset projections, fallback image handling, and public route image rendering must stay aligned.
- Schema definitions become fragile once real content exists in the Sanity dataset.

## User-Facing Workflows

- Public visitors moving through routed pages and contacting the company.
- Editors opening Sanity Studio, creating product categories, case studies, and blog posts, filling localized fields, and publishing.
- Editors uploading product, case-study, and blog images with localized alt text.
- Developers updating visual snapshots only when the visual change is intentional.
- Developers seeding Content Lake starter documents with `npm run seed:studio`.

## Performance-Sensitive Areas

- Hero image loading and mobile layout.
- Sanity query behavior if collections grow large or need ordering/filtering beyond the current simple published list.

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
- Rerunning `npm run seed:studio` after manual Studio edits can replace the deterministic starter documents.
- Updating schema field names without updating `src/lib/sanity.ts` and `src/lib/site-content.ts`.
- Making Sanity images required before the client has uploaded approved assets.
- Creating language-specific copy that no longer says the same factual thing across PT/EN/ES.
- Committing generated build artifacts unintentionally.

## Safe Change Guidance

- Keep early changes small and easy to explain.
- Confirm new content model decisions before encoding them in Sanity schemas.
- Keep public claims tied to confirmed facts.
- Update this `/ai` folder when architecture, commands, or business rules become real.

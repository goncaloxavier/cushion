# Architecture

## Stack

- Frontend: SvelteKit v2 routed presentation site.
- CMS/content backend: Sanity Studio v5.
- Studio runtime: React 19, React DOM 19, styled-components, Sanity structure tool, Sanity Vision tool.
- Database/storage: Sanity Content Lake, project `u4uyfix8`, dataset `production`.
- Build/deploy: Vite/SvelteKit scripts for the public website and Sanity CLI scripts for the Studio.
- Test tools: TypeScript, ESLint, Prettier, and Playwright are installed.

## Main Flow

```text
Sanity product/case/blog documents -> SvelteKit layout server load -> localized routed website content
```

```text
fallback multilingual content -> routed SvelteKit website when Sanity has no published collection content
```

```text
fallback multilingual content -> seed generator -> Sanity Content Lake starter documents
```

## Key Files And Folders

- `package.json` - SvelteKit, Sanity Studio dependencies, and scripts.
- `src/routes/+layout.server.ts` - loads Sanity collection content and falls back to local content.
- `src/routes/+layout.svelte` - shared header, language toggle, route progress, and footer.
- `src/routes/+page.svelte` - homepage.
- `src/routes/sobre-nos/+page.svelte` - company story route.
- `src/routes/produtos/+page.svelte` - product-category route.
- `src/routes/produtos/[slug]/+page.server.ts` and `+page.svelte` - product/category detail route.
- `src/routes/catalogo/+page.svelte` - catalogue and quote-flow route.
- `src/routes/casos-de-estudo/+page.svelte` - case-study route.
- `src/routes/casos-de-estudo/[slug]/+page.server.ts` and `+page.svelte` - case-study detail route.
- `src/routes/blog/+page.svelte` - blog index route.
- `src/routes/blog/[slug]/+page.server.ts` and `+page.svelte` - blog article route.
- `src/routes/contacto/+page.svelte` - contact route.
- `playwright.config.ts` - desktop/mobile Playwright projects and local test server.
- `scripts/write-sanity-seed.ts` - generates `.sanity/seed.ndjson` from fallback content.
- `tests/routes.spec.ts` - route, language, link, overflow, detail-link, form, and 404 checks.
- `tests/sanity-contract.spec.ts` - Studio schema/query/fallback contract checks.
- `tests/visual.spec.ts` and `tests/visual.spec.ts-snapshots/` - full-page visual regression baselines.
- `src/lib/site-content.ts` - fallback multilingual selling copy and Sanity content normalization.
- `src/lib/sanity.ts` - Sanity client and product/case/blog collection query.
- `sanity.config.ts` - Studio title, project id, dataset, plugins, and schema registration.
- `sanity.structure.ts` - client-friendly Studio navigation for products, case studies, blog posts, and remaining schemas.
- `sanity.cli.ts` - Sanity CLI project, dataset, and deployment settings.
- `schemaTypes/` - Sanity document and object schemas for landing experiments plus product categories, case studies, and blog posts.
- `static/logo/brand_mark.png` - provided brand mark.
- `static/images/recycled-products-hero.png` - generated hero image for this project.
- `static/images/product-materials.png`, `static/images/case-installation.png`, and `static/images/blog-editorial.png` - generated fallback collection images used until Sanity entries have uploaded images.
- `eslint.config.mjs` - Sanity Studio ESLint config.
- `tsconfig.json` - TypeScript compiler configuration.
- `docs/sanity-starter.md` - short guide for using the Studio in this project.
- `ai/` - project-local AI context.

## Data Boundaries

- Source of truth: Sanity project `u4uyfix8`, dataset `production`, schema definitions committed in this repo, and fallback content in `src/lib/site-content.ts` until Sanity is populated.
- Derived data: SvelteKit build output from `npm run build` and Sanity Studio build output from `npm run build:studio`.
- Runtime/generated data: `node_modules/`, `.svelte-kit/`, `build/`, `dist/`, and `.sanity/`.
- External services: Sanity Content Lake and Sanity Studio hosting/deployment.
- Test mode: Playwright sets `SANITY_DISABLE_REMOTE=true`, forcing stable fallback fixtures instead of mutable Content Lake content.

## Routes Or Entry Points

- `npm run dev` - starts the SvelteKit website locally.
- `npm run dev:studio` - starts Sanity Studio locally on port `3333`.
- `npm run build` - builds the SvelteKit website.
- `npm run build:studio` - builds Sanity Studio.
- `npm run preview` - previews the built SvelteKit website.
- `npm run start:studio` - serves a built Sanity Studio.
- `npm run deploy:studio` - deploys Sanity Studio through Sanity CLI.
- `npm run deploy-graphql` - deploys Sanity GraphQL.

## Public Routes

- `/`
- `/sobre-nos`
- `/produtos`
- `/produtos/[slug]`
- `/catalogo`
- `/casos-de-estudo`
- `/casos-de-estudo/[slug]`
- `/blog`
- `/blog/[slug]`
- `/contacto`

## Architecture Rules

- Keep `sanity.config.ts` and `sanity.cli.ts` aligned on project id and dataset.
- Add content schemas through `schemaTypes/` and register them in `schemaTypes/index.ts`.
- Keep multilingual public copy synchronized between fallback content and Sanity fields until Sanity becomes the only content source.
- When adding Sanity-backed content, update `src/lib/sanity.ts`, `src/lib/site-content.ts`, and matching routes together.
- Product categories, case studies, and blog posts should keep editable Sanity image fields with hotspot support and localized alt text.
- When adding public routes or fallback CMS items, update Playwright route/visual coverage and refresh snapshots only for intentional visual changes.
- When fallback starter content changes intentionally, update the seed workflow and rerun `npm run seed:studio` only when the Content Lake should receive those changes.
- Do not use assets from the existing DaFábrica4You website; use the provided logo and project-local/generated assets unless Xavier confirms otherwise.
- Keep generated artifacts out of committed project context unless intentionally required.

# Architecture

## Stack

- Frontend: SvelteKit v2 routed presentation site.
- Frontend runtime: Svelte 5 with Vite 7 and `@sveltejs/adapter-node` for Node/Railway hosting.
- CMS/content backend: Sanity Studio v6.
- Studio runtime: React 19, React DOM 19, styled-components, Sanity structure tool, Sanity Vision v6.
- Database/storage: Sanity Content Lake, project `u4uyfix8`, dataset `production`.
- Build/deploy: Vite/SvelteKit scripts for the Railway public website and Sanity CLI scripts for the Studio.
- Test tools: TypeScript, ESLint, Prettier, and Playwright are installed.

## Main Flow

```text
Sanity site-content singleton + product/case/blog documents -> SvelteKit layout server load -> localized routed website content
```

```text
fallback multilingual content -> routed SvelteKit website when Sanity has no published collection content
```

```text
fallback multilingual content -> seed generator -> Sanity Content Lake starter documents
```

## Key Files And Folders

- `package.json` - SvelteKit, Sanity Studio dependencies, and scripts.
- `src/routes/+layout.server.ts` - loads Sanity site content and collections, then falls back to local content.
- `src/routes/+layout.svelte` - shared header, desktop navigation, mobile bottom dock, language toggle, route progress, footer, social links, complaints link, and floating WhatsApp shortcut.
- `src/routes/+page.svelte` - homepage; the hero uses the editable `home.heroVideoUrl` as a muted looping background YouTube embed and opens a full YouTube player from the video button; partner/project logos sit below the impact section.
- `src/routes/sobre-nos/+page.svelte` - company story route.
- `src/routes/produtos/+page.svelte` - product-category route.
- `src/routes/produtos/[slug]/+page.server.ts` and `+page.svelte` - product/category detail route with a text-first editorial layout: one focused description sourced from product detail copy, an optional separated resistance/maintenance paragraph, full-frame shared `ImageGallery`, and quote/catalogue CTA.
- `src/routes/catalogo/+page.svelte` - catalogue and quote-flow route.
- `src/routes/casos-de-estudo/+page.svelte` - case-study route.
- `src/routes/casos-de-estudo/[slug]/+page.server.ts` and `+page.svelte` - case-study detail route with the description folded into the hero lead, shared `ImageGallery`, and optional challenge/solution/result cards.
- `src/routes/blog/+page.svelte` - blog index route.
- `src/routes/blog/[slug]/+page.server.ts` and `+page.svelte` - blog article route.
- `src/routes/contacto/+page.svelte` - contact route.
- `playwright.config.ts` - desktop/mobile Playwright projects, bounded workers/timeouts, and local test server.
- `scripts/write-sanity-seed.ts` - generates `.sanity/seed.ndjson` from fallback content.
- `scripts/old-blog-posts.ts`, `scripts/update-old-blog-bodies.ts`, and `scripts/write-blog-import.ts` - reviewable trilingual migration data for the previous Webnode blog, a raw-body/translation refresh helper, and the generator for `.sanity/blog-import.ndjson`.
- `scripts/old-case-studies.ts` and `scripts/write-case-study-import.ts` - reviewable trilingual migration data for the previous Webnode case-study page and the generator for `.sanity/case-study-import.ndjson`.
- `scripts/scrape-product-images.ts`, `scripts/product-images.json`, `scripts/old-products.ts`, and `scripts/write-product-import.ts` - the product migration: a scraper that pulls every full-resolution gallery photo per old "PRODUTOS" category into a committed JSON, the reviewable trilingual product copy (one entry per category = one `productCategory`), and the generator for `.sanity/product-import.ndjson` (`npm run scrape:products`, `import:products:write`, `import:products`).
- `tests/routes.spec.ts` - route, language, link, overflow, detail-link, navigation, form gating, and 404 checks.
- `tests/sanity-contract.spec.ts` - Studio schema/query/fallback contract checks.
- `tests/visual.spec.ts` - optional full-page visual screenshot checks; generated `tests/*-snapshots/` output is ignored and used only for session review.
- `src/lib/site-content.ts` - fallback multilingual selling copy, site page content, and Sanity content normalization.
- `src/lib/components/ImageGallery.svelte` - shared product/case/blog detail gallery and lightbox; locks background scroll while open and supports keyboard navigation.
- `src/lib/components/Pagination.svelte` - shared numbered (windowed) pagination used by the product, case-study, and blog list routes; page state lives in each route, which passes `page`/`totalPages`/`onchange`.
- `src/lib/article-structure.ts` and `src/lib/components/StructuredArticleBody.svelte` - shared plain-text article parser plus renderer for Studio-authored rich blog articles, with legacy body fallback for migrated posts.
- `src/lib/scroll.ts` - `changeListPage` runs a page change as a market-standard cross-fade: fade the `.collection-results` grid out, swap + render while hidden, instant-reposition to the list top under the fade, then fade back in (opacity/transform only — no per-frame scroll loop). The three list routes (products, case studies, blog) share one `.collection-results` grid + card layout defined in `src/app.css`.
- `src/lib/media.ts` - YouTube URL parsing and no-cookie embed URL helpers; `youtubeEmbedUrl` accepts optional autoplay, controls, loop, mute, and playsinline flags for background and full-player embeds.
- `static/fonts/InterVariable*.woff2` - self-hosted Inter variable font loaded via `@font-face` in `src/app.css` and preloaded in `src/app.html`; this is why the fine-grained font weights render as intended.
- `src/lib/sanity.ts` - Sanity client and site/product/case/blog query.
- `sanity.config.ts` - Studio title, project id, dataset, plugins, and schema registration.
- `sanity.structure.ts` - client-friendly Studio navigation for products, case studies, blog posts, and remaining schemas.
- `sanity.cli.ts` - Sanity CLI project, dataset, and deployment settings.
- `schemaTypes/` - Portuguese Sanity document and object schemas for editable site content plus product categories, case studies, and blog posts.
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
- `npm run deploy:content` - intentionally imports code-managed Content Lake documents: the `siteContent` seed, historical case studies, historical blog posts, and the migrated product catalogue (`import:products`).
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
- Keep public page copy editable through the `siteContent` singleton when the copy belongs to a route rather than a collection item.
- Keep shared contact/social/legal fields editable through the `siteContent` singleton when they appear in the layout or contact route.
- Keep page video sections and partner/logo sections editable through the `siteContent` singleton when they are page-level presentation content.
- Keep multilingual public copy synchronized between fallback content and Sanity fields until Sanity becomes the only content source.
- When adding Sanity-backed content, update `src/lib/sanity.ts`, `src/lib/site-content.ts`, and matching routes together.
- Product categories, case studies, and blog posts should keep editable Sanity image/gallery fields with hotspot support and localized alt text.
- Contact/social/legal Sanity fields must stay aligned across schema definitions, GROQ projections, fallback normalization, layout/footer rendering, and contact route rendering.
- Partner Sanity fields must stay aligned across schema definitions, GROQ projections, fallback normalization, public route rendering, and tests.
- The homepage institutional video is the editable `home.heroVideoUrl` field, rendered as a muted looping hero background and as a full modal player from the video button. The old homepage media/gallery section has been removed; keep `heroVideoUrl` aligned across schema, GROQ, fallback, normalization, and the hero, and keep play/close control labels (`heroVideoLabel`, `heroVideoCloseLabel`) as fallback-only localized UI strings.
- Desktop navigation should expose the full primary route set. Mobile navigation should use a stable high-value bottom dock and must not swap links based on the current route.
- When adding public routes or fallback CMS items, update Playwright route/visual coverage. Generate visual snapshots only for local/session review and do not commit them.
- Keep Playwright deterministic by leaving `SANITY_DISABLE_REMOTE=true` for automated route and visual tests.
- When fallback starter content changes intentionally, update the seed workflow and rerun `npm run seed:studio` or `npm run deploy:content` only when the Content Lake should receive those changes.
- Do not attach Sanity content imports to Railway website builds unless replacing Studio-managed content on every website deploy is explicitly intended.
- Do not use assets from the existing DaFábrica4You website; use the provided logo and project-local/generated assets unless Xavier confirms otherwise.
- Keep generated artifacts out of committed project context unless intentionally required; do not stage `node_modules/`, `test-results/`, visual snapshot folders, or build outputs.

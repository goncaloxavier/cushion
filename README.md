# Cushion / DaFábrica4You

Premium presentational website preparation for DaFábrica4You using SvelteKit and Sanity.

The site is being shaped as a routed, multilingual sales/presentation website with editable CMS content for product categories, case studies, and blog posts.

## Local Development

```bash
npm install
npm run dev
npm run dev:studio
```

- `npm run dev` starts the SvelteKit website.
- `npm run dev:studio` starts Sanity Studio on port `3333`.

## Public Routes

- `/` - homepage and brand/product introduction.
- `/sobre-nos` - company story and principles.
- `/produtos` - editable product-category index.
- `/produtos/[slug]` - individual product/category detail route.
- `/catalogo` - catalogue and quote-request flow.
- `/casos-de-estudo` - editable project/case-study index.
- `/casos-de-estudo/[slug]` - individual case-study detail route.
- `/blog` - editable blog index.
- `/blog/[slug]` - individual blog article route.
- `/contacto` - contact and quote request form surface.

Language is selected with the `lang` query parameter: `pt`, `en`, or `es`.

## Validation

```bash
npm run check
npm run lint
npm run build
npm run build:studio
npm run deploy:content
npm run e2e
npm run seed:studio
```

Visual snapshots are session-only review artifacts. Use `npm run e2e:visual:update` only when you need local screenshots for inspection, then keep the generated `tests/*-snapshots/` output out of git.
Playwright runs with `SANITY_DISABLE_REMOTE=true`, so tests use stable fallback fixtures rather than mutable Studio content.

## Sanity

The website has fallback multilingual content, so it works before any Studio content exists. That fallback is why the site can look like it is "not using Studio" while the Studio is still empty.

Editors can create, publish, unpublish, update, and delete:

- `Product category`
- `Case study`
- `Blog post`

The old `Landing page` schema is still registered as an experimental document, but the routed site currently reads the collection documents above.

Published collection documents replace the matching fallback collection on the public site.

## Starter Content

The current site-wide content and starter products can be written into the Sanity Content Lake with:

```bash
npm run seed:studio
```

This generates `.sanity/seed.ndjson` and imports 6 deterministic documents into dataset `production` using `--replace`: the `siteContent` singleton plus starter products. After that, Studio has editable page copy/contact/footer content and product entries.

To intentionally refresh all code-managed Studio content, including the migrated historical cases and blog posts, run:

```bash
npm run deploy:content
```

Do not put `deploy:content` inside the Railway build command unless overwriting Sanity content on every website deploy is intended.

See `docs/sanity-starter.md` for the short editor/developer guide.

## Dependency Note

This repo is pinned to Vite 7 for now. The installed Sanity Studio package set is the deciding constraint, so do not move the project to Vite 8 until the Sanity CLI/package combination in this repo supports it cleanly.

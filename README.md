# Cushion / DaFábrica4You

Premium presentational website preparation for DaFábrica4You using SvelteKit and Sanity.

The site is being shaped as a routed, multilingual sales/presentation website with editable CMS content for product categories, store products, case studies, and blog posts. Private ecommerce data is kept out of Sanity and belongs in Railway Postgres.

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
- `/loja` - priced store-product index.
- `/loja/[slug]` - individual priced store-product detail route.
- `/carrinho` - local browser cart/review route.
- `/finalizar-compra` - guest/customer checkout route that creates a pending Postgres order.
- `/conta` - customer account/order-history area.
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
npm run db:migrate
SANITY_ALLOW_WRITE=true npm run deploy:content
npm run e2e
SANITY_ALLOW_WRITE=true npm run seed:studio
```

Visual snapshots are session-only review artifacts. Use `npm run e2e:visual:update` only when you need local screenshots for inspection, then keep the generated `tests/*-snapshots/` output out of git.
Playwright runs with `SANITY_DISABLE_REMOTE=true`, so tests use stable fallback fixtures rather than mutable Studio content.

## Sanity

The website has fallback multilingual content, so it works before any Studio content exists. That fallback is why the site can look like it is "not using Studio" while the Studio is still empty.

Editors can create, publish, unpublish, update, and delete:

- `Conteúdo do site`
- `Product category`
- `Produto da loja`
- `Case study`
- `Blog post`

Published CMS documents replace the matching fallback content on the public site. `Conteúdo do site` is the singleton for page copy, contact/legal fields, homepage media, partner logos, footer links, and public store settings such as the transport multiplier.

Sanity is only the public CMS/catalogue editor for website copy, products, store prices/images, case studies, blog posts, and public store settings such as the transport multiplier. Customer accounts, addresses, sessions, orders, payment attempts, and order history are stored in Postgres.

## Ecommerce Foundation

Railway Postgres is the private source of truth for store checkout. Configure `DATABASE_URL` and run:

```bash
npm run db:migrate
```

Checkout supports guests and customer accounts. Orders are created as `pending_payment_link`; Ifthenpay PayByLink is intentionally fail-closed until credentials, callback URLs, and status rules are confirmed. Resend email is optional for local/dev, but production should set `RESEND_API_KEY`, `EMAIL_FROM`, `ORDERS_TO_EMAIL`, and `APP_ORIGIN`.

## Starter Content

The current site-wide content and starter products can be written into the Sanity Content Lake with:

```bash
SANITY_ALLOW_WRITE=true npm run seed:studio
```

This generates `.sanity/seed.ndjson` and imports 21 deterministic documents into dataset `production` using `--replace`: the `siteContent` singleton, starter product categories, and starter Loja products. After that, Studio has editable page copy/contact/footer content, product entries, Loja products, prices, weights, and store images.

To intentionally refresh all code-managed Studio content, including the migrated historical cases and blog posts, run:

```bash
SANITY_ALLOW_WRITE=true npm run deploy:content
```

Do not put `deploy:content` inside the Railway build command unless overwriting Sanity content on every website deploy is intended.

The Sanity write/import commands refuse to run unless `SANITY_ALLOW_WRITE=true` is set, because they can replace published Content Lake documents.

For local-only seed generation without publishing to Sanity:

```bash
npm run seed:studio:write
```

See `docs/sanity-starter.md` for the short editor/developer guide.

## Dependency Note

This repo is pinned to Vite 7 for now. The installed Sanity Studio package set is the deciding constraint, so do not move the project to Vite 8 until the Sanity CLI/package combination in this repo supports it cleanly.

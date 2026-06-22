# Sanity Starter Notes

This project now has two local surfaces:

```bash
npm run dev
npm run dev:studio
```

- `npm run dev` starts the SvelteKit website.
- `npm run dev:studio` starts Sanity Studio on port `3333`.

Studio has two workspaces:

- `/website` edits the public website content in dataset `production`.
- `/crm` reviews private form requests and client profiles in dataset `crm`.

## What To Do In Sanity

1. Open the Studio.
2. Open the `Website` workspace.
3. Open `Conteúdo do site`, `Produtos`, `Loja`, `Casos de estudo`, or `Artigos do blog` from the Studio sidebar.
4. Create or edit an entry.
5. Fill the Portuguese, English, and Spanish fields.
6. Upload the image/cover/project image and add alt text in Portuguese, English, and Spanish.
7. Publish the document.
8. Refresh the SvelteKit website.

The website has built-in fallback content, so it works even before Sanity has content. Once collection documents are published, the website uses the Sanity collection content instead of the fallback items for that collection.

If Studio is empty and the website still looks complete, that is expected. The fallback content is there to keep the client presentation from going blank while the CMS is being learned and populated.

If a Sanity entry has no uploaded image yet, the website uses a project-local fallback image. As soon as an editor uploads an image in Studio and publishes the entry, the public route uses the Sanity image instead.

This project also has a seed workflow. It writes the current site-wide content, starter products, and starter Loja products into Sanity so Studio becomes the editing surface immediately:

```bash
npm run seed:studio
```

The seed currently imports 21 deterministic documents: the `siteContent` singleton, 5 product categories, and 15 Loja products. It uses `--replace`, so rerunning it updates only those seed document IDs.

For a deliberate full content refresh, including the migrated historical cases and blog posts, run:

```bash
npm run deploy:content
```

Do not run this as part of normal Railway website deploys unless replacing Sanity content every time is intended.

## Testing The CMS Flow

Use this as the low-friction Sanity learning loop:

1. Start the website with `npm run dev`.
2. Start Studio with `npm run dev:studio`.
3. Create one `Blog post` with a title, slug, excerpt, category, date, and body in PT/EN/ES.
4. Upload a cover image and fill the alt text.
5. Publish it and open `/blog`.
6. Click the article and confirm `/blog/[slug]` works.
7. Edit the post title, body, or image, publish again, and refresh the website.
8. Unpublish or delete the post and confirm the website falls back if no published blog posts remain.

The same publish/edit/remove loop applies to `Product category` documents on `/produtos`, `Produto da loja` documents on `/loja`, and `Case study` documents on `/casos-de-estudo`.

Detail pages are generated from slugs:

- Product categories: `/produtos/[slug]`
- Loja products: `/loja/[slug]`
- Case studies: `/casos-de-estudo/[slug]`
- Blog posts: `/blog/[slug]`

## Content Model

- `Conteúdo do site` feeds page-level copy, contact/legal fields, the homepage video/media area, partner logos, and footer content.
- `Product category` feeds the `/produtos` route.
- `Produto da loja` feeds `/loja` with category, short summary, variants and finish prices. The public list shows only a starting price; `/loja/[slug]` lets visitors choose measure/variant and finish/color before adding the item to Carrinho.
- Carrinho is frontend-only quote preparation. It uses the published `Produto da loja` content, stores only the selection on the visitor's device, and sends the visitor to the contact form for the real CRM-backed request.
- `Case study` feeds the `/casos-de-estudo` route.
- `Blog post` feeds `/blog` and `/blog/[slug]`.
- Each public collection type has an editable Sanity image field with hotspot support and localized alt text.
- `Conteúdo do site` is a singleton document with the fixed document ID `siteContent`.
- `Localized short text` is for headings, labels, and CTAs.
- `Localized long text` is for paragraphs.
- `Content card` and `Impact stat` are still available for landing-page experiments.

## Contact Requests And CRM

The public contact form writes to the private Sanity dataset `crm` through SvelteKit server code. A successful submission creates a `Pedido recebido` document and updates or creates a `Perfil de cliente`.

When a visitor arrives from Carrinho, the contact message is prefilled with the selected Loja products, variants, finishes, quantities, and current catalogue-derived prices. Personal data is still collected only by the contact form and stored only in `crm` after submission.

Use the Studio `/crm` workspace to:

1. Review `Novos pedidos`.
2. Move requests through `Lido`, `Em acompanhamento`, `Resolvido`, `Spam`, or `Arquivado`.
3. Add internal notes that never appear on the website.
4. Open the related client profile to see submission count, latest message, source, and contact details.

Live CRM writes need private server environment variables:

```bash
SANITY_CRM_WRITE_TOKEN=...
CRM_HASH_SECRET=...
SANITY_CRM_DATASET=crm
```

Keep the `crm` dataset private. The public website must not query `formSubmission` or `clientProfile` documents.

## Tests

```bash
npm run e2e
npm run e2e:visual
```

- `npm run e2e` checks routes, language-safe links, mobile/desktop overflow, detail-page links, 404 behavior, and the Studio/frontend collection contract.
- `npm run e2e:visual` compares full-page screenshots for desktop and mobile routes.
- `npm run e2e:visual:update` refreshes screenshot baselines after an intentional visual design change.

The Playwright server runs with `SANITY_DISABLE_REMOTE=true`, which means tests use stable fallback fixtures. This keeps visual snapshots reliable while real Studio content changes during editing.

## Editorial Notes

- Keep the Portuguese, English, and Spanish versions aligned in meaning.
- Do not add unsupported certifications, guarantees, or impact claims.
- Product-category pricing is intentionally framed as quote/catalogue flow. Loja has catalogue-derived starter prices from `Catalogo 244.pdf`, but final live pricing and approved Loja product images still need client confirmation.
- Do not use PDF catalogue crops as Loja product images. Leave the no-image placeholders until the client supplies proper images.
- Do not use assets from the current public DaFábrica4You site unless the client explicitly approves it.

## Current Sanity Project

- Project ID: `u4uyfix8`
- Public website dataset: `production`
- Private CRM dataset: `crm`

Do not change the project ID or dataset unless the client/project setup changes intentionally.

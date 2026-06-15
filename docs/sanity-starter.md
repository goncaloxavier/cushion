# Sanity Starter Notes

This project now has two local surfaces:

```bash
npm run dev
npm run dev:studio
```

- `npm run dev` starts the SvelteKit website.
- `npm run dev:studio` starts Sanity Studio on port `3333`.

## What To Do In Sanity

1. Open the Studio.
2. Open `Products`, `Case studies`, or `Blog posts` from the Studio sidebar.
3. Create or edit an entry.
4. Fill the Portuguese, English, and Spanish fields.
5. Upload the image/cover/project image and add alt text in Portuguese, English, and Spanish.
6. Publish the document.
7. Refresh the SvelteKit website.

The website has built-in fallback content, so it works even before Sanity has content. Once collection documents are published, the website uses the Sanity collection content instead of the fallback items for that collection.

If Studio is empty and the website still looks complete, that is expected. The fallback content is there to keep the client presentation from going blank while the CMS is being learned and populated.

If a Sanity entry has no uploaded image yet, the website uses a project-local fallback image. As soon as an editor uploads an image in Studio and publishes the entry, the public route uses the Sanity image instead.

This project also has a seed workflow. It writes the current starter content into Sanity so Studio becomes the editing surface immediately:

```bash
npm run seed:studio
```

The seed currently imports 11 deterministic documents: 5 product categories, 3 case studies, and 3 blog posts. It uses `--replace`, so rerunning it updates only those seed document IDs.

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

The same publish/edit/remove loop applies to `Product category` documents on `/produtos` and `Case study` documents on `/casos-de-estudo`.

Detail pages are generated from slugs:

- Product categories: `/produtos/[slug]`
- Case studies: `/casos-de-estudo/[slug]`
- Blog posts: `/blog/[slug]`

## Content Model

- `Product category` feeds the `/produtos` route.
- `Case study` feeds the `/casos-de-estudo` route.
- `Blog post` feeds `/blog` and `/blog/[slug]`.
- Each public collection type has an editable Sanity image field with hotspot support and localized alt text.
- `Landing page` remains registered as an experimental document from the first build pass.
- `Localized short text` is for headings, labels, and CTAs.
- `Localized long text` is for paragraphs.
- `Content card` and `Impact stat` are still available for landing-page experiments.

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
- Product pricing is intentionally framed as quote/catalogue flow for now because the existing client price page is broken and final pricing has not been confirmed.
- Do not use assets from the current public DaFábrica4You site unless the client explicitly approves it.

## Current Sanity Project

- Project ID: `u4uyfix8`
- Dataset: `production`

Do not change the project ID or dataset unless the client/project setup changes intentionally.

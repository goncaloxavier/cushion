# Business rules

Only document rules that exist in code, tests, user requirements, or confirmed docs.

## Core Rules

- DaFábrica4You transforms the yellow-bin waste stream into exterior products; public copy should name packaging, Tetra Pak, and cans/metal packaging where material origin matters instead of using vague "plastic" phrasing alone.
- The website is presentational and multilingual: Portuguese, English, and Spanish.
- Current sales copy must stay anchored in true public facts and avoid invented guarantees, certifications, or unsupported claims.
- Product, case-study, and blog content should be editable through Sanity and should remain usable even if Sanity has no published entries.
- Page-level public copy for home, about, products, catalogue, case studies, blog, contact, footer, and contact details should be editable through the Sanity `siteContent` singleton.
- Contact, social, WhatsApp, Livro de Reclamacoes, the related legal note, and marketing-consent copy/links should be editable through the Sanity `siteContent` singleton.
- Homepage institutional media and partner/project logos should be editable through the Sanity `siteContent` singleton, with fallback content available when Studio is empty.
- The institutional company video leads the homepage as a full-bleed hero (click-to-play; the YouTube embed loads only on click). It is set through the `home.heroVideoUrl` field and uses the homepage hero image as its poster; it is not paired with a placeholder photo.
- The homepage `mediaShowcase` is a mixed image/video gallery (not the institutional video). It must keep supporting images only, videos only, or both together; public copy stays marketing-led, while editor-facing Studio guidance may mention mixing photos and YouTube.
- Mixed page media should support uploaded images, YouTube videos, or both without requiring a code change for each new media item.
- Product, case-study, and blog images/galleries should be editable through Sanity; project-local fallback images are used only when an entry has no published image.
- Pricing is not confirmed. Present catalogue/quote guidance instead of pretending to have final product prices.
- Product categories, case studies, and blog posts expose detail routes from their slugs.
- Starter product, case-study, and blog documents have been seeded into Sanity `production` using deterministic IDs.
- Historical Webnode blog posts are migrated through `scripts/old-blog-posts.ts` as reviewed PT/EN/ES content, then imported with public-read-safe deterministic `blogPost-<slug>` IDs, hash-shortened only when a slug would exceed Sanity's document ID length.
- Automated browser/visual tests intentionally use fallback fixtures so editorial changes in Studio do not invalidate snapshots.
- Pagination on list pages should return the visitor to the top of the changed collection, and a browser refresh should start at the top of the page.
- Primary quote CTAs should go directly to contact/request action, with catalogue guidance linked only where it helps.
- The floating WhatsApp shortcut is useful on public browsing routes, but it should not obstruct the contact form.
- The contact form includes a marketing/personal-data consent checkbox and should not allow submission until every field is filled and consent is checked. This is a visible consent UI only; no form submission backend is currently implemented.

## Inputs

- Visitor language choice through the PT/EN/ES toggle.
- Optional published Sanity `Site content` singleton document.
- Optional published Sanity `Product category`, `Case study`, and `Blog post` documents.
- Optional Sanity image uploads and localized image alt text for those documents.
- Optional Sanity social, WhatsApp, complaints-book, and contact details.
- Fallback multilingual content in `src/lib/site-content.ts`.

## Outputs

- Public SvelteKit routed website.
- Sanity Studio for editing multilingual page copy, contact/footer content, product categories, case studies, and blog posts.

## Pricing Or Quantities

- Public impact metrics currently used in fallback copy: 25,000+ single-use packages per tonne, 700 kg CO2 avoided per tonne, and 2.5 trees preserved per tonne.
- Current fallback official complaints-book URL: `https://www.livroreclamacoes.pt/Pedido/Reclamacao`.
- Whenever the Livro de Reclamacoes link is shown, also show the legal note: `Litígios comerciais serão resolvidos no tribunal da comarca de Leiria`.
- Current fallback institutional video URL: `https://www.youtube.com/watch?v=h1wVIZRj0Hc`.
- Current fallback partner/project links: ABAAE `https://abaae.pt/`, Bandeira Azul `https://bandeiraazul.abaae.pt/`, Eco-Escolas `https://ecoescolas.abaae.pt/`, Eco-Freguesias XXI `https://ecofreguesias21.abaae.pt/`, and Animalife `https://animalife.pt/`.
- Current fallback social URLs: YouTube `https://www.youtube.com/@dafabrica4you245`, Facebook `https://www.facebook.com/dafabrica4you`, and Instagram `https://www.instagram.com/dafabrica4you`.
- Current fallback WhatsApp URL: `https://wa.me/351914746637`.

## Access Or Permissions

- Sanity access is handled by Sanity project permissions.
- No local app-level roles or permissions are defined in this repo.

## Edge Cases

- None confirmed yet.

## Known Limits

- Each collection falls back independently when no published Sanity entries exist. This can make the website look complete even while Studio is empty, though the current production dataset has starter seed documents.
- The public website preview is being deployed to Railway; final production domain and Studio access process still need confirmation.

## Do Not Change Without Confirmation

- Sanity project id `u4uyfix8`.
- Sanity dataset `production`.
- Public impact metrics, client-facing product claims, and contact details.
- Social links, WhatsApp number/link, complaints-book link, and marketing-consent wording.
- Institutional video URL, partner names/links/logos, and claims about partnerships/projects.
- Whether fallback content should remain after Sanity is populated.

# Business rules

Only document rules that exist in code, tests, user requirements, or confirmed docs.

## Core Rules

- DaFábrica4You transforms the yellow-bin waste stream into exterior products; public copy should name packaging, Tetra Pak, and cans/metal packaging where material origin matters instead of using vague "plastic" phrasing alone.
- The website is presentational and multilingual: Portuguese, English, and Spanish.
- Current sales copy must stay anchored in true public facts and avoid invented guarantees, certifications, or unsupported claims.
- Product, Loja, case-study, and blog content should be editable through Sanity and should remain usable even if Sanity has no published entries.
- Page-level public copy for home, about, products, catalogue, case studies, blog, contact, footer, and contact details should be editable through the Sanity `siteContent` singleton.
- Contact, social, WhatsApp, Livro de Reclamacoes, the related legal note, and marketing-consent copy/links should be editable through the Sanity `siteContent` singleton.
- Homepage institutional video and partner/project logos should be editable through the Sanity `siteContent` singleton, with fallback content available when Studio is empty.
- The institutional company video leads the homepage as a full-bleed muted looping background, and the video button opens the full YouTube player for intentional viewing. It is set through the `home.heroVideoUrl` field and is not paired with a placeholder photo.
- The old homepage mixed media/gallery section has been removed. The institutional video remains the editable homepage `heroVideoUrl`, and product/case/blog detail galleries remain supported.
- Product, case-study, and blog images/galleries should be editable through Sanity; project-local fallback images are used only when an entry has no published image.
- Product, Loja, case-study, and blog indexes show 9 cards per page.
- Product list cards should show image and title only; case-study list cards should show image, title, and location metadata; blog list cards should show image, title, and date metadata. Summaries, excerpts, and categories stay searchable/detail-page content but should not appear as subtitles on the list cards.
- Loja list cards should show category, title, short summary, and a starting price only. Do not show catalogue page badges, variant dimensions, finish/color selectors, or proposal links on the list; those decisions belong on `/loja/[slug]`.
- Loja detail pages should let the visitor choose the variant/measure and finish/color, with the displayed price updating from the selected combination.
- Carrinho is a quote-preparation flow, not ecommerce checkout. It should let visitors review selected Loja items and quantities before requesting a quote, but it must not introduce payment, login, registration, shipping, stock, or final order confirmation.
- Carrinho stores only selected product slug, variant index, finish, and quantity in browser localStorage. It must not store visitor identity, contact details, or free-text messages.
- When a visitor continues from Carrinho to Contacto, the contact message can be prefilled with the selected Loja items so the CRM submission is useful, but the submitted personal data still goes only through the existing server-validated form.
- Loja prices come from the supplied `Catalogo 244.pdf` starter data and should be treated as catalogue-derived working content until the client confirms final live commercial pricing.
- Loja PDF crops/images should not be used as product photography. Keep the list ready for Sanity-uploaded client product images and use no-image placeholders until those images exist.
- Product, case-study, and blog list/detail imagery should preserve the full image frame instead of cropping or stretching; detail galleries should use known image aspect ratios where available and lock background scrolling while the lightbox is open.
- Product primary images should prefer real product/project photos over obvious design sheets, dimensions sheets, catalogue panels, or technical drawings; those sheet images can remain later in the gallery.
- Public text content should meet comfortable low-vision readability expectations: strong contrast, body copy at readable sizes, generous line-height, and support for OS high-contrast preferences.
- Product detail pages should not render the product summary and description as two competing text blocks; use one focused detail description, optionally followed by a separated resistance/maintenance paragraph.
- Product detail pages should not render generic `Características`/`Aplicações` chip or list bands when they duplicate obvious sales points already present in the detail copy.
- Case-study detail pages should fold the description into the hero lead and should not render a separate standalone description band below the hero.
- Product list cards and product detail copy should avoid repeating generic material-origin badges such as "100% plástico reciclado" when that claim already appears in the surrounding product/site copy.
- Product-category pricing is not confirmed. Present catalogue/request guidance there instead of pretending to have final product prices.
- The catalogue page should explain that visitors must request the catalogue through the form; the form submission should preserve the catalogue intent for follow-up.
- Product categories, Loja products, case studies, and blog posts expose detail routes from their slugs.
- Starter product, case-study, and blog documents have been seeded into Sanity `production` using deterministic IDs.
- Historical Webnode case studies are migrated through `scripts/old-case-studies.ts` as 11 title-separated cases with PT/EN/ES title, summary, description, product area, location, main image, gallery images, and no date fields. Imports use deterministic public-read-safe `caseStudy-<slug>` IDs and populate the Studio-editable `description` plus image/gallery fields.
- Historical Webnode blog posts are migrated through `scripts/old-blog-posts.ts` as reviewed PT/EN/ES content, with Portuguese bodies extracted from the raw Webnode HTML and EN/ES full-body translations generated for review, then imported with public-read-safe deterministic `blogPost-<slug>` IDs, hash-shortened only when a slug would exceed Sanity's document ID length. Imports keep the legacy full-text `body` and also populate the rich `article` field so Studio editors can preserve headings, lists, simple tables, links, images, and YouTube embeds.
- Automated browser/visual tests intentionally use fallback fixtures so editorial changes in Studio do not invalidate local visual review output.
- Sanity Presentation/Visual Editing should let editors preview draft website content and click through to Studio fields without changing the public visitor content until publishing.
- Pagination on list pages should return the visitor to the top of the changed collection, and a browser refresh should start at the top of the page.
- Primary quote CTAs should go directly to contact/request action, with catalogue guidance linked only where it helps.
- The floating WhatsApp shortcut is useful on public browsing routes, but it should not obstruct the contact form.
- The contact form includes a marketing/personal-data consent checkbox and should not allow submission until every field is filled and consent is checked.
- Valid contact/catalogue form submissions create a private `formSubmission` document and update/create a private `clientProfile` document in the Sanity `crm` dataset. These records are for business follow-up and must not be rendered on the public website.
- The contact form backend must keep stable internal field names even when Studio editors change the visible labels.

## Inputs

- Visitor language choice through the PT/EN/ES toggle.
- Optional published Sanity `Site content` singleton document.
- Optional published Sanity `Product category`, `Store product`, `Case study`, and `Blog post` documents.
- Optional Sanity image uploads, galleries, and localized image alt text for those documents; blog article images and product/case/blog detail-gallery images should render uncropped in article/detail contexts.
- Optional Sanity social, WhatsApp, complaints-book, and contact details.
- Visitor contact/catalogue form submissions with name, email, phone, postal code, locality, message, language, source, and consent state.
- Visitor Loja cart selections stored locally in the browser: product slug, variant, finish, and quantity only.
- Fallback multilingual content in `src/lib/site-content.ts`.

## Outputs

- Public SvelteKit routed website.
- Sanity Studio website workspace for editing multilingual page copy, contact/footer content, product categories, Loja products/prices, case studies, and blog posts.
- Sanity Studio CRM workspace for reviewing form submissions, changing request status, adding internal notes, and maintaining client profiles.
- Local Carrinho page that summarizes selected Loja products and passes the selection into the contact request flow.

## Pricing Or Quantities

- Public impact metrics currently used in fallback copy: 25,000+ single-use packages per tonne, 700 kg CO2 avoided per tonne, and 2.5 trees preserved per tonne.
- Current fallback official complaints-book URL: `https://www.livroreclamacoes.pt/Pedido/Reclamacao`.
- Whenever the Livro de Reclamacoes link is shown, also show the legal note: `Litígios comerciais serão resolvidos no tribunal da comarca de Leiria`.
- Current fallback institutional video URL: `https://www.youtube.com/watch?v=h1wVIZRj0Hc`.
- Current fallback partner/project links: ABAAE `https://abaae.pt/`, Bandeira Azul `https://bandeiraazul.abaae.pt/`, Eco-Escolas `https://ecoescolas.abaae.pt/`, Eco-Freguesias XXI `https://ecofreguesias21.abaae.pt/`, and Animalife `https://animalife.pt/`.
- Current fallback social URLs: YouTube `https://www.youtube.com/@dafabrica4you245`, Facebook `https://www.facebook.com/dafabrica4you`, and Instagram `https://www.instagram.com/dafabrica4you`.
- Current fallback WhatsApp URL: `https://wa.me/351914746637`.
- Current Loja starter content includes 15 items from `Catalogo 244.pdf`: Banco Gavião, Banco Foros Domingão, Banco Fazenda, Banco Montargil, Mesa Vale do Arco, Mesa Octogonal, Conjunto Atalia, Cadeirão Atalia, Cadeira de Bar, Mesa Ervideira, Papeleira Reta, Ecoponto Triplo com Portas, Ecoponto 4 Resíduos, Mesa de Cultivo, and Canteiro com Treliça. `Cadeirão Atalia` is a provisional/editor-friendly name for the unnamed item shown below Conjunto Atalia on page 15.

## Access Or Permissions

- Sanity website editing access is handled by Sanity project permissions and login.
- Sanity Presentation/Visual Editing requires server-only preview credentials that can read drafts and preview-secret documents; public visitors must never receive those credentials.
- CRM access is handled by Sanity project permissions plus the private `crm` dataset.
- The public SvelteKit app uses a server-side write token for CRM writes only; no Sanity write token should ever be bundled into client-side code.
- Required private runtime variables for live CRM writes: `SANITY_CRM_WRITE_TOKEN` and `CRM_HASH_SECRET`; optional override: `SANITY_CRM_DATASET`.
- Required private/runtime variables for Visual Editing preview: `SANITY_VIEWER_TOKEN`, `SANITY_STUDIO_PREVIEW_ORIGIN`, and `SANITY_STUDIO_URL`.

## Edge Cases

- None confirmed yet.

## Known Limits

- Each collection falls back independently when no published Sanity entries exist. This can make the website look complete even while Studio is empty, though the current production dataset has starter seed documents.
- The public website preview is being deployed to Railway; final production domain and Studio access process still need confirmation.

## Do Not Change Without Confirmation

- Sanity project id `u4uyfix8`.
- Sanity public dataset `production`.
- Sanity private CRM dataset `crm`.
- Public impact metrics, client-facing product claims, and contact details.
- Social links, WhatsApp number/link, complaints-book link, and marketing-consent wording.
- Institutional video URL, partner names/links/logos, and claims about partnerships/projects.
- Whether fallback content should remain after Sanity is populated.

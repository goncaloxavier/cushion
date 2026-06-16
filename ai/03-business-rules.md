# Business rules

Only document rules that exist in code, tests, user requirements, or confirmed docs.

## Core Rules

- DaFábrica4You transforms plastic waste into recycled-plastic products.
- The website is presentational and multilingual: Portuguese, English, and Spanish.
- Current sales copy must stay anchored in true public facts and avoid invented guarantees, certifications, or unsupported claims.
- Product, case-study, and blog content should be editable through Sanity and should remain usable even if Sanity has no published entries.
- Page-level public copy for home, about, products, catalogue, case studies, blog, contact, footer, and contact details should be editable through the Sanity `siteContent` singleton.
- Product, case-study, and blog images/galleries should be editable through Sanity; project-local fallback images are used only when an entry has no published image.
- Pricing is not confirmed. Present catalogue/quote guidance instead of pretending to have final product prices.
- Product categories, case studies, and blog posts expose detail routes from their slugs.
- Starter product, case-study, and blog documents have been seeded into Sanity `production` using deterministic IDs.
- Automated browser/visual tests intentionally use fallback fixtures so editorial changes in Studio do not invalidate snapshots.
- Pagination on list pages should return the visitor to the top of the changed collection, and a browser refresh should start at the top of the page.
- Primary quote CTAs should go directly to contact/request action, with catalogue guidance linked only where it helps.

## Inputs

- Visitor language choice through the PT/EN/ES toggle.
- Optional published Sanity `Site content` singleton document.
- Optional published Sanity `Product category`, `Case study`, and `Blog post` documents.
- Optional Sanity image uploads and localized image alt text for those documents.
- Fallback multilingual content in `src/lib/site-content.ts`.

## Outputs

- Public SvelteKit routed website.
- Sanity Studio for editing multilingual page copy, contact/footer content, product categories, case studies, and blog posts.

## Pricing Or Quantities

- Public impact metrics currently used in fallback copy: 25,000+ single-use packages per tonne, 700 kg CO2 avoided per tonne, and 2.5 trees preserved per tonne.

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
- Whether fallback content should remain after Sanity is populated.

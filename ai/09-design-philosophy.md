# Design Philosophy

## Core Direction

The website should feel premium, useful, calm, and alive.

- This is premium restraint, not dead minimalism.
- "Not bloated" does not mean "no candy". The interface needs tasteful motion, crisp loading, mature hover states, confident section rhythm, and polished transitions.
- Avoid loud agency-showcase behavior. The site sells products, material, process, and trust; it is not an animation portfolio.
- Motion should feel expensive: visible, fast enough to keep flow, grounded in transformation, and never more important than product, price, material, or contact information.
- The experience should feel curated and human, not like a generic WordPress/CMS template.
- Low-friction information comes first. Design decisions should help the visitor understand what the company does, what the products solve, how pricing/quotes work, and how to contact.

## Color And Contrast

- The brand direction is now green and blue as the company/category field colors, not a mostly white site with a small green accent.
- Use green and blue as a composed system: deep blue-green anchors, mineral blue structure, recycled/environmental green for action and proof, pale mint/fog surfaces for breathing room, and very restrained yellow-bin warmth only where material-origin storytelling benefits from it.
- Do not lock the site to a single white/off-white background. Clean white is still useful for information cards, forms, and readable content, but page surfaces may use brand fog, deep blue-green, pale mint, and image-led compositions where they improve rhythm.
- Header can stay clean and practical for navigation. Footer may be more branded and expressive when it still preserves contrast and contact clarity.
- The content between header and footer needs visible section rhythm. Adjacent major sections should usually have a contrast shift through clean white, pale green/blue fog, dark blue-green, image-led material surfaces, or another intentional surface change.
- Text must have real contrast. Important copy should never feel hidden, washed out, or decorative.
- Avoid one-note palettes, generic beige luxury, startup-green eco cliches, and random badge/chip color that is not part of the brand system.
- Social and WhatsApp marks should feel like clean transparent logo marks. Avoid sticker-like chips, fake app badges, or colored blobs around the icons unless there is a strong layout reason.
- Social/WhatsApp presentation should be crisp enough to feel like intentional brand UI: prefer clean circular marks, correct logo shapes, strong contrast, and consistent sizing over ad hoc icon chips.

## Navigation

- Primary navigation must stay close to the visitor.
- Desktop uses a compact sticky header.
- Desktop and mobile navigation should keep stable route sets and mark the current route clearly instead of replacing it.
- The header logo is brand presence, not the only route home.
- Mobile uses a persistent bottom dock for high-value routes and should keep its route set stable across pages.
- The top mobile header should stay light: brand, language, and orientation. It should not become a tall wrapped menu.
- CTAs must take the visitor directly to the intended action. `Pedir orcamento` should go to contact/request, not force a catalogue detour and repeated clicks.
- Floating shortcuts such as WhatsApp can support low-friction contact, but they must not block form fields, important card text, or the mobile dock.

## Page Density

- Scrolling is a reading aid, not the default structure. Pages should aim to communicate with the least useful scrolling possible while still allowing depth where content deserves it.
- Smooth scrolling should add weight, rhythm, and premium pacing. Never hijack scroll, trap the user, or slow access to information.
- Use shorter page heroes and compact sections unless a route genuinely needs breathing room.
- Prefer grids, boards, editorial panels, comparison surfaces, and decision surfaces over stacked long sections.
- Product, catalogue, case-study, blog, and contact pages should support scanning first.
- Detail pages should get core information into the first one or two viewports on common screens.
- Long-form reading is acceptable for blog bodies, but the article shell should not add unnecessary height.

## Motion

- Use route progress, scroll progress, reveal transitions, page/category-specific route entrances, stable content loading, and subtle hover polish.
- On-load motion should feel like content arriving on the screen, not like a cheap curtain or overlay hiding the page.
- Use transformation-based motion: translate, scale, clip/mask reveals, image crop reveals, line movement, and light parallax where useful.
- Do not use blur as the default reveal language; it reads cheap here.
- Avoid image zoom hover as a default card effect. Hover should feel tactile and intentional through depth, border, line, background, or small positional changes.
- Buttons need mature micro-interactions. Avoid childish bounce, loud shine, exaggerated sweeps, or corny CTA treatment.
- Pagination, filtering, and search should feel stable. Do not replay heavy entrance animations or cause awkward jumps when moving between pages.
- Pagination should return the visitor to the top of the changed list, not leave them stranded beside the controls.
- A page refresh should start at the top of the page.
- Respect `prefers-reduced-motion`.
- Motion should never hide content for long, create layout shift, or make scanning harder.
- Priority hero content should be readable immediately on page load. Animation may polish the entrance, but it must not create an empty first viewport.

## Composition

- Avoid repeating the same title-left / text-right split section across the site.
- Avoid giving About, Products, Case Studies, and Blog the same first-section structure. List/index routes need distinct opening compositions, while CMS detail routes may stay more content-led.
- Keep titles and subtitles as close to one-line as practical, especially inside compact sections.
- Vary section composition by intent: title above cards, ledger rows, compact editorial blocks, product boards, galleries, quote panels, and direct forms.
- Avoid decorative numbering unless the numbers carry real process or proof value.
- Avoid corny stat cards unless the metrics are genuinely meaningful and integrated into the story.
- Avoid cards with background images as the default idea. Solid color, editorial layout, or actual image galleries often feel more mature.
- Remove repeated content instead of padding the page with duplicate sections.

## Route Personalities

- Home should present the company clearly and quickly. Do not add another large logo in the first section when the header already carries the brand.
- Home should not rely on low-effort quick-access blocks to products, blog, or case studies. It should explain the company, material logic, impact, and route the visitor with intent.
- About should explain origin, values, and experience direction with stronger presentation than simple stacked text. Long/tall titles should be broken into better composition, often title first and cards below.
- Products should feel like a commercial directory: practical, searchable, paginated, and visually confident. Product list cards should not include quote CTAs; detail pages can.
- Product detail pages should support multiple images, gallery behavior, and zoom/inspection patterns when content exists.
- Catalogue should feel like a buying/request surface, not a broken price table, generic brochure, or hover-heavy card grid.
- Case studies should feel project-based and evidence-led. Avoid unnecessary categories/kickers when they do not help the reader.
- Case-study detail pages should support multiple images, gallery behavior, and zoom/inspection patterns when content exists, similar to product detail pages.
- Blog should feel editorial, compact, searchable, and paginated.
- Contact should be direct, stable, and low-friction. Form controls, especially message fields, must remain visually stable when focused or resized.
- Contact should include clear contact routes, social links, complaints-book access, and consent UI where relevant without making the form feel bureaucratic.

## CMS And Content

- Products, blog posts, case studies, and their images should be manageable through Sanity when possible.
- The frontend may use fallback fixture content, but CMS-backed routes should be designed as real content surfaces, not static mockups.
- Cards should summarize and invite detail; they should not show the full content body.
- Search and pagination should be local to products, blog, and case studies rather than global.
- List-page hero titles/text, catalogue copy, contact copy, footer/contact details, and collection entries should be editable through Sanity without giving the client control over the design system.
- Main page hero images that are part of content presentation should be editable through Sanity. Decorative accent lines, reveal strokes, gradients, and layout ornaments belong to the design system unless explicitly requested as editable content.
- Social links, WhatsApp, Livro de Reclamacoes, and marketing-consent wording should be editable through Sanity as business/contact data, not hard-coded decoration.
- Studio labels should be in Portuguese and written for an editor, not for a developer.
- CMS-driven detail routes can be more content-led, but they still need strong typography, clear back navigation, gallery/zoom support where useful, and compact first-view information.

## Performance Feel

- The website should feel fast before it feels clever.
- Use loading hints for above-the-fold images and lazy loading for below-the-fold/list images.
- Keep route transitions light enough that navigation feels instant.
- Avoid layout shift from late-loading images, resized form fields, or unstable pagination controls.
- Automated tests should stay quick enough to run before deployment; slow/flaky tests become friction and stop being used.

## Copy And Claims

- Copy can sell, but it must stay anchored in confirmed facts.
- Do not invent certifications, guarantees, exact pricing, or precise impact claims.
- When pricing is not confirmed, explain what affects the quote and what information the visitor should send.
- When explaining material origin, prefer the confirmed yellow-bin stream language: packaging, Tetra Pak, and cans/metal packaging. Avoid vague recycled-plastic wording when the more specific fact is relevant.
- Subtitles should earn their place: clear, specific, and useful. Avoid internal implementation language such as Sanity, SvelteKit, CMS, or fixture references in public-facing copy.

# Editor Acceptance Scenarios

These are real, manual acceptance runs against the staff editor and the live Sanity dataset. They
complement the deterministic Playwright suite: the operator creates content through the visible UI,
publishes it, and inspects the same public route a visitor receives.

## Safety Rules

1. Create a new isolated document. Never repurpose an existing page, product, case, or article.
2. Put free-page examples below `/exemplos-editor/`.
3. Keep examples out of the main and utility navigation.
4. Mark examples as hidden from search engines.
5. Use the editor UI for every content change. Do not seed the example through scripts or direct
   Sanity mutations.
6. Publish only after the draft preview has been reviewed.
7. Inspect the standalone published route on desktop and mobile. The editor preview alone is not
   sufficient.
8. Record every defect found during the run, fix it, and repeat the failed step before declaring the
   batch complete.
9. Leave the example published only while it is useful for review. Unpublish or delete it when the
   review period ends.

## Script Used For Every Batch

1. Sign in to `/painel/site`.
2. Create the isolated document through `Páginas e conteúdo`.
3. Fill the minimum identity fields: name, route, title, and description.
4. Build the scenario entirely with the controls being evaluated.
5. Confirm autosave reaches `Guardado` without reloading or losing the current selection.
6. Review the draft in the desktop, tablet, and mobile canvas controls.
7. Publish through the editor.
8. Open the standalone public route in a separate tab.
9. Verify content, actions, media, alt text, responsive layout, footer boundary, and navigation
   isolation.
10. Run the focused regression checks for any issue exposed by the manual run.
11. Record the result below with links and unresolved deployment dependencies.

## Batch 1: Free Page Composition

**Date:** 31 July 2026  
**Document:** `Praça Circular`  
**Route:** `/exemplos-editor/praca-circular`  
**Public preview:** <https://dafab4you-website.up.railway.app/exemplos-editor/praca-circular?lang=pt>

### Purpose

Prove that a person can create and publish a coherent page from an empty free-page document without
touching existing website content.

### Content Created Through The UI

- Full-width overlay hero with image, accessible description, body copy, and contact action.
- Text-and-media section.
- Three-image gallery with a useful accessible description for every image.
- Three-number proof section.
- Closing call to action with primary and secondary links.
- Page title and search description.
- Search-engine visibility disabled.

### Acceptance Result

| Check | Result |
| --- | --- |
| New isolated page created through the visible editor | Pass |
| Existing documents left untouched | Pass |
| Autosave completed without a page reload | Pass |
| Draft preview rendered all five sections | Pass |
| Publish completed through the editor | Pass |
| Published route resolved on the Railway preview | Pass |
| Example remained absent from website navigation | Pass |
| Accessible media descriptions reached the public route | Pass |
| Desktop composition remained readable and uncropped | Pass |
| Gallery allowed thumbnail selection, zoom, previous/next navigation, and Escape | Pass after fix |
| Gallery lightbox locked background scrolling and restored it on close | Pass after fix |
| Mobile hero, gallery, CTA, and footer remained contained | Pass after fix |
| Text-and-media section stacked on mobile | Pass after fix |
| Each configured CTA rendered exactly once | Pass after fix |

### Defects Exposed

1. `BuilderSectionHeading` and the CTA branch both rendered the same action array. One configured
   button therefore appeared twice. The duplicate renderer was removed and the editor regression
   check now requires exactly one public link.
2. The mobile grid rule had lower CSS specificity than the desktop `is-left`/`is-right` variants.
   Text-and-media sections stayed in two columns and squeezed headings into a narrow strip. The
   responsive rule now targets the variants directly, with a mobile layout contract covering child
   widths.
3. One gallery item reached the public route without an accessible description. The omission was
   found by inspecting the published image attributes, corrected through the gallery editor, and
   republished. The local public route now exposes useful descriptions for all five page images.
4. The `Principal` gallery presentation was only a responsive image grid with an enlarged first
   tile. It had no selected item, thumbnails, navigation, zoom, keyboard support, or scroll-locked
   lightbox. It now uses the same interactive media gallery as product, case, blog, and Loja detail
   pages, including uploaded videos, optional captions/posters, YouTube embeds, and mobile-safe
   controls. The deliberately static `Grelha` and `Faixa` presentations remain available.

The Sanity content is already published. The renderer corrections must be included in the next
application deployment before the Railway preview reflects the final local result.

## Batch 2: Structured Blog Article

**Date:** 31 July 2026  
**Document:** `Como planear um espaço exterior com menos manutenção`  
**Route:** `/blog/como-planear-um-espaco-exterior-com-menos-manutencao`  
**Public preview:** <https://dafab4you-website.up.railway.app/blog/como-planear-um-espaco-exterior-com-menos-manutencao?lang=pt>

### Purpose

Prove that a person can compose and publish a useful article through the dedicated document editor,
including structures that cannot be represented faithfully by one plain textarea.

### Content Created Through The UI

- Article identity, topic, date, summary, and public slug.
- Introductory paragraph and three section headings.
- Three-item bullet list and three-step numbered list.
- A multi-word external link.
- Three-row comparison table with two editable columns.
- Uploaded image with accessible description and caption.
- YouTube video with an accessible title.
- Automatically generated English and Spanish versions.

### Acceptance Result

| Check | Result |
| --- | --- |
| Existing website content remained untouched | Pass |
| Full article authored in the dedicated editor | Pass |
| Headings and paragraphs retained their order | Pass |
| Bullet and numbered lists rendered correctly | Pass |
| Multi-word link survived the URL form and later block insertion | Pass after fix |
| Table retained all three rows and both columns | Pass |
| Uploaded image retained its alt text and caption | Pass after fix |
| Video rendered with a descriptive iframe title | Pass |
| Pre-publish structure guard passed | Pass |
| Portuguese article published through the editor | Pass |
| English and Spanish translations retained the rich structure | Pass |
| Public Railway route resolved | Pass |
| Desktop and mobile layouts remained contained | Pass |
| Related articles and sharing controls remained available | Pass |

### Defects Exposed

1. Opening the link URL form moved focus away from Portable Text and discarded the selected phrase.
   The toolbar now snapshots the exact editor range, applies the annotation to that range, and
   collapses the caret at the end so the next inserted block cannot replace the link. A focused E2E
   check verifies both the visible anchor and its stored `markDefs`/span marks.
2. The acceptance script waited for `Publicado`, while the actual successful state reads
   `Publicado em PT`. The check now follows the real publishing state instead of timing out after a
   successful publication.
3. Lazy structured-article images began at `width: auto` without intrinsic HTML dimensions. Their
   box collapsed to zero, so Chromium could defer the request forever. The renderer now reserves the
   full available width with the Sanity aspect ratio and `object-fit: contain`, preserving clarity
   without cropping. A stylesheet contract protects the non-zero width.

The Sanity article and its translations are published. The link-selection and image-reservation
fixes must be included in the next application deployment for the Railway preview to receive those
renderer/editor corrections.

## Planned Batches

- **Batch 3 — Product detail:** existing designed area plus movable page sections, gallery media,
  optional video/button section, and mobile composition.
- **Batch 4 — Loja product:** category, gallery, weight, price, variants, transport-dependent total,
  cart handoff, and visual editing.
- **Batch 5 — Case study:** location, gallery, concise body, optional page sections, list visibility,
  and detail-page publication.
- **Batch 6 — Global website controls:** navigation, footer, legal copy, labels, theme tokens, and
  safe rollback without altering private commerce data.

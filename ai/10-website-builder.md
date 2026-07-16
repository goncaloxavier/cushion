# Website Builder Architecture

## Objective

Build a client-facing visual website builder on top of Sanity Content Lake without weakening the
public website, exposing private business data, or allowing arbitrary code to enter content.

The builder is a standalone, staff-only application at `/painel/site`. It uses the existing
Postgres-backed staff login and talks to Sanity exclusively through protected SvelteKit server
endpoints. Sanity remains the content, asset, draft, and publishing engine; no Sanity token is
sent to the browser. Studio Structure, Presentation, and Vision remain available for the current
CMS content and developer recovery, but the visual builder itself is not duplicated inside Studio.

## Product Shape

The editing surface has four stable regions:

- A top command bar for page status, viewport, undo, redo, save state, preview, and publish.
- A left page/section tree for navigation, reordering, duplication, visibility, and insertion.
- A responsive central canvas that renders the builder document immediately.
- A right contextual inspector that initially exposes only the exact selected field, with an explicit
  route to the document's broader settings when needed.

The canvas has two modes for the same URL: `Site atual` renders the existing production route and
`Construtor` renders the builder draft through the real Svelte header/footer. This is the migration
comparison surface, not a separate mock-up.

Portuguese is the only visible authoring language. The existing translation pipeline owns English
and Spanish. Editors should never have to maintain three parallel copies by hand.

## Canvas Editing Contract

- Clicking editable content selects a semantic Sanity document id and field path, not a disposable
  screen rectangle.
- The selection outline is recalculated from the live element during canvas scroll and resize. It may
  hide while the element is off-screen, but returns attached to the same element when it is visible.
- The contextual toolbar stays inside the canvas viewport and has an obvious close action. Escape
  closes the current field before it closes larger editor surfaces.
- The first inspector view edits one field only. If a visual element cannot map to one field, the
  editor explains that clearly and offers `Abrir todas as definições`; it never silently opens a large
  document form.
- Text may be edited inline when the field is truly textual. Numbers, galleries, navigation, media,
  and structured values open purpose-built controls so their Sanity types cannot be corrupted.
- Blog bodies appear as one continuous document editor, never as a technical list of Portable Text
  blocks. The compact toolbar controls headings, emphasis, lists, links, images, videos, and tables;
  media settings open only for the selected item. Portable Text remains the stored structure.
- Loja categories are first-class documents. Their manager shows assigned-product counts and product
  names, offers contextual creation, keeps the category slug stable when the display name changes,
  and blocks deletion until every associated product has been moved.
- The page tree, canvas, and inspector own independent scroll containers. Mouse wheel, trackpad,
  touch, and keyboard scrolling stay within the active panel until that panel reaches its boundary.
- Autosave updates editor state without reloading the builder or canvas. Selection and viewport state
  remain stable after a successful save.
- Simple field and typography changes patch every matching visible element immediately. A successful
  autosave then performs a server-backed soft invalidation so structured content, media, totals, and
  other derived presentation are authoritative without a hard iframe reload or scroll reset.
- Text appearance lives with the localized Sanity value and must survive the public `site-content`
  adapter. Published routes apply the same font family, responsive size, weight, style, alignment,
  line height, and color that the editor previews.
- Structured article paths never enter plain-text inline editing. They open the article editor, and
  the server rejects malformed article payloads before they can replace Portable Text arrays.

## Source Of Truth

- Sanity `production`: public website content, builder pages, media, navigation, theme, drafts.
- Postgres: customers, staff, sessions, CRM, addresses, orders, payment attempts, private notes.
- Browser storage: pre-checkout cart and delivery postal-code state only.

The builder must never query or mutate Postgres customer/order data.

## Versioned Content Contract

`builderPage` is the page document. Every page has:

- a stable Sanity document id;
- `builderVersion` for migrations;
- a unique route;
- page status and page kind;
- SEO metadata;
- an ordered array of typed sections.

`builderSiteSettings` is the global singleton. It owns:

- brand assets;
- primary and utility navigation;
- account/cart/contact labels;
- footer columns and legal links;
- typography, color, radius, spacing, and motion tokens;
- the public renderer switch.

Sections are discriminated Sanity objects. Initial supported blocks are hero, rich text, media,
gallery, cards, statistics, collection, partners, call-to-action, and contact form.

## Power With Guardrails

The client may control page structure, section order, visibility, widths, columns, gaps, spacing,
surfaces, responsive behavior, font family, responsive font sizes, weight, alignment, media fit,
uploaded images/videos, links, buttons, navigation, footer, SEO, and theme tokens.

The builder does not permit raw HTML, JavaScript, arbitrary CSS, arbitrary iframe markup, or
unvalidated color/URL values. These boundaries prevent XSS, inaccessible pages, broken mobile
layouts, and content that cannot be migrated later.

## Draft And Publish Rules

- Builder edits always write to `drafts.*` first.
- Autosave is debounced and shows explicit saving/saved/error state.
- Local undo/redo is available before and after autosave.
- Publishing validates required page data before replacing the published document.
- A published document is never silently deleted or overwritten by an import.
- Concurrent remote edits must surface as a conflict instead of being silently discarded.
- Media uploads pass through a protected same-origin server endpoint; write tokens never enter the
  browser bundle.
- Builder mutations require the staff session, same-origin validation, and the backoffice CSRF token.
- Draft preview uses a signed, short-lived, httpOnly cookie and only activates inside a same-origin
  iframe carrying the builder query flag.
- Preview typography strips Sanity's invisible source metadata before resolving font tokens. Publish
  clears the server's public content cache so a standalone local page reads the new published value
  immediately instead of waiting for the normal cache window.

## Public Renderer Rollout

The existing Svelte routes remain the production renderer while builder work is developed.

1. Keep every existing Svelte route as the public renderer.
2. Recreate one route at a time as a builder page without changing its public design.
3. Compare `Site atual` and `Construtor` for that exact route on desktop, tablet, and mobile.
4. Validate content parity, accessibility, SEO, media behavior, and responsive layout.
5. Repeat until all public routes have migrated; drafts and published builder documents may coexist
   throughout this phase without changing the public website.
6. Enable `builderSiteSettings.rendererMode = "builder"` only after complete migration validation.
7. Keep a reversible `legacy` mode through a stable production cycle, then retire the old page
   implementations deliberately.

No builder schema deployment by itself changes the live website.

## Validation Baseline

- Routes must begin with `/`, contain no query string, and remain unique.
- Section anchors must be valid and unique within a page.
- Heading order is derived from section context and cannot skip levels arbitrarily.
- Images require useful alt text unless explicitly decorative.
- Autoplay video must be muted; controls remain available for meaningful video.
- External links are validated and receive safe `rel` behavior.
- Responsive typography and spacing stay inside bounded ranges.
- Hidden sections remain editable but do not render publicly.
- Deleting a section requires confirmation and remains undoable before publish.
- Publish is blocked when page-level errors remain.

## Testing And Release

- Contract tests cover schema registration, safe field types, translation compatibility, singleton
  ids, protected server boundaries, and renderer-version behavior.
- The application build validates the standalone React editor and Svelte renderer; the Studio build
  validates the shared builder schemas.
- `tests/site-editor.spec.ts` covers focused editing, autosave without iframe reload, selection
  persistence across scroll, panel-wheel ownership, closing behavior, typed numeric fields, gallery
  upload/removal, navigation changes, responsive containment, and CSRF rejection on desktop/mobile.
- Typography tests cover desktop and mobile overrides, publish the edited fixture, then leave the
  editor and assert the saved text and appearance on a standalone page. Structured-article tests
  assert the persisted Portable Text shape and the soft preview refresh.
- Its fixture is request-scoped and guarded by non-production mode, an explicit environment switch,
  and a matching request key. It cannot read or mutate the live Sanity dataset.
- Public renderer tests cover routes and responsive behavior without depending on mutable live Sanity
  content.
- Existing route, commerce, account, CRM, and security tests must remain green.
- Builder releases are additive until the migration switch is deliberately enabled.

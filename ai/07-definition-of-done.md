# Definition of done

Use this as the task completion contract.

## Always

- The change matches the current project shape.
- No client/product business rules are invented.
- Sanity project id and dataset changes are avoided unless explicitly confirmed.
- Public copy stays consistent across Portuguese, English, and Spanish when the same claim appears in all languages.
- Material-origin copy stays specific to the yellow-bin waste stream when that fact matters: packaging, Tetra Pak, and cans/metal packaging rather than vague unsupported wording.
- Sanity-backed page copy, product/category, case-study, blog, and image/gallery changes include the matching frontend load/query/schema updates.
- Contact/social/legal field changes include matching Sanity schema, GROQ query, fallback normalization, public layout, contact route, and tests where relevant.
- Contact-form backend changes preserve server-only Postgres CRM writes, CSRF/origin/honeypot validation, fixed backend field names, private-data boundaries, and tests where relevant.
- Backoffice (`/painel`) changes stay visually plain and dense (no brand palette, no animation/transition), preserve the `locals.staff`/`canManageStaff` guard pattern, and preserve the staff self-lockout guards (can't demote/deactivate yourself or drop the last active admin).
- Ecommerce/backend changes preserve Postgres as the private source of truth, server-side price recomputation, order snapshots, account/staff auth separation, CSRF/origin checks, httpOnly session cookies, hashed tokens, fresh checkout submission tokens, bounded abuse controls, and fail-closed payment behavior.
- Checkout never uses fallback catalogue prices outside automated tests; trusted-content failures are recorded as operational incidents and shown in `/painel/incidentes`.
- Private-data changes preserve the documented privacy-request/export/erasure flow and scheduled retention policy.
- Ecommerce/backend changes preserve stable Sanity variant keys in new browser carts, delivery-zone validation for saved addresses, Postgres address identity/upsert behavior, and a friendly duplicate-address response instead of a database error.
- Security-sensitive web changes preserve the nonce-backed CSP and do not add third-party browser origins without an explicit policy review.
- Page media/video and partner/logo changes include matching Sanity schema, GROQ query, fallback normalization, public renderer, local fallback assets, and tests where relevant.
- Uploaded public videos expose an optional WebVTT caption file from Studio/custom editor through GROQ and the rendered `<track>`.
- Visual Editing/Presentation changes preserve server-only preview tokens, preview-secret validation, draft/stega clients, protocol-aware preview cookies, and contract tests where relevant.
- Visual website editor changes preserve Postgres staff auth, server-only Sanity tokens, same-origin/CSRF mutation checks, signed short-lived iframe preview sessions, revision conflict handling, bounded named design controls, semantic field selection, focused editing, independent panel scrolling, immediate free-page preview state, optimistic text feedback followed by deterministic saved-draft reconciliation for normal CMS pages, real media-transfer progress, video cover images, and accessible in-app confirmations. Any automated auth/content bypass remains impossible in production.
- Studio fields and structure stay client-friendly in Portuguese unless a technical/internal field is intentionally hidden.
- Visual changes follow `ai/09-design-philosophy.md`: compact pages, accessible navigation, smooth restrained motion, and no unnecessary long scrolling.
- Internal route links preserve the selected language when practical.
- Primary navigation keeps a stable route set on each viewport. Desktop marks the current route from the full route set; mobile uses the full-screen overlay menu and marks the current route there.
- Pagination returns users to the top of the collection, and page refresh starts at the top of the page.
- Fallback fixture content, Sanity seed output, and tests stay aligned when starter CMS content changes.
- Performance-sensitive images keep appropriate loading/decoding/fetch-priority hints, and motion respects `prefers-reduced-motion`.
- Floating shortcuts such as WhatsApp do not obscure important content, form fields, or mobile navigation.
- Relevant `/ai` files are updated when architecture, commands, validation, or business rules change.
- No unrelated files are changed.
- Generated artifacts are cleaned up or ignored; screenshot snapshot folders are not committed.

## Validation

- Docs-only changes: review changed markdown for accuracy and consistency.
- SvelteKit changes: run `npm run check`, `npm run lint`, and `npm run build`.
- Sanity config or schema changes: run `npm run check`, `npm run lint`, and `npm run build:studio` when practical.
- Visual Editing/Presentation changes: run `npm run check`, `npm run lint`, `npm run build`, and `npm run build:studio` when practical; manually verify Studio preview in an environment with `SANITY_VIEWER_TOKEN`.
- Visual website editor changes: run `npm run check`, `npm run lint`, `npm run build`, `npm run build:studio`, and `npm run e2e`; manually verify login, live Sanity state load/save/publish, text and structural preview updates, image/video/cover upload states, custom confirmations, desktop/tablet/mobile sizing, and that a copied preview URL cannot expose drafts in a normal tab.
- CRM/form/backoffice backend changes: run `npm run check`, `npm run lint`, `npm run build`, and `npm run e2e` when practical; manually validate live delivery in an environment with `DATABASE_URL`.
- Ecommerce/order/account backend changes: run `npm run check`, `npm run lint`, `npm run build`, and `npm run e2e` when practical; run `npm run db:migrate` only against the intended Postgres database; manually validate checkout/order email/staff review in an environment with `DATABASE_URL` and email settings.
- Dependency changes: run relevant validation and inspect `package-lock.json` intentionally.
- Test/performance config changes: run `npm run e2e` and confirm the suite does not crash on generated artifacts.
- Visual/interface changes: manually review relevant routes on desktop and mobile, preferably with screenshots.
- Route/CMS/interface changes: run `npm run e2e` when practical.
- Intentional visual changes: when practical, run `npm run e2e:visual:update`, review the generated local snapshots, then run `npm run e2e:visual`. Do not commit the generated PNG snapshot folders.
- If Xavier explicitly asks to skip Playwright E2E/visual runs, use lighter validation and targeted browser screenshots, then state which Playwright checks were skipped.

## Testing

- Add or update tests when behavior is added and a test tool exists.
- Manual Studio review is expected for content model/editor experience changes, especially add/edit/image upload/unpublish/delete loops.
- Manual Studio review is expected for Visual Editing changes, especially preview enable/disable, draft rendering, and click-to-edit overlays.
- Manual `/painel/site` review is expected for builder changes against real Sanity, especially exact-field selection, overlay attachment during canvas scrolling, independent side-panel scrolling, reload-free autosave/publishing/conflicts, clear save and publish feedback, media upload, navigation editing, responsive preview, publishing permissions, and route-by-route legacy comparison during migration. Deterministic E2E coverage does not validate live token permissions.
- Manual `/painel` review is expected for CRM/backoffice workflow changes, especially new request triage, status changes, internal notes, client profile updates, and staff-account management.
- Manual staging review is expected for ecommerce workflow changes, especially guest checkout, logged-in checkout, saved details, order history, staff order review, and disabled/future payment behavior.
- Automated tests should be updated when public routes, fallback CMS items, or visual surfaces change.
- Do not make visual regression tests depend on mutable live Studio content.
- Manual browser review is expected for future visual or interaction-heavy SvelteKit changes.
- Screenshots/snapshots are local review artifacts and should not be committed.

## Handoff

- Summary is short and concrete.
- Validation results are listed.
- Checks not run are named with the reason.
- Remaining risk is named honestly.
- Follow-ups are specific and tied to the current project.

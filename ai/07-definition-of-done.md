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
- Studio fields and structure stay client-friendly in Portuguese unless a technical/internal field is intentionally hidden.
- Visual changes follow `ai/09-design-philosophy.md`: compact pages, accessible navigation, smooth restrained motion, and no unnecessary long scrolling.
- Internal route links preserve the selected language when practical.
- Primary navigation keeps a stable route set on each viewport. Desktop marks the current route from the full route set; mobile marks the current route when it is part of the high-value bottom dock.
- Pagination returns users to the top of the collection, and page refresh starts at the top of the page.
- Fallback fixture content, Sanity seed output, and tests stay aligned when starter CMS content changes.
- Performance-sensitive images keep appropriate loading/decoding/fetch-priority hints, and motion respects `prefers-reduced-motion`.
- Floating shortcuts such as WhatsApp do not obscure important content, form fields, or mobile navigation.
- Relevant `/ai` files are updated when architecture, commands, validation, or business rules change.
- No unrelated files are changed.
- Generated artifacts are cleaned up or intentionally committed.

## Validation

- Docs-only changes: review changed markdown for accuracy and consistency.
- SvelteKit changes: run `npm run check`, `npm run lint`, and `npm run build`.
- Sanity config or schema changes: run `npm run check`, `npm run lint`, and `npm run build:studio` when practical.
- Dependency changes: run relevant validation and inspect `package-lock.json` intentionally.
- Test/performance config changes: run `npm run e2e` and confirm the suite does not crash on generated artifacts.
- Visual/interface changes: manually review relevant routes on desktop and mobile, preferably with screenshots.
- Route/CMS/interface changes: run `npm run e2e` when practical.
- Intentional visual changes: run `npm run e2e:visual:update`, review the snapshot changes, then run `npm run e2e:visual` when practical.
- If Xavier explicitly asks to skip Playwright E2E/visual runs, use lighter validation and targeted browser screenshots, then state which Playwright checks were skipped.

## Testing

- Add or update tests when behavior is added and a test tool exists.
- Manual Studio review is expected for content model/editor experience changes, especially add/edit/image upload/unpublish/delete loops.
- Automated tests should be updated when public routes, fallback CMS items, or visual surfaces change.
- Do not make visual regression tests depend on mutable live Studio content.
- Manual browser review is expected for future visual or interaction-heavy SvelteKit changes.
- Screenshots/snapshots should change only when intentionally updated.

## Handoff

- Summary is short and concrete.
- Validation results are listed.
- Checks not run are named with the reason.
- Remaining risk is named honestly.
- Follow-ups are specific and tied to the current project.

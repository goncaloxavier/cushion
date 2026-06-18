# Agent task template

Paste this into an AI agent when starting a project task.

```text
Read the /ai context files first, in order.
If available, also read:
/Users/goncaloxavier/Documents/ai-context-templates/00-xavier-working-style.md

Task:
[describe the concrete task]

Constraints:
- Follow existing project patterns
- Do not invent business rules, content models, routes, or client claims
- Keep PT/EN/ES content aligned when editing public copy
- Keep material-origin claims specific to the confirmed yellow-bin stream when relevant: packaging, Tetra Pak, and cans/metal packaging
- Preserve the routed website shape and the selected language query parameter
- Keep Sanity schemas, GROQ queries, page-copy fields, image/gallery fields, and fallback content aligned
- Keep contact/social/legal fields aligned across Sanity schema, GROQ, fallback normalization, layout, contact page, and tests
- Keep Studio editing labels and structure friendly for a Portuguese client
- Follow `ai/09-design-philosophy.md`: compact premium utility, persistent navigation, smooth restrained motion, and scrolling as a tool
- Preserve stable navigation behavior: desktop uses the full route set, mobile uses a stable high-value bottom dock, and links must not swap based on current route
- Preserve pagination scroll-to-collection and refresh scroll-to-top behavior
- Keep performance in mind: no scroll hijacking, respect reduced motion, avoid layout shift, and use image loading hints intentionally
- Keep floating WhatsApp/social shortcuts useful without covering important content, forms, or mobile navigation
- Update Playwright route and visual coverage when adding public routes or fallback CMS items
- Keep the Sanity seed generator aligned with fallback content when starter CMS documents change
- Keep the change scoped
- Add/update tests where useful and where test tooling exists
- Run the validation commands from /ai/04-validation-map.md and /ai/06-commands.md when relevant
- Generate visual snapshots only for local/session review, and do not commit generated PNG baselines
- Respect explicit requests to skip Playwright; use lighter checks and targeted browser screenshots instead, and report skipped E2E/visual checks
- Remember Playwright uses fallback fixtures; local/dev website reads live Sanity content
- Remember viewport-independent Playwright checks should not be duplicated across mobile and desktop without a reason
- Do not stage generated folders or historical `node_modules/` noise
- Report what changed, what passed, and what was not run

Relevant files:
- [paths]

Definition of done:
- [project-specific done criteria]
```

## Failure Loop

When a check fails:

1. Read the exact failure.
2. Identify the smallest likely cause.
3. Fix the code, config, docs, or test.
4. Re-run the failed check.
5. Repeat until the gate passes or the blocker is real.

Do not restart from zero after every failure.

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
- Preserve the routed website shape and the selected language query parameter
- Keep Sanity schemas, GROQ queries, image fields, and fallback content aligned
- Follow `ai/09-design-philosophy.md`: compact premium utility, persistent navigation, smooth restrained motion, and scrolling as a tool
- Update Playwright route and visual coverage when adding public routes or fallback CMS items
- Keep the Sanity seed generator aligned with fallback content when starter CMS documents change
- Keep the change scoped
- Add/update tests where useful and where test tooling exists
- Run the validation commands from /ai/04-validation-map.md and /ai/06-commands.md when relevant
- Refresh visual snapshots only when the visual change is intentional
- Remember Playwright uses fallback fixtures; local/dev website reads live Sanity content
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

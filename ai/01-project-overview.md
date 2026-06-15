# Project overview

## What This Is

- Product: presentational website preparation for DaFábrica4You.
- Audience: public visitors interested in recycled-plastic products for outdoor, municipal, garden, and custom projects; client/editor users can manage product categories, case studies, and blog posts through Sanity.
- Primary user workflow: visitor explores the routed multilingual website, reviews products, catalogue/quote guidance, cases, and blog content, then contacts the company by email or phone.
- Deployment target: not confirmed for the public website. Sanity Studio deployment is available through Sanity CLI.
- Current maturity: early client preparation. A routed SvelteKit website, product/case/blog detail pages, Sanity Studio with a client-friendly structure, seeded Sanity collection content, CMS-ready image fields, multilingual fallback content, E2E tests, and visual regression baselines are present.

## Source Of Truth

- Main instruction file: this `/ai` folder plus current user instructions.
- Product docs: `README.md` and `docs/sanity-starter.md`.
- Design docs: none present in the repository yet.
- Design docs: `ai/09-design-philosophy.md`.
- API docs: Sanity project configuration in `sanity.config.ts`, `sanity.cli.ts`, and `src/lib/sanity.ts`.
- External references: `/Users/goncaloxavier/Documents/ai-context-templates` for reusable AI context templates.

## Non-Goals

- Do not invent additional client business rules, certifications, guarantees, or impact claims.
- Do not treat the project as production-mature until deployment, final copy, client review, and content ownership are confirmed.
- Do not build unrelated generic website sections just to fill space.

## Current Priorities

1. Keep the SvelteKit presentation site polished, responsive, smooth, and premium without adding friction.
2. Make Sanity understandable and useful for multilingual product, case-study, blog, and image editing.
3. Keep route, language, CMS, and visual regression tests current as pages evolve.
4. Keep pages compact and navigable; use scrolling deliberately rather than as the default page strategy.
5. Confirm final client copy, imagery, pricing/catalogue rules, and deployment target.

## Open Questions

- What is the final approved copy and brand direction for DaFábrica4You?
- Should product/category detail pages later receive image galleries, technical specs, and downloadable sheets?
- Should Sanity images eventually become required once the client has real approved photography?
- What is the final pricing/catalogue strategy once the client confirms real prices?
- Which deployment platform will host the SvelteKit website?
- Where will the public website and Sanity Studio be deployed?

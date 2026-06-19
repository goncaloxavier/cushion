# Project overview

## What This Is

- Product: presentational website preparation for DaFábrica4You.
- Audience: public visitors interested in recycled-plastic products for outdoor, municipal, garden, and custom projects; client/editor users can manage product categories, case studies, and blog posts through Sanity.
- Primary user workflow: visitor explores the routed multilingual website, reviews products, catalogue/quote guidance, cases, and blog content, then contacts the company by email, phone, WhatsApp, or the contact form.
- Deployment target: Railway is being used for the basic public website preview. Sanity Studio is a separate editable application that can run locally or be deployed through Sanity CLI.
- Current maturity: client-approved base direction. A routed SvelteKit website, product/case/blog detail pages, Sanity Studio 6 with a Portuguese client-friendly structure, editable page copy, seeded Sanity collection content, CMS-ready image/gallery fields, editable homepage video/media and partner sections, editable contact/social/legal fields, contact form gating, multilingual fallback content, E2E tests, and session-only visual review tooling are present.

## Source Of Truth

- Main instruction file: this `/ai` folder plus current user instructions.
- Product docs: `README.md` and `docs/sanity-starter.md`.
- Design docs: `ai/09-design-philosophy.md`.
- API docs: Sanity project configuration in `sanity.config.ts`, `sanity.cli.ts`, and `src/lib/sanity.ts`.
- External references: `/Users/goncaloxavier/Documents/ai-context-templates` for reusable AI context templates.

## Non-Goals

- Do not invent additional client business rules, certifications, guarantees, or impact claims.
- Do not treat the project as production-mature until deployment, final copy, client review, and content ownership are confirmed.
- Do not build unrelated generic website sections just to fill space.

## Current Priorities

1. Keep the SvelteKit presentation site polished, responsive, smooth, and premium without adding friction.
2. Make Sanity understandable in Portuguese and useful for editing page copy, products, case studies, blog posts, catalogue/contact content, and imagery.
3. Keep route, language, CMS, performance, and visual review coverage current as pages evolve, without committing generated screenshot baselines.
4. Keep pages compact and navigable; use smooth scrolling deliberately as a reading aid rather than as the default page strategy.
5. Keep Railway preview deployment boring and reliable so the client can test the website without setup friction.
6. Confirm final client copy, imagery, pricing/catalogue rules, production domains, and Studio hosting/access process.

## Open Questions

- What is the final approved copy and brand direction for DaFábrica4You?
- Should product/category detail pages later receive technical specs and downloadable sheets?
- Should Sanity images eventually become required once the client has real approved photography?
- What is the final pricing/catalogue strategy once the client confirms real prices?
- Which production domains will point at the Railway website and deployed Studio?
- What is the best automated import strategy for existing DaFabrica4You blog posts, case studies, products, and images?

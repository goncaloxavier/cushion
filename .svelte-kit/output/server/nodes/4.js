import * as server from '../entries/pages/blog/_slug_/_page.server.ts.js';

export const index = 4;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/blog/_slug_/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/blog/[slug]/+page.server.ts";
export const imports = ["_app/immutable/nodes/4.c2N_u5ib.js","_app/immutable/chunks/DsnmJJEf.js","_app/immutable/chunks/B0qMDbxJ.js","_app/immutable/chunks/DPTcej_g.js","_app/immutable/chunks/DOYjqqOw.js"];
export const stylesheets = [];
export const fonts = [];

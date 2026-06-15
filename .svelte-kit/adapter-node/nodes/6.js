import * as server from '../entries/pages/casos-de-estudo/_slug_/_page.server.ts.js';

export const index = 6;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/casos-de-estudo/_slug_/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/casos-de-estudo/[slug]/+page.server.ts";
export const imports = ["_app/immutable/nodes/6.BY5FWOT1.js","_app/immutable/chunks/DsnmJJEf.js","_app/immutable/chunks/B0qMDbxJ.js","_app/immutable/chunks/oTvUSImd.js","_app/immutable/chunks/BDUFQZCt.js","_app/immutable/chunks/CcncJde4.js","_app/immutable/chunks/DPTcej_g.js","_app/immutable/chunks/DOYjqqOw.js"];
export const stylesheets = [];
export const fonts = [];

import * as server from '../entries/pages/produtos/_slug_/_page.server.ts.js';

export const index = 10;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/produtos/_slug_/_page.svelte.js')).default;
export { server };
export const server_id = "src/routes/produtos/[slug]/+page.server.ts";
export const imports = ["_app/immutable/nodes/10.B3dx2YUN.js","_app/immutable/chunks/DsnmJJEf.js","_app/immutable/chunks/B0qMDbxJ.js","_app/immutable/chunks/oTvUSImd.js","_app/immutable/chunks/BDUFQZCt.js","_app/immutable/chunks/CcncJde4.js","_app/immutable/chunks/DPTcej_g.js","_app/immutable/chunks/DOYjqqOw.js"];
export const stylesheets = [];
export const fonts = [];

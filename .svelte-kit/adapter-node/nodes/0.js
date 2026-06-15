import * as server from '../entries/pages/_layout.server.ts.js';

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export { server };
export const server_id = "src/routes/+layout.server.ts";
export const imports = ["_app/immutable/nodes/0.o2vM5luq.js","_app/immutable/chunks/DsnmJJEf.js","_app/immutable/chunks/B0qMDbxJ.js","_app/immutable/chunks/CQmJb-U-.js","_app/immutable/chunks/BDUFQZCt.js","_app/immutable/chunks/CcncJde4.js","_app/immutable/chunks/DPTcej_g.js","_app/immutable/chunks/nMsXWAX_.js","_app/immutable/chunks/DdtrTdbr.js"];
export const stylesheets = ["_app/immutable/assets/0.DjX57yj7.css"];
export const fonts = [];

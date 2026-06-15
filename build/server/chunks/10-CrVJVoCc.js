import { e as error } from './index-CoD1IJuy.js';

const load = async ({ params, parent }) => {
  const { site, language } = await parent();
  const content = site[language];
  const product = content.products.find((item) => item.slug === params.slug);
  if (!product) {
    error(404, "Product not found");
  }
  return {
    product,
    language
  };
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 10;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-H4b8PvF-.js')).default;
const server_id = "src/routes/produtos/[slug]/+page.server.ts";
const imports = ["_app/immutable/nodes/10.B3dx2YUN.js","_app/immutable/chunks/DsnmJJEf.js","_app/immutable/chunks/B0qMDbxJ.js","_app/immutable/chunks/oTvUSImd.js","_app/immutable/chunks/BDUFQZCt.js","_app/immutable/chunks/CcncJde4.js","_app/immutable/chunks/DPTcej_g.js","_app/immutable/chunks/DOYjqqOw.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=10-CrVJVoCc.js.map

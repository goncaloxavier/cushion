import { e as error } from './index-CoD1IJuy.js';

const load = async ({ params, parent }) => {
  const { site, language } = await parent();
  const content = site[language];
  const caseStudy = content.caseStudies.find((item) => item.slug === params.slug);
  if (!caseStudy) {
    error(404, "Case study not found");
  }
  return {
    caseStudy,
    language
  };
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 6;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-DdE2n5vc.js')).default;
const server_id = "src/routes/casos-de-estudo/[slug]/+page.server.ts";
const imports = ["_app/immutable/nodes/6.BY5FWOT1.js","_app/immutable/chunks/DsnmJJEf.js","_app/immutable/chunks/B0qMDbxJ.js","_app/immutable/chunks/oTvUSImd.js","_app/immutable/chunks/BDUFQZCt.js","_app/immutable/chunks/CcncJde4.js","_app/immutable/chunks/DPTcej_g.js","_app/immutable/chunks/DOYjqqOw.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=6-DJbspXIV.js.map

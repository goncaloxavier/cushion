import { e as error } from './index-CoD1IJuy.js';

const load = async ({ params, parent }) => {
  const { site, language } = await parent();
  const content = site[language];
  const post = content.blogPosts.find((item) => item.slug === params.slug);
  if (!post) {
    error(404, "Post not found");
  }
  return {
    post,
    language
  };
};

var _page_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 4;
let component_cache;
const component = async () => component_cache ??= (await import('./_page.svelte-CLzu1CrG.js')).default;
const server_id = "src/routes/blog/[slug]/+page.server.ts";
const imports = ["_app/immutable/nodes/4.c2N_u5ib.js","_app/immutable/chunks/DsnmJJEf.js","_app/immutable/chunks/B0qMDbxJ.js","_app/immutable/chunks/DPTcej_g.js","_app/immutable/chunks/DOYjqqOw.js"];
const stylesheets = [];
const fonts = [];

export { component, fonts, imports, index, _page_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=4-BP7YtLpg.js.map

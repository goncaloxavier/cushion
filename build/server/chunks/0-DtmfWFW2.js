import { g as getLanguage, l as languages, c as contentFromSanity } from './site-content-DXdOWpkG.js';
import { createClient } from '@sanity/client';

const projectId = "u4uyfix8";
const dataset = "production";
const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion: "2026-06-10",
  useCdn: false
});
const collectionsQuery = `{
  "products": *[_type == "productCategory" && defined(slug.current)] | order(orderRank asc, title.pt asc) {
    title,
    slug,
    image {
      asset -> {
        url
      },
      alt
    },
    gallery[] {
      asset -> {
        url
      },
      alt
    },
    summary,
    description,
    features,
    applications
  },
  "caseStudies": *[_type == "caseStudy" && defined(slug.current)] | order(orderRank asc, title.pt asc) {
    title,
    slug,
    image {
      asset -> {
        url
      },
      alt
    },
    gallery[] {
      asset -> {
        url
      },
      alt
    },
    location,
    summary,
    challenge,
    solution,
    result,
    productArea
  },
  "blogPosts": *[_type == "blogPost" && defined(slug.current)] | order(publishedAt desc) {
    title,
    slug,
    image {
      asset -> {
        url
      },
      alt
    },
    excerpt,
    publishedAt,
    category,
    body
  }
}`;
const getSanityCollections = async () => {
  if (process.env.SANITY_DISABLE_REMOTE === "true") return null;
  try {
    return await sanityClient.fetch(collectionsQuery);
  } catch {
    return null;
  }
};
const load = async ({ url }) => {
  const collections = await getSanityCollections();
  const language = getLanguage(url.searchParams.get("lang"));
  return {
    site: contentFromSanity(collections),
    language,
    languages,
    currentPath: url.pathname,
    isUsingSanityContent: Boolean(
      collections?.products?.length || collections?.caseStudies?.length || collections?.blogPosts?.length
    )
  };
};

var _layout_server_ts = /*#__PURE__*/Object.freeze({
  __proto__: null,
  load: load
});

const index = 0;
let component_cache;
const component = async () => component_cache ??= (await import('./_layout.svelte-B5DA7NOl.js')).default;
const server_id = "src/routes/+layout.server.ts";
const imports = ["_app/immutable/nodes/0.o2vM5luq.js","_app/immutable/chunks/DsnmJJEf.js","_app/immutable/chunks/B0qMDbxJ.js","_app/immutable/chunks/CQmJb-U-.js","_app/immutable/chunks/BDUFQZCt.js","_app/immutable/chunks/CcncJde4.js","_app/immutable/chunks/DPTcej_g.js","_app/immutable/chunks/nMsXWAX_.js","_app/immutable/chunks/DdtrTdbr.js"];
const stylesheets = ["_app/immutable/assets/0.DjX57yj7.css"];
const fonts = [];

export { component, fonts, imports, index, _layout_server_ts as server, server_id, stylesheets };
//# sourceMappingURL=0-DtmfWFW2.js.map

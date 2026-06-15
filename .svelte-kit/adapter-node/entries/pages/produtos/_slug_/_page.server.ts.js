import { error } from "@sveltejs/kit";
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
export {
  load
};

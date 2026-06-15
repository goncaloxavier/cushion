import { error } from "@sveltejs/kit";
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
export {
  load
};

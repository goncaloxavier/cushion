import { error } from "@sveltejs/kit";
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
export {
  load
};

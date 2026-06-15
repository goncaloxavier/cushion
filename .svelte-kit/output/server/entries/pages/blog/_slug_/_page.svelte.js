import { N as head, O as attr, G as derived } from "../../../../chunks/index2.js";
import { i as imageFor, b as blogImageFallback } from "../../../../chunks/site-content.js";
import { e as escape_html } from "../../../../chunks/context.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    const image = derived(() => imageFor(data.post, blogImageFallback));
    head("1teoznn", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>${escape_html(data.post.title)} | DaFábrica4You</title>`);
      });
    });
    $$renderer2.push(`<main><article class="detail-page blog-detail"><header class="blog-detail-header"><div><h1>${escape_html(data.post.title)}</h1> <time${attr("datetime", data.post.publishedAt)}>${escape_html(data.post.publishedAt)}</time></div> <p class="article-lead">${escape_html(data.post.excerpt)}</p></header> <div class="blog-detail-media"><img${attr("src", image().url)}${attr("alt", image().alt)} decoding="async" fetchpriority="high"/></div> <div class="article-body blog-body"><p>${escape_html(data.post.body)}</p></div></article></main>`);
  });
}
export {
  _page as default
};

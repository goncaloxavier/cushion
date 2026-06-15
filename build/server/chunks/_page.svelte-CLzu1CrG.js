import { a7 as head, a8 as attr, a1 as derived } from './index2-3ubY_0I4.js';
import { i as imageFor, b as blogImageFallback } from './site-content-DXdOWpkG.js';
import { k as escape_html } from './context-wcOFFW0f.js';

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

export { _page as default };
//# sourceMappingURL=_page.svelte-CLzu1CrG.js.map

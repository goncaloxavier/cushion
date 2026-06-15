import { a7 as head, a9 as ensure_array_like, a8 as attr, a1 as derived } from './index2-3ubY_0I4.js';
import { R as Reveal } from './Reveal-yIq7l06z.js';
import { i as imageFor, b as blogImageFallback } from './site-content-DXdOWpkG.js';
import { k as escape_html } from './context-wcOFFW0f.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    const content = derived(() => data.site[data.language]);
    const langQuery = derived(() => `?lang=${data.language}`);
    const latestPost = derived(() => content().blogPosts[0]);
    let query = "";
    let page = 1;
    const pageSize = 2;
    const normalizedQuery = derived(() => query.trim().toLowerCase());
    const filteredPosts = derived(() => content().blogPosts.filter((post) => [post.title, post.excerpt, post.category, post.body].join(" ").toLowerCase().includes(normalizedQuery())));
    const totalPages = derived(() => Math.max(1, Math.ceil(filteredPosts().length / pageSize)));
    const visiblePosts = derived(() => filteredPosts().slice((page - 1) * pageSize, page * pageSize));
    head("u4k2t", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>${escape_html(content().nav.blog)} | DaFábrica4You</title>`);
      });
    });
    $$renderer2.push(`<main class="blog-page"><section class="blog-index-hero">`);
    Reveal($$renderer2, {
      class: "blog-index-copy",
      variant: "hero",
      priority: true,
      children: ($$renderer3) => {
        $$renderer3.push(`<p class="kicker">${escape_html(content().blogPage.hero.kicker)}</p> <h1>${escape_html(content().blogPage.hero.title)}</h1> <p>${escape_html(content().blogPage.hero.lead)}</p>`);
      }
    });
    $$renderer2.push(`<!----> `);
    if (latestPost()) {
      $$renderer2.push("<!--[0-->");
      Reveal($$renderer2, {
        class: "blog-index-current",
        delay: 120,
        variant: "panel",
        priority: true,
        children: ($$renderer3) => {
          $$renderer3.push(`<span>${escape_html(latestPost().category)}</span> <h2>${escape_html(latestPost().title)}</h2> <p>${escape_html(latestPost().excerpt)}</p>`);
        }
      });
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></section> <section class="section collection-section blog-collection-section">`);
    Reveal($$renderer2, {
      variant: "panel",
      children: ($$renderer3) => {
        $$renderer3.push(`<div class="collection-tools"><label class="search-field"><input${attr("value", query)} type="search"${attr("aria-label", content().common.searchPosts)}${attr("placeholder", content().nav.blog)}/></label> <p>${escape_html(filteredPosts().length)} / ${escape_html(content().blogPosts.length)}</p></div>`);
      }
    });
    $$renderer2.push(`<!----> <div class="journal-board"><!--[-->`);
    const each_array = ensure_array_like(visiblePosts());
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let post = each_array[$$index];
      const image = imageFor(post, blogImageFallback);
      $$renderer2.push(`<a class="journal-card"${attr("href", `/blog/${post.slug}${langQuery()}`)}><div class="journal-card-media"><img${attr("src", image.url)}${attr("alt", image.alt)} loading="lazy" decoding="async"/></div> <div class="journal-card-copy"><span>${escape_html(post.category)}</span> <time${attr("datetime", post.publishedAt)}>${escape_html(post.publishedAt)}</time> <h2>${escape_html(post.title)}</h2> <p>${escape_html(post.excerpt)}</p></div></a>`);
    }
    $$renderer2.push(`<!--]--></div> `);
    if (!visiblePosts().length) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<p class="empty-state collection-empty">${escape_html(content().common.noResults)}</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <nav class="pagination collection-pagination"${attr("aria-label", content().common.pageLabel)}><button type="button"${attr("disabled", page === 1, true)}>${escape_html(content().common.previous)}</button> <span>${escape_html(content().common.pageLabel)} ${escape_html(page)} / ${escape_html(totalPages())}</span> <button type="button"${attr("disabled", page === totalPages(), true)}>${escape_html(content().common.next)}</button></nav></section></main>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-CeYZXzDS.js.map

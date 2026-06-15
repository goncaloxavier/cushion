import { a7 as head, a9 as ensure_array_like, a8 as attr, a1 as derived } from './index2-3ubY_0I4.js';
import { R as Reveal } from './Reveal-yIq7l06z.js';
import { i as imageFor, p as productImageFallback } from './site-content-DXdOWpkG.js';
import { k as escape_html } from './context-wcOFFW0f.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    const content = derived(() => data.site[data.language]);
    const langQuery = derived(() => `?lang=${data.language}`);
    let query = "";
    let page = 1;
    const pageSize = 4;
    const normalizedQuery = derived(() => query.trim().toLowerCase());
    const filteredProducts = derived(() => content().products.filter((product) => [
      product.title,
      product.summary,
      product.description,
      ...product.features,
      ...product.applications
    ].join(" ").toLowerCase().includes(normalizedQuery())));
    const totalPages = derived(() => Math.max(1, Math.ceil(filteredProducts().length / pageSize)));
    const visibleProducts = derived(() => filteredProducts().slice((page - 1) * pageSize, page * pageSize));
    head("bhavc3", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>${escape_html(content().nav.products)} | DaFábrica4You</title>`);
      });
    });
    $$renderer2.push(`<main class="products-page"><section class="product-index-hero">`);
    Reveal($$renderer2, {
      class: "product-index-copy",
      variant: "hero",
      priority: true,
      children: ($$renderer3) => {
        $$renderer3.push(`<p class="kicker">${escape_html(content().productsPage.hero.kicker)}</p> <h1>${escape_html(content().productsPage.hero.title)}</h1> <p>${escape_html(content().productsPage.hero.lead)}</p>`);
      }
    });
    $$renderer2.push(`<!----> `);
    Reveal($$renderer2, {
      class: "product-index-note",
      delay: 120,
      variant: "panel",
      priority: true,
      children: ($$renderer3) => {
        $$renderer3.push(`<span>${escape_html(content().products.length)}</span> <p>${escape_html(content().productsPage.lead)}</p>`);
      }
    });
    $$renderer2.push(`<!----></section> <section class="section product-collection-section">`);
    Reveal($$renderer2, {
      delay: 80,
      variant: "panel",
      children: ($$renderer3) => {
        $$renderer3.push(`<div class="collection-tools"><label class="search-field"><input${attr("value", query)} type="search"${attr("aria-label", content().common.searchProducts)}${attr("placeholder", content().nav.products)}/></label> <p>${escape_html(filteredProducts().length)} / ${escape_html(content().products.length)}</p></div>`);
      }
    });
    $$renderer2.push(`<!----> <div class="product-directory product-directory-editorial"><!--[-->`);
    const each_array = ensure_array_like(visibleProducts());
    for (let $$index_1 = 0, $$length = each_array.length; $$index_1 < $$length; $$index_1++) {
      let product = each_array[$$index_1];
      const image = imageFor(product, productImageFallback);
      $$renderer2.push(`<a class="product-panel"${attr("href", `/produtos/${product.slug}${langQuery()}`)}><div class="product-panel-media"><img${attr("src", image.url)}${attr("alt", image.alt)} loading="lazy" decoding="async"/></div> <div class="product-panel-copy"><span>${escape_html(product.features[0])}</span> <h2>${escape_html(product.title)}</h2> <p>${escape_html(product.summary)}</p> <div class="tag-row"><!--[-->`);
      const each_array_1 = ensure_array_like(product.features.slice(0, 3));
      for (let $$index = 0, $$length2 = each_array_1.length; $$index < $$length2; $$index++) {
        let feature = each_array_1[$$index];
        $$renderer2.push(`<small>${escape_html(feature)}</small>`);
      }
      $$renderer2.push(`<!--]--></div></div></a>`);
    }
    $$renderer2.push(`<!--]--></div> `);
    if (!visibleProducts().length) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<p class="empty-state">${escape_html(content().common.noResults)}</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <nav class="pagination"${attr("aria-label", content().common.pageLabel)}><button type="button"${attr("disabled", page === 1, true)}>${escape_html(content().common.previous)}</button> <span>${escape_html(content().common.pageLabel)} ${escape_html(page)} / ${escape_html(totalPages())}</span> <button type="button"${attr("disabled", page === totalPages(), true)}>${escape_html(content().common.next)}</button></nav></section></main>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-B3pufavn.js.map

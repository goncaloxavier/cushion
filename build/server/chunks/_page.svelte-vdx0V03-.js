import { a7 as head, a9 as ensure_array_like, a8 as attr, a1 as derived } from './index2-3ubY_0I4.js';
import { R as Reveal } from './Reveal-yIq7l06z.js';
import { i as imageFor, a as caseStudyImageFallback } from './site-content-DXdOWpkG.js';
import { k as escape_html } from './context-wcOFFW0f.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    const content = derived(() => data.site[data.language]);
    const langQuery = derived(() => `?lang=${data.language}`);
    let query = "";
    let page = 1;
    const pageSize = 2;
    const normalizedQuery = derived(() => query.trim().toLowerCase());
    const filteredCases = derived(() => content().caseStudies.filter((item) => [
      item.title,
      item.location,
      item.summary,
      item.challenge,
      item.solution,
      item.result
    ].join(" ").toLowerCase().includes(normalizedQuery())));
    const totalPages = derived(() => Math.max(1, Math.ceil(filteredCases().length / pageSize)));
    const visibleCases = derived(() => filteredCases().slice((page - 1) * pageSize, page * pageSize));
    head("2cetsx", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>${escape_html(content().nav.cases)} | DaFábrica4You</title>`);
      });
    });
    $$renderer2.push(`<main class="cases-page"><section class="case-index-hero">`);
    Reveal($$renderer2, {
      class: "case-index-copy",
      variant: "hero",
      priority: true,
      children: ($$renderer3) => {
        $$renderer3.push(`<p class="kicker">${escape_html(content().casesPage.hero.kicker)}</p> <h1>${escape_html(content().casesPage.hero.title)}</h1> <p>${escape_html(content().casesPage.hero.lead)}</p>`);
      }
    });
    $$renderer2.push(`<!----> `);
    Reveal($$renderer2, {
      class: "case-index-proof",
      delay: 120,
      variant: "panel",
      priority: true,
      children: ($$renderer3) => {
        $$renderer3.push(`<span>${escape_html(content().common.challenge)}</span> <span>${escape_html(content().common.solution)}</span> <span>${escape_html(content().common.result)}</span>`);
      }
    });
    $$renderer2.push(`<!----></section> <section class="section collection-section case-collection-section">`);
    Reveal($$renderer2, {
      variant: "panel",
      children: ($$renderer3) => {
        $$renderer3.push(`<div class="collection-tools"><label class="search-field"><input${attr("value", query)} type="search"${attr("aria-label", content().common.searchCases)}${attr("placeholder", content().nav.cases)}/></label> <p>${escape_html(filteredCases().length)} / ${escape_html(content().caseStudies.length)}</p></div>`);
      }
    });
    $$renderer2.push(`<!----> <div class="case-strip"><!--[-->`);
    const each_array = ensure_array_like(visibleCases());
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let item = each_array[$$index];
      const image = imageFor(item, caseStudyImageFallback);
      $$renderer2.push(`<a class="case-card"${attr("href", `/casos-de-estudo/${item.slug}${langQuery()}`)}><div class="case-card-media"><img${attr("src", image.url)}${attr("alt", image.alt)} loading="lazy" decoding="async"/></div> <div class="case-card-copy"><span>${escape_html(item.location)}</span> <h2>${escape_html(item.title)}</h2> <p>${escape_html(item.summary)}</p></div></a>`);
    }
    $$renderer2.push(`<!--]--></div> `);
    if (!visibleCases().length) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<p class="empty-state collection-empty">${escape_html(content().common.noResults)}</p>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--> <nav class="pagination collection-pagination"${attr("aria-label", content().common.pageLabel)}><button type="button"${attr("disabled", page === 1, true)}>${escape_html(content().common.previous)}</button> <span>${escape_html(content().common.pageLabel)} ${escape_html(page)} / ${escape_html(totalPages())}</span> <button type="button"${attr("disabled", page === totalPages(), true)}>${escape_html(content().common.next)}</button></nav></section></main>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-vdx0V03-.js.map

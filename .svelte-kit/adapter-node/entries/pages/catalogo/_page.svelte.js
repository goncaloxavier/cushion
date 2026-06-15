import { N as head, Q as spread_props, P as ensure_array_like, G as derived, O as attr } from "../../../chunks/index2.js";
import { P as PageHero } from "../../../chunks/PageHero.js";
import { R as Reveal } from "../../../chunks/Reveal.js";
import { e as escape_html } from "../../../chunks/context.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    const content = derived(() => data.site[data.language]);
    const langQuery = derived(() => `?lang=${data.language}`);
    head("owb2al", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>${escape_html(content().nav.catalogue)} | DaFábrica4You</title>`);
      });
    });
    $$renderer2.push(`<main>`);
    PageHero($$renderer2, spread_props([content().catalogue.hero]));
    $$renderer2.push(`<!----> <section class="section catalogue-board">`);
    Reveal($$renderer2, {
      class: "catalogue-intro",
      variant: "panel",
      children: ($$renderer3) => {
        $$renderer3.push(`<p class="kicker">${escape_html(content().catalogue.estimate.kicker)}</p> <h2>${escape_html(content().catalogue.estimate.title)}</h2> <p>${escape_html(content().catalogue.estimate.lead)}</p> <a class="button primary"${attr("href", `/contacto${langQuery()}`)}>${escape_html(content().common.requestQuote)}</a>`);
      }
    });
    $$renderer2.push(`<!----> <div class="price-factors"><!--[-->`);
    const each_array = ensure_array_like(content().catalogue.estimate.cards);
    for (let index = 0, $$length = each_array.length; index < $$length; index++) {
      let card = each_array[index];
      Reveal($$renderer2, {
        delay: index * 70,
        variant: "card",
        children: ($$renderer3) => {
          $$renderer3.push(`<article class="factor-card"><h3>${escape_html(card.title)}</h3> <p>${escape_html(card.text)}</p></article>`);
        }
      });
    }
    $$renderer2.push(`<!--]--></div> `);
    Reveal($$renderer2, {
      class: "quote-checklist",
      delay: 120,
      variant: "scale",
      children: ($$renderer3) => {
        $$renderer3.push(`<h2>${escape_html(content().catalogue.estimate.checklistTitle)}</h2> <ul><!--[-->`);
        const each_array_1 = ensure_array_like(content().catalogue.estimate.checklist);
        for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
          let item = each_array_1[$$index_1];
          $$renderer3.push(`<li>${escape_html(item)}</li>`);
        }
        $$renderer3.push(`<!--]--></ul> <p>${escape_html(content().catalogue.note)}</p>`);
      }
    });
    $$renderer2.push(`<!----> <div class="quote-flow compact-flow"><!--[-->`);
    const each_array_2 = ensure_array_like(content().catalogue.quoteFlow);
    for (let index = 0, $$length = each_array_2.length; index < $$length; index++) {
      let step = each_array_2[index];
      Reveal($$renderer2, {
        delay: index * 55,
        variant: "list",
        children: ($$renderer3) => {
          $$renderer3.push(`<article><h3>${escape_html(step.title)}</h3> <p>${escape_html(step.text)}</p></article>`);
        }
      });
    }
    $$renderer2.push(`<!--]--></div></section></main>`);
  });
}
export {
  _page as default
};

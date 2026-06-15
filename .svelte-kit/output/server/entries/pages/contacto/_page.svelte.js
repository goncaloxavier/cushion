import { N as head, Q as spread_props, G as derived, O as attr, P as ensure_array_like } from "../../../chunks/index2.js";
import { P as PageHero } from "../../../chunks/PageHero.js";
import { R as Reveal } from "../../../chunks/Reveal.js";
import { e as escape_html } from "../../../chunks/context.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    const content = derived(() => data.site[data.language]);
    head("1q5tl52", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>${escape_html(content().nav.contact)} | DaFábrica4You</title>`);
      });
    });
    $$renderer2.push(`<main>`);
    PageHero($$renderer2, spread_props([content().contactPage.hero]));
    $$renderer2.push(`<!----> <section class="section contact-grid">`);
    Reveal($$renderer2, {
      class: "contact-method",
      variant: "card",
      children: ($$renderer3) => {
        $$renderer3.push(`<div class="contact-box"><span>${escape_html(content().common.emailLabel)}</span> <a${attr("href", `mailto:${content().common.contactEmail}`)}>${escape_html(content().common.contactEmail)}</a></div>`);
      }
    });
    $$renderer2.push(`<!----> `);
    Reveal($$renderer2, {
      class: "contact-method",
      delay: 80,
      variant: "card",
      children: ($$renderer3) => {
        $$renderer3.push(`<div class="contact-box"><span>${escape_html(content().common.phoneLabel)}</span> <a${attr("href", `tel:${content().common.contactPhone.replaceAll(" ", "")}`)}>${escape_html(content().common.contactPhone)}</a></div>`);
      }
    });
    $$renderer2.push(`<!----> `);
    Reveal($$renderer2, {
      class: "contact-form-reveal",
      delay: 160,
      variant: "panel",
      children: ($$renderer3) => {
        $$renderer3.push(`<form class="contact-form"><!--[-->`);
        const each_array = ensure_array_like(content().contactPage.fields);
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let field = each_array[$$index];
          $$renderer3.push(`<label><span>${escape_html(field)}</span> `);
          if (field.toLowerCase().includes("mensagem") || field.toLowerCase().includes("message") || field.toLowerCase().includes("mensaje")) {
            $$renderer3.push("<!--[0-->");
            $$renderer3.push(`<textarea rows="4"></textarea>`);
          } else {
            $$renderer3.push("<!--[-1-->");
            $$renderer3.push(`<input/>`);
          }
          $$renderer3.push(`<!--]--></label>`);
        }
        $$renderer3.push(`<!--]--> <button class="button primary" type="button">${escape_html(content().common.requestQuote)}</button></form>`);
      }
    });
    $$renderer2.push(`<!----></section></main>`);
  });
}
export {
  _page as default
};

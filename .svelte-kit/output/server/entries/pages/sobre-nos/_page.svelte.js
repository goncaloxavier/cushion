import { N as head, P as ensure_array_like, G as derived } from "../../../chunks/index2.js";
import { R as Reveal } from "../../../chunks/Reveal.js";
import { e as escape_html } from "../../../chunks/context.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    const content = derived(() => data.site[data.language]);
    head("mirit3", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>${escape_html(content().nav.about)} | DaFábrica4You</title>`);
      });
    });
    $$renderer2.push(`<main class="about-page"><section class="about-index-hero">`);
    Reveal($$renderer2, {
      class: "about-index-copy",
      variant: "hero",
      priority: true,
      children: ($$renderer3) => {
        $$renderer3.push(`<p class="kicker">${escape_html(content().about.hero.kicker)}</p> <h1>${escape_html(content().about.hero.title)}</h1>`);
      }
    });
    $$renderer2.push(`<!----> `);
    Reveal($$renderer2, {
      class: "about-index-lead",
      delay: 120,
      variant: "panel",
      priority: true,
      children: ($$renderer3) => {
        $$renderer3.push(`<p>${escape_html(content().about.hero.lead)}</p>`);
      }
    });
    $$renderer2.push(`<!----></section> <section class="section about-narrative">`);
    Reveal($$renderer2, {
      class: "about-statement",
      variant: "panel",
      children: ($$renderer3) => {
        $$renderer3.push(`<p class="kicker">${escape_html(content().home.intro.kicker)}</p> <h2>${escape_html(content().home.intro.title)}</h2> <p>${escape_html(content().home.intro.lead)}</p>`);
      }
    });
    $$renderer2.push(`<!----> <div class="about-moments"><!--[-->`);
    const each_array = ensure_array_like(content().about.timeline);
    for (let index = 0, $$length = each_array.length; index < $$length; index++) {
      let item = each_array[index];
      Reveal($$renderer2, {
        delay: index * 70,
        variant: "list",
        children: ($$renderer3) => {
          $$renderer3.push(`<article class="about-moment"><span>${escape_html(item.title)}</span> <p>${escape_html(item.text)}</p></article>`);
        }
      });
    }
    $$renderer2.push(`<!--]--></div></section> <section class="section about-principles">`);
    Reveal($$renderer2, {
      class: "about-principles-lead",
      variant: "panel",
      children: ($$renderer3) => {
        $$renderer3.push(`<p class="kicker">${escape_html(content().home.manifesto.attribution)}</p> <h2>${escape_html(content().home.manifesto.quote)}</h2>`);
      }
    });
    $$renderer2.push(`<!----> <div class="principle-grid"><!--[-->`);
    const each_array_1 = ensure_array_like(content().about.principles);
    for (let index = 0, $$length = each_array_1.length; index < $$length; index++) {
      let principle = each_array_1[index];
      Reveal($$renderer2, {
        delay: index * 70,
        variant: "card",
        children: ($$renderer3) => {
          $$renderer3.push(`<article class="feature-card about-principle-card"><span>${escape_html(String(index + 1).padStart(2, "0"))}</span> <h2>${escape_html(principle.title)}</h2> <p>${escape_html(principle.text)}</p></article>`);
        }
      });
    }
    $$renderer2.push(`<!--]--></div></section></main>`);
  });
}
export {
  _page as default
};

import { a7 as head, a9 as ensure_array_like, a1 as derived, a8 as attr } from './index2-3ubY_0I4.js';
import { R as Reveal } from './Reveal-yIq7l06z.js';
import { k as escape_html } from './context-wcOFFW0f.js';

function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    const content = derived(() => data.site[data.language]);
    const langQuery = derived(() => `?lang=${data.language}`);
    head("1uha8ag", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>DaFábrica4You | Plástico reciclado para exterior</title>`);
      });
    });
    $$renderer2.push(`<main class="home-page"><section class="home-hero"><div class="home-hero-copy">`);
    Reveal($$renderer2, {
      variant: "hero",
      priority: true,
      children: ($$renderer3) => {
        $$renderer3.push(`<h1>${escape_html(content().home.hero.title)}</h1> <p>${escape_html(content().home.hero.lead)}</p> <div class="hero-proof-strip"${attr("aria-label", content().home.impact.title)}><!--[-->`);
        const each_array = ensure_array_like(content().home.impact.stats.slice(0, 3));
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let stat = each_array[$$index];
          $$renderer3.push(`<span><strong>${escape_html(stat.title)}</strong>${escape_html(stat.text)}</span>`);
        }
        $$renderer3.push(`<!--]--></div>`);
      }
    });
    $$renderer2.push(`<!----> `);
    Reveal($$renderer2, {
      delay: 130,
      variant: "scale",
      priority: true,
      children: ($$renderer3) => {
        $$renderer3.push(`<div class="hero-actions"><a class="button primary"${attr("href", `/contacto${langQuery()}`)}>${escape_html(content().common.requestQuote)}</a> <a class="button secondary"${attr("href", `/catalogo${langQuery()}`)}>${escape_html(content().nav.catalogue)}</a></div>`);
      }
    });
    $$renderer2.push(`<!----></div> <p class="scroll-cue">${escape_html(content().common.scroll)}</p></section> <section class="section home-brief">`);
    Reveal($$renderer2, {
      class: "home-brief-lead",
      variant: "panel",
      children: ($$renderer3) => {
        $$renderer3.push(`<p class="kicker">${escape_html(content().home.intro.kicker)}</p> <h2>${escape_html(content().home.intro.title)}</h2> <p>${escape_html(content().home.intro.lead)}</p>`);
      }
    });
    $$renderer2.push(`<!----> <div class="home-story-rail"><!--[-->`);
    const each_array_1 = ensure_array_like(content().about.timeline);
    for (let index = 0, $$length = each_array_1.length; index < $$length; index++) {
      let item = each_array_1[index];
      Reveal($$renderer2, {
        delay: index * 60,
        variant: "list",
        children: ($$renderer3) => {
          $$renderer3.push(`<article><span>${escape_html(item.title)}</span> <p>${escape_html(item.text)}</p></article>`);
        }
      });
    }
    $$renderer2.push(`<!--]--></div></section> <section class="section home-impact-ledger">`);
    Reveal($$renderer2, {
      class: "impact-copy",
      variant: "panel",
      children: ($$renderer3) => {
        $$renderer3.push(`<h2>${escape_html(content().home.impact.title)}</h2> <p>${escape_html(content().home.impact.lead)}</p>`);
      }
    });
    $$renderer2.push(`<!----> <div class="impact-ledger"><!--[-->`);
    const each_array_2 = ensure_array_like(content().home.impact.stats);
    for (let index = 0, $$length = each_array_2.length; index < $$length; index++) {
      let stat = each_array_2[index];
      Reveal($$renderer2, {
        delay: index * 60,
        variant: "list",
        children: ($$renderer3) => {
          $$renderer3.push(`<article><strong>${escape_html(stat.title)}</strong> <p>${escape_html(stat.text)}</p></article>`);
        }
      });
    }
    $$renderer2.push(`<!--]--></div></section></main>`);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-CwBhKB9T.js.map

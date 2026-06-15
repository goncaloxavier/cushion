import { aa as attr_class } from './index2-3ubY_0I4.js';
import { R as Reveal } from './Reveal-yIq7l06z.js';
import { k as escape_html } from './context-wcOFFW0f.js';

function PageHero($$renderer, $$props) {
  let { kicker, title, lead, align = "split" } = $$props;
  $$renderer.push(`<section${attr_class(`page-hero page-hero-${align}`)}>`);
  Reveal($$renderer, {
    class: "page-hero-copy",
    variant: "hero",
    priority: true,
    children: ($$renderer2) => {
      $$renderer2.push(`<p class="kicker">${escape_html(kicker)}</p> <h1>${escape_html(title)}</h1> <p class="hero-copy">${escape_html(lead)}</p>`);
    }
  });
  $$renderer.push(`<!----></section>`);
}

export { PageHero as P };
//# sourceMappingURL=PageHero-CyKGWgij.js.map

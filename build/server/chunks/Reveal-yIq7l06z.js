import { aa as attr_class, a8 as attr, ab as attr_style } from './index2-3ubY_0I4.js';

function Reveal($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      children,
      delay = 0,
      variant = "rise",
      priority = false,
      class: className = ""
    } = $$props;
    $$renderer2.push(`<div${attr_class(`reveal ${""} ${className}`)}${attr("data-reveal", variant)}${attr_style(`--delay: ${delay}ms`)}>`);
    children($$renderer2);
    $$renderer2.push(`<!----></div>`);
  });
}

export { Reveal as R };
//# sourceMappingURL=Reveal-yIq7l06z.js.map

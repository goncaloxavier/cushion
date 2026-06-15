import { J as attr_class, O as attr, K as attr_style } from "./index2.js";
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
export {
  Reveal as R
};

import { a7 as head, a8 as attr, a9 as ensure_array_like, aa as attr_class, ab as attr_style, a1 as derived } from './index2-3ubY_0I4.js';
import './exports-BOROuGf9.js';
import './state.svelte-CGKxMQOu.js';
import { k as escape_html } from './context-wcOFFW0f.js';

function RouteProgress($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let loading = false;
    let scroll = 0;
    $$renderer2.push(`<div${attr_class("route-progress", void 0, { "loading": loading })} aria-hidden="true"></div> <div class="scroll-progress"${attr_style(`--scroll-scale: ${scroll}`)} aria-hidden="true"></div>`);
  });
}
function RouteScene($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { children, kind } = $$props;
    $$renderer2.push(`<div${attr_class(`page-transition route-${kind} ${""}`)}>`);
    children($$renderer2);
    $$renderer2.push(`<!----></div>`);
  });
}
function _layout($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data, children } = $$props;
    const content = derived(() => data.site[data.language]);
    const routeItems = derived(() => [
      { href: "/", label: content().nav.home },
      { href: "/sobre-nos", label: content().nav.about },
      { href: "/produtos", label: content().nav.products },
      { href: "/catalogo", label: content().nav.catalogue },
      { href: "/casos-de-estudo", label: content().nav.cases },
      { href: "/blog", label: content().nav.blog }
    ]);
    const dockItems = derived(() => [
      { href: "/produtos", label: content().nav.products },
      { href: "/catalogo", label: content().nav.catalogue },
      { href: "/casos-de-estudo", label: content().nav.cases },
      { href: "/blog", label: content().nav.blog },
      { href: "/contacto", label: content().nav.contact }
    ]);
    const withLanguage = (href, language) => `${href}?lang=${language}`;
    const isActive = (href) => href === "/" ? data.currentPath === "/" : data.currentPath.startsWith(href);
    const routeKind = derived(() => {
      if (data.currentPath === "/") return "home";
      if (data.currentPath.startsWith("/produtos/")) return "product-detail";
      if (data.currentPath.startsWith("/produtos")) return "products";
      if (data.currentPath.startsWith("/catalogo")) return "catalogue";
      if (data.currentPath.startsWith("/casos-de-estudo/")) return "case-detail";
      if (data.currentPath.startsWith("/casos-de-estudo")) return "cases";
      if (data.currentPath.startsWith("/blog/")) return "blog-detail";
      if (data.currentPath.startsWith("/blog")) return "blog";
      if (data.currentPath.startsWith("/contacto")) return "contact";
      if (data.currentPath.startsWith("/sobre-nos")) return "about";
      return "default";
    });
    head("12qhfyh", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>DaFábrica4You</title>`);
      });
    });
    RouteProgress($$renderer2);
    $$renderer2.push(`<!----> <header class="site-header"><a class="brand"${attr("href", withLanguage("/", data.language))} aria-label="DaFábrica4You"><img src="/logo/brand_mark.png" alt="DaFábrica4You"/></a> <nav class="nav-links" aria-label="Main navigation"><!--[-->`);
    const each_array = ensure_array_like(routeItems());
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let item = each_array[$$index];
      $$renderer2.push(`<a${attr("href", withLanguage(item.href, data.language))}${attr_class("", void 0, { "active": isActive(item.href) })}>${escape_html(item.label)}</a>`);
    }
    $$renderer2.push(`<!--]--></nav> <div class="header-actions"><a class="contact-link"${attr("href", withLanguage("/contacto", data.language))}>${escape_html(content().nav.contact)}</a> <div class="language-switcher" aria-label="Language"><!--[-->`);
    const each_array_1 = ensure_array_like(data.languages);
    for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
      let language = each_array_1[$$index_1];
      $$renderer2.push(`<a${attr("aria-current", data.language === language.code ? "true" : void 0)}${attr("href", withLanguage(data.currentPath, language.code))}${attr_class("", void 0, { "active": data.language === language.code })}>${escape_html(language.label)}</a>`);
    }
    $$renderer2.push(`<!--]--></div></div></header> <nav class="mobile-dock" aria-label="Mobile quick navigation"><!--[-->`);
    const each_array_2 = ensure_array_like(dockItems());
    for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
      let item = each_array_2[$$index_2];
      $$renderer2.push(`<a${attr("href", withLanguage(item.href, data.language))}${attr_class("", void 0, { "active": isActive(item.href) })}>${escape_html(item.label)}</a>`);
    }
    $$renderer2.push(`<!--]--></nav> <!---->`);
    {
      RouteScene($$renderer2, {
        kind: routeKind(),
        children: ($$renderer3) => {
          children($$renderer3);
          $$renderer3.push(`<!---->`);
        }
      });
    }
    $$renderer2.push(`<!----> <footer class="site-footer"><div><img src="/logo/brand_mark.png" alt="DaFábrica4You"/></div> <div class="footer-links"><a${attr("href", `mailto:${content().common.contactEmail}`)}>${escape_html(content().common.contactEmail)}</a> <a${attr("href", `tel:${content().common.contactPhone.replaceAll(" ", "")}`)}>${escape_html(content().common.contactPhone)}</a></div> <p>${escape_html(content().footer.note)}</p></footer>`);
  });
}

export { _layout as default };
//# sourceMappingURL=_layout.svelte-B5DA7NOl.js.map

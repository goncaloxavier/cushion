import { N as head, O as attr, P as ensure_array_like, J as attr_class, G as derived } from "../../../../chunks/index2.js";
import { e as productImagesFor, p as productImageFallback } from "../../../../chunks/site-content.js";
import { e as escape_html } from "../../../../chunks/context.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    const content = derived(() => data.site[data.language]);
    const langQuery = derived(() => `?lang=${data.language}`);
    let selectedImageIndex = 0;
    const images = derived(() => productImagesFor(data.product, productImageFallback));
    const image = derived(() => images()[selectedImageIndex] ?? images()[0]);
    head("176r1fp", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>${escape_html(data.product.title)} | DaFábrica4You</title>`);
      });
    });
    $$renderer2.push(`<main><article class="detail-page product-detail"><section class="detail-hero product-detail-hero"><div class="detail-hero-copy"><p class="kicker">${escape_html(content().nav.products)}</p> <h1>${escape_html(data.product.title)}</h1> <p class="article-lead">${escape_html(data.product.description)}</p></div> <div class="product-gallery"><button class="detail-hero-media product-gallery-main" type="button"${attr("aria-label", content().common.zoomImage)}><img${attr("src", image().url)}${attr("alt", image().alt)} decoding="async" fetchpriority="high"/> <span>${escape_html(content().common.zoomImage)}</span></button> `);
    if (images().length > 1) {
      $$renderer2.push("<!--[0-->");
      $$renderer2.push(`<div class="product-thumbnails"${attr("aria-label", content().common.zoomImage)}><!--[-->`);
      const each_array = ensure_array_like(images());
      for (let index = 0, $$length = each_array.length; index < $$length; index++) {
        let galleryImage = each_array[index];
        $$renderer2.push(`<button type="button"${attr("aria-label", `${content().common.zoomImage} ${index + 1}`)}${attr_class("", void 0, { "active": selectedImageIndex === index })}><img${attr("src", galleryImage.url)}${attr("alt", galleryImage.alt)} loading="lazy" decoding="async"/></button>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></div></section> <section class="detail-body product-detail-body"><div class="detail-sticky"><h2>${escape_html(content().common.featuresLabel)}</h2> <div class="tag-row"><!--[-->`);
    const each_array_1 = ensure_array_like(data.product.features);
    for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
      let feature = each_array_1[$$index_1];
      $$renderer2.push(`<small>${escape_html(feature)}</small>`);
    }
    $$renderer2.push(`<!--]--></div> <a class="button primary"${attr("href", `/contacto${langQuery()}`)}>${escape_html(content().common.requestQuote)}</a> <a class="text-link quote-process-link"${attr("href", `/catalogo${langQuery()}`)}>${escape_html(content().catalogue.estimate.kicker)}</a></div> <div class="detail-panel"><h2>${escape_html(content().common.applicationsLabel)}</h2> <ul class="detail-list"><!--[-->`);
    const each_array_2 = ensure_array_like(data.product.applications);
    for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
      let application = each_array_2[$$index_2];
      $$renderer2.push(`<li>${escape_html(application)}</li>`);
    }
    $$renderer2.push(`<!--]--></ul></div></section></article> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></main>`);
  });
}
export {
  _page as default
};

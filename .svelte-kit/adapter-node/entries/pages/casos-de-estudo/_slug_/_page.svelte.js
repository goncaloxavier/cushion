import { N as head, O as attr, P as ensure_array_like, J as attr_class, G as derived } from "../../../../chunks/index2.js";
import { d as caseStudyImagesFor, a as caseStudyImageFallback } from "../../../../chunks/site-content.js";
import { e as escape_html } from "../../../../chunks/context.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    const content = derived(() => data.site[data.language]);
    let selectedImageIndex = 0;
    const images = derived(() => caseStudyImagesFor(data.caseStudy, caseStudyImageFallback));
    const image = derived(() => images()[selectedImageIndex] ?? images()[0]);
    head("1w73n6v", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>${escape_html(data.caseStudy.title)} | DaFábrica4You</title>`);
      });
    });
    $$renderer2.push(`<main><article class="detail-page case-detail"><section class="case-detail-hero"><div class="case-detail-overlay"><p class="kicker">${escape_html(data.caseStudy.location)}</p> <h1>${escape_html(data.caseStudy.title)}</h1> <p class="article-lead">${escape_html(data.caseStudy.summary)}</p></div> <div class="product-gallery case-gallery"><button class="detail-hero-media product-gallery-main" type="button"${attr("aria-label", content().common.zoomImage)}><img${attr("src", image().url)}${attr("alt", image().alt)} decoding="async" fetchpriority="high"/> <span>${escape_html(content().common.zoomImage)}</span></button> `);
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
    $$renderer2.push(`<!--]--></div></section> <section class="case-detail-list"><article><span>${escape_html(content().common.challenge)}</span> <p>${escape_html(data.caseStudy.challenge)}</p></article> <article><span>${escape_html(content().common.solution)}</span> <p>${escape_html(data.caseStudy.solution)}</p></article> <article><span>${escape_html(content().common.result)}</span> <p>${escape_html(data.caseStudy.result)}</p></article></section></article> `);
    {
      $$renderer2.push("<!--[-1-->");
    }
    $$renderer2.push(`<!--]--></main>`);
  });
}
export {
  _page as default
};

<script lang="ts">
  import {page} from '$app/state'
  import {createDataAttribute} from '@sanity/visual-editing/create-data-attribute'
  import StoreMediaGallery from '$lib/components/StoreMediaGallery.svelte'
  import SeoHead from '$lib/components/SeoHead.svelte'
  import {collectionListHref} from '$lib/collection-page'
  import {absoluteUrl, breadcrumbListSchema} from '$lib/seo'
  import {textAppearanceStyle} from '$lib/text-appearance'
  import {
    caseStudyImageFallback,
    caseStudyImagesFor,
    caseStudyMediaFor,
    withLanguage,
  } from '$lib/site-content'

  let {data} = $props()
  const content = $derived(data.site)
  const backHref = $derived(
    collectionListHref('/casos-de-estudo', data.language, data.returnPage),
  )
  const images = $derived(caseStudyImagesFor(data.caseStudy, caseStudyImageFallback))
  const media = $derived(caseStudyMediaFor(data.caseStudy, caseStudyImageFallback))
  const caseDataAttribute = $derived(
    (data.preview || data.builderPreview) && data.studioUrl && data.caseStudy.studioDocumentId
      ? createDataAttribute({
          baseUrl: data.studioUrl,
          id: data.caseStudy.studioDocumentId,
          type: 'caseStudy',
        })
      : null,
  )
  const imageDataAttribute = $derived(
    caseDataAttribute ? (path: string) => caseDataAttribute(path) : undefined,
  )
  const lead = $derived(data.caseStudy.description || data.caseStudy.summary)
  const leadFieldPath = $derived(
    data.caseStudy.description ? 'description.pt' : 'summary.pt',
  )
  const hasProcess = $derived(
    Boolean(data.caseStudy.challenge || data.caseStudy.solution || data.caseStudy.result),
  )
  const caseJsonLd = $derived(
    breadcrumbListSchema([
      {name: content.nav.home, url: absoluteUrl(page.url.origin, withLanguage('/', data.language))!},
      {name: content.nav.cases, url: absoluteUrl(page.url.origin, withLanguage('/casos-de-estudo', data.language))!},
      {name: data.caseStudy.title, url: absoluteUrl(page.url.origin, withLanguage(page.url.pathname, data.language))!},
    ]),
  )
</script>

<SeoHead title={data.caseStudy.title} description={lead} image={images[0]} jsonLd={caseJsonLd} />

<main>
  <article class="detail-page case-detail">
    <section class="case-detail-hero">
      <div class="case-detail-overlay">
        <a class="detail-back-link" href={backHref}>
          <span aria-hidden="true">←</span>
          {content.common.backToCases}
        </a>
        <p class="kicker" data-sanity={caseDataAttribute?.('location')}>{data.caseStudy.location}</p>
        <h1
          class="cms-styled-text"
          style={textAppearanceStyle(data.caseStudy.textAppearance?.title)}
          data-sanity={caseDataAttribute?.('title.pt')}
        >{data.caseStudy.title}</h1>
        <p
          class="article-lead cms-styled-text"
          style={textAppearanceStyle(
            data.caseStudy.textAppearance?.[
              leadFieldPath.startsWith('description') ? 'description' : 'summary'
            ],
          )}
          data-sanity={caseDataAttribute?.(leadFieldPath)}
        >{lead}</p>
      </div>
      <StoreMediaGallery
        {media}
        label={content.common.zoomImage}
        closeLabel={content.common.close}
        className="case-gallery"
        sizes="(max-width: 900px) 92vw, (max-width: 1300px) 48vw, 650px"
        transitionName={`vt-${data.caseStudy.slug}`}
        dataAttribute={imageDataAttribute}
        fallbackEditPath="image"
      />
    </section>

    {#if hasProcess}
      <section class="case-detail-list">
        {#if data.caseStudy.challenge}
          <article>
            <span>{content.common.challenge}</span>
            <p
              class="cms-styled-text"
              style={textAppearanceStyle(data.caseStudy.textAppearance?.challenge)}
              data-sanity={caseDataAttribute?.('challenge.pt')}
            >{data.caseStudy.challenge}</p>
          </article>
        {/if}
        {#if data.caseStudy.solution}
          <article>
            <span>{content.common.solution}</span>
            <p
              class="cms-styled-text"
              style={textAppearanceStyle(data.caseStudy.textAppearance?.solution)}
              data-sanity={caseDataAttribute?.('solution.pt')}
            >{data.caseStudy.solution}</p>
          </article>
        {/if}
        {#if data.caseStudy.result}
          <article>
            <span>{content.common.result}</span>
            <p
              class="cms-styled-text"
              style={textAppearanceStyle(data.caseStudy.textAppearance?.result)}
              data-sanity={caseDataAttribute?.('result.pt')}
            >{data.caseStudy.result}</p>
          </article>
        {/if}
      </section>
    {/if}
  </article>

</main>

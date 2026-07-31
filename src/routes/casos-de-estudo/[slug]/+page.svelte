<script lang="ts">
  import {page} from '$app/state'
  import {loadSanityDataAttributeFactory, type SanityDataAttributeFactory} from '$lib/sanity-edit-attributes'
  import ManagedPageComposition from '$lib/components/builder/ManagedPageComposition.svelte'
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
  import {managedCoreSectionForDocumentType} from '$lib/builder/managed-page-sections'

  let {data} = $props()
  let dataAttributeFactory = $state<SanityDataAttributeFactory | null>(null)
  $effect(() => {
    if ((data.preview || data.builderPreview) && !dataAttributeFactory) {
      void loadSanityDataAttributeFactory().then((factory) => (dataAttributeFactory = factory))
    }
  })
  const content = $derived(data.site)
  const pageCore = managedCoreSectionForDocumentType('caseStudy')!
  const backHref = $derived(
    collectionListHref('/casos-de-estudo', data.language, data.returnPage),
  )
  const images = $derived(caseStudyImagesFor(data.caseStudy, caseStudyImageFallback))
  const media = $derived(caseStudyMediaFor(data.caseStudy, caseStudyImageFallback))
  const caseDataAttribute = $derived(
    (data.preview || data.builderPreview) && data.studioUrl && data.caseStudy.studioDocumentId
      ? dataAttributeFactory?.({
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
  <ManagedPageComposition
    sections={data.caseStudy.sections ?? []}
    core={pageCore}
    settings={data.settings}
    {content}
    language={data.language}
    dataset={data.sanityDataset}
    preview={data.preview || data.builderPreview}
    editorSource={{
      baseUrl: data.studioUrl,
      id: data.caseStudy.studioDocumentId,
      type: 'caseStudy',
    }}
  >
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
    </article>
  </ManagedPageComposition>
</main>

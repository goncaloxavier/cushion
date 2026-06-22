<script lang="ts">
  import ImageGallery from '$lib/components/ImageGallery.svelte'
  import {collectionListHref} from '$lib/collection-page'
  import {caseStudyImageFallback, caseStudyImagesFor} from '$lib/site-content'

  let {data} = $props()
  const content = $derived(data.site[data.language])
  const backHref = $derived(
    collectionListHref('/casos-de-estudo', data.language, data.returnPage),
  )
  const images = $derived(caseStudyImagesFor(data.caseStudy, caseStudyImageFallback))
  const lead = $derived(data.caseStudy.description || data.caseStudy.summary)
  const hasProcess = $derived(
    Boolean(data.caseStudy.challenge || data.caseStudy.solution || data.caseStudy.result),
  )
</script>

<svelte:head>
  <title>{data.caseStudy.title} | DaFábrica4You</title>
</svelte:head>

<main>
  <article class="detail-page case-detail">
    <section class="case-detail-hero">
      <div class="case-detail-overlay">
        <a class="detail-back-link" href={backHref}>
          <span aria-hidden="true">←</span>
          {content.common.backToCases}
        </a>
        <p class="kicker">{data.caseStudy.location}</p>
        <h1>{data.caseStudy.title}</h1>
        <p class="article-lead">{lead}</p>
      </div>
      <ImageGallery
        {images}
        label={content.common.zoomImage}
        closeLabel={content.common.close}
        className="case-gallery"
      />
    </section>

    {#if hasProcess}
      <section class="case-detail-list">
        {#if data.caseStudy.challenge}
          <article>
            <span>{content.common.challenge}</span>
            <p>{data.caseStudy.challenge}</p>
          </article>
        {/if}
        {#if data.caseStudy.solution}
          <article>
            <span>{content.common.solution}</span>
            <p>{data.caseStudy.solution}</p>
          </article>
        {/if}
        {#if data.caseStudy.result}
          <article>
            <span>{content.common.result}</span>
            <p>{data.caseStudy.result}</p>
          </article>
        {/if}
      </section>
    {/if}
  </article>

</main>

<script lang="ts">
  import {loadSanityDataAttributeFactory, type SanityDataAttributeFactory} from '$lib/sanity-edit-attributes'
  import ManagedPageComposition from '$lib/components/builder/ManagedPageComposition.svelte'
  import SeoHead from '$lib/components/SeoHead.svelte'
  import {managedCoreSectionForRoot} from '$lib/builder/managed-page-sections'

  let {data} = $props()
  let dataAttributeFactory = $state<SanityDataAttributeFactory | null>(null)
  $effect(() => {
    if ((data.preview || data.builderPreview) && !dataAttributeFactory) {
      void loadSanityDataAttributeFactory().then((factory) => (dataAttributeFactory = factory))
    }
  })
  const content = $derived(data.site)
  const pageCore = managedCoreSectionForRoot('billingDetails')!
  const t = $derived(content.billingDetails)
  const siteContentDataAttribute = $derived(
    (data.preview || data.builderPreview) && data.studioUrl
      ? dataAttributeFactory?.({baseUrl: data.studioUrl, id: 'siteContent', type: 'siteLanding'})
      : null,
  )
  const billingDataAttribute = (path: string) => siteContentDataAttribute?.(`billingDetails.${path}`)
</script>

<SeoHead title={t.title} description={t.lead} />

<main class="article-page policy-page">
  <ManagedPageComposition
    sections={t.sections}
    core={pageCore}
    settings={data.settings}
    {content}
    language={data.language}
    dataset={data.sanityDataset}
    preview={data.preview || data.builderPreview}
    editorSource={{
      baseUrl: data.studioUrl,
      id: 'siteContent',
      type: 'siteLanding',
      rootPath: 'billingDetails',
    }}
  >
    <p class="kicker" data-sanity={billingDataAttribute('kicker.pt')}>{t.kicker}</p>
    <h1 data-sanity={billingDataAttribute('title.pt')}>{t.title}</h1>
    <p class="policy-lead" data-sanity={billingDataAttribute('lead.pt')}>{t.lead}</p>
    <!-- A description list rather than a table: this is a set of named values,
         and it stays readable when a long registered address wraps on a phone. -->
    <dl class="billing-list" data-sanity={billingDataAttribute('entries')}>
      {#each t.entries as entry}
        <div class="billing-row">
          <dt>{entry.label}</dt>
          <dd>{entry.value}</dd>
        </div>
      {/each}
    </dl>
  </ManagedPageComposition>
</main>

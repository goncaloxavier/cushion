<script lang="ts">
  import {loadSanityDataAttributeFactory, type SanityDataAttributeFactory} from '$lib/sanity-edit-attributes'
  import SeoHead from '$lib/components/SeoHead.svelte'

  let {data} = $props()
  let dataAttributeFactory = $state<SanityDataAttributeFactory | null>(null)
  $effect(() => {
    if ((data.preview || data.builderPreview) && !dataAttributeFactory) {
      void loadSanityDataAttributeFactory().then((factory) => (dataAttributeFactory = factory))
    }
  })
  const content = $derived(data.site)
  const t = $derived(content.returnsPolicy)
  const siteContentDataAttribute = $derived(
    (data.preview || data.builderPreview) && data.studioUrl
      ? dataAttributeFactory?.({baseUrl: data.studioUrl, id: 'siteContent', type: 'siteLanding'})
      : null,
  )
  const returnsPolicyDataAttribute = (path: string) =>
    siteContentDataAttribute?.(`returnsPolicy.${path}`)
</script>

<SeoHead title={t.title} description={t.lead} />

<main class="article-page policy-page">
  <p class="kicker" data-sanity={returnsPolicyDataAttribute('kicker.pt')}>{t.kicker}</p>
  <h1 data-sanity={returnsPolicyDataAttribute('title.pt')}>{t.title}</h1>
  <p class="policy-lead" data-sanity={returnsPolicyDataAttribute('lead.pt')}>{t.lead}</p>
  <ul class="policy-list" data-sanity={returnsPolicyDataAttribute('conditions')}>
    {#each t.conditions as condition}
      <li>{condition}</li>
    {/each}
  </ul>
</main>

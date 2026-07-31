<script lang="ts">
  import BuilderPageRenderer from '$lib/components/builder/BuilderPageRenderer.svelte'
  import SeoHead from '$lib/components/SeoHead.svelte'
  import {builderLocalized} from '$lib/builder/content'
  import type {BuilderSeo} from '$lib/builder/types'
  import {
    loadSanityDataAttributeFactory,
    type SanityDataAttributeFactory,
  } from '$lib/sanity-edit-attributes'

  let {data} = $props()
  let dataAttributeFactory = $state<SanityDataAttributeFactory | null>(null)
  $effect(() => {
    if (data.preview && !dataAttributeFactory) {
      void loadSanityDataAttributeFactory().then((factory) => (dataAttributeFactory = factory))
    }
  })
  const seo = $derived((data.page.seo ?? {}) as BuilderSeo)
  const title = $derived(builderLocalized(seo.title, data.language) || data.page.title)
  const description = $derived(builderLocalized(seo.description, data.language))
  const pageDataAttribute = $derived(
    data.preview && data.studioUrl
      ? dataAttributeFactory?.({
          baseUrl: data.studioUrl,
          id: data.page._id,
          type: data.page._type,
        })
      : null,
  )
</script>

<SeoHead {title} {description} noindex={Boolean(seo.noIndex)} />

<main class="builder-page-main">
  <BuilderPageRenderer
    page={data.page}
    settings={data.settings}
    content={data.site}
    language={data.language}
    dataset={data.sanityDataset}
    preview={data.preview}
    dataAttribute={pageDataAttribute ? (path) => pageDataAttribute(path) : undefined}
  />
</main>

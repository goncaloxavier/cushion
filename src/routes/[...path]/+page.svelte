<script lang="ts">
  import BuilderPageRenderer from '$lib/components/builder/BuilderPageRenderer.svelte'
  import SeoHead from '$lib/components/SeoHead.svelte'
  import {builderLocalized} from '$lib/builder/content'
  import type {BuilderSeo} from '$lib/builder/types'

  let {data} = $props()
  const seo = $derived((data.page.seo ?? {}) as BuilderSeo)
  const title = $derived(builderLocalized(seo.title, data.language) || data.page.title)
  const description = $derived(builderLocalized(seo.description, data.language))
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
  />
</main>

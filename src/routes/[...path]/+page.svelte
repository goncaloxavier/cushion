<script lang="ts">
  import BuilderPageRenderer from '$lib/components/builder/BuilderPageRenderer.svelte'

  let {data} = $props()
</script>

<svelte:head>
  <title>{data.page.seo?.title?.pt || data.page.title} | DaFábrica4You</title>
  {#if data.page.seo?.description?.pt}
    <meta name="description" content={data.page.seo.description.pt} />
  {/if}
</svelte:head>

<BuilderPageRenderer
  page={data.page}
  settings={data.settings}
  content={data.site}
  language={data.language}
  dataset={data.sanityDataset}
  preview={data.preview}
/>

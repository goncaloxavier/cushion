<script lang="ts">
  import type {BuilderSection, BuilderSiteSettings} from '$lib/builder/types'
  import type {LanguageCode, SiteContent} from '$lib/site-content'
  import type {SitePageDocument} from '$lib/site-editor/types'
  import BuilderPageRenderer from './BuilderPageRenderer.svelte'

  let {
    sections,
    settings,
    content,
    language,
    dataset,
    preview = false,
    listenForState = true,
    selectedSectionKey,
  } = $props<{
    sections: BuilderSection[]
    settings: BuilderSiteSettings | null
    content: SiteContent
    language: LanguageCode
    dataset: string
    preview?: boolean
    listenForState?: boolean
    selectedSectionKey?: string
  }>()

  const page = $derived({sections} as SitePageDocument)
</script>

{#if sections.length || preview}
  <BuilderPageRenderer
    {page}
    {settings}
    {content}
    {language}
    {dataset}
    {preview}
    {listenForState}
    externalSelectedSectionKey={selectedSectionKey}
    embedded
  />
{/if}

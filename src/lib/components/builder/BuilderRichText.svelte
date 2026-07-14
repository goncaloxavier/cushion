<script lang="ts">
  import StructuredArticleBody from '$lib/components/StructuredArticleBody.svelte'
  import {builderLocalizedArticle} from '$lib/builder/content'
  import {builderAssetUrl} from '$lib/builder/media'
  import type {RichArticleBlock} from '$lib/article-structure'
  import type {LanguageCode} from '$lib/site-content'

  let {value, language, dataset} = $props<{
    value: unknown
    language: LanguageCode
    dataset: string
  }>()

  const article = $derived(
    builderLocalizedArticle(value, language).map((raw) => {
      if (!raw || typeof raw !== 'object') return raw
      const block = raw as Record<string, unknown>
      if (block._type !== 'image' && block._type !== 'articleImage') return block

      const asset = block.asset as {_ref?: string} | undefined
      return {
        ...block,
        asset: {url: builderAssetUrl(asset?._ref, dataset)},
      }
    }) as RichArticleBlock[],
  )
</script>

<div class="builder-rich-text">
  <StructuredArticleBody body="" {article} />
</div>

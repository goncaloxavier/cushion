<script lang="ts">
  import {page} from '$app/state'
  import {cleanSeoText, seoDescription, siteName, titleWithSiteName} from '$lib/seo'
  import {defaultLanguage, languages, type ContentImage, type LanguageCode} from '$lib/site-content'

  type SeoType = 'website' | 'article'

  type Props = {
    title: string
    description?: string
    image?: ContentImage
    type?: SeoType
    noindex?: boolean
  }

  let {title, description, image, type = 'website', noindex = false}: Props = $props()

  const languageQuery = (language: LanguageCode) =>
    language === defaultLanguage ? '' : `?lang=${language}`
  const languageFromUrl = (value: string | null): LanguageCode =>
    languages.some((option) => option.code === value) ? (value as LanguageCode) : defaultLanguage
  const absoluteUrl = (url: string | undefined) => {
    if (!url) return undefined
    if (/^https?:\/\//i.test(url)) return url
    return `${page.url.origin}${url.startsWith('/') ? url : `/${url}`}`
  }

  const language = $derived(languageFromUrl(page.url.searchParams.get('lang')))
  const fullTitle = $derived(titleWithSiteName(title))
  const metaDescription = $derived(seoDescription(language, description))
  const canonicalUrl = $derived(`${page.url.origin}${page.url.pathname}${languageQuery(language)}`)
  const defaultUrl = $derived(`${page.url.origin}${page.url.pathname}`)
  const imageUrl = $derived(absoluteUrl(image?.url))
  const imageAlt = $derived(cleanSeoText(image?.alt || siteName, 120))
</script>

<svelte:head>
  <title>{fullTitle}</title>
  <meta name="description" content={metaDescription} />
  <link rel="canonical" href={canonicalUrl} />
  {#each languages as option}
    <link rel="alternate" hreflang={option.code} href={`${page.url.origin}${page.url.pathname}${languageQuery(option.code)}`} />
  {/each}
  <link rel="alternate" hreflang="x-default" href={defaultUrl} />

  <meta property="og:site_name" content={siteName} />
  <meta property="og:type" content={type} />
  <meta property="og:title" content={fullTitle} />
  <meta property="og:description" content={metaDescription} />
  <meta property="og:url" content={canonicalUrl} />
  {#if imageUrl}
    <meta property="og:image" content={imageUrl} />
    <meta property="og:image:alt" content={imageAlt} />
  {/if}

  <meta name="twitter:card" content={imageUrl ? 'summary_large_image' : 'summary'} />
  <meta name="twitter:title" content={fullTitle} />
  <meta name="twitter:description" content={metaDescription} />
  {#if imageUrl}
    <meta name="twitter:image" content={imageUrl} />
    <meta name="twitter:image:alt" content={imageAlt} />
  {/if}

  {#if noindex}
    <meta name="robots" content="noindex, nofollow" />
  {/if}
</svelte:head>

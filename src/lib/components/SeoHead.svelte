<script lang="ts">
  import {page} from '$app/state'
  import {
    cleanSeoText,
    defaultShareImagePath,
    seoDescription,
    siteName,
    titleWithSiteName,
    type JsonLd,
  } from '$lib/seo'
  import {defaultLanguage, languages, type ContentImage, type LanguageCode} from '$lib/site-content'

  type SeoType = 'website' | 'article'

  type Props = {
    title: string
    description?: string
    image?: ContentImage
    type?: SeoType
    noindex?: boolean
    jsonLd?: JsonLd | JsonLd[]
    pagination?: {page: number; totalPages: number}
  }

  let {
    title,
    description,
    image,
    type = 'website',
    noindex = false,
    jsonLd,
    pagination,
  }: Props = $props()

  const jsonLdHtml = $derived(
    (jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [])
      .map(
        (item) =>
          `<script type="application/ld+json">${JSON.stringify(item).replace(/</g, '\\u003c')}<\/script>`,
      )
      .join(''),
  )

  const queryFor = (language: LanguageCode, pageNumber = pagination?.page ?? 1) => {
    const params = new URLSearchParams()
    if (language !== defaultLanguage) params.set('lang', language)
    if (pageNumber > 1) params.set('page', String(pageNumber))
    const query = params.toString()
    return query ? `?${query}` : ''
  }
  const languageFromUrl = (value: string | null): LanguageCode =>
    languages.some((option) => option.code === value) ? (value as LanguageCode) : defaultLanguage
  const absoluteUrl = (url: string | undefined) => {
    if (!url) return undefined
    if (/^https?:\/\//i.test(url)) return url
    return `${page.url.origin}${url.startsWith('/') ? url : `/${url}`}`
  }

  const language = $derived(languageFromUrl(page.url.searchParams.get('lang')))
  const currentPage = $derived(
    pagination
      ? Math.min(Math.max(1, pagination.page), Math.max(1, pagination.totalPages))
      : 1,
  )
  const pagedTitle = $derived(
    currentPage > 1
      ? `${title} · ${language === 'en' ? 'Page' : 'Página'} ${currentPage}`
      : title,
  )
  const fullTitle = $derived(titleWithSiteName(pagedTitle))
  const metaDescription = $derived(seoDescription(language, description))
  const canonicalUrl = $derived(
    `${page.url.origin}${page.url.pathname}${queryFor(language, currentPage)}`,
  )
  const defaultUrl = $derived(
    `${page.url.origin}${page.url.pathname}${queryFor(defaultLanguage, currentPage)}`,
  )
  const pageUrl = (pageNumber: number) =>
    `${page.url.origin}${page.url.pathname}${queryFor(language, pageNumber)}`
  const imageUrl = $derived(absoluteUrl(image?.url) ?? absoluteUrl(defaultShareImagePath))
  const imageAlt = $derived(cleanSeoText(image?.alt || siteName, 120))
</script>

<svelte:head>
  <title>{fullTitle}</title>
  <meta name="description" content={metaDescription} />
  <link rel="canonical" href={canonicalUrl} />
  {#each languages as option}
    <link rel="alternate" hreflang={option.code} href={`${page.url.origin}${page.url.pathname}${queryFor(option.code, currentPage)}`} />
  {/each}
  <link rel="alternate" hreflang="x-default" href={defaultUrl} />
  {#if pagination && currentPage > 1}
    <link rel="prev" href={pageUrl(currentPage - 1)} />
  {/if}
  {#if pagination && currentPage < pagination.totalPages}
    <link rel="next" href={pageUrl(currentPage + 1)} />
  {/if}

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

  {#if jsonLdHtml}
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html jsonLdHtml}
  {/if}
</svelte:head>

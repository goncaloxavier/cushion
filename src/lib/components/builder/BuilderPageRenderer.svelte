<script lang="ts">
  import {onMount} from 'svelte'
  import Reveal from '$lib/components/Reveal.svelte'
  import CollectionCard from '$lib/components/CollectionCard.svelte'
  import LandingCollectionSection from '$lib/components/landing/LandingCollectionSection.svelte'
  import LandingImpactSection from '$lib/components/landing/LandingImpactSection.svelte'
  import LandingPartnersSection from '$lib/components/landing/LandingPartnersSection.svelte'
  import StoreMediaGallery from '$lib/components/StoreMediaGallery.svelte'
  import BuilderMedia from './BuilderMedia.svelte'
  import BuilderProductFeatureSection from './BuilderProductFeatureSection.svelte'
  import BuilderRichText from './BuilderRichText.svelte'
  import BuilderSectionHeading from './BuilderSectionHeading.svelte'
  import {
    boundedBuilderNumber,
    builderFontFamily,
    builderLocalized,
    builderTypographyStyle,
  } from '$lib/builder/content'
  import type {
    BuilderCard,
    BuilderMedia as BuilderMediaValue,
    BuilderPage,
    BuilderSection,
    BuilderSiteSettings,
    BuilderStat,
  } from '$lib/builder/types'
  import type {SitePageDocument} from '$lib/site-editor/types'
  import {
    blogImageFallback,
    caseStudyImageFallback,
    imageFor,
    productImageFallback,
    storeCategoryLabel,
    type LanguageCode,
    type PartnerItem,
    type SiteContent,
    type StoreProductMedia,
  } from '$lib/site-content'
  import {
    builderAssetUrl,
    builderImageAspectRatio,
    builderVideoMimeType,
    builderYoutubeEmbedUrl,
  } from '$lib/builder/media'
  import {sizedImage} from '$lib/image'
  import {textAppearanceStyle} from '$lib/text-appearance'
  import '$lib/styles/builder-renderer.css'

  let {
    page,
    settings,
    content,
    language,
    dataset,
    preview = false,
    embedded = false,
    listenForState = true,
    externalSelectedSectionKey,
    dataAttribute,
    onpagechange,
  } = $props<{
    page: BuilderPage | SitePageDocument | null
    settings: BuilderSiteSettings | null
    content: SiteContent
    language: LanguageCode
    dataset: string
    preview?: boolean
    embedded?: boolean
    listenForState?: boolean
    externalSelectedSectionKey?: string
    dataAttribute?: (path: string) => string | undefined
    onpagechange?: (page: BuilderPage | SitePageDocument) => void
  }>()

  let currentPage = $state<BuilderPage | SitePageDocument | null>(null)
  let currentSettings = $state<BuilderSiteSettings | null>(null)
  let selectedSectionKey = $state<string>()

  $effect(() => {
    currentPage = page
  })
  $effect(() => {
    currentSettings = settings
  })
  $effect(() => {
    if (!listenForState) selectedSectionKey = externalSelectedSectionKey
  })

  const safeHex = (value: string | undefined, fallback: string) =>
    /^#[0-9a-f]{6}$/i.test(value || '') ? value! : fallback

  const themeStyle = $derived.by(() => {
    const theme = currentSettings?.theme
    return [
      `--builder-text:${safeHex(theme?.textColor, '#10231f')}`,
      `--builder-muted:${safeHex(theme?.mutedColor, '#49605a')}`,
      `--builder-deep:${safeHex(theme?.deepColor, '#073f45')}`,
      // #2f8b69 gives white button labels 4.19:1. This is the nearest green that
      // clears 4.5:1 — a difference of a couple of steps, and the difference
      // between a compliant button and one that is not.
      `--builder-green:${safeHex(theme?.greenColor, '#2b8261')}`,
      `--builder-blue:${safeHex(theme?.blueColor, '#17657a')}`,
      `--builder-yellow:${safeHex(theme?.yellowColor, '#d7bd35')}`,
      `--builder-fog:${safeHex(theme?.fogColor, '#eef7f3')}`,
      `--builder-mint:${safeHex(theme?.mintColor, '#dcefe7')}`,
      `--builder-radius:${boundedBuilderNumber(theme?.radius, 0, 16, 6)}px`,
      `--builder-heading-font:${builderFontFamily(theme?.headingFont, "'Space Grotesk', Arial, sans-serif")}`,
      `--builder-body-font:${builderFontFamily(theme?.bodyFont, "'Space Grotesk', Arial, sans-serif")}`,
    ].join(';')
  })

  const surface = (section: BuilderSection) =>
    ['white', 'fog', 'mint', 'deep', 'blue', 'transparent'].includes(
      section.layout?.surface || '',
    )
      ? section.layout?.surface
      : 'fog'

  const width = (section: BuilderSection) =>
    ['narrow', 'content', 'wide', 'full'].includes(section.layout?.width || '')
      ? section.layout?.width
      : 'wide'

  const spacingStyle = (section: BuilderSection) => {
    const spacing = section.layout?.spacing
    const top = boundedBuilderNumber(spacing?.top, 0, 240, 64)
    const bottom = boundedBuilderNumber(spacing?.bottom, 0, 240, 64)
    const sides = boundedBuilderNumber(spacing?.sides, 0, 120, 24)
    const minimum =
      section._type === 'builderHeroSection'
        ? boundedBuilderNumber(section.minHeight, 320, 1080, 640)
        : 0
    return `--builder-space-top:${top}px;--builder-space-bottom:${bottom}px;--builder-space-sides:${sides}px;--builder-min-height:${minimum}px`
  }

  const columnsStyle = (section: BuilderSection, fallback: number) => {
    const desktop = boundedBuilderNumber(section.layout?.columns, 1, 4, fallback)
    const mobile = boundedBuilderNumber(section.layout?.mobileColumns, 1, 2, 1)
    const gap = boundedBuilderNumber(section.layout?.gap, 0, 96, 24)
    return `--builder-columns:${desktop};--builder-mobile-columns:${mobile};--builder-gap:${gap}px`
  }

  const sectionMedia = (section: BuilderSection) => section.items as BuilderMediaValue[] | undefined
  const sectionCards = (section: BuilderSection) => section.items as BuilderCard[] | undefined
  const sectionStats = (section: BuilderSection) => section.items as BuilderStat[] | undefined

  const keyedPath = (collection: string, key: string | undefined, index?: number) =>
    key
      ? `${collection}[_key=="${key.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"]`
      : `${collection}[${index ?? 0}]`

  const sectionPath = (section: BuilderSection, path?: string) => {
    const base = keyedPath('sections', section._key)
    return path ? `${base}.${path}` : base
  }

  const sectionDataAttribute = (section: BuilderSection, path?: string) =>
    dataAttribute?.(sectionPath(section, path))

  const sectionDataAttributeFor = (section: BuilderSection) => (path: string) =>
    sectionDataAttribute(section, path)

  const sectionGalleryMedia = (section: BuilderSection): StoreProductMedia[] =>
    (sectionMedia(section) ?? []).flatMap((media, index) => {
      const imageRef = media.image?.asset?._ref
      const videoRef = media.videoFile?.asset?._ref
      const posterRef = media.poster?.asset?._ref
      const imageUrl = builderAssetUrl(imageRef, dataset)
      const videoUrl = builderAssetUrl(videoRef, dataset)
      const posterUrl = builderAssetUrl(posterRef, dataset)
      const embedUrl = builderYoutubeEmbedUrl(media.youtubeUrl)
      const caption = builderLocalized(media.caption, language)
      const alt =
        builderLocalized(media.alt, language) ||
        caption ||
        content.common.zoomImage
      const poster = posterUrl
        ? {
            url: posterUrl,
            alt,
            aspectRatio: builderImageAspectRatio(posterRef),
          }
        : undefined

      if (media.kind === 'video' && videoUrl) {
        return [
          {
            type: 'video' as const,
            url: videoUrl,
            title: alt,
            mimeType: builderVideoMimeType(videoRef),
            poster,
            captionsUrl: builderAssetUrl(media.captions?.asset?._ref, dataset) || undefined,
            caption,
            editPath: keyedPath('items', media._key, index),
          },
        ]
      }

      if (media.kind === 'youtube' && embedUrl) {
        return [
          {
            type: 'embed' as const,
            provider: 'youtube' as const,
            url: embedUrl,
            title: alt,
            poster,
            caption,
            editPath: keyedPath('items', media._key, index),
          },
        ]
      }

      if (!imageUrl) return []
      return [
        {
          type: 'image' as const,
          url: imageUrl,
          alt,
          aspectRatio: builderImageAspectRatio(imageRef),
          caption,
          editPath: keyedPath('items', media._key, index),
        },
      ]
    })

  const landingVariant = (section: BuilderSection) =>
    ['landing-solutions', 'landing-work', 'landing-impact', 'landing-partners'].includes(
      section.variant || '',
    )
      ? section.variant
      : undefined

  const landingSectionClass = (section: BuilderSection) => {
    if (section.variant === 'landing-solutions') return 'home-solutions'
    if (section.variant === 'landing-work') return 'home-work'
    if (section.variant === 'landing-impact') return 'home-impact-ledger'
    if (section.variant === 'landing-partners') return 'home-partners-section'
    return ''
  }

  const internalHref = (href: string | undefined) => {
    const safe = href?.trim() || '/'
    if (!safe.startsWith('/') || safe.includes('lang=')) return safe
    return `${safe}${safe.includes('?') ? '&' : '?'}lang=${language}`
  }

  const landingAction = (section: BuilderSection) => {
    const action = section.actions?.[0]
    const label = builderLocalized(action?.label, language)
    if (!action || !label) return undefined
    return {
      label,
      href: internalHref(action.href),
      style: textAppearanceStyle(action.label),
    }
  }

  /**
   * Sections whose entire output is the content typed into them. Anything else
   * — a collection list, a contact block — draws itself from elsewhere and is
   * never empty just because its own fields are.
   */
  const contentOnlySections = new Set([
    'builderHeroSection',
    'builderMediaSection',
    'builderRichTextSection',
    'builderGallerySection',
    'builderCardsSection',
    'builderStatsSection',
    'builderPartnersSection',
    'builderCtaSection',
  ])

  const hasRenderableMedia = (media: unknown) => {
    const value = media as Record<string, any> | undefined
    return Boolean(
      value?.image?.asset?._ref ||
        value?.videoFile?.asset?._ref ||
        String(value?.youtubeUrl ?? '').trim(),
    )
  }

  /**
   * Whether a visitor would see anything at all. A section the client added from
   * the picker and has not filled in yet renders as a band of empty colour on
   * the live page — it is skipped here instead. The editor still renders it, with
   * its placeholders, so nothing disappears from the person working on it.
   */
  const rendersSomethingPublic = (section: BuilderSection) => {
    if (!contentOnlySections.has(section._type)) return true
    // Landing blocks draw their content from the CMS collections, not from the
    // section's own fields — empty fields there mean nothing.
    if (landingVariant(section) || section.variant === 'product-feature') return true

    // A rich-text body is an article array, not a string, and builderLocalized
    // calls .trim() on whatever it finds — handing it an array throws, which
    // killed hydration and took every section on the page with it.
    const plainText = (value: unknown) => {
      const localized = value as Record<string, unknown> | undefined
      const candidate = localized?.[language] ?? localized?.pt
      return typeof candidate === 'string' ? candidate.trim() : ''
    }

    if ([section.eyebrow, section.title, section.body].some((value) => plainText(value))) return true

    const body = (section as Record<string, any>).body
    if (Array.isArray(body?.[language]) && body[language].length) return true
    if (Array.isArray(body?.pt) && body.pt.length) return true

    if (hasRenderableMedia(section.media)) return true
    if ((section.items as unknown[] | undefined)?.length) return true
    if ((section.actions as unknown[] | undefined)?.length) return true

    return false
  }

  const firstPublicSectionKey = $derived.by(
    () =>
      currentPage?.sections.find(
        (section) =>
          section._type !== 'builderManagedSection' &&
          section.enabled !== false &&
          rendersSomethingPublic(section),
      )?._key,
  )

  const collectionItems = (section: BuilderSection) => {
    const limit = boundedBuilderNumber(section.limit, 1, 24, 6)
    if (section.source === 'storeProduct') {
      return content.storeProducts.slice(0, limit).map((item) => ({
        key: item.slug,
        title: item.title,
        meta: storeCategoryLabel(content.storePage, item.category),
        description: '',
        slug: item.slug,
        textAppearance: item.textAppearance,
        image: imageFor(item, productImageFallback),
        href: `/loja/${item.slug}?lang=${language}`,
      }))
    }
    if (section.source === 'caseStudy') {
      return content.caseStudies.filter((item) => item.active !== false).slice(0, limit).map((item) => ({
        key: item.slug,
        title: item.title,
        meta: item.location,
        description: item.summary ?? '',
        slug: item.slug,
        textAppearance: item.textAppearance,
        image: imageFor(item, caseStudyImageFallback),
        href: `/casos-de-estudo/${item.slug}?lang=${language}`,
      }))
    }
    if (section.source === 'blogPost') {
      return content.blogPosts.slice(0, limit).map((item) => ({
        key: item.slug,
        title: item.title,
        meta: item.category,
        description: item.excerpt ?? '',
        slug: item.slug,
        textAppearance: item.textAppearance,
        image: imageFor(item, blogImageFallback),
        href: `/blog/${item.slug}?lang=${language}`,
      }))
    }
    return content.products.filter((item) => item.active !== false).slice(0, limit).map((item) => ({
      key: item.slug,
      title: item.title,
      meta: '',
      description: item.description ?? '',
      slug: item.slug,
      textAppearance: item.textAppearance,
      image: imageFor(item, productImageFallback),
      href: `/produtos/${item.slug}?lang=${language}`,
    }))
  }

  const contactAction = (section: BuilderSection) => {
    if (section.formKind === 'catalogue') {
      return {href: `/catalogo?lang=${language}`, label: content.nav.catalogue}
    }
    if (section.formKind === 'quote') {
      return {href: `/contacto?lang=${language}`, label: content.common.requestQuote}
    }
    return {href: `/contacto?lang=${language}`, label: content.nav.contact}
  }

  const blockPreviewNavigation = (event: MouseEvent) => {
    if (preview) event.preventDefault()
  }

  const containPreviewNavigation = (node: HTMLElement, active: boolean) => {
    let enabled = active
    const handleClick = (event: MouseEvent) => {
      if (enabled && (event.target as HTMLElement).closest('a')) event.preventDefault()
    }

    node.addEventListener('click', handleClick)
    return {
      update(next: boolean) {
        enabled = next
      },
      destroy() {
        node.removeEventListener('click', handleClick)
      },
    }
  }

  const landingPartners = (section: BuilderSection): PartnerItem[] =>
    (section.items ?? []).flatMap((partner, index) => {
      const item = partner as Record<string, any>
      const logoUrl =
        builderAssetUrl(item.logo?.asset?._ref, dataset) ||
        (typeof item.logo?.url === 'string' ? item.logo.url : '')
      const name = String(item.name || `Parceiro ${index + 1}`)
      if (!logoUrl || !name) return []
      return [{
        name,
        url: typeof item.url === 'string' ? item.url : '',
        logo: {
          url: logoUrl,
          alt: builderLocalized(item.logo?.alt, language) || name,
        },
        logoTone: item.logoTone === 'dark' ? 'dark' : 'light',
        text: builderLocalized(item.text, language),
      }]
    })

  const chooseSection = (event: MouseEvent, key: string) => {
    if (!preview) return
    event.preventDefault()
    event.stopPropagation()
    selectedSectionKey = key
    window.parent.postMessage({type: 'df4y:builder-select', sectionKey: key}, window.location.origin)
  }

  onMount(() => {
    if (!preview || !listenForState) return

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== window.parent) return
      if (!event.data || typeof event.data !== 'object') return

      if (event.data.type === 'df4y:builder-state') {
        if (event.data.page?._type === 'builderPage' || event.data.page?._type === 'sitePage') {
          currentPage = event.data.page
          onpagechange?.(event.data.page)
        }
        if (event.data.settings?._type === 'builderSiteSettings') {
          currentSettings = event.data.settings
        }
        selectedSectionKey = event.data.selectedSectionKey || undefined
      }
      if (event.data.type === 'df4y:builder-focus') {
        selectedSectionKey = event.data.sectionKey || undefined
        const node = event.data.sectionKey
          ? document.querySelector(`[data-builder-section="${CSS.escape(event.data.sectionKey)}"]`)
          : null
        node?.scrollIntoView({behavior: 'smooth', block: 'center'})
      }
    }

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || !selectedSectionKey) return
      selectedSectionKey = undefined
      window.parent.postMessage({type: 'df4y:site-editor:clear-selection'}, window.location.origin)
    }

    let receivedBuilderState = false
    let readyAttempts = 0
    let readyTimer: number | undefined
    const announceReady = () => {
      if (receivedBuilderState || readyAttempts >= 20) return
      readyAttempts += 1
      window.parent.postMessage({type: 'df4y:builder-ready'}, window.location.origin)
      readyTimer = window.setTimeout(announceReady, 250)
    }

    const receiveState = (event: MessageEvent) => {
      if (
        event.origin === window.location.origin &&
        event.source === window.parent &&
        event.data?.type === 'df4y:builder-state'
      ) {
        receivedBuilderState = true
        window.clearTimeout(readyTimer)
      }
      handleMessage(event)
    }

    window.addEventListener('message', receiveState)
    window.addEventListener('keydown', handleKeydown)
    announceReady()
    return () => {
      window.clearTimeout(readyTimer)
      window.removeEventListener('message', receiveState)
      window.removeEventListener('keydown', handleKeydown)
    }
  })
</script>

<div
  class="builder-page"
  class:is-preview={preview}
  class:is-embedded={embedded}
  style={themeStyle}
  data-builder-page={currentPage?.route ?? ''}
>
  {#if currentPage}
    {#each currentPage.sections as section (section._key)}
      {#if section._type !== 'builderManagedSection' && (preview || (section.enabled !== false && rendersSomethingPublic(section)))}
        <section
          id={section.anchor || undefined}
          class={`builder-render-section is-${surface(section)} is-${section._type} ${landingSectionClass(section)}`}
          class:is-product-feature={section.variant === 'product-feature'}
          class:is-selected={preview && selectedSectionKey === section._key}
          class:is-hidden={preview && section.enabled === false}
          style={spacingStyle(section)}
          data-builder-section={section._key}
        >
          {#if preview}
            <button
              type="button"
              class="builder-section-hit-area"
              aria-label={`Editar ${section.internalLabel || 'secção'}`}
              onclick={(event) => chooseSection(event, section._key)}
            >Editar secção</button>
          {/if}
          {#if preview && section.enabled === false}
            <span class="builder-hidden-badge">Oculta no site</span>
          {:else if preview && !rendersSomethingPublic(section)}
            <!-- An empty section is skipped for visitors rather than published as
                 a band of blank colour. Saying so here is the difference between
                 that and the section quietly not existing: the editor shows it,
                 the site does not, and without this badge the two disagree with
                 no explanation. -->
            <span class="builder-hidden-badge is-empty">Vazia — não aparece no site</span>
          {/if}
          {#if preview && section.enabled !== false && !rendersSomethingPublic(section)}
            <!-- The badge above says the same thing, at 11px, in a corner. For an
                 empty gallery that badge floats over nothing at all, which is
                 exactly how a client kept an unfilled gallery on a live page: the
                 editor had told him, somewhere he was never going to look. This
                 says it where the missing content would be. -->
            <div class="builder-section-empty">
              <strong>Esta secção ainda está vazia</strong>
              <span>
                Sem conteúdo, não aparece no site. Use “Editar secção” para adicionar
                imagens ou texto.
              </span>
            </div>
          {/if}
          <div
            class={`builder-render-inner is-${width(section)}`}
            class:is-landing={Boolean(landingVariant(section))}
            use:containPreviewNavigation={preview}
          >
            {#if section.variant === 'landing-solutions' || section.variant === 'landing-work'}
              <LandingCollectionSection
                variant={section.variant === 'landing-work' ? 'work' : 'solutions'}
                eyebrow={builderLocalized(section.eyebrow, language)}
                title={builderLocalized(section.title, language)}
                eyebrowStyle={textAppearanceStyle(section.eyebrow)}
                titleStyle={`${builderTypographyStyle(section.titleStyle, 'title')};${textAppearanceStyle(section.title)}`}
                items={collectionItems(section).map((item) => ({
                  ...item,
                  description: section.variant === 'landing-work' ? '' : item.description,
                  transitionName: item.slug ? `vt-${item.slug}` : '',
                }))}
                action={landingAction(section)}
                dataAttribute={sectionDataAttributeFor(section)}
                {preview}
              />
            {:else if section.variant === 'landing-impact'}
              <LandingImpactSection
                title={builderLocalized(section.title, language)}
                titleStyle={`${builderTypographyStyle(section.titleStyle, 'title')};${textAppearanceStyle(section.title)}`}
                items={(sectionStats(section) ?? []).map((item, index) => ({
                  key: item._key || String(index),
                  value: builderLocalized(item.value, language) || '0',
                  label: builderLocalized(item.label, language),
                  valueStyle: textAppearanceStyle(item.value),
                  labelStyle: textAppearanceStyle(item.label),
                }))}
                dataAttribute={sectionDataAttributeFor(section)}
                {preview}
              />
            {:else if section.variant === 'landing-partners'}
              <LandingPartnersSection
                eyebrow={builderLocalized(section.eyebrow, language)}
                title={builderLocalized(section.title, language)}
                body={builderLocalized(
                  Array.isArray(section.body) ? undefined : section.body,
                  language,
                )}
                eyebrowStyle={textAppearanceStyle(section.eyebrow)}
                titleStyle={`${builderTypographyStyle(section.titleStyle, 'title')};${textAppearanceStyle(section.title)}`}
                bodyStyle={`${builderTypographyStyle(section.bodyStyle, 'body')};${textAppearanceStyle(Array.isArray(section.body) ? undefined : section.body)}`}
                items={landingPartners(section)}
                dataAttribute={sectionDataAttributeFor(section)}
                {preview}
              />
            {:else if section.variant === 'product-feature' && section._type === 'builderMediaSection'}
              <BuilderProductFeatureSection
                {section}
                {dataset}
                {language}
                {preview}
                dataAttribute={sectionDataAttributeFor(section)}
              />
            {:else}
            <Reveal
              variant={section._type === 'builderHeroSection' ? 'hero' : 'panel'}
              priority={preview || section._key === firstPublicSectionKey}
            >
              {#if section._type === 'builderHeroSection'}
                <div class={`builder-hero is-${section.variant ?? 'split'}`}>
                  <BuilderSectionHeading {section} {language} {preview} surface={surface(section)} theme={currentSettings?.theme} dataAttribute={sectionDataAttributeFor(section)} />
                  <BuilderMedia media={section.media} {dataset} {language} {preview} dataAttribute={sectionDataAttribute(section, 'media')} />
                </div>
              {:else if section._type === 'builderMediaSection'}
                <div class={`builder-media-copy is-${section.mediaSide ?? 'right'}`}>
                  {#if section.mediaSide === 'left' || section.mediaSide === 'top'}
                    <BuilderMedia media={section.media} {dataset} {language} {preview} dataAttribute={sectionDataAttribute(section, 'media')} />
                  {/if}
                  <BuilderSectionHeading {section} {language} {preview} surface={surface(section)} theme={currentSettings?.theme} dataAttribute={sectionDataAttributeFor(section)} />
                  {#if section.mediaSide !== 'left' && section.mediaSide !== 'top'}
                    <BuilderMedia media={section.media} {dataset} {language} {preview} dataAttribute={sectionDataAttribute(section, 'media')} />
                  {/if}
                </div>
              {:else if section._type === 'builderRichTextSection'}
                <div class="builder-editorial">
                  <BuilderSectionHeading {section} {language} {preview} surface={surface(section)} theme={currentSettings?.theme} dataAttribute={sectionDataAttributeFor(section)} />
                  <BuilderRichText value={section.body} {language} {dataset} dataAttribute={sectionDataAttribute(section, `body.${language}`)} />
                </div>
              {:else if section._type === 'builderGallerySection'}
                <BuilderSectionHeading {section} {language} {preview} surface={surface(section)} theme={currentSettings?.theme} dataAttribute={sectionDataAttributeFor(section)} />
                {@const galleryMedia = sectionGalleryMedia(section)}
                {#if (section.presentation ?? 'gallery') === 'gallery' && galleryMedia.length}
                  <StoreMediaGallery
                    media={galleryMedia}
                    label={content.common.zoomImage}
                    closeLabel={content.common.close}
                    className="builder-interactive-gallery"
                    sizes="(max-width: 900px) calc(100vw - 3rem), (max-width: 1400px) calc(100vw - 6rem), 1280px"
                    dataAttribute={sectionDataAttributeFor(section)}
                    fallbackEditPath="items"
                  />
                {:else}
                  <div
                    class={`builder-grid builder-gallery is-${section.presentation ?? 'gallery'}`}
                    style={columnsStyle(section, 3)}
                  >
                    {#each sectionMedia(section) ?? [] as media, index (media._key)}
                      <BuilderMedia {media} {dataset} {language} {preview} dataAttribute={sectionDataAttribute(section, keyedPath('items', media._key, index))} />
                    {:else}
                      <div class="builder-empty-state">Adicione imagens ou vídeos</div>
                    {/each}
                  </div>
                {/if}
              {:else if section._type === 'builderCardsSection'}
                <BuilderSectionHeading {section} {language} {preview} surface={surface(section)} theme={currentSettings?.theme} dataAttribute={sectionDataAttributeFor(section)} />
                <div class="builder-grid builder-card-grid" style={columnsStyle(section, 3)}>
                  {#each sectionCards(section) ?? [] as card, index (card._key)}
                    {@const cardPath = keyedPath('items', card._key, index)}
                    <article class="builder-card">
                      {#if card.media}
                        <BuilderMedia media={card.media} {dataset} {language} {preview} dataAttribute={sectionDataAttribute(section, `${cardPath}.media`)} />
                      {/if}
                      {#if builderLocalized(card.eyebrow, language)}
                        <small class="cms-styled-text" style={textAppearanceStyle(card.eyebrow)} data-sanity={sectionDataAttribute(section, `${cardPath}.eyebrow.${language}`)}>{builderLocalized(card.eyebrow, language)}</small>
                      {/if}
                      <h3 class="cms-styled-text" style={textAppearanceStyle(card.title)} data-sanity={sectionDataAttribute(section, `${cardPath}.title.${language}`)}>{builderLocalized(card.title, language) || 'Cartão sem título'}</h3>
                      <p class="cms-styled-text" style={textAppearanceStyle(card.body)} data-sanity={sectionDataAttribute(section, `${cardPath}.body.${language}`)}>{builderLocalized(card.body, language)}</p>
                    </article>
                  {:else}
                    <div class="builder-empty-state">Adicione cartões</div>
                  {/each}
                </div>
              {:else if section._type === 'builderStatsSection'}
                <BuilderSectionHeading {section} {language} {preview} surface={surface(section)} theme={currentSettings?.theme} dataAttribute={sectionDataAttributeFor(section)} />
                <div class="builder-grid builder-stats" style={columnsStyle(section, 4)}>
                  {#each sectionStats(section) ?? [] as stat, index (stat._key)}
                    {@const statPath = keyedPath('items', stat._key, index)}
                    <article>
                      <strong class="cms-styled-text" style={textAppearanceStyle(stat.value)} data-sanity={sectionDataAttribute(section, `${statPath}.value.${language}`)}>{builderLocalized(stat.value, language) || '0'}</strong>
                      <span class="cms-styled-text" style={textAppearanceStyle(stat.label)} data-sanity={sectionDataAttribute(section, `${statPath}.label.${language}`)}>{builderLocalized(stat.label, language)}</span>
                    </article>
                  {:else}
                    <div class="builder-empty-state">Adicione números de impacto</div>
                  {/each}
                </div>
              {:else if section._type === 'builderCollectionSection'}
                <BuilderSectionHeading {section} {language} {preview} surface={surface(section)} theme={currentSettings?.theme} dataAttribute={sectionDataAttributeFor(section)} />
                <div class="builder-grid builder-collection" style={columnsStyle(section, 3)}>
                  {#each collectionItems(section) as item, index}
                    <CollectionCard
                      href={item.href}
                      title={item.title}
                      description={item.description}
                      meta={item.meta}
                      image={item.image}
                      textAppearance={item.textAppearance}
                      transitionName={item.slug ? `vt-${item.slug}` : ''}
                      {index}
                      {preview}
                    />
                  {/each}
                </div>
              {:else if section._type === 'builderPartnersSection'}
                <BuilderSectionHeading {section} {language} {preview} surface={surface(section)} theme={currentSettings?.theme} dataAttribute={sectionDataAttributeFor(section)} />
                <div class="builder-grid builder-partners" style={columnsStyle(section, 4)}>
                  {#each section.items ?? [] as partner, index}
                    {@const item = partner as Record<string, any>}
                    {@const partnerPath = keyedPath('items', item._key, index)}
                    {@const logoUrl = builderAssetUrl(item.logo?.asset?._ref, dataset)}
                    {@const name = String(item.name || `Parceiro ${index + 1}`)}
                    <svelte:element
                      this={item.url ? 'a' : 'article'}
                      class="builder-partner"
                      href={!preview ? item.url || undefined : undefined}
                      target={item.url ? '_blank' : undefined}
                      rel={item.url ? 'noreferrer' : undefined}
                    >
                      {#if logoUrl}
                        <span class="builder-partner-logo" data-logo-tone={item.logoTone || 'light'}>
                          <img
                            data-sanity={sectionDataAttribute(section, `${partnerPath}.logo`)}
                            src={sizedImage(logoUrl, 320)}
                            alt={builderLocalized(item.logo?.alt, language) || name}
                            loading="lazy"
                            decoding="async"
                          />
                        </span>
                      {/if}
                      <strong data-sanity={sectionDataAttribute(section, `${partnerPath}.name`)}>{name}</strong>
                      {#if builderLocalized(item.text, language)}
                        <span class="builder-partner-text" data-sanity={sectionDataAttribute(section, `${partnerPath}.text.${language}`)}>{builderLocalized(item.text, language)}</span>
                      {/if}
                    </svelte:element>
                  {:else}
                    <div class="builder-empty-state">Adicione parceiros</div>
                  {/each}
                </div>
              {:else if section._type === 'builderCtaSection'}
                {#if section.media}
                  <div class="builder-cta-media">
                    <BuilderMedia media={section.media} {dataset} {language} {preview} dataAttribute={sectionDataAttribute(section, 'media')} />
                  </div>
                {/if}
                <BuilderSectionHeading {section} {language} {preview} surface={surface(section)} theme={currentSettings?.theme} dataAttribute={sectionDataAttributeFor(section)} />
              {:else if section._type === 'builderContactSection'}
                <div class="builder-contact-preview">
                  <BuilderSectionHeading {section} {language} {preview} surface={surface(section)} theme={currentSettings?.theme} dataAttribute={sectionDataAttributeFor(section)} />
                  <div class="builder-contact-action">
                    {#if section.showContactDetails !== false}
                      <div>
                        <a href={`mailto:${content.common.contactEmail}`}>
                          {content.common.contactEmail}
                        </a>
                        <a href={`tel:${content.common.contactPhone.replace(/\s+/g, '')}`}>
                          {content.common.contactPhone}
                        </a>
                      </div>
                    {/if}
                    <a
                      class="builder-action is-primary"
                      href={contactAction(section).href}
                      onclick={blockPreviewNavigation}
                    >
                      {contactAction(section).label}
                    </a>
                  </div>
                </div>
              {:else}
                <BuilderSectionHeading {section} {language} {preview} surface={surface(section)} theme={currentSettings?.theme} dataAttribute={sectionDataAttributeFor(section)} />
              {/if}
            </Reveal>
            {/if}
          </div>
        </section>
      {/if}
    {/each}
  {:else}
    <section class="builder-preview-waiting" aria-live="polite">
      <strong>A preparar a página…</strong>
    </section>
  {/if}
</div>

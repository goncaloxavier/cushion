<script lang="ts">
  import {onMount} from 'svelte'
  import Reveal from '$lib/components/Reveal.svelte'
  import CollectionCard from '$lib/components/CollectionCard.svelte'
  import LandingCollectionSection from '$lib/components/landing/LandingCollectionSection.svelte'
  import LandingImpactSection from '$lib/components/landing/LandingImpactSection.svelte'
  import LandingPartnersSection from '$lib/components/landing/LandingPartnersSection.svelte'
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
  } from '$lib/site-content'
  import {builderAssetUrl} from '$lib/builder/media'
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

  const sectionActions = (section: BuilderSection) =>
    (section.actions ?? [])
      .map((action) => ({
        key: String((action as Record<string, unknown>)._key ?? ''),
        label: builderLocalized(action.label, language),
        href: internalHref(action.href),
        style: textAppearanceStyle(action.label),
      }))
      .filter((action) => action.label)

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
      return content.caseStudies.slice(0, limit).map((item) => ({
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
    return content.products.slice(0, limit).map((item) => ({
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
            ></button>
          {/if}
          {#if preview && section.enabled === false}
            <span class="builder-hidden-badge">Oculta no site</span>
          {/if}
          <div
            class={`builder-render-inner is-${width(section)}`}
            class:is-landing={Boolean(landingVariant(section))}
            inert={preview}
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
                {preview}
              />
            {:else if section.variant === 'product-feature' && section._type === 'builderMediaSection'}
              <BuilderProductFeatureSection {section} {dataset} {language} />
            {:else}
            <Reveal variant={section._type === 'builderHeroSection' ? 'hero' : 'panel'} priority={preview}>
              {#if section._type === 'builderHeroSection'}
                <div class={`builder-hero is-${section.variant ?? 'split'}`}>
                  <BuilderSectionHeading {section} {language} {preview} surface={surface(section)} theme={currentSettings?.theme} />
                  <BuilderMedia media={section.media} {dataset} {language} {preview} />
                </div>
              {:else if section._type === 'builderMediaSection'}
                <div class={`builder-media-copy is-${section.mediaSide ?? 'right'}`}>
                  {#if section.mediaSide === 'left' || section.mediaSide === 'top'}
                    <BuilderMedia media={section.media} {dataset} {language} {preview} />
                  {/if}
                  <BuilderSectionHeading {section} {language} {preview} surface={surface(section)} theme={currentSettings?.theme} />
                  {#if section.mediaSide !== 'left' && section.mediaSide !== 'top'}
                    <BuilderMedia media={section.media} {dataset} {language} {preview} />
                  {/if}
                </div>
              {:else if section._type === 'builderRichTextSection'}
                <div class="builder-editorial">
                  <BuilderSectionHeading {section} {language} {preview} surface={surface(section)} theme={currentSettings?.theme} />
                  <BuilderRichText value={section.body} {language} {dataset} />
                </div>
              {:else if section._type === 'builderGallerySection'}
                <BuilderSectionHeading {section} {language} {preview} surface={surface(section)} theme={currentSettings?.theme} />
                <div
                  class={`builder-grid builder-gallery is-${section.presentation ?? 'grid'}`}
                  style={columnsStyle(section, 3)}
                >
                  {#each sectionMedia(section) ?? [] as media (media._key)}
                    <BuilderMedia {media} {dataset} {language} {preview} />
                  {:else}
                    <div class="builder-empty-state">Adicione imagens ou vídeos</div>
                  {/each}
                </div>
              {:else if section._type === 'builderCardsSection'}
                <BuilderSectionHeading {section} {language} {preview} surface={surface(section)} theme={currentSettings?.theme} />
                <div class="builder-grid builder-card-grid" style={columnsStyle(section, 3)}>
                  {#each sectionCards(section) ?? [] as card (card._key)}
                    <article class="builder-card">
                      {#if card.media}
                        <BuilderMedia media={card.media} {dataset} {language} {preview} />
                      {/if}
                      {#if builderLocalized(card.eyebrow, language)}
                        <small class="cms-styled-text" style={textAppearanceStyle(card.eyebrow)}>{builderLocalized(card.eyebrow, language)}</small>
                      {/if}
                      <h3 class="cms-styled-text" style={textAppearanceStyle(card.title)}>{builderLocalized(card.title, language) || 'Cartão sem título'}</h3>
                      <p class="cms-styled-text" style={textAppearanceStyle(card.body)}>{builderLocalized(card.body, language)}</p>
                    </article>
                  {:else}
                    <div class="builder-empty-state">Adicione cartões</div>
                  {/each}
                </div>
              {:else if section._type === 'builderStatsSection'}
                <BuilderSectionHeading {section} {language} {preview} surface={surface(section)} theme={currentSettings?.theme} />
                <div class="builder-grid builder-stats" style={columnsStyle(section, 4)}>
                  {#each sectionStats(section) ?? [] as stat (stat._key)}
                    <article>
                      <strong class="cms-styled-text" style={textAppearanceStyle(stat.value)}>{builderLocalized(stat.value, language) || '0'}</strong>
                      <span class="cms-styled-text" style={textAppearanceStyle(stat.label)}>{builderLocalized(stat.label, language)}</span>
                    </article>
                  {:else}
                    <div class="builder-empty-state">Adicione números de impacto</div>
                  {/each}
                </div>
              {:else if section._type === 'builderCollectionSection'}
                <BuilderSectionHeading {section} {language} {preview} surface={surface(section)} theme={currentSettings?.theme} />
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
                <BuilderSectionHeading {section} {language} {preview} surface={surface(section)} theme={currentSettings?.theme} />
                <div class="builder-grid builder-partners" style={columnsStyle(section, 4)}>
                  {#each section.items ?? [] as partner, index}
                    {@const item = partner as Record<string, any>}
                    {@const logoUrl = builderAssetUrl(item.logo?.asset?._ref, dataset)}
                    {@const name = String(item.name || `Parceiro ${index + 1}`)}
                    <svelte:element
                      this={item.url ? 'a' : 'article'}
                      class="builder-partner"
                      href={item.url || undefined}
                      target={item.url ? '_blank' : undefined}
                      rel={item.url ? 'noreferrer' : undefined}
                    >
                      {#if logoUrl}
                        <span class="builder-partner-logo" data-logo-tone={item.logoTone || 'light'}>
                          <img
                            src={sizedImage(logoUrl, 320)}
                            alt={builderLocalized(item.logo?.alt, language) || name}
                            loading="lazy"
                            decoding="async"
                          />
                        </span>
                      {/if}
                      <strong>{name}</strong>
                      {#if builderLocalized(item.text, language)}
                        <span class="builder-partner-text">{builderLocalized(item.text, language)}</span>
                      {/if}
                    </svelte:element>
                  {:else}
                    <div class="builder-empty-state">Adicione parceiros</div>
                  {/each}
                </div>
              {:else if section._type === 'builderCtaSection'}
                <!-- Offered in the picker but never rendered until now: it fell
                     through to the heading-only fallback, so a call to action
                     the client had added showed up blank on the page while the
                     editor listed it as a section. -->
                {#if section.media}
                  <div class="builder-cta-media">
                    <BuilderMedia media={section.media} {dataset} {language} {preview} />
                  </div>
                {/if}
                <BuilderSectionHeading {section} {language} {preview} surface={surface(section)} theme={currentSettings?.theme} />
                {#if sectionActions(section).length}
                  <div class="builder-cta-actions">
                    {#each sectionActions(section) as action (action.key || action.href)}
                      <a
                        class="builder-action is-primary"
                        href={action.href}
                        style={action.style}
                        onclick={blockPreviewNavigation}
                      >{action.label}</a>
                    {/each}
                  </div>
                {/if}
              {:else if section._type === 'builderContactSection'}
                <div class="builder-contact-preview">
                  <BuilderSectionHeading {section} {language} {preview} surface={surface(section)} theme={currentSettings?.theme} />
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
                <BuilderSectionHeading {section} {language} {preview} surface={surface(section)} theme={currentSettings?.theme} />
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

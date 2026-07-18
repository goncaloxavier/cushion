<script lang="ts">
  import {onMount} from 'svelte'
  import Reveal from '$lib/components/Reveal.svelte'
  import BuilderMedia from './BuilderMedia.svelte'
  import BuilderRichText from './BuilderRichText.svelte'
  import BuilderSectionHeading from './BuilderSectionHeading.svelte'
  import {
    boundedBuilderNumber,
    builderFontFamily,
    builderLocalized,
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
  import {storeCategoryLabel, type LanguageCode, type SiteContent} from '$lib/site-content'
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
  } = $props<{
    page: BuilderPage | SitePageDocument | null
    settings: BuilderSiteSettings | null
    content: SiteContent
    language: LanguageCode
    dataset: string
    preview?: boolean
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

  const safeHex = (value: string | undefined, fallback: string) =>
    /^#[0-9a-f]{6}$/i.test(value || '') ? value! : fallback

  const themeStyle = $derived.by(() => {
    const theme = currentSettings?.theme
    return [
      `--builder-text:${safeHex(theme?.textColor, '#10231f')}`,
      `--builder-muted:${safeHex(theme?.mutedColor, '#49605a')}`,
      `--builder-deep:${safeHex(theme?.deepColor, '#073f45')}`,
      `--builder-green:${safeHex(theme?.greenColor, '#2f8b69')}`,
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

  const collectionItems = (section: BuilderSection) => {
    const limit = boundedBuilderNumber(section.limit, 1, 24, 6)
    if (section.source === 'storeProduct') {
      return content.storeProducts.slice(0, limit).map((item) => ({
        title: item.title,
        meta: storeCategoryLabel(content.storePage, item.category),
        image: item.image,
        href: `/loja/${item.slug}?lang=${language}`,
      }))
    }
    if (section.source === 'caseStudy') {
      return content.caseStudies.slice(0, limit).map((item) => ({
        title: item.title,
        meta: item.location,
        image: item.image,
        href: `/casos-de-estudo/${item.slug}?lang=${language}`,
      }))
    }
    if (section.source === 'blogPost') {
      return content.blogPosts.slice(0, limit).map((item) => ({
        title: item.title,
        meta: item.category,
        image: item.image,
        href: `/blog/${item.slug}?lang=${language}`,
      }))
    }
    return content.products.slice(0, limit).map((item) => ({
      title: item.title,
      meta: '',
      image: item.image,
      href: `/produtos/${item.slug}?lang=${language}`,
    }))
  }

  const chooseSection = (event: MouseEvent, key: string) => {
    if (!preview) return
    event.preventDefault()
    event.stopPropagation()
    selectedSectionKey = key
    window.parent.postMessage({type: 'df4y:builder-select', sectionKey: key}, window.location.origin)
  }

  onMount(() => {
    if (!preview) return

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== window.parent) return
      if (!event.data || typeof event.data !== 'object') return

      if (event.data.type === 'df4y:builder-state') {
        if (event.data.page?._type === 'builderPage' || event.data.page?._type === 'sitePage') {
          currentPage = event.data.page
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

    window.addEventListener('message', handleMessage)
    window.addEventListener('keydown', handleKeydown)
    window.parent.postMessage({type: 'df4y:builder-ready'}, window.location.origin)
    return () => {
      window.removeEventListener('message', handleMessage)
      window.removeEventListener('keydown', handleKeydown)
    }
  })
</script>

<main
  class="builder-page"
  class:is-preview={preview}
  style={themeStyle}
  data-builder-page={currentPage?.route ?? ''}
>
  {#if currentPage}
    {#each currentPage.sections as section (section._key)}
      {#if section.enabled !== false || preview}
        <section
          id={section.anchor || undefined}
          class={`builder-render-section is-${surface(section)} is-${section._type}`}
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
          <div class={`builder-render-inner is-${width(section)}`} inert={preview}>
            <Reveal variant={section._type === 'builderHeroSection' ? 'hero' : 'panel'} priority={preview}>
              {#if section._type === 'builderHeroSection'}
                <div class={`builder-hero is-${section.variant ?? 'split'}`}>
                  <BuilderSectionHeading {section} {language} {preview} />
                  <BuilderMedia media={section.media} {dataset} {language} />
                </div>
              {:else if section._type === 'builderMediaSection'}
                <div class={`builder-media-copy is-${section.mediaSide ?? 'right'}`}>
                  {#if section.mediaSide === 'left' || section.mediaSide === 'top'}
                    <BuilderMedia media={section.media} {dataset} {language} />
                  {/if}
                  <BuilderSectionHeading {section} {language} {preview} />
                  {#if section.mediaSide !== 'left' && section.mediaSide !== 'top'}
                    <BuilderMedia media={section.media} {dataset} {language} />
                  {/if}
                </div>
              {:else if section._type === 'builderRichTextSection'}
                <div class="builder-editorial">
                  <BuilderSectionHeading {section} {language} {preview} />
                  <BuilderRichText value={section.body} {language} {dataset} />
                </div>
              {:else if section._type === 'builderGallerySection'}
                <BuilderSectionHeading {section} {language} {preview} />
                <div
                  class={`builder-grid builder-gallery is-${section.presentation ?? 'grid'}`}
                  style={columnsStyle(section, 3)}
                >
                  {#each sectionMedia(section) ?? [] as media (media._key)}
                    <BuilderMedia {media} {dataset} {language} />
                  {:else}
                    <div class="builder-empty-state">Adicione imagens ou vídeos</div>
                  {/each}
                </div>
              {:else if section._type === 'builderCardsSection'}
                <BuilderSectionHeading {section} {language} {preview} />
                <div class="builder-grid builder-card-grid" style={columnsStyle(section, 3)}>
                  {#each sectionCards(section) ?? [] as card (card._key)}
                    <article class="builder-card">
                      {#if card.media}
                        <BuilderMedia media={card.media} {dataset} {language} />
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
                <BuilderSectionHeading {section} {language} {preview} />
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
                <BuilderSectionHeading {section} {language} {preview} />
                {#if section.showSearch}
                  <div class="builder-search-preview">Pesquisar</div>
                {/if}
                <div class="builder-grid builder-collection" style={columnsStyle(section, 3)}>
                  {#each collectionItems(section) as item}
                    <a href={item.href} onclick={(event) => preview && event.preventDefault()}>
                      {#if item.image?.url}
                        <img src={sizedImage(item.image.url, 720)} alt={item.image.alt} loading="lazy" />
                      {:else}
                        <span class="builder-collection-media-empty"></span>
                      {/if}
                      {#if item.meta}<small>{item.meta}</small>{/if}
                      <h3>{item.title}</h3>
                    </a>
                  {/each}
                </div>
              {:else if section._type === 'builderPartnersSection'}
                <BuilderSectionHeading {section} {language} {preview} />
                <div class="builder-grid builder-partners" style={columnsStyle(section, 4)}>
                  {#each section.items ?? [] as partner, index}
                    <article>
                      <strong>{String((partner as Record<string, unknown>).name || `Parceiro ${index + 1}`)}</strong>
                    </article>
                  {:else}
                    <div class="builder-empty-state">Adicione parceiros</div>
                  {/each}
                </div>
              {:else if section._type === 'builderContactSection'}
                <div class="builder-contact-preview">
                  <BuilderSectionHeading {section} {language} {preview} />
                  <div class="builder-form-preview" aria-label="Pré-visualização do formulário">
                    <span>Nome</span><span>Email</span><span>Telefone</span><span>Mensagem</span>
                    <strong>Enviar pedido</strong>
                  </div>
                </div>
              {:else}
                <BuilderSectionHeading {section} {language} {preview} />
              {/if}
            </Reveal>
          </div>
        </section>
      {/if}
    {/each}
  {:else}
    <section class="builder-preview-waiting" aria-live="polite">
      <strong>A preparar a página…</strong>
    </section>
  {/if}
</main>

<script lang="ts">
  import {builderImageAspectRatio, builderMediaImageRef} from '$lib/builder/media'
  import {builderLocalized, builderTypographyStyle} from '$lib/builder/content'
  import {textAppearanceStyle} from '$lib/text-appearance'
  import type {BuilderSection} from '$lib/builder/types'
  import type {LanguageCode} from '$lib/site-content'
  import BuilderMedia from './BuilderMedia.svelte'

  let {
    section,
    dataset,
    language,
    preview = false,
    dataAttribute,
  } = $props<{
    section: BuilderSection
    dataset: string
    language: LanguageCode
    preview?: boolean
    dataAttribute?: (path: string) => string | undefined
  }>()

  const label = $derived(builderLocalized(section.eyebrow, language))
  const title = $derived(builderLocalized(section.title, language))
  const text = $derived(
    Array.isArray(section.body) ? '' : builderLocalized(section.body, language),
  )
  const labelStyle = $derived(
    section.labelStyle === 'pill' || section.labelStyle === 'eyebrow'
      ? section.labelStyle
      : 'caption',
  )
  const mediaSide = $derived(
    ['left', 'right', 'top', 'bottom'].includes(section.mediaSide || '')
      ? section.mediaSide
      : 'left',
  )
  const surface = $derived(
    ['fog', 'mint', 'deep', 'blue'].includes(section.layout?.surface || '')
      ? section.layout?.surface
      : 'white',
  )
  const hasCopy = $derived(Boolean(title || text || section.actions?.length || (label && labelStyle === 'eyebrow')))

  const external = (href: string | undefined) => /^https?:\/\//i.test(href || '')
  const localizedHref = (href: string | undefined) => {
    const value = href?.trim() || '/'
    if (!value.startsWith('/') || value.includes('lang=')) return value
    return `${value}${value.includes('?') ? '&' : '?'}lang=${language}`
  }

  // The frame follows the image, rather than the image being forced into the
  // frame. This was pinned at 16:9 for every image, so a portrait photo was laid
  // out at its own proportions inside a landscape box and the overflow was
  // clipped — the client reported the bottom of their composter simply missing,
  // and shrinking the file never helped because the mismatch is the ratio, not
  // the size. Video and embeds have no intrinsic ratio to read, so they keep 16:9.
  // builderMediaImageRef decides which asset is showing the same way
  // BuilderMedia does, so the frame and its contents can never disagree.
  const imageRef = $derived(builderMediaImageRef(section.media))
  const isImage = $derived(Boolean(imageRef))
  const mediaRatio = $derived(builderImageAspectRatio(imageRef) ?? 1.7778)

  const blockPreviewNavigation = (event: MouseEvent) => {
    if (preview) event.preventDefault()
  }
</script>

<div
  class={`product-content-section is-${mediaSide} is-${surface}`}
  class:has-copy={hasCopy}
  aria-label={title || builderLocalized(section.media?.alt, language) || undefined}
>
  <div class="product-content-inner">
    <!-- The ratio is declared on the group, not the frame inside it. Custom
         properties inherit downwards, so the frame still reads it — but the
         group needs it too, to cap its own width, and it cannot see a property
         its child declares. -->
    <div
      class="product-content-media-group"
      class:is-image={isImage}
      style={`--product-content-ratio: ${mediaRatio}`}
    >
      <div class="product-content-media" class:is-image={isImage}>
        <BuilderMedia media={section.media} {dataset} {language} {preview} dataAttribute={dataAttribute?.('media')} />
        {#if label && labelStyle === 'pill'}
          <span class="product-content-label is-pill" data-sanity={dataAttribute?.(`eyebrow.${language}`)}>{label}</span>
        {/if}
      </div>
      {#if label && labelStyle === 'caption'}
        <p class="product-content-label is-caption" data-sanity={dataAttribute?.(`eyebrow.${language}`)}>{label}</p>
      {/if}
    </div>

    {#if hasCopy}
      <div class="product-content-copy">
        <div class="product-content-copy-body">
          {#if label && labelStyle === 'eyebrow'}
            <p class="product-content-label is-eyebrow" data-sanity={dataAttribute?.(`eyebrow.${language}`)}>{label}</p>
          {/if}
          {#if title}
            <h2
              class="cms-styled-text"
              style={`${builderTypographyStyle(section.titleStyle, 'title')};${textAppearanceStyle(section.title)}`}
              data-sanity={dataAttribute?.(`title.${language}`)}
            >{title}</h2>
          {/if}
          {#if text}
            <p
              class="cms-styled-text"
              style={`${builderTypographyStyle(section.bodyStyle, 'body')};${textAppearanceStyle(section.body)}`}
              data-sanity={dataAttribute?.(`body.${language}`)}
            >{text}</p>
          {/if}
        </div>

        {#if section.actions?.length}
          <div class="product-content-actions">
            {#each section.actions as action, index (action._key)}
              {@const href = localizedHref(action.href)}
              {@const isExternal = external(href)}
              {@const actionPath = action._key
                ? `actions[_key=="${action._key.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"]`
                : `actions[${index}]`}
              <a
                class="product-content-link cms-styled-text"
                href={href}
                target={isExternal || action.newTab ? '_blank' : undefined}
                rel={isExternal || action.newTab ? 'noreferrer' : undefined}
                style={textAppearanceStyle(action.label)}
                data-sanity={dataAttribute?.(`${actionPath}.label.${language}`)}
                data-df4y-editor-label="Botão"
                onclick={blockPreviewNavigation}
              >
                <span>{builderLocalized(action.label, language)}</span>
                <span class="product-content-link-arrow" aria-hidden="true">→</span>
              </a>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>

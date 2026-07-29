<script lang="ts">
  import {builderLocalized, builderTypographyStyle} from '$lib/builder/content'
  import {textAppearanceStyle} from '$lib/text-appearance'
  import type {BuilderSection} from '$lib/builder/types'
  import type {LanguageCode} from '$lib/site-content'
  import BuilderMedia from './BuilderMedia.svelte'

  let {
    section,
    dataset,
    language,
  } = $props<{
    section: BuilderSection
    dataset: string
    language: LanguageCode
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
</script>

<div
  class={`product-content-section is-${mediaSide} is-${surface}`}
  class:has-copy={hasCopy}
  aria-label={title || builderLocalized(section.media?.alt, language) || undefined}
>
  <div class="product-content-inner">
    <div class="product-content-media-group" class:is-image={section.media?.kind === 'image'}>
      <div
        class="product-content-media"
        class:is-image={section.media?.kind === 'image'}
        style="--product-content-ratio: 1.7778"
      >
        <BuilderMedia media={section.media} {dataset} {language} />
        {#if label && labelStyle === 'pill'}
          <span class="product-content-label is-pill">{label}</span>
        {/if}
      </div>
      {#if label && labelStyle === 'caption'}
        <p class="product-content-label is-caption">{label}</p>
      {/if}
    </div>

    {#if hasCopy}
      <div class="product-content-copy">
        <div class="product-content-copy-body">
          {#if label && labelStyle === 'eyebrow'}
            <p class="product-content-label is-eyebrow">{label}</p>
          {/if}
          {#if title}
            <h2
              class="cms-styled-text"
              style={`${builderTypographyStyle(section.titleStyle, 'title')};${textAppearanceStyle(section.title)}`}
            >{title}</h2>
          {/if}
          {#if text}
            <p
              class="cms-styled-text"
              style={`${builderTypographyStyle(section.bodyStyle, 'body')};${textAppearanceStyle(section.body)}`}
            >{text}</p>
          {/if}
        </div>

        {#if section.actions?.length}
          <div class="product-content-actions">
            {#each section.actions as action (action._key)}
              {@const href = localizedHref(action.href)}
              {@const isExternal = external(href)}
              <a
                class="product-content-link cms-styled-text"
                href={href}
                target={isExternal || action.newTab ? '_blank' : undefined}
                rel={isExternal || action.newTab ? 'noreferrer' : undefined}
                style={textAppearanceStyle(action.label)}
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

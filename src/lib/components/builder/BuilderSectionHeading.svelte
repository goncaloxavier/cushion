<script lang="ts">
  import {
    builderLocalized,
    builderTypographyStyle,
    safeBuilderHref,
  } from '$lib/builder/content'
  import type {BuilderSection} from '$lib/builder/types'
  import type {LanguageCode} from '$lib/site-content'
  import {textAppearanceStyle} from '$lib/text-appearance'

  let {section, language, preview = false} = $props<{
    section: BuilderSection
    language: LanguageCode
    preview?: boolean
  }>()

  const eyebrow = $derived(builderLocalized(section.eyebrow, language))
  const title = $derived(builderLocalized(section.title, language))
  const body = $derived(
    Array.isArray(section.body)
      ? ''
      : builderLocalized(section.body as Parameters<typeof builderLocalized>[0], language),
  )

  const blockPreviewNavigation = (event: MouseEvent) => {
    if (preview) event.preventDefault()
  }
</script>

<div class="builder-section-heading">
  {#if eyebrow}
    <p class="builder-eyebrow cms-styled-text" style={textAppearanceStyle(section.eyebrow)}>{eyebrow}</p>
  {/if}
  {#if title}
    <h2
      class="builder-responsive-title cms-styled-text"
      style={`${builderTypographyStyle(section.titleStyle, 'title')};${textAppearanceStyle(section.title)}`}
    >
      {title}
    </h2>
  {/if}
  {#if body}
    <p
      class="builder-responsive-body cms-styled-text"
      style={`${builderTypographyStyle(section.bodyStyle, 'body')};${textAppearanceStyle(section.body as Parameters<typeof textAppearanceStyle>[0])}`}
    >
      {body}
    </p>
  {/if}
  {#if section.actions?.length}
    <div class="builder-actions">
      {#each section.actions as action (action._key)}
        <a
          class={`builder-action is-${action.style ?? 'primary'} cms-styled-text`}
          style={textAppearanceStyle(action.label)}
          href={safeBuilderHref(action.href)}
          target={action.newTab ? '_blank' : undefined}
          rel={action.newTab ? 'noreferrer noopener' : undefined}
          aria-label={builderLocalized(action.ariaLabel, language) || undefined}
          onclick={blockPreviewNavigation}
        >
          {builderLocalized(action.label, language) || 'Botão'}
        </a>
      {/each}
    </div>
  {/if}
</div>

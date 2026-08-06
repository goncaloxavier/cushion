<script lang="ts">
  import {
    builderLocalized,
    builderSectionTextStyle,
    safeBuilderHref,
  } from '$lib/builder/content'
  import {correctedTextColor} from '$lib/builder/contrast'
  import type {BuilderSection, BuilderSiteSettings} from '$lib/builder/types'
  import type {LanguageCode} from '$lib/site-content'
  import {textAppearanceStyle} from '$lib/text-appearance'

  let {section, language, preview = false, surface, theme, dataAttribute} = $props<{
    section: BuilderSection
    language: LanguageCode
    preview?: boolean
    // The background this text sits on, and the palette that defines it. Without
    // both, a colour the client picked on a light section keeps applying after
    // they make the section dark — which is how black text ended up on blue.
    surface?: string
    theme?: BuilderSiteSettings['theme']
    dataAttribute?: (path: string) => string | undefined
  }>()

  // Appended last so it wins over the colour the client chose, and only when that
  // colour is genuinely unreadable on this background. Every legible choice is
  // left exactly as they made it.
  const legible = (requested: string | undefined) => {
    const corrected = correctedTextColor(requested, surface, theme)
    return corrected ? `;color:${corrected}` : ''
  }

  const fieldColor = (value: unknown) => (value as {color?: string} | undefined)?.color

  const eyebrow = $derived(builderLocalized(section.eyebrow, language))
  const title = $derived(builderLocalized(section.title, language))
  const body = $derived(
    Array.isArray(section.body)
      ? ''
      : builderLocalized(section.body as Parameters<typeof builderLocalized>[0], language),
  )

  // The eyebrow and the buttons follow the title's alignment, so a centred
  // section reads as one block. Alignment is stored per text, which is why
  // centring a title used to leave the label and the buttons hard left: correct
  // by the data, and plainly wrong to anyone looking at the page.
  const blockAlign = $derived(
    ['center', 'right'].includes(section.titleStyle?.align || '')
      ? (section.titleStyle?.align as 'center' | 'right')
      : 'left',
  )

  const blockPreviewNavigation = (event: MouseEvent) => {
    if (preview) event.preventDefault()
  }
</script>

<div class="builder-section-heading" data-align={blockAlign}>
  {#if eyebrow}
    <p
      class="builder-eyebrow cms-styled-text"
      style={`${textAppearanceStyle(section.eyebrow)}${legible(fieldColor(section.eyebrow))}`}
      data-sanity={dataAttribute?.(`eyebrow.${language}`)}
    >{eyebrow}</p>
  {/if}
  {#if title}
    <h2
      class="builder-responsive-title cms-styled-text"
      style={`${builderSectionTextStyle(section.titleStyle, section.title, 'title')}${legible(fieldColor(section.title) ?? section.titleStyle?.color)}`}
      data-sanity={dataAttribute?.(`title.${language}`)}
    >
      {title}
    </h2>
  {/if}
  {#if body}
    <p
      class="builder-responsive-body cms-styled-text"
      style={`${builderSectionTextStyle(section.bodyStyle, section.body as Parameters<typeof builderSectionTextStyle>[1], 'body')}${legible(fieldColor(section.body) ?? section.bodyStyle?.color)}`}
      data-sanity={dataAttribute?.(`body.${language}`)}
    >
      {body}
    </p>
  {/if}
  {#if section.actions?.length}
    <div class="builder-actions">
      {#each section.actions as action, index (action._key)}
        {@const actionPath = action._key
          ? `actions[_key=="${action._key.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"]`
          : `actions[${index}]`}
        <a
          class={`builder-action is-${action.style ?? 'primary'} cms-styled-text`}
          style={`${textAppearanceStyle(action.label)}${action.style === 'text' || action.style === 'secondary' ? legible(fieldColor(action.label)) : ''}`}
          href={safeBuilderHref(action.href)}
          target={action.newTab ? '_blank' : undefined}
          rel={action.newTab ? 'noreferrer noopener' : undefined}
          aria-label={builderLocalized(action.ariaLabel, language) || undefined}
          data-sanity={dataAttribute?.(`${actionPath}.label.${language}`)}
          data-df4y-editor-label="Botão"
          onclick={blockPreviewNavigation}
        >
          {builderLocalized(action.label, language) || 'Botão'}
        </a>
      {/each}
    </div>
  {/if}
</div>

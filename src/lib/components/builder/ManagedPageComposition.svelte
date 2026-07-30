<script lang="ts">
  import {onMount, type Snippet} from 'svelte'
  import type {BuilderSection, BuilderSiteSettings} from '$lib/builder/types'
  import {
    splitManagedCoreSections,
    type ManagedCoreSectionDefinition,
  } from '$lib/builder/managed-page-sections'
  import type {LanguageCode, SiteContent} from '$lib/site-content'
  import ManagedPageSections from './ManagedPageSections.svelte'

  let {
    sections,
    core,
    settings,
    content,
    language,
    dataset,
    preview = false,
    children,
  } = $props<{
    sections: BuilderSection[]
    core: ManagedCoreSectionDefinition
    settings: BuilderSiteSettings | null
    content: SiteContent
    language: LanguageCode
    dataset: string
    preview?: boolean
    children: Snippet
  }>()

  let liveSections = $state<BuilderSection[]>([])
  let selectedSectionKey = $state<string>()
  let coreRoot = $state<HTMLDivElement | null>(null)

  $effect(() => {
    liveSections = sections
  })

  const composition = $derived(splitManagedCoreSections(liveSections, core))
  const coreVisible = $derived(composition.core.enabled !== false)

  const selectCore = (event: MouseEvent) => {
    if (!preview) return
    const target = event.target as HTMLElement
    if (
      target.closest(
        'a, button, input, select, textarea, [data-sanity], [data-df4y-editor-field="true"]',
      )
    ) {
      return
    }
    event.preventDefault()
    event.stopPropagation()
    selectedSectionKey = composition.core._key
    window.parent.postMessage(
      {type: 'df4y:builder-select', sectionKey: composition.core._key},
      window.location.origin,
    )
  }

  const selectCoreFromKeyboard = (event: KeyboardEvent) => {
    if (!preview || event.target !== event.currentTarget) return
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    selectedSectionKey = composition.core._key
    window.parent.postMessage(
      {type: 'df4y:builder-select', sectionKey: composition.core._key},
      window.location.origin,
    )
  }

  onMount(() => {
    if (!preview) return

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== window.parent) return
      if (!event.data || typeof event.data !== 'object') return

      if (event.data.type === 'df4y:builder-state' && Array.isArray(event.data.page?.sections)) {
        liveSections = event.data.page.sections
        selectedSectionKey = event.data.selectedSectionKey || undefined
      }
      if (event.data.type === 'df4y:builder-focus') {
        selectedSectionKey = event.data.sectionKey || undefined
        if (event.data.sectionKey === composition.core._key) {
          coreRoot?.firstElementChild?.scrollIntoView({behavior: 'smooth', block: 'center'})
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  })
</script>

<ManagedPageSections
  sections={composition.before}
  {settings}
  {content}
  {language}
  {dataset}
  {preview}
  listenForState={false}
  {selectedSectionKey}
/>

{#if preview}
  <div
    class="managed-page-core"
    class:is-selected={selectedSectionKey === composition.core._key}
    class:is-hidden={!coreVisible}
    data-builder-section={composition.core._key}
    role="button"
    aria-label={`Editar ${core.label}`}
    tabindex="0"
    bind:this={coreRoot}
    onclick={selectCore}
    onkeydown={selectCoreFromKeyboard}
  >
    {#if coreVisible}
      {@render children()}
    {:else}
      <section class="managed-page-core-placeholder">
        <strong>{core.label}</strong>
        <span>Esta área está oculta no site.</span>
      </section>
    {/if}
  </div>
{:else if coreVisible}
  {@render children()}
{/if}

<ManagedPageSections
  sections={composition.after}
  {settings}
  {content}
  {language}
  {dataset}
  {preview}
  listenForState={false}
  {selectedSectionKey}
/>

<style>
  .managed-page-core {
    display: contents;
  }

  .managed-page-core.is-selected > :first-child {
    outline: 2px solid #5b6cff;
    outline-offset: -2px;
  }

  .managed-page-core-placeholder {
    display: grid;
    min-height: 160px;
    place-content: center;
    gap: 0.35rem;
    padding: 2rem;
    color: #233a35;
    text-align: center;
    background: repeating-linear-gradient(
      -45deg,
      #f4f7f6,
      #f4f7f6 12px,
      #e9efed 12px,
      #e9efed 24px
    );
    border: 2px dashed #79918b;
  }

  .managed-page-core-placeholder strong {
    font-size: 1rem;
  }

  .managed-page-core-placeholder span {
    font-size: 0.9rem;
  }
</style>

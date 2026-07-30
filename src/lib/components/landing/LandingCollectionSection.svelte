<script lang="ts">
  import CollectionCard from '$lib/components/CollectionCard.svelte'
  import Reveal from '$lib/components/Reveal.svelte'
  import type {ContentImage} from '$lib/site-content'
  import type {TextAppearanceMap} from '$lib/text-appearance'

  export type LandingCollectionItem = {
    key: string
    href: string
    title: string
    description?: string
    meta?: string
    image: ContentImage
    transitionName?: string
    textAppearance?: TextAppearanceMap
  }

  let {
    variant,
    eyebrow = '',
    title = '',
    eyebrowStyle = '',
    titleStyle = '',
    items,
    action,
    preview = false,
  } = $props<{
    variant: 'solutions' | 'work'
    eyebrow?: string
    title?: string
    eyebrowStyle?: string
    titleStyle?: string
    items: LandingCollectionItem[]
    action?: {label: string; href: string; style?: string}
    preview?: boolean
  }>()
</script>

<Reveal class="home-section-head" variant="panel" priority={preview}>
  {#if eyebrow}
    <p class="kicker cms-styled-text" style={eyebrowStyle}>{eyebrow}</p>
  {/if}
  {#if title}
    <h2 class="cms-styled-text" style={titleStyle}>{title}</h2>
  {/if}
</Reveal>

<div class={variant === 'work' ? 'home-work-grid' : 'home-solutions-grid'}>
  {#each items as item, index (item.key)}
    <CollectionCard
      href={item.href}
      title={item.title}
      description={item.description}
      meta={item.meta}
      image={item.image}
      {index}
      transitionName={item.transitionName}
      textAppearance={item.textAppearance}
      layout={variant === 'work' ? 'landscape' : 'portrait'}
      metaPlacement={variant === 'work' ? 'overlay' : 'copy'}
      {preview}
    />
  {/each}
</div>

{#if action?.label}
  <Reveal variant="scale" priority={preview}>
    <a
      class="home-section-cta cms-styled-text"
      style={action.style}
      href={action.href}
      onclick={(event: MouseEvent) => preview && event.preventDefault()}
    >
      {action.label}
      <span aria-hidden="true">→</span>
    </a>
  </Reveal>
{/if}

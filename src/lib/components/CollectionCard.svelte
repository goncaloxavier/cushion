<script lang="ts">
  import Reveal from '$lib/components/Reveal.svelte'
  import {imageSrcset, sizedImage} from '$lib/image'
  import {textAppearanceStyle} from '$lib/text-appearance'
  import type {ContentImage} from '$lib/site-content'
  import type {TextAppearanceMap} from '$lib/text-appearance'

  // One card, used by the hand-built home grids and by the builder's automatic
  // list section alike. Both used to draw their own: the builder's lost the
  // srcset, the LQIP placeholder, the view transition and the scroll reveal, so
  // converting a designed block into a section visibly downgraded it. Sharing
  // the markup is what makes that conversion invisible.
  let {
    href,
    title,
    description = '',
    meta = '',
    image,
    index = 0,
    transitionName = '',
    textAppearance,
    layout = 'portrait',
    metaPlacement = 'copy',
    preview = false,
  } = $props<{
    href: string
    title: string
    description?: string
    meta?: string
    image: ContentImage
    index?: number
    transitionName?: string
    textAppearance?: TextAppearanceMap
    layout?: 'portrait' | 'landscape'
    metaPlacement?: 'copy' | 'overlay'
    preview?: boolean
  }>()
</script>

<Reveal class="collection-card-wrap" delay={index * 70} variant="card">
  <a
    class={`collection-card is-${layout}`}
    {href}
    onclick={(event: MouseEvent) => preview && event.preventDefault()}
  >
    <div class="collection-card-media">
      <img
        src={sizedImage(image.url, 720)}
        srcset={imageSrcset(image.url, [400, 640, 800, 1100])}
        sizes="(max-width: 760px) 92vw, 30vw"
        alt={image.alt}
        loading="lazy"
        decoding="async"
        style:background={image.lqip ? `center / cover no-repeat url(${image.lqip})` : undefined}
        style:view-transition-name={transitionName || undefined}
      />
      {#if meta && metaPlacement === 'overlay'}
        <span class="card-meta">{meta}</span>
      {/if}
    </div>
    <div class="collection-card-copy">
      {#if meta && metaPlacement === 'copy'}
        <small class="collection-card-meta">{meta}</small>
      {/if}
      <h3 class="cms-styled-text" style={textAppearanceStyle(textAppearance?.title)}>{title}</h3>
      {#if description}
        <p class="cms-styled-text" style={textAppearanceStyle(textAppearance?.description)}>
          {description}
        </p>
      {/if}
    </div>
  </a>
</Reveal>

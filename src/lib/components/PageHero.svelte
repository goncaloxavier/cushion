<script lang="ts">
  import {lineReveal} from '$lib/actions/line-reveal'
  import {textAppearanceStyle, type TextAppearance} from '$lib/text-appearance'
  import Reveal from './Reveal.svelte'
  import type {Snippet} from 'svelte'

  let {
    kicker,
    title,
    lead,
    align = 'split',
    dataAttribute,
    textAppearance,
    children,
  }: {
    kicker: string
    title: string
    lead: string
    align?: 'split' | 'center'
    dataAttribute?: (field: 'kicker' | 'title' | 'lead') => string | undefined
    textAppearance?: Partial<Record<'kicker' | 'title' | 'lead', TextAppearance>>
    // Rendered inside the hero copy, so anything a page adds here belongs to
    // the hero rather than forming a band of its own beneath it.
    children?: Snippet
  } = $props()
</script>

<section class={`page-hero page-hero-${align}`}>
  <Reveal class="page-hero-copy" variant="hero" priority>
    <p
      class="kicker cms-styled-text"
      style={textAppearanceStyle(textAppearance?.kicker)}
      data-sanity={dataAttribute?.('kicker')}
    >{kicker}</p>
    <h1
      class="cms-styled-text"
      style={textAppearanceStyle(textAppearance?.title)}
      use:lineReveal
      data-sanity={dataAttribute?.('title')}
    >{title}</h1>
    {#if lead}
      <p
        class="hero-copy cms-styled-text"
        style={textAppearanceStyle(textAppearance?.lead)}
        data-sanity={dataAttribute?.('lead')}
      >{lead}</p>
    {/if}
    {@render children?.()}
  </Reveal>
</section>

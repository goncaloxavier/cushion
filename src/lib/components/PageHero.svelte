<script lang="ts">
  import {lineReveal} from '$lib/actions/line-reveal'
  import {textAppearanceStyle, type TextAppearance} from '$lib/text-appearance'
  import Reveal from './Reveal.svelte'

  let {
    kicker,
    title,
    lead,
    align = 'split',
    dataAttribute,
    textAppearance,
  }: {
    kicker: string
    title: string
    lead: string
    align?: 'split' | 'center'
    dataAttribute?: (field: 'kicker' | 'title' | 'lead') => string | undefined
    textAppearance?: Partial<Record<'kicker' | 'title' | 'lead', TextAppearance>>
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
  </Reveal>
</section>

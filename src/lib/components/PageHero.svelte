<script lang="ts">
  import {lineReveal} from '$lib/actions/line-reveal'
  import Reveal from './Reveal.svelte'

  let {
    kicker,
    title,
    lead,
    align = 'split',
  }: {
    kicker: string
    title: string
    lead: string
    align?: 'split' | 'center'
  } = $props()
</script>

<section class={`page-hero page-hero-${align}`}>
  <Reveal class="page-hero-copy" variant="hero" priority>
    <p class="kicker">{kicker}</p>
    <h1 use:lineReveal>{title}</h1>
    {#if lead}
      <p class="hero-copy">{lead}</p>
    {/if}
  </Reveal>
</section>

<script lang="ts">
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
    <h1>{title}</h1>
    {#if lead}
      <p class="hero-copy">{lead}</p>
    {/if}
  </Reveal>
</section>

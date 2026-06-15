<script lang="ts">
  import Reveal from './Reveal.svelte'

  let {
    kicker,
    title,
    lead = '',
  }: {
    kicker?: string
    title: string
    lead?: string
  } = $props()
</script>

<div class="section-intro">
  <Reveal>
    {#if kicker}
      <p class="kicker">{kicker}</p>
    {/if}
    <h2>{title}</h2>
    {#if lead}
      <p>{lead}</p>
    {/if}
  </Reveal>
</div>

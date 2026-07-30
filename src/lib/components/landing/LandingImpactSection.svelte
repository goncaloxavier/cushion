<script lang="ts">
  import Reveal from '$lib/components/Reveal.svelte'

  export type LandingImpactItem = {
    key: string
    value: string
    label: string
    valueStyle?: string
    labelStyle?: string
  }

  let {
    title,
    titleStyle = '',
    items,
    preview = false,
  } = $props<{
    title: string
    titleStyle?: string
    items: LandingImpactItem[]
    preview?: boolean
  }>()
</script>

<div class="home-impact-layout">
  <Reveal class="impact-copy" variant="panel" priority={preview}>
    <h2 class="cms-styled-text" style={titleStyle}>{title}</h2>
  </Reveal>

  <div class="impact-ledger">
    {#each items as item, index (item.key)}
      <Reveal delay={index * 60} variant="list" priority={preview}>
        <article>
          <strong class="cms-styled-text" style={item.valueStyle}>
            {item.value}
          </strong>
          <p class="cms-styled-text" style={item.labelStyle}>
            {item.label}
          </p>
        </article>
      </Reveal>
    {/each}
  </div>
</div>

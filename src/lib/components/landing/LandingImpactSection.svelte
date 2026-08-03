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
    dataAttribute,
  } = $props<{
    title: string
    titleStyle?: string
    items: LandingImpactItem[]
    preview?: boolean
    dataAttribute?: (path: string) => string | undefined
  }>()
</script>

<div class="home-impact-layout">
  <Reveal class="impact-copy" variant="panel" priority={preview}>
    <h2 class="cms-styled-text" style={titleStyle} data-sanity={dataAttribute?.('title.pt')}>{title}</h2>
  </Reveal>

  <div class="impact-ledger">
    {#each items as item, index (item.key)}
      {@const itemPath = item.key
        ? `items[_key=="${item.key.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"]`
        : `items[${index}]`}
      <Reveal delay={index * 60} variant="list" priority={preview}>
        <article>
          <strong class="cms-styled-text" style={item.valueStyle} data-sanity={dataAttribute?.(`${itemPath}.value.pt`)}>
            {item.value}
          </strong>
          <p class="cms-styled-text" style={item.labelStyle} data-sanity={dataAttribute?.(`${itemPath}.label.pt`)}>
            {item.label}
          </p>
        </article>
      </Reveal>
    {/each}
  </div>
</div>

<script lang="ts">
  import Reveal from '$lib/components/Reveal.svelte'
  import {imageSrcset, sizedImage} from '$lib/image'
  import type {PartnerItem} from '$lib/site-content'

  let {
    eyebrow,
    title,
    body,
    eyebrowStyle = '',
    titleStyle = '',
    bodyStyle = '',
    items,
    preview = false,
  } = $props<{
    eyebrow: string
    title: string
    body: string
    eyebrowStyle?: string
    titleStyle?: string
    bodyStyle?: string
    items: PartnerItem[]
    preview?: boolean
  }>()
</script>

<Reveal class="partner-panel" variant="panel" priority={preview}>
  <div class="partner-copy">
    {#if eyebrow}
      <p class="kicker cms-styled-text" style={eyebrowStyle}>
        {eyebrow}
      </p>
    {/if}
    {#if title}
      <h2 class="cms-styled-text" style={titleStyle}>{title}</h2>
    {/if}
    {#if body}
      <p class="cms-styled-text" style={bodyStyle}>{body}</p>
    {/if}
  </div>

  <div class="partner-grid" aria-label={title || eyebrow}>
    {#each items as partner (partner.name)}
      <svelte:element
        this={partner.url ? 'a' : 'article'}
        class="partner-logo-card"
        href={partner.url && !preview ? partner.url : undefined}
        target={partner.url && !preview ? '_blank' : undefined}
        rel={partner.url && !preview ? 'noreferrer noopener' : undefined}
      >
        <span class="partner-logo-wrap" data-logo-tone={partner.logoTone}>
          <img
            src={sizedImage(partner.logo.url, 320)}
            srcset={imageSrcset(partner.logo.url, [160, 240, 320])}
            sizes="160px"
            alt={partner.logo.alt}
            loading="lazy"
            decoding="async"
          />
        </span>
        <span class="partner-name">{partner.name}</span>
        {#if partner.text}
          <span class="partner-text">{partner.text}</span>
        {/if}
      </svelte:element>
    {/each}
  </div>
</Reveal>

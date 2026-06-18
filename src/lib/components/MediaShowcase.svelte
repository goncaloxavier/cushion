<script lang="ts">
  import {youtubeEmbedUrl} from '$lib/media'
  import type {ContentMediaItem} from '$lib/site-content'

  let {items} = $props<{items: ContentMediaItem[]}>()
  const visibleItems = $derived(
    items.filter((item) => item.kind === 'youtube' ? Boolean(youtubeEmbedUrl(item.url)) : Boolean(item.image)),
  )
</script>

{#if visibleItems.length}
  <div class:single={visibleItems.length === 1} class="media-showcase">
    {#each visibleItems as item}
      {@const embedUrl = item.kind === 'youtube' ? youtubeEmbedUrl(item.url) : undefined}
      <article class:video={item.kind === 'youtube'} class="media-card">
        <div class="media-frame">
          {#if embedUrl}
            <iframe
              title={item.title}
              src={embedUrl}
              loading="lazy"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowfullscreen
            ></iframe>
          {:else if item.image}
            <img src={item.image.url} alt={item.image.alt} loading="lazy" decoding="async" />
          {/if}
        </div>
        <div class="media-copy">
          <h3>{item.title}</h3>
          {#if item.caption}
            <p>{item.caption}</p>
          {/if}
        </div>
      </article>
    {/each}
  </div>
{/if}

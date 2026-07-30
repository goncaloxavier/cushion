<script lang="ts">
  import Reveal from '$lib/components/Reveal.svelte'
  import type {DownloadDocument} from '$lib/site-content'

  // Renders nothing at all when there is nothing to download. The button should
  // appear only when a file is attached — an empty heading over an empty list is
  // worse than no heading.
  let {documents = [], title = '', fallbackTitle = 'Documentos'} = $props<{
    documents?: DownloadDocument[]
    title?: string
    fallbackTitle?: string
  }>()

  // The client names this per page. The shared label is only the default, so a
  // product can say "Ficha técnica" while the Loja says "Tabelas de preços".
  const heading = $derived(title?.trim() || fallbackTitle)

  const sizeLabel = (bytes?: number) => {
    if (!bytes) return ''
    const mb = bytes / (1024 * 1024)
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`
  }
</script>

{#if documents.length}
  <Reveal class="download-list" variant="list">
    <p class="download-list-title">{heading}</p>
    <ul>
      {#each documents as item (item.url)}
        <li>
          <a href={item.url} download target="_blank" rel="noopener">
            <span class="download-list-icon" aria-hidden="true"></span>
            <span class="download-list-copy">
              <strong>{item.title}</strong>
              <!-- Type and weight up front: people decide whether to tap a
                   download before they tap it, especially on mobile data. -->
              <small>PDF{item.size ? ` · ${sizeLabel(item.size)}` : ''}</small>
            </span>
          </a>
        </li>
      {/each}
    </ul>
  </Reveal>
{/if}

<script lang="ts">
  let {page, totalPages, onchange, label, previousLabel, nextLabel, disabled = false} = $props<{
    page: number
    totalPages: number
    onchange: (page: number) => void
    label: string
    previousLabel: string
    nextLabel: string
    disabled?: boolean
  }>()

  // Windowed page list: first, last, current and its neighbours, with gaps.
  const items = $derived.by<(number | 'gap')[]>(() => {
    if (totalPages <= 7) return Array.from({length: totalPages}, (_, i) => i + 1)

    const keep = new Set([1, totalPages, page, page - 1, page + 1])
    const sorted = [...keep].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b)

    const out: (number | 'gap')[] = []
    let prev = 0
    for (const n of sorted) {
      if (n - prev > 1) out.push('gap')
      out.push(n)
      prev = n
    }
    return out
  })

  const go = (next: number) => {
    if (disabled) return
    if (next !== page && next >= 1 && next <= totalPages) onchange(next)
  }
</script>

{#if totalPages > 1}
  <nav class="pagination" aria-label={label}>
    <button
      type="button"
      class="pagination-edge"
      aria-label={previousLabel}
      disabled={disabled || page === 1}
      onclick={() => go(page - 1)}
    >
      <span aria-hidden="true">&larr;</span>
    </button>

    <div class="pagination-pages">
      {#each items as item}
        {#if item === 'gap'}
          <span class="pagination-gap" aria-hidden="true">&hellip;</span>
        {:else}
          <button
            type="button"
            class="pagination-page"
            class:active={item === page}
            aria-label={`${label} ${item}`}
            aria-current={item === page ? 'page' : undefined}
            disabled={disabled}
            onclick={() => go(item)}
          >
            {item}
          </button>
        {/if}
      {/each}
    </div>

    <button
      type="button"
      class="pagination-edge"
      aria-label={nextLabel}
      disabled={disabled || page === totalPages}
      onclick={() => go(page + 1)}
    >
      <span aria-hidden="true">&rarr;</span>
    </button>
  </nav>
{/if}

<script lang="ts">
  import {goto} from '$app/navigation'
  import {portal} from '$lib/actions/portal'
  import {trapFocus} from '$lib/actions/trap-focus'
  import {
    CATEGORY_ORDER,
    isQueryTooShort,
    topItemsPerCategory,
    type SearchCategory,
    type SearchResult,
    type SearchResults,
  } from '$lib/search'
  import {prefersReducedMotion} from '$lib/motion'
  import {withLanguage, type LanguageCode, type SiteContent} from '$lib/site-content'
  import {tick} from 'svelte'
  import {fade} from 'svelte/transition'

  const overlayFade = (node: Element) =>
    prefersReducedMotion() ? {duration: 0} : fade(node, {duration: 150})

  export type SearchStrings = {
    openLabel: string
    closeLabel: string
    placeholder: string
    noResults: string
    hint: {navigate: string; select: string; close: string}
    categories: Record<SearchCategory, string>
  }

  let {
    open = $bindable(false),
    language,
    content,
    strings,
  } = $props<{
    open: boolean
    language: LanguageCode
    content: SiteContent
    strings: SearchStrings
  }>()

  let dialog = $state<HTMLDivElement | null>(null)
  let inputEl = $state<HTMLInputElement | null>(null)
  let query = $state('')
  let results = $state<SearchResults>({products: [], storeProducts: [], caseStudies: [], blogPosts: []})
  let activeIndex = $state(-1)
  let debounceTimer: ReturnType<typeof setTimeout> | undefined
  let searchToken = 0
  let previouslyFocused: HTMLElement | null = null

  const close = () => {
    open = false
  }

  const flatResults = $derived(
    CATEGORY_ORDER.flatMap((category: SearchCategory) => results[category]),
  )

  // Precompute a flat row index per result, grouped by category, so keyboard
  // navigation and hover highlighting can stay in sync without mutating state
  // during template rendering.
  const groupedResults = $derived.by(() => {
    let index = -1
    return CATEGORY_ORDER.map((category: SearchCategory) => ({
      category,
      label: strings.categories[category],
      rows: results[category].map((result: SearchResult) => ({result, index: (index += 1)})),
    })).filter((group) => group.rows.length > 0)
  })

  const runSearch = async (value: string) => {
    const token = ++searchToken
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(value)}&lang=${language}`)
      if (token !== searchToken) return
      const data = await response.json()
      results = data.results
    } catch {
      if (token !== searchToken) return
      results = {products: [], storeProducts: [], caseStudies: [], blogPosts: []}
    }
  }

  const onInput = (value: string) => {
    query = value
    activeIndex = -1
    if (debounceTimer) clearTimeout(debounceTimer)

    if (isQueryTooShort(value)) {
      searchToken += 1
      results = topItemsPerCategory(content)
      return
    }

    debounceTimer = setTimeout(() => runSearch(value), 180)
  }

  const moveActive = (direction: -1 | 1) => {
    if (!flatResults.length) return
    const next = activeIndex + direction
    activeIndex = Math.min(flatResults.length - 1, Math.max(0, next))
  }

  const followActive = () => {
    const target = flatResults[activeIndex]
    if (!target) return
    close()
    goto(withLanguage(target.href, language))
  }

  $effect(() => {
    if (!open) return

    previouslyFocused = document.activeElement as HTMLElement | null
    document.documentElement.classList.add('lightbox-open')
    document.body.classList.add('lightbox-open')
    query = ''
    activeIndex = -1
    results = topItemsPerCategory(content)
    tick().then(() => inputEl?.focus())

    return () => {
      document.documentElement.classList.remove('lightbox-open')
      document.body.classList.remove('lightbox-open')
      if (debounceTimer) clearTimeout(debounceTimer)
      previouslyFocused?.focus()
    }
  })
</script>

{#if open}
  <div
    class="search-overlay"
    role="dialog"
    aria-modal="true"
    aria-label={strings.openLabel}
    tabindex="-1"
    data-lenis-prevent
    use:portal
    use:trapFocus
    bind:this={dialog}
    transition:overlayFade
    onclick={(event) => {
      if (event.currentTarget === event.target) close()
    }}
    onkeydown={(event) => {
      if (event.key === 'Escape') close()
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        moveActive(1)
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        moveActive(-1)
      }
      if (event.key === 'Enter' && activeIndex >= 0) {
        event.preventDefault()
        followActive()
      }
    }}
  >
    <div class="search-panel">
      <div class="search-input-row">
        <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          bind:this={inputEl}
          type="text"
          value={query}
          placeholder={strings.placeholder}
          autocomplete="off"
          spellcheck="false"
          oninput={(event) => onInput(event.currentTarget.value)}
        />
        <button class="search-close" type="button" aria-label={strings.closeLabel} onclick={close}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="search-results">
        {#if flatResults.length === 0}
          <p class="search-empty">{strings.noResults}</p>
        {:else}
          {#each groupedResults as group (group.category)}
            <div class="search-group">
              <p class="search-group-label">{group.label}</p>
              {#each group.rows as row (row.result.slug)}
                <a
                  class="search-result"
                  class:active={row.index === activeIndex}
                  href={withLanguage(row.result.href, language)}
                  onmouseenter={() => (activeIndex = row.index)}
                  onclick={close}
                >
                  <span class="search-result-icon" data-category={group.category} aria-hidden="true">
                    {#if group.category === 'products'}
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
                    {:else if group.category === 'storeProducts'}
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="20" r="1" /><circle cx="18" cy="20" r="1" /><path d="M3 4h2l2.4 12.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 8H6" /></svg>
                    {:else if group.category === 'caseStudies'}
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 10 12 4l9 6-9 6-9-6Z" /><path d="M7 12.5V17l5 3 5-3v-4.5" /></svg>
                    {:else}
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 5h13a2 2 0 0 1 2 2v12H6a2 2 0 0 1-2-2V5Z" /><path d="M8 9h8M8 13h5" /></svg>
                    {/if}
                  </span>
                  <span class="search-result-text">
                    <span class="search-result-title">{row.result.title}</span>
                    {#if row.result.snippet}
                      <span class="search-result-snippet">{row.result.snippet}</span>
                    {/if}
                  </span>
                </a>
              {/each}
            </div>
          {/each}
        {/if}
      </div>

      <div class="search-footer">
        <span>{strings.hint.navigate}</span>
        <span>{strings.hint.select}</span>
        <span>{strings.hint.close}</span>
      </div>
    </div>
  </div>
{/if}

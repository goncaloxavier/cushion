<script lang="ts">
  import BrandIcon from '$lib/components/BrandIcon.svelte'
  import {onDestroy, onMount} from 'svelte'

  type RailItem = {
    href: string
    level?: 2 | 3
    text: string
  }

  type Labels = {
    related: string
    share: string
    nativeShare: string
    whatsapp: string
    linkedin: string
    copy: string
    copied: string
  }

  let {
    items,
    labels,
    shareUrl,
    shareText,
  }: {
    items: RailItem[]
    labels: Labels
    shareUrl: string
    shareText: string
  } = $props()

  let copied = $state(false)
  let canNativeShare = $state(false)
  let resetTimer: ReturnType<typeof setTimeout> | undefined

  const linkedInUrl = $derived(
    `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
  )
  const whatsappUrl = $derived(
    `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`,
  )

  onMount(() => {
    canNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'
  })

  const nativeShare = async () => {
    try {
      await navigator.share({title: shareText, url: shareUrl})
    } catch {
      // user dismissed the share sheet, or the platform refused — nothing to do.
    }
  }

  const copyFallback = () => {
    const textarea = document.createElement('textarea')
    textarea.value = shareUrl
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    textarea.remove()
  }

  const markCopied = () => {
    copied = true
    if (resetTimer) clearTimeout(resetTimer)
    resetTimer = setTimeout(() => {
      copied = false
    }, 1800)
  }

  const copyLink = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl)
      } else {
        copyFallback()
      }
      markCopied()
    } catch {
      copyFallback()
      markCopied()
    }
  }

  onDestroy(() => {
    if (resetTimer) clearTimeout(resetTimer)
  })
</script>

<aside class="blog-article-extras" aria-label={`${labels.related} / ${labels.share}`}>
  {#if items.length}
    <nav class="blog-related-panel" aria-label={labels.related}>
      <h2>{labels.related}</h2>
      <ol>
        {#each items as item}
          <li class:subitem={item.level === 3}>
            <a href={item.href}>{item.text}</a>
          </li>
        {/each}
      </ol>
    </nav>
  {/if}

  <div class="blog-share-panel">
    <h2>{labels.share}</h2>
    <div class="blog-share-actions">
      {#if canNativeShare}
        <button type="button" aria-label={`${labels.nativeShare}: ${shareText}`} onclick={nativeShare}>
          <svg class="blog-share-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
            <path d="M12 3v12" />
            <path d="m8 7 4-4 4 4" />
          </svg>
        </button>
      {/if}
      <a href={whatsappUrl} target="_blank" rel="noreferrer" aria-label={`${labels.whatsapp}: ${shareText}`}>
        <BrandIcon name="whatsapp" />
      </a>
      <a href={linkedInUrl} target="_blank" rel="noreferrer" aria-label={`${labels.linkedin}: ${shareText}`}>
        <BrandIcon name="linkedin" />
      </a>
      <button
        type="button"
        class:copied
        aria-label={`${copied ? labels.copied : labels.copy}: ${shareText}`}
        onclick={copyLink}
      >
        {#if copied}
          <svg class="blog-share-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="m20 6-11 11-5-5" />
          </svg>
        {:else}
          <svg class="blog-share-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M10 13a5 5 0 0 0 7.07 0l2.12-2.12a5 5 0 0 0-7.07-7.07L10.9 5.03" />
            <path d="M14 11a5 5 0 0 0-7.07 0L4.81 13.1a5 5 0 0 0 7.07 7.08l1.2-1.2" />
          </svg>
        {/if}
      </button>
    </div>
  </div>
</aside>

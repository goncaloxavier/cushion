<script lang="ts">
  import {onMount} from 'svelte'
  import {cubicOut} from 'svelte/easing'
  import {fly} from 'svelte/transition'

  let {children, kind}: {children: import('svelte').Snippet; kind: string} = $props()

  let entered = $state(false)
  const motion = $derived.by(() => {
    const base = {delay: 20, duration: 660, easing: cubicOut, opacity: 0.12}

    if (kind === 'home') return {...base, y: 0, duration: 560, opacity: 0.72}
    if (kind === 'products' || kind === 'product-detail') return {...base, y: 26}
    if (kind === 'catalogue') return {...base, x: -18, y: 16}
    if (kind === 'cases' || kind === 'case-detail') return {...base, y: 18}
    if (kind === 'blog' || kind === 'blog-detail') return {...base, x: 18, y: 14}
    if (kind === 'contact') return {...base, y: 30}
    return {...base, y: 20}
  })

  onMount(() => {
    let firstFrame = 0
    let secondFrame = 0
    let enterDelay = 0

    firstFrame = requestAnimationFrame(() => {
      secondFrame = requestAnimationFrame(() => {
        enterDelay = window.setTimeout(() => {
          entered = true
        }, 36)
      })
    })

    return () => {
      cancelAnimationFrame(firstFrame)
      cancelAnimationFrame(secondFrame)
      window.clearTimeout(enterDelay)
    }
  })
</script>

<div class={`page-transition route-${kind} ${entered ? 'entered' : ''}`} in:fly={motion}>
  {@render children()}
</div>

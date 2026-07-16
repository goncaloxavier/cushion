<script lang="ts">
  import {onMount} from 'svelte'

  let {children, delay = 0, variant = 'rise', priority = false, class: className = '', id} = $props<{
    children: import('svelte').Snippet
    delay?: number
    variant?: 'rise' | 'hero' | 'panel' | 'card' | 'list' | 'media' | 'scale'
    priority?: boolean
    class?: string
    id?: string
  }>()

  let node: HTMLDivElement
  let visible = $state(false)
  const isVisible = $derived(priority || visible)

  onMount(() => {
    if (!node) return

    let firstFrame = 0
    let secondFrame = 0
    let observer: IntersectionObserver | undefined

    const show = () => {
      if (visible) return
      firstFrame = requestAnimationFrame(() => {
        secondFrame = requestAnimationFrame(() => {
          visible = true
        })
      })
    }

    if (priority) {
      visible = true
      return () => {
        cancelAnimationFrame(firstFrame)
        cancelAnimationFrame(secondFrame)
      }
    }

    observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect()
          show()
        }
      },
      {rootMargin: '12% 0px -6% 0px', threshold: 0},
    )

    observer.observe(node)

    return () => {
      observer?.disconnect()
      cancelAnimationFrame(firstFrame)
      cancelAnimationFrame(secondFrame)
    }
  })
</script>

<div
  {id}
  bind:this={node}
  class={`reveal ${isVisible ? 'visible' : ''} ${className}`}
  data-reveal={variant}
  style={`--delay: ${delay}ms`}
>
  {@render children()}
</div>

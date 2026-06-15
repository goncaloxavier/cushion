<script lang="ts">
  import {onMount} from 'svelte'

  let {children, delay = 0, variant = 'rise', priority = false, class: className = ''} = $props<{
    children: import('svelte').Snippet
    delay?: number
    variant?: 'rise' | 'hero' | 'panel' | 'card' | 'list' | 'media' | 'scale'
    priority?: boolean
    class?: string
  }>()

  let node: HTMLDivElement
  let visible = $state(false)

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

    const isInView = () => {
      const rect = node.getBoundingClientRect()
      return rect.top < window.innerHeight * 0.92 && rect.bottom > window.innerHeight * -0.12
    }

    const check = () => {
      if (isInView()) {
        observer?.disconnect()
        window.removeEventListener('scroll', check)
        window.removeEventListener('resize', check)
        show()
      }
    }

    if (priority) {
      show()
      return () => {
        cancelAnimationFrame(firstFrame)
        cancelAnimationFrame(secondFrame)
      }
    }

    observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.disconnect()
          window.removeEventListener('scroll', check)
          window.removeEventListener('resize', check)
          show()
        }
      },
      {rootMargin: '12% 0px -6% 0px', threshold: 0},
    )

    observer.observe(node)
    check()
    window.addEventListener('scroll', check, {passive: true})
    window.addEventListener('resize', check)

    return () => {
      observer?.disconnect()
      window.removeEventListener('scroll', check)
      window.removeEventListener('resize', check)
      cancelAnimationFrame(firstFrame)
      cancelAnimationFrame(secondFrame)
    }
  })
</script>

<div
  bind:this={node}
  class={`reveal ${visible ? 'visible' : ''} ${className}`}
  data-reveal={variant}
  style={`--delay: ${delay}ms`}
>
  {@render children()}
</div>

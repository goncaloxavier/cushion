<script lang="ts">
  import {isFinePointer, prefersReducedMotion} from '$lib/motion'
  import {onMount} from 'svelte'

  let root: HTMLDivElement
  let dot: HTMLDivElement
  let ring: HTMLDivElement

  const interactiveSelector =
    'a, button, [role="button"], input, textarea, select, label, summary, .is-magnetic, [data-cursor="hover"]'

  onMount(() => {
    if (!isFinePointer() || prefersReducedMotion()) return

    document.documentElement.classList.add('has-custom-cursor')

    let mouseX = window.innerWidth / 2
    let mouseY = window.innerHeight / 2
    let ringX = mouseX
    let ringY = mouseY
    let raf = 0
    let seen = false

    const onMove = (event: MouseEvent) => {
      mouseX = event.clientX
      mouseY = event.clientY
      dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`
      if (!seen) {
        seen = true
        root.classList.remove('is-hidden')
      }
    }

    const onOver = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      root.classList.toggle('is-hover', Boolean(target?.closest(interactiveSelector)))
    }

    const onDown = () => root.classList.add('is-down')
    const onUp = () => root.classList.remove('is-down')
    const onLeave = () => root.classList.add('is-hidden')
    const onEnter = () => root.classList.remove('is-hidden')

    const loop = () => {
      ringX += (mouseX - ringX) * 0.24
      ringY += (mouseY - ringY) * 0.24
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    window.addEventListener('mousemove', onMove, {passive: true})
    window.addEventListener('mouseover', onOver, {passive: true})
    window.addEventListener('mousedown', onDown)
    window.addEventListener('mouseup', onUp)
    document.addEventListener('mouseleave', onLeave)
    document.addEventListener('mouseenter', onEnter)

    return () => {
      cancelAnimationFrame(raf)
      document.documentElement.classList.remove('has-custom-cursor')
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseover', onOver)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('mouseup', onUp)
      document.removeEventListener('mouseleave', onLeave)
      document.removeEventListener('mouseenter', onEnter)
    }
  })
</script>

<div class="cursor-root is-hidden" bind:this={root} aria-hidden="true">
  <div class="cursor-ring" bind:this={ring}></div>
  <div class="cursor-dot" bind:this={dot}></div>
</div>

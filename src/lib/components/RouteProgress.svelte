<script lang="ts">
  import {afterNavigate, beforeNavigate} from '$app/navigation'
  import {onMount} from 'svelte'

  let loading = $state(false)
  let scroll = $state(0)
  let timeout: ReturnType<typeof setTimeout>

  onMount(() => {
    let frame = 0

    const updateScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight
      scroll = maxScroll > 0 ? window.scrollY / maxScroll : 0
      document.documentElement.style.setProperty('--hero-parallax', `${Math.min(window.scrollY * 0.12, 72)}px`)
      document.documentElement.dataset.scrolled = window.scrollY > 12 ? 'true' : 'false'
    }

    const requestScrollUpdate = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        updateScroll()
      })
    }

    beforeNavigate(() => {
      clearTimeout(timeout)
      loading = true
    })

    afterNavigate(() => {
      timeout = setTimeout(() => {
        loading = false
      }, 420)
    })

    updateScroll()
    window.addEventListener('scroll', requestScrollUpdate, {passive: true})
    window.addEventListener('resize', requestScrollUpdate)

    return () => {
      clearTimeout(timeout)
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', requestScrollUpdate)
      window.removeEventListener('resize', requestScrollUpdate)
    }
  })
</script>

<div class:loading class="route-progress" aria-hidden="true"></div>
<div class="scroll-progress" style={`--scroll-scale: ${scroll}`} aria-hidden="true"></div>

<script lang="ts">
  import {prefersReducedMotion} from '$lib/motion'
  import {onMount} from 'svelte'

  let show = $state(false)
  let leaving = $state(false)

  onMount(() => {
    if (prefersReducedMotion()) return
    if (sessionStorage.getItem('df4y-intro-seen')) return

    show = true
    document.body.style.overflow = 'hidden'

    const leaveTimer = window.setTimeout(() => {
      leaving = true
    }, 880)

    const unlockTimer = window.setTimeout(() => {
      finish()
    }, 1900)

    return () => {
      window.clearTimeout(leaveTimer)
      window.clearTimeout(unlockTimer)
      document.body.style.overflow = ''
    }
  })

  const finish = () => {
    if (!leaving && show) leaving = true
    show = false
    document.body.style.overflow = ''
    try {
      sessionStorage.setItem('df4y-intro-seen', '1')
    } catch {
      // ignore storage failures (private mode etc.)
    }
  }
</script>

{#if show}
  <div
    class="intro-overlay"
    class:is-leaving={leaving}
    onanimationend={finish}
    aria-hidden="true"
  >
    <img class="intro-mark" src="/logo/brand_mark.png" alt="" decoding="async" />
  </div>
{/if}

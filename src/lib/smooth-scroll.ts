import {isFinePointer, prefersReducedMotion} from '$lib/motion'

export type SmoothScroll = {
  destroy: () => void
  toTop: (immediate?: boolean) => void
}

// Lenis momentum scroll, desktop-only and reduced-motion-safe. Loaded lazily so it
// never touches the critical path. Mobile keeps native (already-good) scrolling.
export async function createSmoothScroll(): Promise<SmoothScroll | null> {
  if (typeof window === 'undefined') return null
  if (prefersReducedMotion() || !isFinePointer()) return null

  try {
    const {default: Lenis} = await import('lenis')
    const lenis = new Lenis({
      duration: 1.05,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.4,
    })

    let raf = 0
    const loop = (time: number) => {
      lenis.raf(time)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    // Lenis runs its own scroll loop and ignores `overflow: hidden`, so the page
    // would keep scrolling behind a lightbox/modal. Pause it whenever something
    // locks scroll via the `lightbox-open` class on <html>.
    const root = document.documentElement
    const syncScrollLock = () => {
      if (root.classList.contains('lightbox-open')) lenis.stop()
      else lenis.start()
    }
    const lockObserver = new MutationObserver(syncScrollLock)
    lockObserver.observe(root, {attributes: true, attributeFilter: ['class']})
    syncScrollLock()

    return {
      destroy() {
        cancelAnimationFrame(raf)
        lockObserver.disconnect()
        lenis.destroy()
      },
      toTop(immediate = true) {
        lenis.scrollTo(0, {immediate})
      },
    }
  } catch {
    return null
  }
}

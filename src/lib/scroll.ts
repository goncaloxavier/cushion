// List page-change transition.
//
// Market-standard, cheap approach: cross-fade the list out, swap + render while
// it is hidden, snap the viewport to the list top under the fade (so the
// reposition is never seen as a scroll), then fade back in. Opacity/transform
// only — no per-frame scroll loop, no animated `filter`, no persistent
// `will-change`. The min-height hold stops a shorter next page from clamping
// the viewport during the swap.

const fadeOutMs = 150

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms))
const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

// Snap the top of a list/section to just under the sticky header. Instant on
// purpose: it runs while the list is faded out, so there is nothing to animate.
export const scrollListToTop = (section: HTMLElement | null) => {
  if (!section || typeof window === 'undefined') return

  const header = document.querySelector('.site-header')
  const headerOffset = (header?.getBoundingClientRect().height ?? 0) + 12
  const top = Math.max(0, section.getBoundingClientRect().top + window.scrollY - headerOffset)

  window.scrollTo({top, behavior: 'instant' as ScrollBehavior})
}

export const changeListPage = async (
  section: HTMLElement | null,
  swap: () => void,
  render: () => Promise<void>,
  setSwapping?: (value: boolean) => void,
) => {
  if (typeof window === 'undefined') {
    swap()
    return
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (document.activeElement instanceof HTMLElement) document.activeElement.blur()

  try {
    if (!reduceMotion) {
      setSwapping?.(true)
      await wait(fadeOutMs)
    }

    swap()
    await render()
    scrollListToTop(section)

    if (!reduceMotion) {
      await nextFrame()
      setSwapping?.(false)
    }
  } finally {
    setSwapping?.(false)
  }
}

const paginationScrollDurationMs = 650
const paginationSwapOutMs = 90

export type ListPageTransitionPhase = 'idle' | 'out' | 'in'

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms))

const easeInOutSine = (progress: number) => -(Math.cos(Math.PI * progress) - 1) / 2

const animateScrollTo = (target: number) =>
  new Promise<void>((resolve) => {
    if (typeof window === 'undefined') {
      resolve()
      return
    }

    const start = window.scrollY
    const distance = target - start

    if (Math.abs(distance) < 2) {
      window.scrollTo(0, target)
      resolve()
      return
    }

    const startedAt = performance.now()

    const step = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / paginationScrollDurationMs)
      const next = start + distance * easeInOutSine(progress)
      window.scrollTo(0, next)

      if (progress === 1) {
        window.scrollTo(0, target)
        resolve()
        return
      }

      requestAnimationFrame(step)
    }

    requestAnimationFrame(step)
  })

// Bring the top of a list/section to just under the sticky header. It is smooth
// and intentionally timed, instead of relying on browser-native smooth scrolling.
export const scrollToSectionTop = (element: HTMLElement | null) => {
  if (!element || typeof window === 'undefined') return Promise.resolve()

  const header = document.querySelector('.site-header')
  const headerOffset = (header?.getBoundingClientRect().height ?? 0) + 12
  const top = Math.max(0, element.getBoundingClientRect().top + window.scrollY - headerOffset)

  return animateScrollTo(top)
}

// Run a list page change without a visual jump: swap + render first, but hold
// the old section height so a shorter next page cannot clamp the viewport, then
// run one explicit eased scroll to the collection top.
export const changeListPage = async (
  section: HTMLElement | null,
  swap: () => void,
  render: () => Promise<void>,
  transition?: {
    setPhase: (phase: ListPageTransitionPhase) => void
  },
) => {
  if (typeof window === 'undefined') {
    swap()
    return
  }

  const root = document.documentElement
  const previousBehavior = root.style.scrollBehavior
  const previousMinHeight = section?.style.minHeight ?? ''
  root.style.scrollBehavior = 'auto'

  if (document.activeElement instanceof HTMLElement) document.activeElement.blur()

  try {
    if (section) {
      section.style.minHeight = `${Math.ceil(section.getBoundingClientRect().height)}px`
    }

    if (transition) {
      transition.setPhase('out')
      await wait(paginationSwapOutMs)
    }

    swap()
    await render()

    if (transition) {
      transition.setPhase('in')
      await nextFrame()
      transition.setPhase('idle')
    }

    await nextFrame()
    await scrollToSectionTop(section)
  } finally {
    root.style.scrollBehavior = previousBehavior
    if (section) section.style.minHeight = previousMinHeight
    transition?.setPhase('idle')
  }
}

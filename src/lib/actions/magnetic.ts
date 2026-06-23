import {isFinePointer, prefersReducedMotion} from '$lib/motion'

type MagneticOptions = {strength?: number}

// Subtle magnetic pull toward the cursor for primary CTAs. Desktop + motion only.
export function magnetic(node: HTMLElement, options: MagneticOptions = {}) {
  const strength = options.strength ?? 0.28

  if (!isFinePointer() || prefersReducedMotion()) {
    return {}
  }

  let raf = 0

  const onMove = (event: MouseEvent) => {
    const rect = node.getBoundingClientRect()
    const x = event.clientX - (rect.left + rect.width / 2)
    const y = event.clientY - (rect.top + rect.height / 2)
    cancelAnimationFrame(raf)
    raf = requestAnimationFrame(() => {
      node.style.transform = `translate(${x * strength}px, ${y * strength}px)`
    })
  }

  const onLeave = () => {
    cancelAnimationFrame(raf)
    node.style.transform = ''
  }

  node.classList.add('is-magnetic')
  node.addEventListener('mousemove', onMove)
  node.addEventListener('mouseleave', onLeave)

  return {
    destroy() {
      cancelAnimationFrame(raf)
      node.classList.remove('is-magnetic')
      node.style.transform = ''
      node.removeEventListener('mousemove', onMove)
      node.removeEventListener('mouseleave', onLeave)
    },
  }
}

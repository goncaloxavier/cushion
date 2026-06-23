// Shared motion guards. Everything in the motion layer is gated through these so
// the site stays fast + accessible: no heavy motion for reduced-motion users or
// touch devices.
//
// Manual override for previewing: visit any page with `?motion=on` to force the
// full motion experience regardless of the OS/browser "Reduce Motion" setting (it
// persists via localStorage). Use `?motion=off` to clear the override.

const readForceMotion = (): boolean => {
  if (typeof window === 'undefined') return false
  try {
    const param = new URLSearchParams(window.location.search).get('motion')
    if (param === 'on') {
      localStorage.setItem('df4y-force-motion', '1')
      return true
    }
    if (param === 'off') {
      localStorage.removeItem('df4y-force-motion')
      return false
    }
    return localStorage.getItem('df4y-force-motion') === '1'
  } catch {
    return false
  }
}

export const forceMotion = (): boolean => readForceMotion()

export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false
  if (readForceMotion()) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// Desktop-style pointer: a precise pointer that can hover. Excludes touch + most
// hybrid devices, where the cursor / magnetic effects would feel wrong.
export const isFinePointer = (): boolean => {
  if (typeof window === 'undefined') return false
  if (readForceMotion()) return true
  return (
    window.matchMedia('(pointer: fine)').matches && window.matchMedia('(hover: hover)').matches
  )
}

export const motionEnabled = (): boolean => !prefersReducedMotion()

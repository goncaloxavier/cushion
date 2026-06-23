// Shared motion guards. Everything in the motion layer is gated through these so
// the site stays fast + accessible: no heavy motion for reduced-motion users or
// touch devices.

export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Desktop-style pointer: a precise pointer that can hover. Excludes touch + most
// hybrid devices, where the cursor / magnetic effects would feel wrong.
export const isFinePointer = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(pointer: fine)').matches &&
  window.matchMedia('(hover: hover)').matches

export const motionEnabled = (): boolean => !prefersReducedMotion()

import {writable} from 'svelte/store'

// Tiny global toast queue for lightweight feedback (e.g. cart add/remove).
export type ToastTone = 'success' | 'info'
export type ToastItem = {id: number; message: string; tone: ToastTone}

export const toasts = writable<ToastItem[]>([])

let counter = 0

export const showToast = (message: string, tone: ToastTone = 'success') => {
  const id = (counter += 1)
  toasts.update((list) => [...list, {id, message, tone}])

  if (typeof window !== 'undefined') {
    window.setTimeout(() => {
      toasts.update((list) => list.filter((toast) => toast.id !== id))
    }, 2600)
  }
}

export const dismissToast = (id: number) => {
  toasts.update((list) => list.filter((toast) => toast.id !== id))
}

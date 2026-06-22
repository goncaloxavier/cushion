import {browser} from '$app/environment'
import type {StoreFinish} from './site-content'

const cartStorageKey = 'df4y-store-cart-v1'
const cartChangeEvent = 'df4y-cart-change'

export type StoreCartItem = {
  slug: string
  variantIndex: number
  finish: StoreFinish
  quantity: number
}

const normalizeQuantity = (quantity: number) => Math.min(99, Math.max(1, Math.floor(quantity || 1)))

const itemKey = (item: Pick<StoreCartItem, 'slug' | 'variantIndex' | 'finish'>) =>
  `${item.slug}::${item.variantIndex}::${item.finish}`

const normalizeItems = (items: StoreCartItem[]) =>
  items
    .filter((item) => item.slug && (item.finish === 'natural' || item.finish === 'dark'))
    .map((item) => ({
      slug: item.slug,
      variantIndex: Math.max(0, Math.floor(item.variantIndex || 0)),
      finish: item.finish,
      quantity: normalizeQuantity(item.quantity),
    }))

const emitCartChange = (items: StoreCartItem[]) => {
  if (!browser) return

  window.dispatchEvent(
    new CustomEvent(cartChangeEvent, {
      detail: {items, count: cartTotalQuantity(items)},
    }),
  )
}

export const cartEventName = cartChangeEvent

export const cartTotalQuantity = (items: StoreCartItem[]) =>
  items.reduce((total, item) => total + item.quantity, 0)

export const readCart = (): StoreCartItem[] => {
  if (!browser) return []

  try {
    const parsed = JSON.parse(window.localStorage.getItem(cartStorageKey) || '[]')
    return normalizeItems(Array.isArray(parsed) ? parsed : [])
  } catch {
    return []
  }
}

export const writeCart = (items: StoreCartItem[]) => {
  if (!browser) return []

  const normalized = normalizeItems(items)
  window.localStorage.setItem(cartStorageKey, JSON.stringify(normalized))
  emitCartChange(normalized)
  return normalized
}

export const addCartItem = (item: StoreCartItem) => {
  const items = readCart()
  const key = itemKey(item)
  const existing = items.find((cartItem) => itemKey(cartItem) === key)

  if (existing) {
    existing.quantity = normalizeQuantity(existing.quantity + item.quantity)
    return writeCart(items)
  }

  return writeCart([...items, {...item, quantity: normalizeQuantity(item.quantity)}])
}

export const setCartItemQuantity = (
  item: Pick<StoreCartItem, 'slug' | 'variantIndex' | 'finish'>,
  quantity: number,
) => {
  const key = itemKey(item)
  const nextItems = readCart()
    .map((cartItem) =>
      itemKey(cartItem) === key ? {...cartItem, quantity: normalizeQuantity(quantity)} : cartItem,
    )
    .filter((cartItem) => cartItem.quantity > 0)

  return writeCart(nextItems)
}

export const removeCartItem = (item: Pick<StoreCartItem, 'slug' | 'variantIndex' | 'finish'>) => {
  const key = itemKey(item)
  return writeCart(readCart().filter((cartItem) => itemKey(cartItem) !== key))
}

export const clearCart = () => writeCart([])

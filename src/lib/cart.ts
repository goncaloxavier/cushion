import {browser} from '$app/environment'
import type {StoreFinish, StoreProduct, StoreProductVariant} from './site-content'

const cartStorageKey = 'df4y-store-cart-v1'
const cartChangeEvent = 'df4y-cart-change'

export type StoreCartItem = {
  slug: string
  // New carts carry the stable Studio `_key`. `variantIndex` is retained only
  // to keep carts saved before this migration usable.
  variantKey?: string
  variantIndex?: number
  finish: StoreFinish
  quantity: number
}

type StoreCartItemReference = Pick<StoreCartItem, 'slug' | 'variantKey' | 'variantIndex' | 'finish'>

const normalizeQuantity = (quantity: number) => Math.min(99, Math.max(1, Math.floor(quantity || 1)))

const itemKey = (item: StoreCartItemReference) =>
  `${item.slug}::${item.variantKey || `legacy-${Math.max(0, Math.floor(item.variantIndex || 0))}`}::${item.finish}`

const normalizeItems = (items: StoreCartItem[]) =>
  items
    .filter((item) => item.slug && (item.finish === 'natural' || item.finish === 'dark'))
    .map((item) => ({
      slug: item.slug,
      variantKey:
        typeof item.variantKey === 'string' && item.variantKey.trim()
          ? item.variantKey.trim().slice(0, 120)
          : undefined,
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

export const storeVariantForCartItem = (
  product: Pick<StoreProduct, 'variants'>,
  item: Pick<StoreCartItem, 'variantKey' | 'variantIndex'>,
): StoreProductVariant | undefined => {
  if (item.variantKey) return product.variants.find((variant) => variant.key === item.variantKey)
  return product.variants[Math.max(0, Math.floor(item.variantIndex || 0))]
}

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
  item: StoreCartItemReference,
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

export const removeCartItem = (item: StoreCartItemReference) => {
  const key = itemKey(item)
  return writeCart(readCart().filter((cartItem) => itemKey(cartItem) !== key))
}

export const clearCart = () => writeCart([])

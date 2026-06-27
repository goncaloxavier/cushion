const deliveryStorageKey = 'df4y-store-delivery-postal-code-v1'
const deliveryChangeEvent = 'df4y-store-delivery-change'

export const storeDeliveryEventName = deliveryChangeEvent
export const storeVatRate = 0.23
export const storeTransportFuelSurchargeRate = 0.1
export const storeTransportMultiplier = 2.5
export const storeDispatchZone = 'alto-alentejo'
export const storeDispatchLabel = 'Alto Alentejo'

type PostalZoneId =
  | 'lisboa'
  | 'leiria'
  | 'margem-sul'
  | 'coimbra'
  | 'viseu'
  | 'porto'
  | 'minho'
  | 'tras-os-montes'
  | 'castelo-branco'
  | 'alto-alentejo'
  | 'baixo-alentejo'
  | 'algarve'

export type PostalZone = {
  id: PostalZoneId
  label: string
  minPrefix: number
  maxPrefix: number
}

export type StoreTransportEstimate = {
  destination: PostalZone
  transportZone: 1 | 2 | 3 | 4 | 5
  weightKg: number
  bracketMaxKg: number
  tableNet: number
  fuelSurchargeNet: number
  transportNet: number
}

export type StorePricingItem = {
  unitPrice: number
  quantity: number
  weightKg?: number
}

export type StorePricingEstimate = {
  productNet: number
  totalWeightKg: number
  missingWeight: boolean
  transport: StoreTransportEstimate | null
  subtotalNet: number | null
  vat: number | null
  totalGross: number | null
}

const postalZones: PostalZone[] = [
  {id: 'lisboa', label: 'Lisboa', minPrefix: 10, maxPrefix: 19},
  {id: 'leiria', label: 'Leiria', minPrefix: 20, maxPrefix: 25},
  {id: 'margem-sul', label: 'Margem Sul', minPrefix: 26, maxPrefix: 29},
  {id: 'coimbra', label: 'Coimbra', minPrefix: 30, maxPrefix: 31},
  {id: 'viseu', label: 'Viseu', minPrefix: 32, maxPrefix: 36},
  {id: 'porto', label: 'Porto', minPrefix: 37, maxPrefix: 45},
  {id: 'minho', label: 'Minho', minPrefix: 46, maxPrefix: 49},
  {id: 'tras-os-montes', label: 'Tras-os-Montes', minPrefix: 50, maxPrefix: 59},
  {id: 'castelo-branco', label: 'Castelo Branco', minPrefix: 60, maxPrefix: 69},
  {id: 'alto-alentejo', label: 'Alto Alentejo', minPrefix: 70, maxPrefix: 71},
  {id: 'baixo-alentejo', label: 'Baixo Alentejo', minPrefix: 72, maxPrefix: 79},
  {id: 'algarve', label: 'Algarve', minPrefix: 80, maxPrefix: 89},
]

const altoAlentejoDispatchZones: Record<PostalZoneId, 1 | 2 | 3 | 4 | 5> = {
  lisboa: 3,
  leiria: 3,
  'margem-sul': 3,
  coimbra: 4,
  viseu: 4,
  porto: 4,
  minho: 4,
  'tras-os-montes': 5,
  'castelo-branco': 5,
  'alto-alentejo': 2,
  'baixo-alentejo': 3,
  algarve: 4,
}

const transportBrackets = [
  {maxKg: 10, prices: [6.11, 6.66, 7.81, 8.91, 10.01]},
  {maxKg: 50, prices: [9.35, 10.18, 11.28, 12.65, 15.18]},
  {maxKg: 75, prices: [13.2, 14.47, 15.9, 17.82, 21.4]},
  {maxKg: 100, prices: [15.95, 17.33, 18.92, 21.18, 25.41]},
  {maxKg: 150, prices: [20.35, 22.28, 24.95, 27.94, 33.53]},
  {maxKg: 200, prices: [24.75, 28.55, 31.3, 35.09, 42.13]},
  {maxKg: 300, prices: [34.43, 37.53, 42.08, 47.14, 56.56]},
  {maxKg: 400, prices: [38.5, 41.97, 47.03, 52.69, 63.23]},
  {maxKg: 500, prices: [46.75, 50.96, 57.09, 64.02, 76.84]},
  {maxKg: 600, prices: [53.79, 58.63, 65.67, 73.43, 88.11]},
  {maxKg: 700, prices: [57.75, 62.98, 70.57, 80.19, 96.25]},
  {maxKg: 800, prices: [67.1, 73.15, 81.93, 90.42, 108.5]},
  {maxKg: 900, prices: [69.74, 78.05, 87.89, 98.45, 118.18]},
  {maxKg: 1000, prices: [72.38, 79.75, 89.32, 100.65, 120.78]},
  {maxKg: 1100, prices: [75.68, 82.72, 92.64, 103.95, 124.74]},
  {maxKg: 1200, prices: [81.95, 89.38, 100.1, 112.15, 134.59]},
  {maxKg: 1500, prices: [87.45, 95.32, 106.81, 118.91, 142.73]},
  {maxKg: 1800, prices: [89.21, 97.24, 109.02, 122.1, 146.58]},
  {maxKg: 2000, prices: [96.36, 104.5, 117.15, 130.9, 156.2]},
  {maxKg: 2500, prices: [101.42, 110.55, 123.2, 137.5, 165]},
  {maxKg: 3000, prices: [109.01, 121, 135.85, 151.8, 182.33]},
  {maxKg: 3500, prices: [124.03, 135.19, 151.42, 169.68, 203.61]},
  {maxKg: 3750, prices: [137.5, 149.88, 167.92, 187, 224.4]},
  {maxKg: 4000, prices: [148.61, 161.98, 182.55, 204.44, 245.36]},
  {maxKg: 5000, prices: [159.72, 174.13, 196.68, 220, 264.17]},
  {maxKg: 6000, prices: [170.5, 185.85, 209, 234.08, 280.5]},
  {maxKg: 7000, prices: [187, 204.05, 228.58, 256.03, 307.45]},
  {maxKg: 8000, prices: [196.35, 214.5, 240.9, 272.25, 326.7]},
  {maxKg: 9000, prices: [206.8, 225.5, 252.89, 283.58, 346.5]},
  {maxKg: 10000, prices: [211.15, 233.2, 258.5, 291.5, 379.5]},
  {maxKg: 11000, prices: [221.05, 242, 270.6, 302.5, 467.5]},
  {maxKg: 12000, prices: [247.5, 269.78, 302.5, 341, 528]},
  {maxKg: 15000, prices: [269.67, 291.5, 326.48, 379.5, 621.5]},
  {maxKg: 20000, prices: [286, 313.5, 352, 451, 764.5]},
  {maxKg: 25000, prices: [302.5, 328.9, 440, 605, 830.5]},
] as const

const roundMoney = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100
const compactPostalCode = (value: string) => value.replace(/\D/g, '').slice(0, 7)
const isBrowser = () => typeof window !== 'undefined'

export const normalizePostalCode = (value: string) => {
  const digits = compactPostalCode(value)
  if (digits.length <= 4) return digits
  return `${digits.slice(0, 4)}-${digits.slice(4)}`
}

export const postalZoneFor = (value: string) => {
  const digits = compactPostalCode(value)
  if (digits.length < 2) return null

  const prefix = Number(digits.slice(0, 2))
  return postalZones.find((zone) => prefix >= zone.minPrefix && prefix <= zone.maxPrefix) ?? null
}

export const postalCodeIssue = (value: string): 'incomplete' | 'unsupported' | null => {
  const digits = compactPostalCode(value)
  if (digits.length < 4) return 'incomplete'
  if (!postalZoneFor(value)) return 'unsupported'
  return null
}

export const isSupportedStorePostalCode = (value: string) => postalCodeIssue(value) === null

export const readStorePostalCode = () => {
  if (!isBrowser()) return ''

  const saved = window.localStorage.getItem(deliveryStorageKey) ?? ''
  const normalized = normalizePostalCode(saved)
  return isSupportedStorePostalCode(normalized) ? normalized : ''
}

export const writeStorePostalCode = (value: string) => {
  if (!isBrowser()) return ''

  const normalized = normalizePostalCode(value)
  if (!isSupportedStorePostalCode(normalized)) return ''

  window.localStorage.setItem(deliveryStorageKey, normalized)
  window.dispatchEvent(new CustomEvent(deliveryChangeEvent, {detail: {postalCode: normalized}}))
  return normalized
}

export const clearStorePostalCode = () => {
  if (!isBrowser()) return

  window.localStorage.removeItem(deliveryStorageKey)
  window.dispatchEvent(new CustomEvent(deliveryChangeEvent, {detail: {postalCode: ''}}))
}

export const transportEstimateFor = (postalCode: string, weightKg: number) => {
  const destination = postalZoneFor(postalCode)
  if (!destination || !Number.isFinite(weightKg) || weightKg <= 0) return null

  const bracket = transportBrackets.find((item) => weightKg <= item.maxKg)
  if (!bracket) return null

  const transportZone = altoAlentejoDispatchZones[destination.id]
  const tableNet = bracket.prices[transportZone - 1]
  const fuelSurchargeNet = tableNet * storeTransportFuelSurchargeRate
  const transportNet = (tableNet + fuelSurchargeNet) * storeTransportMultiplier

  return {
    destination,
    transportZone,
    weightKg,
    bracketMaxKg: bracket.maxKg,
    tableNet: roundMoney(tableNet),
    fuelSurchargeNet: roundMoney(fuelSurchargeNet),
    transportNet: roundMoney(transportNet),
  } satisfies StoreTransportEstimate
}

export const calculateStoreEstimate = (
  items: StorePricingItem[],
  postalCode: string,
): StorePricingEstimate => {
  const productNet = roundMoney(
    items.reduce((total, item) => total + item.unitPrice * Math.max(1, item.quantity || 1), 0),
  )
  const missingWeight = items.some(
    (item) => !Number.isFinite(item.weightKg) || (item.weightKg ?? 0) <= 0,
  )
  const totalWeightKg = items.reduce(
    (total, item) => total + (item.weightKg ?? 0) * Math.max(1, item.quantity || 1),
    0,
  )

  if (!items.length || missingWeight || totalWeightKg <= 0) {
    return {
      productNet,
      totalWeightKg,
      missingWeight,
      transport: null,
      subtotalNet: null,
      vat: null,
      totalGross: null,
    }
  }

  const transport = transportEstimateFor(postalCode, totalWeightKg)
  if (!transport) {
    return {
      productNet,
      totalWeightKg,
      missingWeight,
      transport: null,
      subtotalNet: null,
      vat: null,
      totalGross: null,
    }
  }

  const subtotalNet = roundMoney(productNet + transport.transportNet)
  const vat = roundMoney(subtotalNet * storeVatRate)

  return {
    productNet,
    totalWeightKg,
    missingWeight,
    transport,
    subtotalNet,
    vat,
    totalGross: roundMoney(subtotalNet + vat),
  }
}

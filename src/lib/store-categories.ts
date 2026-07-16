export const defaultStoreCategories = [
  {slug: 'bancos', labels: {pt: 'Bancos', en: 'Benches', es: 'Bancos'}},
  {
    slug: 'mesas',
    labels: {pt: 'Mesas e conjuntos', en: 'Tables and sets', es: 'Mesas y conjuntos'},
  },
  {slug: 'cadeiras', labels: {pt: 'Cadeiras', en: 'Chairs', es: 'Sillas'}},
  {slug: 'decking', labels: {pt: 'Decking', en: 'Decking', es: 'Decking'}},
  {slug: 'residuos', labels: {pt: 'Resíduos', en: 'Waste', es: 'Residuos'}},
  {slug: 'cultivo', labels: {pt: 'Cultivo', en: 'Growing', es: 'Cultivo'}},
] as const

export type DefaultStoreCategorySlug = (typeof defaultStoreCategories)[number]['slug']

export const defaultStoreCategoryOptions = defaultStoreCategories.map((category) => ({
  label: category.labels.pt,
  value: category.slug,
}))

export const humanizeStoreCategory = (value: string) => {
  const normalized = value.trim().replace(/[-_]+/g, ' ')
  if (!normalized) return 'Categoria'
  return normalized.charAt(0).toLocaleUpperCase('pt') + normalized.slice(1)
}

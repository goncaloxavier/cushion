export type SanityDataAttributeFactory =
  (typeof import('@sanity/visual-editing/create-data-attribute'))['createDataAttribute']

let factoryPromise: Promise<SanityDataAttributeFactory> | undefined

export const loadSanityDataAttributeFactory = () => {
  factoryPromise ??= import('@sanity/visual-editing/create-data-attribute').then(
    (module) => module.createDataAttribute,
  )
  return factoryPromise
}

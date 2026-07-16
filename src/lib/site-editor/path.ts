import {studioPath} from '@sanity/client/csm'

type PathSegment = ReturnType<typeof studioPath.fromString>[number]

export const normalizeEditorDocumentId = (id: string) => id.replace(/^drafts\./, '')

export const editorDraftId = (id: string) => `drafts.${normalizeEditorDocumentId(id)}`

export const editorPathSegments = (path: string): PathSegment[] => studioPath.fromString(path)

export const getEditorValue = <T = unknown>(value: unknown, path: string, fallback?: T) =>
  studioPath.get<T, T | undefined>(value, path, fallback)

const cloneContainer = (value: unknown, nextSegment: PathSegment) => {
  if (Array.isArray(value)) return [...value]
  if (value && typeof value === 'object') return {...(value as Record<string, unknown>)}
  return typeof nextSegment === 'number' || typeof nextSegment === 'object' ? [] : {}
}

export const setEditorValue = <T>(source: T, path: string, value: unknown): T => {
  const segments = editorPathSegments(path)
  if (!segments.length) return source

  const root = cloneContainer(source, segments[0]) as Record<string, unknown> | unknown[]
  let current: Record<string, unknown> | unknown[] = root
  let original: unknown = source

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index]
    const last = index === segments.length - 1

    if (typeof segment === 'string') {
      if (Array.isArray(current)) throw new Error(`Caminho inválido: ${path}`)
      if (last) {
        current[segment] = value
        break
      }
      const originalChild =
        original && typeof original === 'object' && !Array.isArray(original)
          ? (original as Record<string, unknown>)[segment]
          : undefined
      const child = cloneContainer(originalChild, segments[index + 1])
      current[segment] = child
      current = child as Record<string, unknown> | unknown[]
      original = originalChild
      continue
    }

    if (!Array.isArray(current)) throw new Error(`Caminho inválido: ${path}`)
    const position =
      typeof segment === 'number'
        ? segment
        : '_key' in segment
          ? current.findIndex(
              (item) =>
                item &&
                typeof item === 'object' &&
                (item as Record<string, unknown>)._key === segment._key,
            )
          : -1
    if (position < 0) throw new Error(`Item não encontrado em ${path}`)
    if (last) {
      current[position] = value
      break
    }
    const originalChild = Array.isArray(original) ? original[position] : undefined
    const child = cloneContainer(originalChild, segments[index + 1])
    current[position] = child
    current = child as Record<string, unknown> | unknown[]
    original = originalChild
  }

  return root as T
}

export const editorPathLabel = (path: string) => {
  const last = editorPathSegments(path).at(-1)
  if (typeof last !== 'string') return 'Conteúdo selecionado'
  return last
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, (character) => character.toUpperCase())
}

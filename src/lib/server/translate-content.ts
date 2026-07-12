import {createHash} from 'node:crypto'

// Matches schemaTypes/objects/localizedArticle.ts's `articleBlocks` shape.
// Kept loose (Record<string, unknown>) since this walks raw Sanity document
// JSON, not a strongly-typed client model.
export type PortableTextBlock = Record<string, unknown>

export type LocalizedFieldKind = 'string' | 'article'

const localizedShapeKeys = new Set(['pt', 'en', 'es', 'translationHash', '_key', '_type'])

// Shape-based detection: every localizedString/localizedText/localizedArticle
// instance in this codebase has exactly this key set, and nothing else does
// (verified: `grep -rn "type: 'localizedString'\|type: 'localizedText'\|type: 'localizedArticle'"`
// across schemaTypes/ = 48 hits, zero ad-hoc bypasses). The allow-listed keys
// are defense-in-depth against a hypothetical unrelated object, not a fix for
// an observed collision.
export const detectLocalizedKind = (value: unknown): LocalizedFieldKind | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null

  const obj = value as Record<string, unknown>
  const keys = Object.keys(obj)
  if (!keys.length) return null
  if (!keys.every((key) => localizedShapeKeys.has(key))) return null

  if (typeof obj.pt === 'string') return 'string'
  if (Array.isArray(obj.pt)) return 'article'
  return null
}

type LeafVisitor = (get: () => string, set: (value: string) => void) => void

// One shared recursive visitor used by both collection and reinsertion below,
// so the two can never drift out of order-sync with each other. Only ever
// reads/writes leaf `text`/`alt`/`caption`/`title`/cell strings — never
// touches `_key`, `_type`, `markDefs[].href`, `style`, `listItem`, `level`,
// image `asset` refs, or `youtubeEmbed.url`.
const walkArticleBlocks = (blocks: PortableTextBlock[], visit: LeafVisitor): void => {
  for (const block of blocks) {
    const type = block._type

    if (type === 'block') {
      const children = (block.children as PortableTextBlock[] | undefined) ?? []
      for (const child of children) {
        if (child._type !== 'span') continue
        const text = child.text
        if (typeof text !== 'string' || !text.trim()) continue
        visit(
          () => child.text as string,
          (value) => {
            child.text = value
          },
        )
      }
      continue
    }

    if (type === 'image') {
      if (typeof block.alt === 'string' && block.alt.trim()) {
        visit(
          () => block.alt as string,
          (value) => {
            block.alt = value
          },
        )
      }
      if (typeof block.caption === 'string' && block.caption.trim()) {
        visit(
          () => block.caption as string,
          (value) => {
            block.caption = value
          },
        )
      }
      continue
    }

    if (type === 'youtubeEmbed') {
      if (typeof block.title === 'string' && block.title.trim()) {
        visit(
          () => block.title as string,
          (value) => {
            block.title = value
          },
        )
      }
      if (typeof block.caption === 'string' && block.caption.trim()) {
        visit(
          () => block.caption as string,
          (value) => {
            block.caption = value
          },
        )
      }
      continue
    }

    if (type === 'articleTable') {
      const columns = (block.columns as string[] | undefined) ?? []
      columns.forEach((value, index) => {
        if (!value?.trim()) return
        visit(
          () => columns[index],
          (translated) => {
            columns[index] = translated
          },
        )
      })

      const rows = (block.rows as PortableTextBlock[] | undefined) ?? []
      for (const row of rows) {
        const cells = (row.cells as string[] | undefined) ?? []
        cells.forEach((value, index) => {
          if (!value?.trim()) return
          visit(
            () => cells[index],
            (translated) => {
              cells[index] = translated
            },
          )
        })
      }
      continue
    }

    // Any other/unknown block type is intentionally left untouched
    // (forward-compat with future article block members).
  }
}

export const collectArticleLeaves = (blocks: PortableTextBlock[]): string[] => {
  const leaves: string[] = []
  walkArticleBlocks(blocks, (get) => leaves.push(get()))
  return leaves
}

export const reinsertArticleLeaves = (
  blocks: PortableTextBlock[],
  translated: string[],
): PortableTextBlock[] => {
  const clone = structuredClone(blocks)
  let index = 0
  walkArticleBlocks(clone, (_get, set) => {
    if (index >= translated.length) {
      throw new Error('translated leaf count mismatch: fewer translations than leaves')
    }
    set(translated[index])
    index += 1
  })
  if (index !== translated.length) {
    throw new Error('translated leaf count mismatch: more translations than leaves')
  }
  return clone
}

export const collectLeaves = (kind: LocalizedFieldKind, ptValue: string | PortableTextBlock[]): string[] => {
  if (kind === 'string') {
    const value = ptValue as string
    return value.trim() ? [value] : []
  }
  return collectArticleLeaves(ptValue as PortableTextBlock[])
}

export const reinsertLeaves = (
  kind: LocalizedFieldKind,
  ptValue: string | PortableTextBlock[],
  translated: string[],
): string | PortableTextBlock[] => {
  if (kind === 'string') return translated[0] ?? (ptValue as string)
  return reinsertArticleLeaves(ptValue as PortableTextBlock[], translated)
}

export const hashLeaves = (leaves: string[]): string =>
  createHash('sha256').update(JSON.stringify(leaves)).digest('hex')

export type LocalizedFieldTask = {
  patchPath: string
  kind: LocalizedFieldKind
  ptValue: string | PortableTextBlock[]
  currentHash?: string
  leaves: string[]
  hash: string
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)

// Generic recursive document walk shared by the translation orchestrator and
// the one-off backfill script — detects every localized-shaped field purely
// by value shape (see detectLocalizedKind above), so it automatically covers
// any localized field added to the content model in the future without code
// changes here.
export const findLocalizedFields = (doc: unknown, basePath = ''): LocalizedFieldTask[] => {
  if (!isPlainObject(doc)) return []

  const tasks: LocalizedFieldTask[] = []

  for (const [key, value] of Object.entries(doc)) {
    if (key.startsWith('_')) continue
    const path = basePath ? `${basePath}.${key}` : key

    const kind = detectLocalizedKind(value)
    if (kind) {
      const obj = value as Record<string, unknown>
      const ptValue = obj.pt as string | PortableTextBlock[]
      const leaves = collectLeaves(kind, ptValue)
      if (!leaves.length) continue

      tasks.push({
        patchPath: path,
        kind,
        ptValue,
        currentHash: typeof obj.translationHash === 'string' ? obj.translationHash : undefined,
        leaves,
        hash: hashLeaves(leaves),
      })
      continue
    }

    if (isPlainObject(value)) {
      tasks.push(...findLocalizedFields(value, path))
      continue
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (!isPlainObject(item)) continue
        const itemKey = item._key
        if (typeof itemKey !== 'string') continue
        // Sanity's stable array-item identity — never a numeric index, which
        // could patch the wrong element if an editor reorders the array
        // between webhook fire and patch commit.
        tasks.push(...findLocalizedFields(item, `${path}[_key=="${itemKey}"]`))
      }
    }
  }

  return tasks
}

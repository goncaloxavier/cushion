import {createHash} from 'node:crypto'

// Two writers touch the same Sanity documents, and they own disjoint parts of
// them:
//
//   - the site editor owns the Portuguese content (everything in editableFields)
//   - the translation pipeline (translate-document.ts, plus the Studio's
//     "Retraduzir" action) owns the `en` / `es` / `translationHash` leaves it
//     patches onto every localized value
//
// A plain _rev check cannot tell those apart, so publishing a document — which
// fires the translation webhook seconds later — used to guarantee that the next
// keystroke in the still-open editor failed with "recarregue a página", over a
// change to fields the editor does not even own.
//
// The two helpers here restore the distinction: `editorSignature` hashes only
// the editor-owned content so a translation landing does not move it, and
// `carryMachineOwned` keeps the editor from pushing the stale `en`/`es` it
// loaded back over a fresher translation.

const machineOwnedKeys = ['en', 'es', 'translationHash'] as const

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

// Machine-owned keys are only recognised next to the `pt` sibling the editor
// owns. Without that anchor, a field legitimately named `es` on some unrelated
// object would be silently dropped.
const isLocalized = (value: unknown): value is Record<string, unknown> =>
  isPlainObject(value) && Object.prototype.hasOwnProperty.call(value, 'pt')

const editorOwnedValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(editorOwnedValue)
  if (!isPlainObject(value)) return value
  const localized = isLocalized(value)
  const result: Record<string, unknown> = {}
  // Sorted so that two documents differing only in key order hash identically.
  for (const key of Object.keys(value).sort()) {
    if (localized && (machineOwnedKeys as readonly string[]).includes(key)) continue
    result[key] = editorOwnedValue(value[key])
  }
  return result
}

export const editorContentSignature = (
  document: Record<string, unknown> | null | undefined,
  fields: readonly string[] | undefined,
) => {
  if (!document || !fields) return ''
  const projection: Record<string, unknown> = {}
  for (const field of fields) {
    if (Object.prototype.hasOwnProperty.call(document, field)) {
      projection[field] = editorOwnedValue(document[field])
    }
  }
  return createHash('sha256').update(JSON.stringify(projection)).digest('hex')
}

// Where the Portuguese text actually changed, the carried-over translationHash
// no longer matches it, so the translator re-runs on its own — the same way it
// does after any Studio edit. Nothing here needs to decide what is stale.
export const carryMachineOwned = (next: unknown, previous: unknown): unknown => {
  if (Array.isArray(next)) {
    if (!Array.isArray(previous)) return next
    const byKey = new Map<string, unknown>()
    for (const item of previous) {
      const key = isPlainObject(item) && typeof item._key === 'string' ? item._key : undefined
      if (key) byKey.set(key, item)
    }
    return next.map((item, index) => {
      const key = isPlainObject(item) && typeof item._key === 'string' ? item._key : undefined
      // Fall back to position only for arrays without _key — reordering a keyed
      // array must not drag another entry's translation along with it.
      return carryMachineOwned(item, key ? byKey.get(key) : previous[index])
    })
  }
  if (!isPlainObject(next) || !isPlainObject(previous)) return next
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(next)) {
    result[key] = carryMachineOwned(value, previous[key])
  }
  if (isLocalized(next)) {
    for (const key of machineOwnedKeys) {
      // Absent on the server means absent, full stop: the editor must not
      // resurrect a translation that was deliberately cleared.
      if (Object.prototype.hasOwnProperty.call(previous, key)) result[key] = previous[key]
      else delete result[key]
    }
  }
  return result
}

/**
 * Which fields the two sides disagree about.
 *
 * A rejected save currently tells the client to reload and tells us nothing. The
 * whole-document hash is a single bit of information — same or different — so
 * every wrongly-rejected save has had to be reproduced by hand before it could be
 * explained. Hashing field by field turns the next occurrence into a log line
 * naming the field, which is the one thing needed to tell a genuine concurrent
 * edit from a bug in our own baseline.
 *
 * Content is never logged, only field names: these documents are the client's.
 */
export const editorSignatureMismatch = (
  a: Record<string, unknown> | null | undefined,
  b: Record<string, unknown> | null | undefined,
  fields: readonly string[] | undefined,
): string[] => {
  if (!fields) return []
  return fields.filter(
    (field) => editorContentSignature(a, [field]) !== editorContentSignature(b, [field]),
  )
}

// Deliberately compares the stored values verbatim — machine-owned leaves
// included — rather than reusing editorContentSignature. This decides whether a
// draft can be thrown away, so "no editor-visible difference" is not a strong
// enough test: a draft holding a translation the published document lacks still
// holds something, and discarding it would lose it.
//
// The one thing it does ignore is `_type`. Saving normalises the schema
// annotation onto every value it writes, and most published content predates
// that: 538 of the 894 localized objects in the dataset carry no `_type` at all.
// Comparing it would mean the first save on almost any existing document leaves
// a draft behind whose only difference is an annotation nobody authored — which
// is the whole problem this check exists to stop. `_key` is still compared, so
// array identity and ordering are untouched, and no edit the editor can make is
// expressible as a `_type` change on its own.
export const sameStoredContent = (
  left: Record<string, unknown> | null | undefined,
  right: Record<string, unknown> | null | undefined,
  fields: readonly string[],
) => {
  if (!left || !right) return false
  // Key order is not part of the content: Sanity is free to hand back the same
  // object with its keys in a different order, and a plain JSON.stringify would
  // read that as a change and keep the draft forever.
  const stable = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(stable)
    if (!isPlainObject(value)) return value
    return Object.fromEntries(
      Object.keys(value)
        .filter((key) => key !== '_type')
        .sort()
        .map((key) => [key, stable(value[key])]),
    )
  }
  const project = (document: Record<string, unknown>) =>
    JSON.stringify(
      fields
        .filter((field) => Object.prototype.hasOwnProperty.call(document, field))
        .map((field) => [field, stable(document[field])]),
    )
  return project(left) === project(right)
}

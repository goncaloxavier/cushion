import {createClient} from '@sanity/client'
import {env} from '$env/dynamic/private'
import {
  findLocalizedFields,
  reinsertLeaves,
  type PortableTextBlock,
} from './translate-content'
import {logTranslationFailure, translateBatch} from './translate'

const projectId = 'u4uyfix8'
const apiVersion = '2026-06-10'

const writeClient = () =>
  createClient({
    projectId,
    dataset: env.SANITY_DATASET || 'production',
    apiVersion,
    useCdn: false,
    token: env.SANITY_WRITE_TOKEN,
  })

export type TranslateDocumentResult =
  | {ok: true; changed: number}
  | {ok: false; reason: 'not-configured' | 'not-found' | 'translation-failed'}

// Best-effort, eventually-consistent: `localized()`/`localizedArticle()` in
// site-content.ts already fall back to the Portuguese value whenever a
// target-language value is empty, so a field that fails to translate here
// simply keeps showing Portuguese until a later attempt succeeds — it never
// produces a broken or blank page.
export const translateDocument = async (documentId: string): Promise<TranslateDocumentResult> => {
  if (!env.SANITY_WRITE_TOKEN || !env.DEEPL_API_KEY) {
    return {ok: false, reason: 'not-configured'}
  }

  const client = writeClient()
  const doc = await client.getDocument(documentId)
  if (!doc) return {ok: false, reason: 'not-found'}

  const tasks = findLocalizedFields(doc).filter((task) => task.hash !== task.currentHash)
  if (!tasks.length) return {ok: true, changed: 0}

  const allLeaves = tasks.flatMap((task) => task.leaves)
  const [en, es] = await Promise.all([
    translateBatch(allLeaves, 'en'),
    translateBatch(allLeaves, 'es'),
  ])
  if (!en.ok) logTranslationFailure(`${documentId} EN`, en.error)
  if (!es.ok) logTranslationFailure(`${documentId} ES`, es.error)

  const patch: Record<string, unknown> = {}
  let cursor = 0
  let translatedFieldCount = 0

  for (const task of tasks) {
    const enSlice = en.ok ? en.texts.slice(cursor, cursor + task.leaves.length) : null
    const esSlice = es.ok ? es.texts.slice(cursor, cursor + task.leaves.length) : null
    cursor += task.leaves.length

    if (enSlice) {
      patch[`${task.patchPath}.en`] = reinsertLeaves(
        task.kind,
        task.ptValue as string | PortableTextBlock[],
        enSlice,
      )
    }
    if (esSlice) {
      patch[`${task.patchPath}.es`] = reinsertLeaves(
        task.kind,
        task.ptValue as string | PortableTextBlock[],
        esSlice,
      )
    }

    // Only stamp the hash once BOTH languages succeeded — a partial failure
    // (e.g. ES quota exceeded) must stay "dirty" so the next attempt retries
    // it, instead of silently being marked done.
    if (enSlice && esSlice) {
      patch[`${task.patchPath}.translationHash`] = task.hash
      translatedFieldCount += 1
    }
  }

  if (!Object.keys(patch).length) return {ok: false, reason: 'translation-failed'}

  await client.patch(documentId).set(patch).commit({visibility: 'sync'})
  return {ok: true, changed: translatedFieldCount}
}

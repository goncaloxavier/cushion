import type {SanityClient, SanityDocument} from '@sanity/client'
import type {BuilderPage, BuilderSiteSettings} from './types'

const apiVersion = '2026-07-13'

export const builderClientOptions = {apiVersion}

export class BuilderConflictError extends Error {
  constructor() {
    super('Este conteúdo foi alterado noutro separador ou por outro editor.')
    this.name = 'BuilderConflictError'
  }
}

export const publishedBuilderId = (id: string) => id.replace(/^drafts\./, '')
export const draftBuilderId = (id: string) => `drafts.${publishedBuilderId(id)}`

const chooseDrafts = <T extends SanityDocument>(documents: T[]) => {
  const grouped = new Map<string, T>()

  for (const document of documents) {
    const id = publishedBuilderId(document._id)
    const current = grouped.get(id)
    if (!current || document._id.startsWith('drafts.')) grouped.set(id, document)
  }

  return [...grouped.values()]
}

export const loadBuilderPages = async (client: SanityClient) => {
  const documents = await client.fetch<BuilderPage[]>(
    `*[_type == "builderPage" && !(_id in path("versions.**"))] | order(route asc)`,
  )
  return chooseDrafts(documents).sort((left, right) => left.route.localeCompare(right.route, 'pt'))
}

export const loadBuilderSettings = async (client: SanityClient) => {
  const documents = await client.fetch<BuilderSiteSettings[]>(
    `*[_type == "builderSiteSettings" && !(_id in path("versions.**"))]`,
  )
  return chooseDrafts(documents).find(
    (document) => publishedBuilderId(document._id) === 'builderSiteSettings',
  )
}

const cleanValue = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(cleanValue)
  if (!value || typeof value !== 'object') return value

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, child]) => child !== undefined)
      .map(([key, child]) => [key, cleanValue(child)]),
  )
}

const pageFields = [
  'builderVersion',
  'title',
  'route',
  'pageKind',
  'active',
  'sections',
  'seo',
  'migrationSource',
] as const

const settingsFields = [
  'builderVersion',
  'logo',
  'logoLight',
  'logoAlt',
  'navigation',
  'accountLabel',
  'cartLabel',
  'contactLabel',
  'footerColumns',
  'copyright',
  'theme',
  'rendererMode',
] as const

const saveDraft = async <T extends SanityDocument>(
  client: SanityClient,
  document: T,
  fields: readonly string[],
): Promise<T> => {
  const draftId = draftBuilderId(document._id)
  const currentDraft = await client.getDocument<T>(draftId)

  if (
    currentDraft &&
    document._id.startsWith('drafts.') &&
    document._rev &&
    currentDraft._rev !== document._rev
  ) {
    throw new BuilderConflictError()
  }

  const fieldValues = Object.fromEntries(
    fields
      .filter((field) => Object.prototype.hasOwnProperty.call(document, field))
      .map((field) => [field, cleanValue((document as Record<string, unknown>)[field])]),
  )
  const missingFields = fields.filter(
    (field) => !Object.prototype.hasOwnProperty.call(document, field),
  )

  if (!currentDraft) {
    const created = await client.create({
      ...fieldValues,
      _id: draftId,
      _type: document._type,
    })
    return created as T
  }

  let patch = client.patch(draftId).ifRevisionId(currentDraft._rev).set(fieldValues)
  if (missingFields.length) patch = patch.unset(missingFields)

  try {
    return (await patch.commit({autoGenerateArrayKeys: true, visibility: 'sync'})) as T
  } catch (error) {
    if (error instanceof Error && /revision|conflict/i.test(error.message)) {
      throw new BuilderConflictError()
    }
    throw error
  }
}

export const saveBuilderPageDraft = (client: SanityClient, page: BuilderPage) =>
  saveDraft(client, page, pageFields)

export const saveBuilderSettingsDraft = (client: SanityClient, settings: BuilderSiteSettings) =>
  saveDraft(client, settings, settingsFields)

export const publishBuilderDocument = async <T extends SanityDocument>(
  client: SanityClient,
  document: T,
): Promise<T> => {
  const draftId = draftBuilderId(document._id)
  const publishedId = publishedBuilderId(document._id)
  const draft = await client.getDocument<T>(draftId)
  if (!draft) throw new Error('Guarde o rascunho antes de publicar.')

  const {
    _rev: _ignoredRevision,
    _createdAt: _ignoredCreatedAt,
    _updatedAt: _ignoredUpdatedAt,
    ...content
  } = draft
  void _ignoredRevision
  void _ignoredCreatedAt
  void _ignoredUpdatedAt

  const published = {
    ...content,
    _id: publishedId,
    _type: draft._type,
  }

  await client.transaction().createOrReplace(published).delete(draftId).commit({visibility: 'sync'})
  const result = await client.getDocument<T>(publishedId)
  if (!result) throw new Error('A publicação terminou sem devolver o documento.')
  return result
}

export const deleteBuilderPage = async (client: SanityClient, id: string) => {
  const draftId = draftBuilderId(id)
  const publishedId = publishedBuilderId(id)
  const transaction = client.transaction().delete(draftId)
  const published = await client.getDocument(publishedId)
  if (published) transaction.delete(publishedId)
  await transaction.commit({visibility: 'sync'})
}

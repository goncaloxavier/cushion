import {createClient, type SanityClient} from '@sanity/client'
import {env} from '$env/dynamic/private'
import {
  deleteBuilderPage as deletePageDocument,
  loadBuilderPages,
  loadBuilderSettings,
  publishBuilderDocument,
  saveBuilderPageDraft,
  saveBuilderSettingsDraft,
} from '$lib/builder/sanityDocuments'
import type {BuilderPage, BuilderSiteSettings} from '$lib/builder/types'
import {
  hasBuilderErrors,
  validateBuilderPage,
  validateBuilderSettings,
} from '$lib/builder/validation'

const projectId = 'u4uyfix8'
const apiVersion = '2026-07-13'

export const builderDataset = () => env.SANITY_DATASET || 'production'
export const builderProjectId = projectId

const clientFor = (token: string): SanityClient =>
  createClient({
    projectId,
    dataset: builderDataset(),
    apiVersion,
    token,
    useCdn: false,
    perspective: 'raw',
  })

const readToken = () => env.SANITY_WRITE_TOKEN || env.SANITY_VIEWER_TOKEN || ''
const writeToken = () => env.SANITY_WRITE_TOKEN || ''

const requireReadClient = () => {
  const token = readToken()
  if (!token) {
    throw new Error('Configure SANITY_VIEWER_TOKEN ou SANITY_WRITE_TOKEN para abrir o gestor do site.')
  }
  return clientFor(token)
}

const requireWriteClient = () => {
  const token = writeToken()
  if (!token) {
    throw new Error('Configure SANITY_WRITE_TOKEN para guardar ou publicar alterações.')
  }
  return clientFor(token)
}

export const builderCapabilities = () => ({
  canRead: Boolean(readToken()),
  canWrite: Boolean(writeToken()),
  dataset: builderDataset(),
  projectId,
})

export const getBuilderState = async () => {
  const client = requireReadClient()
  const [pages, settings] = await Promise.all([
    loadBuilderPages(client),
    loadBuilderSettings(client),
  ])

  return {pages, settings}
}

export const getBuilderPreviewPage = async (route: string) => {
  const client = requireReadClient()
  const documents = await client.fetch<BuilderPage[]>(
    `*[_type == "builderPage" && route == $route && !(_id in path("versions.**"))]`,
    {route},
  )

  return (
    documents.find((document) => document._id.startsWith('drafts.')) ?? documents[0] ?? null
  )
}

export const getBuilderPreviewSettings = async () => {
  const client = requireReadClient()
  return (await loadBuilderSettings(client)) ?? null
}

export const saveBuilderPage = async (page: BuilderPage) => {
  if (!page || page._type !== 'builderPage' || !Array.isArray(page.sections)) {
    throw new Error('A página enviada não tem uma estrutura válida.')
  }

  const pages = await loadBuilderPages(requireReadClient())
  const issues = validateBuilderPage(page, pages)
  const structuralErrors = issues.filter(
    (issue) => issue.level === 'error' && ['title', 'route'].includes(issue.field ?? ''),
  )
  if (structuralErrors.length) throw new Error(structuralErrors[0].message)

  return saveBuilderPageDraft(requireWriteClient(), page)
}

export const saveBuilderSettings = async (settings: BuilderSiteSettings) => {
  if (!settings || settings._type !== 'builderSiteSettings') {
    throw new Error('As definições enviadas não têm uma estrutura válida.')
  }

  return saveBuilderSettingsDraft(requireWriteClient(), settings)
}

export const publishBuilderPage = async (page: BuilderPage) => {
  const pages = await loadBuilderPages(requireReadClient())
  const issues = validateBuilderPage(page, pages)
  if (hasBuilderErrors(issues)) {
    throw new Error(issues.find((issue) => issue.level === 'error')?.message || 'A página tem erros.')
  }

  const saved = await saveBuilderPageDraft(requireWriteClient(), page)
  return publishBuilderDocument(requireWriteClient(), saved)
}

export const publishBuilderSettings = async (settings: BuilderSiteSettings) => {
  const issues = validateBuilderSettings(settings)
  if (hasBuilderErrors(issues)) {
    throw new Error(
      issues.find((issue) => issue.level === 'error')?.message || 'As definições têm erros.',
    )
  }

  const saved = await saveBuilderSettingsDraft(requireWriteClient(), settings)
  return publishBuilderDocument(requireWriteClient(), saved)
}

export const deleteBuilderPage = (id: string) => deletePageDocument(requireWriteClient(), id)

export const uploadBuilderAsset = async (file: File, kind: 'image' | 'video') => {
  const maxBytes = kind === 'video' ? 250 * 1024 * 1024 : 25 * 1024 * 1024
  const validType = kind === 'image' ? file.type.startsWith('image/') : file.type.startsWith('video/')

  if (!validType) throw new Error(kind === 'image' ? 'Escolha uma imagem válida.' : 'Escolha um vídeo válido.')
  if (file.size <= 0 || file.size > maxBytes) {
    throw new Error(kind === 'image' ? 'A imagem excede 25 MB.' : 'O vídeo excede 250 MB.')
  }

  const bytes = Buffer.from(await file.arrayBuffer())
  return requireWriteClient().assets.upload(kind === 'image' ? 'image' : 'file', bytes, {
    contentType: file.type,
    filename: file.name.slice(0, 180),
  })
}

import type {
  SiteEditorDocument,
  SiteEditorDocumentType,
  SiteEditorManifest,
} from '../types'

type DocumentResponse = {document: SiteEditorDocument}

const responseError = async (response: Response) => {
  const fallback = `O servidor respondeu com o estado ${response.status}.`
  try {
    const payload = (await response.json()) as {message?: string}
    return new Error(payload.message || fallback)
  } catch {
    return new Error(fallback)
  }
}

const request = async <T>(url: string, init: RequestInit = {}): Promise<T> => {
  const response = await fetch(url, {
    credentials: 'same-origin',
    ...init,
    headers: {accept: 'application/json', ...init.headers},
  })
  if (!response.ok) throw await responseError(response)
  return response.json() as Promise<T>
}

export const createSiteEditorApi = (csrfToken: string) => ({
  manifest: () => request<SiteEditorManifest>('/painel/site/api'),
  document: async (id: string) =>
    (
      await request<DocumentResponse>(
        `/painel/site/api?document=${encodeURIComponent(id)}`,
      )
    ).document,
  save: async (document: SiteEditorDocument) =>
    (
      await request<DocumentResponse>('/painel/site/api', {
        method: 'PUT',
        headers: {'content-type': 'application/json', 'x-csrf-token': csrfToken},
        body: JSON.stringify({document}),
      })
    ).document,
  publish: async (document: SiteEditorDocument) =>
    (
      await request<DocumentResponse>('/painel/site/api', {
        method: 'POST',
        headers: {'content-type': 'application/json', 'x-csrf-token': csrfToken},
        body: JSON.stringify({action: 'publish', document}),
      })
    ).document,
  create: async (documentType: SiteEditorDocumentType, title: string, route?: string) =>
    (
      await request<DocumentResponse>('/painel/site/api', {
        method: 'POST',
        headers: {'content-type': 'application/json', 'x-csrf-token': csrfToken},
        body: JSON.stringify({action: 'create', documentType, title, route}),
      })
    ).document,
  delete: (id: string) =>
    request<{ok: true}>(`/painel/site/api?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {'x-csrf-token': csrfToken},
    }),
  uploadAsset: async (file: File, kind: 'image' | 'video') => {
    const body = new FormData()
    body.set('file', file)
    body.set('kind', kind)
    return request<{
      asset: {
        id: string
        url: string
        originalFilename?: string
        mimeType?: string
        size?: number
      }
    }>('/painel/site/api/media', {
      method: 'POST',
      headers: {'x-csrf-token': csrfToken},
      body,
    })
  },
})

export type SiteEditorApi = ReturnType<typeof createSiteEditorApi>

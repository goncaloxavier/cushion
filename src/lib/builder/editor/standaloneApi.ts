import type {BuilderPage, BuilderSiteSettings} from '../types'

type BuilderStateResponse = {
  pages: BuilderPage[]
  settings?: BuilderSiteSettings
  capabilities: {
    canRead: boolean
    canWrite: boolean
    dataset: string
    projectId: string
  }
  canPublish: boolean
}

type DocumentResponse<T> = {document: T}

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
    headers: {
      accept: 'application/json',
      ...init.headers,
    },
  })
  if (!response.ok) throw await responseError(response)
  return response.json() as Promise<T>
}

export const createStandaloneBuilderApi = (csrfToken: string) => ({
  load: () => request<BuilderStateResponse>('/painel/site/api'),

  savePage: async (page: BuilderPage) =>
    (
      await request<DocumentResponse<BuilderPage>>('/painel/site/api', {
        method: 'PUT',
        headers: {'content-type': 'application/json', 'x-csrf-token': csrfToken},
        body: JSON.stringify({kind: 'page', value: page}),
      })
    ).document,

  saveSettings: async (settings: BuilderSiteSettings) =>
    (
      await request<DocumentResponse<BuilderSiteSettings>>('/painel/site/api', {
        method: 'PUT',
        headers: {'content-type': 'application/json', 'x-csrf-token': csrfToken},
        body: JSON.stringify({kind: 'settings', value: settings}),
      })
    ).document,

  publishPage: async (page: BuilderPage) =>
    (
      await request<DocumentResponse<BuilderPage>>('/painel/site/api', {
        method: 'POST',
        headers: {'content-type': 'application/json', 'x-csrf-token': csrfToken},
        body: JSON.stringify({action: 'publish-page', value: page}),
      })
    ).document,

  publishSettings: async (settings: BuilderSiteSettings) =>
    (
      await request<DocumentResponse<BuilderSiteSettings>>('/painel/site/api', {
        method: 'POST',
        headers: {'content-type': 'application/json', 'x-csrf-token': csrfToken},
        body: JSON.stringify({action: 'publish-settings', value: settings}),
      })
    ).document,

  deletePage: (id: string) =>
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

export type StandaloneBuilderApi = ReturnType<typeof createStandaloneBuilderApi>

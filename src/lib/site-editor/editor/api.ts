import type {
  SiteEditorAssetKind,
  SiteEditorDocument,
  SiteEditorDocumentType,
  SiteEditorManifest,
} from '../types'
import type {BuilderPageStarter} from '$lib/builder/defaults'

type DocumentResponse = {document: SiteEditorDocument}
const requestTimeoutMs = 30_000
const uploadTimeoutMs = 10 * 60_000

export type SiteEditorUploadProgress = {
  loaded: number
  total: number
  percent: number
}

// The server already classifies failures — a save that lost a race throws
// SiteEditorConflictError and comes back as 409. Keeping the status on the
// error lets callers branch on that fact instead of pattern-matching the
// Portuguese message, which silently stops working the moment someone
// rewords it.
export class SiteEditorRequestError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'SiteEditorRequestError'
    this.status = status
  }
}

export const isConflictError = (error: unknown) =>
  error instanceof SiteEditorRequestError && error.status === 409

const responseError = async (response: Response) => {
  const fallback = `O servidor respondeu com o estado ${response.status}.`
  try {
    const payload = (await response.json()) as {message?: string}
    return new SiteEditorRequestError(payload.message || fallback, response.status)
  } catch {
    return new SiteEditorRequestError(fallback, response.status)
  }
}

const request = async <T>(url: string, init: RequestInit = {}): Promise<T> => {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), requestTimeoutMs)
  const abortFromCaller = () => controller.abort()
  init.signal?.addEventListener('abort', abortFromCaller, {once: true})
  try {
    const response = await fetch(url, {
      credentials: 'same-origin',
      ...init,
      signal: controller.signal,
      headers: {accept: 'application/json', ...init.headers},
    })
    if (!response.ok) throw await responseError(response)
    return response.json() as Promise<T>
  } catch (error) {
    if (controller.signal.aborted && !init.signal?.aborted) {
      throw new Error('A ligação demorou demasiado. Verifique a internet e tente novamente.')
    }
    throw error
  } finally {
    window.clearTimeout(timeout)
    init.signal?.removeEventListener('abort', abortFromCaller)
  }
}

export const createSiteEditorApi = (csrfToken: string) => ({
  manifest: () => request<SiteEditorManifest>('/painel/site/api'),
  document: async (id: string) =>
    (await request<DocumentResponse>(`/painel/site/api?document=${encodeURIComponent(id)}`))
      .document,
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
  create: async (
    documentType: SiteEditorDocumentType,
    title: string,
    route?: string,
    sitePageStarter?: BuilderPageStarter,
  ) =>
    (
      await request<DocumentResponse>('/painel/site/api', {
        method: 'POST',
        headers: {'content-type': 'application/json', 'x-csrf-token': csrfToken},
        body: JSON.stringify({action: 'create', documentType, title, route, sitePageStarter}),
      })
    ).document,
  delete: (id: string) =>
    request<{ok: true}>(`/painel/site/api?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: {'x-csrf-token': csrfToken},
    }),
  uploadAsset: async (
    file: File,
    kind: SiteEditorAssetKind,
    onProgress?: (progress: SiteEditorUploadProgress) => void,
  ) => {
    const body = new FormData()
    body.set('file', file)
    body.set('kind', kind)
    type ResponsePayload = {
      asset: {
        id: string
        url: string
        originalFilename?: string
        mimeType?: string
        size?: number
      }
    }

    return new Promise<ResponsePayload>((resolve, reject) => {
      const upload = new XMLHttpRequest()
      upload.open('POST', '/painel/site/api/media')
      upload.timeout = uploadTimeoutMs
      upload.withCredentials = true
      upload.setRequestHeader('accept', 'application/json')
      upload.setRequestHeader('x-csrf-token', csrfToken)
      upload.upload.addEventListener('progress', (event) => {
        if (!event.lengthComputable || event.total <= 0) return
        onProgress?.({
          loaded: event.loaded,
          total: event.total,
          percent: Math.min(100, Math.round((event.loaded / event.total) * 100)),
        })
      })
      upload.addEventListener('load', () => {
        let payload: ResponsePayload | {message?: string} | undefined
        try {
          payload = JSON.parse(upload.responseText) as ResponsePayload | {message?: string}
        } catch {
          payload = undefined
        }
        if (upload.status >= 200 && upload.status < 300 && payload && 'asset' in payload) {
          onProgress?.({loaded: file.size, total: file.size, percent: 100})
          resolve(payload)
          return
        }
        reject(
          new Error(
            (payload && 'message' in payload && payload.message) ||
              `O servidor respondeu com o estado ${upload.status || 0}.`,
          ),
        )
      })
      upload.addEventListener('error', () =>
        reject(new Error('A ligação falhou durante o carregamento. Tente novamente.')),
      )
      upload.addEventListener('timeout', () =>
        reject(
          new Error('O carregamento demorou demasiado. Verifique a internet e tente novamente.'),
        ),
      )
      upload.addEventListener('abort', () => reject(new Error('O carregamento foi cancelado.')))
      upload.send(body)
    })
  },
})

export type SiteEditorApi = ReturnType<typeof createSiteEditorApi>

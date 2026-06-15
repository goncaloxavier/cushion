import type {Handle} from '@sveltejs/kit'

export const handle: Handle = async ({event, resolve}) => {
  const response = await resolve(event)
  const contentType = response.headers.get('content-type') ?? ''

  if (!contentType.includes('text/html')) {
    return response
  }

  const headers = new Headers(response.headers)
  headers.set('cache-control', 'no-store, max-age=0')

  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText
  })
}

// Visual Editing / Presentation preview mode. When this cookie is set (only after
// passing the signed secret check at /preview/enable), the server loads render
// draft content with stega metadata for the click-to-edit overlay.
export const PREVIEW_COOKIE = '__df4y_preview'

export const isPreview = (cookies: {get: (name: string) => string | undefined}): boolean =>
  cookies.get(PREVIEW_COOKIE) === '1'

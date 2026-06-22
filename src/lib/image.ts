// Image URL helpers.
//
// NOTE: on-the-fly Sanity transforms (?w=…&auto=format) are currently DISABLED.
// They generate a fresh derivative on first request, which is slow until the
// CDN warms — making images feel slower on first view. Until we add a one-time
// warming step, serve the already-cached original URL (fast) untouched.
export const sizedImage = (url: string | undefined, _width?: number, _quality?: number) => url ?? ''

export const imageSrcset = (
  _url: string | undefined,
  _widths?: number[],
  _quality?: number,
): string | undefined => undefined

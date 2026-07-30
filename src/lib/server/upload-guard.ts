export type UploadKind = 'image' | 'video' | 'file' | 'document'

const allowedImageTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
])
const allowedVideoTypes = new Set(['video/mp4', 'video/webm', 'video/quicktime'])
const allowedCaptionTypes = new Set(['text/vtt', 'text/plain', 'application/octet-stream', ''])
const allowedDocumentTypes = new Set(['application/pdf'])

// 'document' is its own kind rather than a loosened 'file'. 'file' means WebVTT
// subtitles and is capped at 2 MB; widening it to accept PDFs would have let a
// subtitle field take a 20 MB upload, and a document field take a .vtt.
export const uploadLimitBytes: Record<UploadKind, number> = {
  image: 25 * 1024 * 1024,
  video: 250 * 1024 * 1024,
  file: 2 * 1024 * 1024,
  document: 20 * 1024 * 1024,
}

// Explicit allowlists, never a startsWith('image/') check — that pattern also
// accepts image/svg+xml, which can carry inline <script>/event handlers. For the
// two extension-bearing kinds the name and the MIME type must agree, so neither
// alone is enough to get a file through.
const typeAllowed = (name: string, type: string, kind: UploadKind) => {
  const lower = name.toLowerCase()
  if (kind === 'image') return allowedImageTypes.has(type)
  if (kind === 'video') return allowedVideoTypes.has(type)
  if (kind === 'document') return lower.endsWith('.pdf') && allowedDocumentTypes.has(type)
  return lower.endsWith('.vtt') && allowedCaptionTypes.has(type)
}

const typeError: Record<UploadKind, string> = {
  image: 'Este ficheiro não é uma imagem aceite. Use JPEG, PNG, WebP, GIF ou AVIF.',
  video: 'Este ficheiro não é um vídeo aceite. Use MP4, WebM ou QuickTime.',
  document: 'Só é possível carregar ficheiros PDF.',
  file: 'Este ficheiro não contém legendas WebVTT válidas. Use um ficheiro .vtt.',
}

const sizeError: Record<UploadKind, string> = {
  image: 'Esta imagem é maior do que 25 MB. Escolha um ficheiro mais pequeno.',
  video: 'Este vídeo é maior do que 250 MB. Escolha um ficheiro mais pequeno.',
  document: 'Este PDF é maior do que 20 MB. Escolha um ficheiro mais pequeno.',
  file: 'Este ficheiro de legendas é maior do que 2 MB.',
}

/** Throws with a message written for the person uploading, not for a log. */
export const assertUploadAllowed = (
  file: {name: string; type: string; size: number},
  kind: UploadKind,
) => {
  if (!typeAllowed(file.name, file.type, kind)) throw new Error(typeError[kind])
  if (file.size <= 0 || file.size > uploadLimitBytes[kind]) throw new Error(sizeError[kind])
}

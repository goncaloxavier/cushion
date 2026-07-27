import {createClient} from '@sanity/client'
import {env} from '$env/dynamic/private'

const projectId = 'u4uyfix8'
const apiVersion = '2026-07-13'

const clientFor = (token: string) =>
  createClient({
    projectId,
    dataset: env.SANITY_DATASET || 'production',
    apiVersion,
    token,
    useCdn: false,
    perspective: 'raw',
  })

const writeToken = () => env.SANITY_WRITE_TOKEN || ''

const requireWriteClient = () => {
  const token = writeToken()
  if (!token) {
    throw new Error('Não é possível guardar alterações neste momento. Contacte o suporte técnico.')
  }
  return clientFor(token)
}

const allowedImageTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
])
const allowedVideoTypes = new Set(['video/mp4', 'video/webm', 'video/quicktime'])
const allowedCaptionTypes = new Set(['text/vtt', 'text/plain', 'application/octet-stream', ''])

export const uploadBuilderAsset = async (file: File, kind: 'image' | 'video' | 'file') => {
  const maxBytes =
    kind === 'video' ? 250 * 1024 * 1024 : kind === 'file' ? 2 * 1024 * 1024 : 25 * 1024 * 1024
  // Explicit allowlist, not a startsWith('image/') check — that pattern also
  // accepts image/svg+xml, which can carry inline <script>/event handlers.
  const validType =
    kind === 'image'
      ? allowedImageTypes.has(file.type)
      : kind === 'video'
        ? allowedVideoTypes.has(file.type)
        : file.name.toLowerCase().endsWith('.vtt') && allowedCaptionTypes.has(file.type)

  if (!validType) {
    throw new Error(
      kind === 'image'
        ? 'Este ficheiro não é uma imagem aceite. Use JPEG, PNG, WebP, GIF ou AVIF.'
        : kind === 'video'
          ? 'Este ficheiro não é um vídeo aceite. Use MP4, WebM ou QuickTime.'
          : 'Este ficheiro não contém legendas WebVTT válidas. Use um ficheiro .vtt.',
    )
  }
  if (file.size <= 0 || file.size > maxBytes) {
    throw new Error(
      kind === 'image'
        ? 'Esta imagem é maior do que 25 MB. Escolha um ficheiro mais pequeno.'
        : kind === 'video'
          ? 'Este vídeo é maior do que 250 MB. Escolha um ficheiro mais pequeno.'
          : 'Este ficheiro de legendas é maior do que 2 MB.',
    )
  }

  const bytes = Buffer.from(await file.arrayBuffer())
  return requireWriteClient().assets.upload(kind === 'image' ? 'image' : 'file', bytes, {
    contentType: file.type,
    filename: file.name.slice(0, 180),
  })
}

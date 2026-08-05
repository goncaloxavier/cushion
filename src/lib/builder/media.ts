const projectId = 'u4uyfix8'

export const builderAssetUrl = (reference: string | undefined, dataset: string) => {
  if (!reference) return ''

  const image = reference.match(/^image-(.+)-(\d+x\d+)-([a-z0-9]+)$/i)
  if (image) {
    return `https://cdn.sanity.io/images/${projectId}/${dataset}/${image[1]}-${image[2]}.${image[3]}`
  }

  const file = reference.match(/^file-(.+)-([a-z0-9]+)$/i)
  if (file) {
    return `https://cdn.sanity.io/files/${projectId}/${dataset}/${file[1]}.${file[2]}`
  }

  return ''
}

/**
 * Which asset a media block actually shows, decided once so the frame and its
 * contents can never disagree. BuilderMedia draws the image whenever there is
 * one — a video or embed only wins when it has something to play — but callers
 * sizing the frame asked for `kind === 'image'` instead, which is stricter. A
 * media object with no kind therefore rendered an image inside a 16:9 frame and
 * cropped it, while the section editor, which reads a missing kind as 'image',
 * showed every control as if it were fine.
 */
type MediaLike = {
  kind?: string
  image?: {asset?: {_ref?: string}}
  videoFile?: {asset?: {_ref?: string}}
  youtubeUrl?: string
}

export const builderMediaImageRef = (media: MediaLike | undefined) => {
  if (!media) return undefined
  const hasVideo = media.kind === 'video' && Boolean(media.videoFile?.asset?._ref)
  const hasEmbed = media.kind === 'youtube' && Boolean(media.youtubeUrl?.trim())
  return hasVideo || hasEmbed ? undefined : media.image?.asset?._ref
}

export const builderImageAspectRatio = (reference: string | undefined) => {
  const dimensions = reference?.match(/-(\d+)x(\d+)-[a-z0-9]+$/i)
  if (!dimensions) return undefined

  const width = Number(dimensions[1])
  const height = Number(dimensions[2])
  return width > 0 && height > 0 ? width / height : undefined
}

export const builderVideoMimeType = (reference: string | undefined) => {
  const extension = reference?.match(/-([a-z0-9]+)$/i)?.[1]?.toLowerCase()
  if (extension === 'webm') return 'video/webm'
  if (extension === 'mov' || extension === 'quicktime') return 'video/quicktime'
  return 'video/mp4'
}

export const builderYoutubeEmbedUrl = (value: string | undefined) => {
  if (!value) return ''

  try {
    const url = new URL(value)
    const id = url.hostname.includes('youtu.be')
      ? url.pathname.slice(1)
      : url.searchParams.get('v') || url.pathname.split('/').filter(Boolean).at(-1)

    return id ? `https://www.youtube-nocookie.com/embed/${id}` : ''
  } catch {
    return ''
  }
}

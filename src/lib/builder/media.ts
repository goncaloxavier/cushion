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

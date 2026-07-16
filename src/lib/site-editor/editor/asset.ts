export const sanityAssetUrl = (
  reference: string | undefined,
  projectId: string,
  dataset: string,
) => {
  if (!reference) return ''
  const image = /^image-([a-zA-Z0-9]+)-(\d+x\d+)-([a-zA-Z0-9]+)$/.exec(reference)
  if (image) {
    return `https://cdn.sanity.io/images/${projectId}/${dataset}/${image[1]}-${image[2]}.${image[3]}`
  }
  const file = /^file-([a-zA-Z0-9]+)-([a-zA-Z0-9]+)$/.exec(reference)
  if (file) return `https://cdn.sanity.io/files/${projectId}/${dataset}/${file[1]}.${file[2]}`
  return ''
}

export const editorKey = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().replace(/-/g, '').slice(0, 16)
    : Math.random().toString(36).slice(2, 18)

export const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 90)

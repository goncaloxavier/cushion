import {createClient} from '@sanity/client'
import {env} from '$env/dynamic/private'
import {assertUploadAllowed, type UploadKind} from './upload-guard'

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

export const uploadBuilderAsset = async (file: File, kind: UploadKind) => {
  assertUploadAllowed(file, kind)

  const bytes = Buffer.from(await file.arrayBuffer())
  return requireWriteClient().assets.upload(kind === 'image' ? 'image' : 'file', bytes, {
    contentType: file.type,
    filename: file.name.slice(0, 180),
  })
}

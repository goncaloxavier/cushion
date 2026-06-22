import type {LanguageCode} from './site-content'

export const pageFromSearchParams = (params: URLSearchParams, key = 'page') => {
  const page = Number(params.get(key))
  return Number.isInteger(page) && page > 0 ? page : 1
}

export const collectionListHref = (path: string, language: LanguageCode, page: number) => {
  const params = new URLSearchParams({lang: language})
  if (page > 1) params.set('page', String(page))
  return `${path}?${params.toString()}`
}

export const collectionDetailHref = (path: string, language: LanguageCode, page: number) => {
  const params = new URLSearchParams({lang: language})
  if (page > 1) params.set('fromPage', String(page))
  return `${path}?${params.toString()}`
}

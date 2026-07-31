import {randomUUID} from 'node:crypto'
import type {SiteEditorDocumentType} from '$lib/site-editor/types'

type StarterDocumentType = Exclude<SiteEditorDocumentType, 'siteLanding' | 'sitePage'>

type StarterOptions = {
  type: StarterDocumentType
  title: string
  slug: string
  storeCategory?: string
  publishedAt?: string
}

const localizedString = (pt: string) => ({_type: 'localizedString', pt})
const localizedText = (pt: string) => ({_type: 'localizedText', pt})
const starterKey = (prefix: string) => `${prefix}-${randomUUID().replace(/-/g, '').slice(0, 12)}`

const starterArticle = () => ({
  _type: 'localizedArticle',
  pt: [],
})

export const createSiteEditorStarterFields = ({
  type,
  title,
  slug,
  storeCategory = 'bancos',
  publishedAt = new Date().toISOString().slice(0, 10),
}: StarterOptions): Record<string, unknown> => {
  const identity = {
    title: localizedString(title),
    slug: {_type: 'slug', current: slug},
  }

  if (type === 'storeCategory') {
    return {...identity, orderRank: 100}
  }

  if (type === 'productCategory') {
    return {
      ...identity,
      gallery: [],
      sections: [],
      description: localizedText(
        'Apresente aqui, numa frase, onde este produto é útil. Descreva o produto, as aplicações e as principais vantagens.',
      ),
      active: false,
      orderRank: 100,
    }
  }

  if (type === 'storeProduct') {
    return {
      ...identity,
      category: storeCategory,
      summary: localizedText('Apresente o produto numa frase curta.'),
      hasFinishChoice: true,
      gallery: [],
      variants: [
        {
          _key: starterKey('variant'),
          _type: 'storeProductVariant',
          label: localizedString('Opção principal'),
          dimensions: [],
          weightKg: 0,
          priceNatural: 0,
          priceDark: 0,
          note: localizedText(''),
        },
      ],
      active: false,
      orderRank: 100,
    }
  }

  if (type === 'caseStudy') {
    return {
      ...identity,
      gallery: [],
      location: 'Localização',
      summary: localizedText('Resuma o projeto e a solução aplicada.'),
      description: localizedText('Descreva o contexto, o trabalho realizado e o resultado.'),
      orderRank: 100,
    }
  }

  return {
    ...identity,
    gallery: [],
    publishedAt,
    category: localizedString('Tema'),
    excerpt: localizedText('Resuma o artigo em duas ou três linhas.'),
    article: starterArticle(),
    body: localizedText(''),
  }
}

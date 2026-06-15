import {createClient} from '@sanity/client'

const projectId = 'u4uyfix8'
const dataset = 'production'

export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion: '2026-06-10',
  useCdn: false,
})

const collectionsQuery = `{
  "products": *[_type == "productCategory" && defined(slug.current)] | order(orderRank asc, title.pt asc) {
    title,
    slug,
    image {
      asset -> {
        url
      },
      alt
    },
    gallery[] {
      asset -> {
        url
      },
      alt
    },
    summary,
    description,
    features,
    applications
  },
  "caseStudies": *[_type == "caseStudy" && defined(slug.current)] | order(orderRank asc, title.pt asc) {
    title,
    slug,
    image {
      asset -> {
        url
      },
      alt
    },
    gallery[] {
      asset -> {
        url
      },
      alt
    },
    location,
    summary,
    challenge,
    solution,
    result,
    productArea
  },
  "blogPosts": *[_type == "blogPost" && defined(slug.current)] | order(publishedAt desc) {
    title,
    slug,
    image {
      asset -> {
        url
      },
      alt
    },
    excerpt,
    publishedAt,
    category,
    body
  }
}`

export const getSanityCollections = async () => {
  if (process.env.SANITY_DISABLE_REMOTE === 'true') return null

  try {
    return await sanityClient.fetch(collectionsQuery)
  } catch {
    return null
  }
}

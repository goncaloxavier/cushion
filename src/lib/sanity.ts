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
  "siteContent": coalesce(*[_id == "siteContent"][0], *[_type == "siteLanding"][0]) {
    common {
      contactEmail,
      contactPhone,
      whatsappLabel,
      whatsappUrl,
      socialLabel,
      youtubeUrl,
      facebookUrl,
      instagramUrl,
      complaintsLabel,
      complaintsUrl,
      complaintsNote,
      marketingConsent
    },
    footer {
      line
    },
    home {
      hero,
      heroImage {
        asset -> {
          url
        },
        alt
      },
      intro,
      impact {
        title,
        lead,
        stats[] {
          title,
          text
        }
      },
      manifesto,
      mediaShowcase {
        kicker,
        title,
        lead,
        items[] {
          kind,
          title,
          caption,
          youtubeUrl,
          image {
            asset -> {
              url
            },
            alt
          },
          poster {
            asset -> {
              url
            },
            alt
          }
        }
      },
      partners {
        kicker,
        title,
        lead,
        items[] {
          name,
          url,
          logoTone,
          logo {
            asset -> {
              url
            },
            alt
          },
          text
        }
      }
    },
    about {
      hero,
      timeline[] {
        title,
        text
      },
      principles[] {
        title,
        text
      }
    },
    productsPage {
      hero,
      heroImage {
        asset -> {
          url
        },
        alt
      },
      lead
    },
    catalogue {
      hero,
      quoteFlow[] {
        title,
        text
      },
      estimate {
        kicker,
        title,
        lead,
        cards[] {
          title,
          text
        },
        checklistTitle,
        checklist[]
      },
      note
    },
    casesPage {
      hero,
      heroImage {
        asset -> {
          url
        },
        alt
      }
    },
    blogPage {
      hero,
      heroImage {
        asset -> {
          url
        },
        alt
      },
      newsletter
    },
    contactPage {
      hero,
      fields[]
    }
  },
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

import {createClient} from '@sanity/client'
import {env} from '$env/dynamic/private'

const projectId = 'u4uyfix8'
// Dataset is env-driven (defaults to `production`) so it can be repointed without
// code changes if a separate dataset is ever provisioned. To keep local work off
// the deployed content today we instead use SANITY_DISABLE_REMOTE (see below),
// which renders the in-code fallback and never reads/writes Sanity.
const dataset = env.SANITY_DATASET || 'production'

const apiVersion = '2026-06-10'

export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  // Visitor-facing pages prioritise speed: the cached API edge serves document
  // queries ~13x faster. Published Studio changes propagate within a few seconds.
  useCdn: true,
})

// Preview client for Visual Editing (Presentation tool): reads draft content and
// embeds Content Source Map metadata (stega) in the returned strings so the
// click-to-edit overlay can map each on-page value back to its Studio field.
// Requires a read token with draft access (SANITY_VIEWER_TOKEN).
const studioUrl = env.SANITY_STUDIO_URL || 'http://localhost:3333/website'
export const sanityStudioUrl = studioUrl
export const previewClient = sanityClient.withConfig({
  useCdn: false,
  token: env.SANITY_VIEWER_TOKEN,
  perspective: 'drafts',
  stega: {enabled: true, studioUrl},
})

export const previewEnabled = () => Boolean(env.SANITY_VIEWER_TOKEN)

// Plain authed client for validating the preview-url secret. Must NOT use stega,
// otherwise the stored secret string gets encoded with invisible characters and
// no longer matches the secret from the URL.
export const previewSecretClient = sanityClient.withConfig({
  useCdn: false,
  token: env.SANITY_VIEWER_TOKEN,
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
      privacyPolicyLabel,
      privacyPolicyUrl,
      cookiePolicyLabel,
      cookiePolicyUrl,
      marketingConsent,
      privacyConsentPrefix
    },
    home {
      hero,
      heroImage {
        asset -> {
          url,
          metadata {
            dimensions {
              aspectRatio
            }
          }
        },
        alt
      },
      heroVideoUrl,
      intro,
      impact {
        title,
        lead,
        stats[] {
          title,
          text
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
              url,
              metadata {
                dimensions {
                  aspectRatio
                }
              }
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
      }
    },
    productsPage {
      hero {
        kicker,
        title
      },
      heroImage {
        asset -> {
          url,
          metadata {
            dimensions {
              aspectRatio
            }
          }
        },
        alt
      }
    },
    storePage {
      hero {
        kicker,
        title
      },
      transportMultiplier
    },
    catalogue {
      hero {
        kicker,
        title
      },
      ctaLabel,
      estimate {
        kicker,
        title,
        lead,
        checklistTitle,
        checklist[]
      }
    },
    casesPage {
      hero {
        kicker,
        title
      },
      heroImage {
        asset -> {
          url,
          metadata {
            dimensions {
              aspectRatio
            }
          }
        },
        alt
      }
    },
    blogPage {
      hero {
        kicker,
        title
      },
      heroImage {
        asset -> {
          url,
          metadata {
            dimensions {
              aspectRatio
            }
          }
        },
        alt
      }
    },
    contactPage {
      hero,
      formLabels,
      fields[]
    }
  },
  "products": *[_type == "productCategory" && defined(slug.current)] | order(orderRank asc, title.pt asc) {
    _id,
    title,
    slug,
    image {
      asset -> {
        url,
        originalFilename,
        metadata {
          dimensions {
            aspectRatio
          }
        }
      },
      alt
    },
    gallery[] {
      _key,
      _type,
      _type == "galleryImage" => {
        asset -> {
          url,
          originalFilename,
          metadata {
            dimensions {
              aspectRatio
            }
          }
        },
        alt
      },
      _type == "galleryVideo" => {
        asset -> {
          url,
          originalFilename,
          mimeType,
          size
        },
        title,
        poster {
          asset -> {
            url,
            originalFilename,
            metadata {
              dimensions {
                aspectRatio
              }
            }
          },
          alt
        }
      },
      _type == "image" => {
        asset -> {
          url,
          originalFilename,
          metadata {
            dimensions {
              aspectRatio
            }
          }
        },
        alt
      },
    },
    summary,
    description,
    videoUrl,
    videoTitle,
    toolUrl,
    toolTitle,
    toolText,
    toolLabel
  },
  "storeProducts": *[_type == "storeProduct" && defined(slug.current) && coalesce(active, true)] | order(orderRank asc, title.pt asc) {
    _id,
    title,
    slug,
    category,
    summary,
    hasFinishChoice,
    flatTransportPrice,
    image {
      asset -> {
        url,
        originalFilename,
        metadata {
          dimensions {
            aspectRatio
          }
        }
      },
      alt
    },
    gallery[] {
      _key,
      _type,
      _type == "galleryImage" => {
        asset -> {
          url,
          originalFilename,
          metadata {
            dimensions {
              aspectRatio
            }
          }
        },
        alt
      },
      _type == "galleryVideo" => {
        asset -> {
          url,
          originalFilename,
          mimeType,
          size
        },
        title,
        poster {
          asset -> {
            url,
            originalFilename,
            metadata {
              dimensions {
                aspectRatio
              }
            }
          },
          alt
        }
      },
      _type == "image" => {
        asset -> {
          url,
          originalFilename,
          metadata {
            dimensions {
              aspectRatio
            }
          }
        },
        alt
      },
    },
    variants[] {
      _key,
      label,
      dimensions[],
      weightKg,
      priceNatural,
      priceDark,
      note
    }
  },
  "caseStudies": *[_type == "caseStudy" && defined(slug.current)] | order(orderRank asc, title.pt asc) {
    _id,
    title,
    slug,
    image {
      asset -> {
        url,
        metadata {
          dimensions {
            aspectRatio
          }
        }
      },
      alt
    },
    gallery[] {
      _key,
      asset -> {
        url,
        metadata {
          dimensions {
            aspectRatio
          }
        }
      },
      alt
    },
    location,
    summary,
    description,
    challenge,
    solution,
    result
  },
  "blogPosts": *[_type == "blogPost" && defined(slug.current)] | order(publishedAt desc) {
    _id,
    title,
    slug,
    image {
      asset -> {
        url,
        metadata {
          dimensions {
            aspectRatio
          }
        }
      },
      alt
    },
    gallery[] {
      _key,
      asset -> {
        url,
        metadata {
          dimensions {
            aspectRatio
          }
        }
      },
      alt
    },
    excerpt,
    publishedAt,
    category
  }
}`

// Article bodies are large (~2.6 MB across all posts) and only needed on a
// single blog detail page, so they are loaded per-slug here instead of in the
// global query that runs on every route.
const blogPostDetailQuery = `*[_type == "blogPost" && slug.current == $slug][0] {
  body,
  article {
    pt[] {
      ...,
      markDefs[] {
        ...
      },
      children[] {
        ...
      },
      asset -> {
        url,
        metadata {
          dimensions {
            aspectRatio
          }
        }
      },
      rows[] {
        ...
      }
    },
    en[] {
      ...,
      markDefs[] {
        ...
      },
      children[] {
        ...
      },
      asset -> {
        url,
        metadata {
          dimensions {
            aspectRatio
          }
        }
      },
      rows[] {
        ...
      }
    },
    es[] {
      ...,
      markDefs[] {
        ...
      },
      children[] {
        ...
      },
      asset -> {
        url,
        metadata {
          dimensions {
            aspectRatio
          }
        }
      },
      rows[] {
        ...
      }
    }
  }
}`

const collectionCacheTtlMs = Math.max(0, Number(env.SANITY_COLLECTION_CACHE_MS ?? 15_000))
let collectionCache:
  | {
      expiresAt: number
      value: unknown
    }
  | null = null

export const getSanityCollections = async (preview = false) => {
  if (env.SANITY_DISABLE_REMOTE === 'true') return null

  if (!preview && collectionCache && collectionCache.expiresAt > Date.now()) {
    return collectionCache.value
  }

  const client = preview && previewEnabled() ? previewClient : sanityClient
  try {
    const value = await client.fetch(collectionsQuery)
    if (!preview && collectionCacheTtlMs > 0) {
      collectionCache = {value, expiresAt: Date.now() + collectionCacheTtlMs}
    }
    return value
  } catch {
    return null
  }
}

export const getBlogPostDetail = async (slug: string, preview = false) => {
  if (env.SANITY_DISABLE_REMOTE === 'true') return null

  const client = preview && previewEnabled() ? previewClient : sanityClient
  try {
    return await client.fetch(blogPostDetailQuery, {slug})
  } catch {
    return null
  }
}

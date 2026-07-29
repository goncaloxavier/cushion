import {createClient} from '@sanity/client'
import {dev} from '$app/environment'
import {env} from '$env/dynamic/private'
import type {BuilderSection} from '$lib/builder/types'
import type {ManagedDetailSectionScope} from '$lib/builder/managed-page-sections'
import {productBuilderSections} from '$lib/builder/product-sections'

const projectId = 'u4uyfix8'
// Dataset is env-driven (defaults to `production`) so it can be repointed without
// code changes if a separate dataset is ever provisioned. To keep local work off
// the deployed content today we instead use SANITY_DISABLE_REMOTE (see below),
// which renders the in-code fallback and never reads/writes Sanity.
const dataset = env.SANITY_DATASET || 'production'
export const sanityDataset = dataset

const apiVersion = '2026-06-10'

export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion,
  // Visitor-facing pages prioritise speed: the cached API edge serves document
  // queries ~13x faster. Published Studio changes propagate within a few seconds.
  useCdn: true,
})

const freshPublishedClient = sanityClient.withConfig({useCdn: false})
let preferFreshPublishedUntil = 0

const publishedClient = () =>
  dev || Date.now() < preferFreshPublishedUntil ? freshPublishedClient : sanityClient

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

const sitePageQuery = `*[
  _type == "sitePage" &&
  route == $route &&
  ($includeInactive || coalesce(active, true))
][0]`

const siteEditorSettingsQuery = `coalesce(
  *[_id == "builderSiteSettings"][0],
  *[_type == "builderSiteSettings"][0]
)`

export const getSitePage = async (route: string, preview = false) => {
  const client = preview && previewEnabled() ? previewClient : publishedClient()
  return client.fetch(sitePageQuery, {route, includeInactive: preview})
}

export const getSiteEditorSettings = async (preview = false) => {
  const client = preview && previewEnabled() ? previewClient : publishedClient()
  return client.fetch(siteEditorSettingsQuery)
}

export const getBuilderDocumentSections = async (
  scope: ManagedDetailSectionScope,
  preview = false,
): Promise<BuilderSection[] | null> => {
  if (env.SANITY_DISABLE_REMOTE === 'true') return null

  const client = preview && previewEnabled() ? previewClient : publishedClient()
  try {
    const source = await client.fetch<{
      sections?: BuilderSection[]
      contentSections?: unknown[]
    } | null>(
      `*[_type == $documentType && slug.current == $slug][0] {
        sections,
        contentSections
      }`,
      scope,
    )
    if (scope.documentType === 'productCategory') {
      return productBuilderSections(source?.sections, source?.contentSections)
    }
    return Array.isArray(source?.sections) ? source.sections : []
  } catch (error) {
    console.warn(
      `[sanity] section fetch failed for ${scope.documentType}/${scope.slug}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    )
    return null
  }
}

export const getPublicSitePages = async () => {
  if (env.SANITY_DISABLE_REMOTE === 'true') return []
  try {
    return await publishedClient().fetch<Array<{route: string; updatedAt?: string}>>(`*[
      _type == "sitePage" &&
      coalesce(active, true) &&
      !coalesce(seo.noIndex, false) &&
      defined(route)
    ] | order(route asc) {
      route,
      "updatedAt": _updatedAt
    }`)
  } catch (error) {
    console.warn(
      `[sanity] public site-page fetch failed: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    )
    return []
  }
}

// Plain authed client for validating the preview-url secret. Must NOT use stega,
// otherwise the stored secret string gets encoded with invisible characters and
// no longer matches the secret from the URL.
export const previewSecretClient = sanityClient.withConfig({
  useCdn: false,
  token: env.SANITY_VIEWER_TOKEN,
})

const collectionsQuery = `{
  "siteContent": coalesce(*[_id == "siteContent"][0], *[_type == "siteLanding"][0]) {
    _updatedAt,
    navigation[] {
      _key,
      label,
      href,
      placement,
      visibleDesktop,
      visibleMobile,
      newTab
    },
    common {
      readMore,
      requestQuote,
      exploreProducts,
      viewCases,
      allProducts,
      latestPosts,
      challenge,
      solution,
      result,
      emailLabel,
      phoneLabel,
      backToProducts,
      backToCases,
      backToBlog,
      searchProducts,
      searchCases,
      searchPosts,
      searchPlaceholder,
      noResults,
      pageLabel,
      previous,
      next,
      zoomImage,
      downloadsTitle,
      close,
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
      cookieNoticeMessage,
      cookieNoticeLearnMore,
      cookieNoticeAccept,
      marketingConsent,
      privacyConsentPrefix
    },
    home {
      // Sections come through unprojected, exactly as sitePageQuery returns
      // them: BuilderPageRenderer resolves image references against the
      // dataset itself, so a projection here would only strip what it needs.
      sections,
      hero {
        title
      },
      heroVideo{
        kind,
        youtubeUrl,
        "fileUrl": file.asset->url,
        "captionsUrl": captions.asset->url
      },
      heroVideoLabel,
      heroVideoCloseLabel,
      impact {
        title,
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
      sections,
      hero {
        kicker,
        title
      },
      statement {
        kicker,
        title
      },
      timeline[] {
        title,
        text
      }
    },
    productsPage {
      sections,
      documentsTitle,
      documentsTitle,
    "documents": documents[]{
        title,
        "fileUrl": file.asset->url,
        "fileSize": file.asset->size
      },
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
      sections,
      documentsTitle,
      documentsTitle,
    "documents": documents[]{
        title,
        "fileUrl": file.asset->url,
        "fileSize": file.asset->size
      },
      hero {
        kicker,
        title
      },
      searchLabel,
      categoryLabel,
      finishLabel,
      sortLabel,
      allCategoriesLabel,
      sortOptions,
      categoryLabels,
      finishLabels,
      priceFromLabel,
      requestLabel,
      noResults,
      vatNote,
      delivery,
      postalGate,
      detail,
      transportMultiplier
    },
    cartPage {
      sections,
      hero {
        kicker,
        title
      },
      cartItems,
      empty,
      continueShopping,
      clear,
      clearConfirm,
      request,
      quantity,
      remove,
      removed,
      finish,
      unitPrice,
      total,
      productSubtotal,
      transport,
      iva,
      finalTotal,
      deliveryPostcode,
      changePostcode,
      totalWeight,
      transportPending,
      transportOverweight,
      summary,
      product
    },
    returnsPolicy,
    catalogue {
      sections,
      hero {
        kicker,
        title
      },
      ctaLabel,
      formLabels,
      estimate {
        kicker,
        title,
        lead,
        checklistTitle,
        checklist[]
      }
    },
    casesPage {
      sections,
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
      sections,
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
      sections,
      hero,
      formLabels
    }
  },
  "products": select($includeProducts => (*[_type == "productCategory" && defined(slug.current)] | order(orderRank asc, title.pt asc) {
    _id,
    _updatedAt,
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
        captions {
          asset -> {
            url,
            originalFilename,
            mimeType
          }
        },
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
    description,
    documentsTitle,
    "documents": documents[]{
      title,
      "fileUrl": file.asset->url,
      "fileSize": file.asset->size
    },
    "specs": {
      "dimensions": dimensions[],
      "materials": materials[],
      "specifications": specifications[],
      "advantages": advantages[]
    }
  }), []),
  "storeCategories": select($includeStore => (*[_type == "storeCategory" && defined(slug.current)] | order(orderRank asc, title.pt asc) {
    _id,
    title,
    slug,
    orderRank
  }), []),
  "storeProducts": select($includeStore => (*[
    _type == "storeProduct" &&
    defined(slug.current) &&
    ($includeInactive || coalesce(active, true))
  ] | order(orderRank asc, title.pt asc) {
    _id,
    _updatedAt,
    title,
    slug,
    category,
    summary,
    hasFinishChoice,
    flatTransportPrice,
    documentsTitle,
    "documents": documents[]{
      title,
      "fileUrl": file.asset->url,
      "fileSize": file.asset->size
    },
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
        captions {
          asset -> {
            url,
            originalFilename,
            mimeType
          }
        },
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
  }), []),
  "caseStudies": select($includeCases => (*[_type == "caseStudy" && defined(slug.current)] | order(orderRank asc, title.pt asc) {
    _id,
    _updatedAt,
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
        captions {
          asset -> {
            url,
            originalFilename,
            mimeType
          }
        },
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
      }
    },
    location,
    summary,
    description,
    challenge,
    solution,
    result
  }), []),
  "blogPosts": select($includeBlog => (*[_type == "blogPost" && defined(slug.current)] | order(publishedAt desc) {
    _id,
    _updatedAt,
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
        captions {
          asset -> {
            url,
            originalFilename,
            mimeType
          }
        },
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
      }
    },
    excerpt,
    publishedAt,
    category
  }), [])
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
export type SanityCollectionScope = {
  products?: boolean
  store?: boolean
  cases?: boolean
  blog?: boolean
}

const allCollections: Required<SanityCollectionScope> = {
  products: true,
  store: true,
  cases: true,
  blog: true,
}

const normalizedCollectionScope = (
  scope: SanityCollectionScope = allCollections,
): Required<SanityCollectionScope> => ({
  products: scope.products ?? false,
  store: scope.store ?? false,
  cases: scope.cases ?? false,
  blog: scope.blog ?? false,
})

const collectionScopeKey = (scope: Required<SanityCollectionScope>) =>
  `${Number(scope.products)}${Number(scope.store)}${Number(scope.cases)}${Number(scope.blog)}`

const collectionParams = (
  scope: Required<SanityCollectionScope>,
  includeInactive: boolean,
) => ({
  includeInactive,
  includeProducts: scope.products,
  includeStore: scope.store,
  includeCases: scope.cases,
  includeBlog: scope.blog,
})

const collectionCache = new Map<string, {expiresAt: number; value: unknown}>()

export const invalidateSanityCollectionsCache = () => {
  collectionCache.clear()
  preferFreshPublishedUntil = Date.now() + 30_000
}

export const getSanityCollections = async (
  preview = false,
  requestedScope: SanityCollectionScope = allCollections,
) => {
  if (env.SANITY_DISABLE_REMOTE === 'true') return null

  const scope = normalizedCollectionScope(requestedScope)
  const cacheKey = collectionScopeKey(scope)
  const cached = collectionCache.get(cacheKey)
  if (!preview && cached && cached.expiresAt > Date.now()) {
    return cached.value
  }

  const client = preview && previewEnabled() ? previewClient : publishedClient()
  try {
    const value = await client.fetch(collectionsQuery, collectionParams(scope, preview))
    if (!preview && collectionCacheTtlMs > 0) {
      collectionCache.set(cacheKey, {value, expiresAt: Date.now() + collectionCacheTtlMs})
    }
    return value
  } catch (error) {
    console.warn(
      `[sanity] collection fetch failed: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    )
    return null
  }
}

export const getSanityCollectionsStrict = async (
  preview = false,
  requestedScope: SanityCollectionScope = allCollections,
) => {
  if (env.SANITY_DISABLE_REMOTE === 'true') {
    throw new Error('Sanity remote access is disabled')
  }

  const scope = normalizedCollectionScope(requestedScope)
  const cacheKey = collectionScopeKey(scope)
  const cached = collectionCache.get(cacheKey)
  if (!preview && cached && cached.expiresAt > Date.now()) {
    return cached.value
  }

  const client = preview && previewEnabled() ? previewClient : publishedClient()
  const value = await client.fetch(collectionsQuery, collectionParams(scope, preview))

  if (!preview && collectionCacheTtlMs > 0) {
    collectionCache.set(cacheKey, {value, expiresAt: Date.now() + collectionCacheTtlMs})
  }

  return value
}

export const getBlogPostDetail = async (slug: string, preview = false) => {
  if (env.SANITY_DISABLE_REMOTE === 'true') return null

  const client = preview && previewEnabled() ? previewClient : publishedClient()
  try {
    return await client.fetch(blogPostDetailQuery, {slug})
  } catch {
    return null
  }
}

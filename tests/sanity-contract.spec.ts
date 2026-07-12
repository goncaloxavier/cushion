import {readFileSync} from 'node:fs'
import {expect, test} from '@playwright/test'
import {
  calculateStoreEstimate,
  maxStoreTransportWeightKg,
  normalizePostalCode,
  normalizeStorePostalCode,
  storeDispatchZone,
  storeTransportFuelSurchargeRate,
  storeTransportMultiplier,
  storeVatRate,
  transportEstimateFor,
} from '../src/lib/store-shipping'
import {sameOriginOk} from '../src/lib/server/form-guard'
import {rateLimit, rateLimitKey} from '../src/lib/server/rate-limit'

const read = (path: string) => readFileSync(path, 'utf8')

test.describe('Sanity Studio content contract', () => {
  test.beforeEach(({browserName}, testInfo) => {
    test.skip(
      Boolean(browserName) && testInfo.project.name !== 'desktop-chrome',
      'File contract checks are viewport independent',
    )
  })

  test('in-process rate limiting enforces a boundary and resets by window', () => {
    const key = rateLimitKey('audit-boundary', `visitor-${Date.now()}-${Math.random()}`)

    expect(rateLimit(key, 2, 1_000, 100)).toBe(false)
    expect(rateLimit(key, 2, 1_000, 100)).toBe(false)
    expect(rateLimit(key, 2, 1_000, 100)).toBe(true)
    expect(rateLimit(key, 2, 1_000, 1_100)).toBe(false)
    expect(rateLimitKey('checkout', 'visitor')).not.toBe(rateLimitKey('register', 'visitor'))
  })

  test('collection documents are registered in Studio', () => {
    const schemaIndex = read('schemaTypes/index.ts')

    expect(schemaIndex).toContain('websiteSchemaTypes')
    expect(schemaIndex).toContain('crmSchemaTypes')
    expect(schemaIndex).toContain('siteLanding')
    expect(schemaIndex).toContain('productCategory')
    expect(schemaIndex).toContain('storeProduct')
    expect(schemaIndex).toContain('caseStudy')
    expect(schemaIndex).toContain('blogPost')
    expect(schemaIndex).toContain('partnerItem')
    expect(schemaIndex).toContain('clientProfile')
    expect(schemaIndex).toContain('formSubmission')
  })

  test('public page copy is managed through the website Studio workspace', () => {
    const studioConfig = read('sanity.config.ts')
    const studioStructure = read('sanity.structure.ts')
    const siteSchema = read('schemaTypes/siteLanding.ts')

    expect(studioConfig).toContain("name: 'website'")
    expect(studioConfig).toContain("basePath: '/website'")
    expect(studioConfig).toContain('SANITY_STUDIO_DATASET')
    expect(studioConfig).toContain("|| 'production'")
    expect(studioConfig).toContain('types: websiteSchemaTypes')
    expect(studioStructure).toContain("documentId('siteContent')")
    expect(studioStructure).toContain("schemaType('siteLanding')")
    expect(studioStructure).toContain("'Conteúdo do site'")
    expect(studioStructure).toContain("'Produtos'")
    expect(studioStructure).toContain("'Loja'")
    expect(studioStructure).toContain("'Textos da página Loja'")
    expect(studioStructure).toContain("'Todos os produtos'")
    expect(studioStructure).toContain("'Produtos visíveis'")
    expect(studioStructure).toContain("'Sem imagem principal'")
    expect(studioStructure).toContain("'Sem peso definido'")
    expect(studioStructure).toContain("'Produtos ocultos'")
    expect(studioStructure).toContain("'Casos de estudo'")
    expect(studioStructure).toContain("'Artigos do blog'")
    expect(siteSchema).toContain("title: 'Conteúdo do site'")
    expect(siteSchema).toContain("'Página inicial'")
    expect(siteSchema).toContain("'Página Produtos'")
    expect(siteSchema).toContain("'Página Loja'")
    expect(siteSchema).toContain("'Multiplicador de transporte'")
    expect(siteSchema).toContain("'Página Catálogo'")
    expect(siteSchema).toContain("'Página Contacto'")
    expect(siteSchema).toContain("'Vídeo do topo (YouTube)'")
    expect(siteSchema).toContain("'Parceiros e projetos'")
    expect(siteSchema).toContain("'Link do WhatsApp'")
    expect(siteSchema).toContain("'Link Livro de Reclamações'")
    expect(siteSchema).toContain("'Texto legal junto ao Livro de Reclamações'")
    expect(siteSchema).toContain("'Link Política de Privacidade'")
    expect(siteSchema).toContain("'Link Política de Cookies'")
    expect(siteSchema).toContain("'Consentimento de dados/marketing'")
    expect(siteSchema).toContain("'Labels visíveis do formulário'")
    expect(siteSchema).toContain("'Primeiro nome'")
    expect(siteSchema).toContain("'Apelido'")
    expect(siteSchema).toContain("'Morada'")
    expect(siteSchema).toContain("'Nome antigo'")
    expect(siteSchema).toContain("'Labels antigos do formulário'")
    expect(siteSchema).toContain('Este texto já não é apresentado no website')
    expect(siteSchema).toContain("copyBlockField('hero', 'Primeira secção', undefined, {includeLead: false})")
    expect(siteSchema).toContain("copyBlockField('hero', 'Primeira secção', undefined, {hiddenLead: true})")
    expect(siteSchema).not.toContain("'Navigation labels'")
    expect(siteSchema).not.toContain("'Shared labels and contact'")
    expect(siteSchema).not.toContain("'Nota de posicionamento'")
    expect(siteSchema).not.toContain("'Cartões de princípios'")
    expect(siteSchema).not.toContain("'Secção newsletter'")
    expect(siteSchema).not.toContain("title: 'Rodapé'")
  })

  test('private CRM content is isolated from the public website workspace', () => {
    const studioConfig = read('sanity.config.ts')
    const studioStructure = read('sanity.structure.ts')
    const crmServer = read('src/lib/server/crm.ts')
    const contactAction = read('src/routes/contacto/+page.server.ts')
    const formGuard = read('src/lib/server/form-guard.ts')

    expect(studioConfig).toContain("name: 'crm'")
    expect(studioConfig).toContain("basePath: '/crm'")
    expect(studioConfig).toContain("dataset: 'crm'")
    expect(studioConfig).toContain('types: crmSchemaTypes')
    expect(studioStructure).toContain('crmStructure')
    expect(studioStructure).toContain("'Novos pedidos'")
    expect(studioStructure).toContain("'Pedidos em acompanhamento'")
    expect(studioStructure).toContain("'Perfis de clientes'")
    expect(crmServer).toContain("env.SANITY_CRM_DATASET || 'crm'")
    expect(crmServer).toContain('SANITY_CRM_WRITE_TOKEN')
    expect(crmServer).toContain('CRM_HASH_SECRET')
    expect(crmServer).toContain("createIfNotExists({")
    expect(crmServer).toContain("_type: 'clientProfile'")
    expect(crmServer).toContain("_type: 'formSubmission'")
    expect(contactAction).toContain('csrfCookieName')
    expect(contactAction).toContain('csrfOk')
    expect(formGuard).toContain('timingSafeEqual')
    expect(contactAction).toContain('companyWebsite')
    expect(contactAction).toContain('storeContactSubmission')
  })

  test('frontend query reads the same collections editors manage', () => {
    const sanityClient = read('src/lib/sanity.ts')
    const contentModel = read('src/lib/site-content.ts')
    const warmImages = read('scripts/warm-images.ts')
    const storeProductsImport = read('scripts/import-store-products.ts')
    const storeImagesImport = read('scripts/import-store-images.ts')
    const seedScript = read('scripts/write-sanity-seed.ts')
    const cleanupScript = read('scripts/cleanup-removed-website-fields.ts')
    const writeGuard = read('scripts/require-sanity-write.ts')
    const packageJson = read('package.json')

    expect(sanityClient).toContain('useCdn: true')
    expect(sanityClient).toContain('previewClient')
    expect(sanityClient).toContain('useCdn: false')
    expect(sanityClient).toContain("perspective: 'drafts'")
    expect(sanityClient).toContain('stega: {enabled: true, studioUrl}')
    expect(warmImages).toContain('useCdn: false')
    expect(sanityClient).toContain('_id == "siteContent"')
    expect(sanityClient).toContain('_type == "siteLanding"')
    expect(sanityClient).toContain('_type == "productCategory"')
    expect(sanityClient).toContain('_type == "storeProduct"')
    expect(sanityClient).toContain('_type == "caseStudy"')
    expect(sanityClient).toContain('_type == "blogPost"')
    expect(sanityClient).toContain('_id')
    expect(sanityClient).toContain('_key')
    expect(sanityClient).toContain('whatsappUrl')
    expect(sanityClient).toContain('instagramUrl')
    expect(sanityClient).toContain('complaintsUrl')
    expect(sanityClient).toContain('complaintsNote')
    expect(sanityClient).toContain('privacyPolicyUrl')
    expect(sanityClient).toContain('cookiePolicyUrl')
    expect(sanityClient).toContain('marketingConsent')
    expect(sanityClient).toContain('formLabels')
    expect(sanityClient).toContain('heroVideoUrl')
    expect(sanityClient).toContain('videoUrl')
    expect(sanityClient).toContain('toolUrl')
    expect(sanityClient).toContain('storePage')
    expect(sanityClient).toContain('transportMultiplier')
    expect(sanityClient).toContain('_key')
    expect(sanityClient).toContain('priceNatural')
    expect(sanityClient).toContain('priceDark')
    expect(sanityClient).toContain('hasFinishChoice')
    expect(sanityClient).toContain('flatTransportPrice')
    expect(sanityClient).toContain('gallery[]')
    expect(storeProductsImport).toContain('createIfNotExists(document)')
    expect(storeProductsImport).toContain("'cadeira-atalaia': ['cadeirao-atalia']")
    expect(storeProductsImport).toContain('setIfMissing(fields)')
    expect(storeImagesImport).toContain("slug: 'banco-gaviao'")
    expect(storeImagesImport).toContain("slug: 'cadeira-atalaia'")
    expect(storeImagesImport).toContain("slug: 'banco-montargil'")
    expect(storeImagesImport).toContain('client.assets.upload')
    expect(storeImagesImport).toContain('gallery: uploadedImages')
    expect(storeImagesImport).toContain('.slice(1)')
    expect(storeImagesImport).toContain("'galleryImage'")
    expect(packageJson).toContain('"import:store-products"')
    expect(packageJson).toContain('"import:store-images"')
    expect(packageJson).toContain('"sanity:require-write"')
    expect(packageJson).toContain('npm run sanity:require-write && npm run seed:studio:write')
    expect(packageJson).toContain('npm run sanity:require-write && npm run import:cases:write')
    expect(packageJson).toContain('npm run sanity:require-write && npm run import:blog:write')
    expect(packageJson).toContain('npm run sanity:require-write && npm run import:products:write')
    expect(writeGuard).toContain('SANITY_ALLOW_WRITE')
    expect(writeGuard).toContain('process.exit(1)')
    expect(sanityClient).toContain('partners')
    expect(sanityClient).toContain('youtubeUrl')
    expect(sanityClient).toContain('logoTone')
    expect(sanityClient).toContain('logo')
    expect(sanityClient).toContain('asset ->')
    expect(sanityClient).toContain('alt')
    expect(sanityClient).not.toContain('features,')
    expect(sanityClient).not.toContain('applications')
    expect(sanityClient).not.toContain('quoteFlow[]')
    expect(sanityClient).not.toContain('cards[]')
    expect(sanityClient).not.toContain('clientProfile')
    expect(sanityClient).not.toContain('formSubmission')
    expect(sanityClient).not.toContain('customers')
    expect(sanityClient).not.toContain('orders')
    expect(sanityClient).not.toContain('payment_attempts')
    expect(contentModel).toContain('lead: \'\',')
    expect(seedScript).toContain('copyBlockWithoutLead')
    expect(seedScript).toContain('hero: copyBlockWithoutLead((content) => content.productsPage.hero)')
    expect(seedScript).toContain('hero: copyBlockWithoutLead((content) => content.storePage.hero)')
    expect(seedScript).toContain('transportMultiplier: fallbackContent.pt.storePage.transportMultiplier')
    expect(seedScript).toContain('hero: copyBlockWithoutLead((content) => content.catalogue.hero)')
    expect(seedScript).toContain('hero: copyBlockWithoutLead((content) => content.casesPage.hero)')
    expect(seedScript).toContain('hero: copyBlockWithoutLead((content) => content.blogPage.hero)')
    expect(seedScript).not.toContain('content.productsPage.lead')
    expect(seedScript).not.toContain('content.storePage.lead')
    expect(cleanupScript).toContain('productsPage.hero.lead')
    expect(cleanupScript).toContain('productsPage.lead')
    expect(cleanupScript).toContain('storePage.hero.lead')
    expect(cleanupScript).toContain('storePage.lead')
    expect(cleanupScript).toContain('catalogue.hero.lead')
    expect(cleanupScript).toContain('casesPage.hero.lead')
    expect(cleanupScript).toContain('blogPage.hero.lead')
  })

  test('visual editing preview is wired through Studio and draft rendering', () => {
    const studioConfig = read('sanity.config.ts')
    const layoutServer = read('src/routes/+layout.server.ts')
    const layout = read('src/routes/+layout.svelte')
    const storeListRoute = read('src/routes/loja/+page.svelte')
    const storeDetailRoute = read('src/routes/loja/[slug]/+page.svelte')
    const storeMediaGallery = read('src/lib/components/StoreMediaGallery.svelte')
    const imageGallery = read('src/lib/components/ImageGallery.svelte')
    const productDetailRoute = read('src/routes/produtos/[slug]/+page.svelte')
    const caseDetailRoute = read('src/routes/casos-de-estudo/[slug]/+page.svelte')
    const blogDetailRoute = read('src/routes/blog/[slug]/+page.svelte')
    const contentModel = read('src/lib/site-content.ts')
    const sanityClient = read('src/lib/sanity.ts')
    const previewHelpers = read('src/lib/server/preview.ts')
    const previewEnable = read('src/routes/preview/enable/+server.ts')
    const previewDisable = read('src/routes/preview/disable/+server.ts')
    const blogDetailServer = read('src/routes/blog/[slug]/+page.server.ts')
    const envExample = read('.env.example')

    expect(studioConfig).toContain('presentationTool')
    expect(studioConfig).toContain("enable: '/preview/enable'")
    expect(studioConfig).toContain('resolve: {')
    expect(studioConfig).toContain('locations: {')
    expect(studioConfig).toContain("productCategory: collectionLocation('/produtos', 'Produto')")
    expect(studioConfig).toContain("storeProduct: collectionLocation('/loja', 'Produto da loja')")
    expect(studioConfig).toContain("caseStudy: collectionLocation('/casos-de-estudo', 'Caso de estudo')")
    expect(studioConfig).toContain("blogPost: collectionLocation('/blog', 'Artigo do blog')")
    expect(layoutServer).toContain('isPreview(cookies, request.headers)')
    expect(layoutServer).toContain('getSanityCollections(preview)')
    expect(layoutServer).toContain('studioUrl: preview ? sanityStudioUrl :')
    // The preview cookie persists for an hour across any request from that
    // browser, so a plain top-level visit outside Studio must not inherit
    // draft content/the click-to-edit overlay just because the cookie is
    // still set from an earlier Presentation session.
    expect(previewHelpers).toContain("sec-fetch-dest")
    expect(previewHelpers).toContain("=== 'document'")
    // Sec-Fetch-Dest only distinguishes real vs. embedded on the first
    // request; SvelteKit's own client-side navigation re-runs load() via a
    // background fetch that carries neither signal, so a normal tab would
    // fall back into preview mode on the next page click. The client must
    // self-heal by checking window.self === window.top (a browsing context
    // always knows this) and clearing the cookie via /preview/disable when
    // it's provably not embedded in Studio's iframe.
    expect(layout).toContain('window.self === window.top')
    expect(layout).toContain('/preview/disable?redirect=')
    expect(layout).toContain('@sanity/visual-editing/svelte')
    expect(layout).toContain("import('@sanity/visual-editing/svelte')")
    expect(layout).toContain('<VisualEditingComponent />')
    expect(storeListRoute).toContain('@sanity/visual-editing/create-data-attribute')
    expect(storeListRoute).toContain("storeProductFieldDataAttribute(product, 'image')")
    expect(storeListRoute).toContain('data-sanity={cardImageDataAttribute}')
    expect(storeDetailRoute).toContain('@sanity/visual-editing/create-data-attribute')
    expect(storeDetailRoute).toContain('StoreMediaGallery')
    expect(storeDetailRoute).toContain("storeProductDataAttribute('image')")
    expect(storeDetailRoute).toContain('imageDataAttribute = $derived')
    expect(storeDetailRoute).toContain('dataAttribute={mediaDataAttribute}')
    expect(storeMediaGallery).toContain('dataAttribute?: (path: string) => string | undefined')
    expect(storeMediaGallery).toContain('entry?.editPath && dataAttribute')
    expect(storeMediaGallery).toContain('data-sanity={activeDataAttribute}')
    expect(storeMediaGallery).toContain('data-sanity={thumbAttr}')
    expect(contentModel).toContain('editPath?: string')
    expect(contentModel).toContain("imageFromSanity(mainImage, language, fallback, 'image')")
    expect(contentModel).toContain('gallery[_key==')
    expect(imageGallery).toContain('dataAttribute?: (path: string) => string | undefined')
    expect(imageGallery).toContain('image?.editPath && dataAttribute')
    expect(imageGallery).toContain('data-sanity={activeDataAttribute}')
    expect(imageGallery).toContain('data-sanity={thumbAttr}')
    expect(productDetailRoute).toContain('@sanity/visual-editing/create-data-attribute')
    expect(productDetailRoute).toContain("type: 'productCategory'")
    expect(productDetailRoute).toContain('dataAttribute={imageDataAttribute}')
    expect(caseDetailRoute).toContain("type: 'caseStudy'")
    expect(caseDetailRoute).toContain('dataAttribute={imageDataAttribute}')
    expect(blogDetailRoute).toContain("type: 'blogPost'")
    expect(blogDetailRoute).toContain('dataAttribute={imageDataAttribute}')
    expect(storeDetailRoute).toContain('data-sanity={selectedPriceDataAttribute}')
    expect(storeDetailRoute).toContain('data-sanity={selectedWeightDataAttribute}')
    expect(storeDetailRoute).toContain("effectiveFinish === 'natural' ? 'priceNatural' : 'priceDark'")
    expect(storeDetailRoute).toContain('{#if hasFinishChoice}')
    expect(storeDetailRoute).toContain('.weightKg')
    expect(sanityClient).toContain('previewClient')
    expect(sanityClient).toContain('previewSecretClient')
    expect(sanityClient).toContain("perspective: 'drafts'")
    expect(sanityClient).toContain('stega: {enabled: true, studioUrl}')
    expect(sanityClient).toContain('getSanityCollections = async (preview = false)')
    expect(sanityClient).toContain('getBlogPostDetail')
    expect(previewHelpers).toContain("url.protocol === 'https:'")
    expect(previewHelpers).toContain("sameSite: secure ? ('none' as const) : ('lax' as const)")
    expect(previewEnable).toContain('validatePreviewUrl(previewSecretClient')
    expect(previewEnable).toContain('setPreviewCookie(cookies, url)')
    expect(previewDisable).toContain('clearPreviewCookie(cookies, url)')
    expect(blogDetailServer).toContain('getBlogPostDetail(params.slug, preview)')
    expect(envExample).toContain('SANITY_VIEWER_TOKEN')
    expect(envExample).toContain('SANITY_STUDIO_PREVIEW_ORIGIN')
    expect(envExample).toContain('SANITY_STUDIO_URL')
    expect(envExample).toContain('SANITY_DATASET')
    expect(envExample).toContain('SANITY_STUDIO_DATASET')
    expect(envExample).toContain('SANITY_DISABLE_REMOTE')
  })

  test('visual editing metadata does not break custom text reveal animations', () => {
    const lineReveal = read('src/lib/actions/line-reveal.ts')

    expect(lineReveal).toContain('sanityStegaMetadataPattern')
    expect(lineReveal).toContain('return {}')
  })

  test('editable collection documents support uploaded images', () => {
    const productSchema = read('schemaTypes/productCategory.ts')
    const storeSchema = read('schemaTypes/storeProduct.ts')
    const caseSchema = read('schemaTypes/caseStudy.ts')
    const blogSchema = read('schemaTypes/blogPost.ts')

    expect(productSchema).not.toContain("name: 'features'")
    expect(productSchema).not.toContain("name: 'applications'")
    expect(productSchema).toContain("name: 'videoUrl'")
    expect(productSchema).toContain("'Vídeo do produto (YouTube)'")
    expect(productSchema).toContain("name: 'toolUrl'")
    expect(productSchema).toContain("'Link da ferramenta externa'")

    for (const schema of [productSchema, storeSchema, caseSchema, blogSchema]) {
      expect(schema).toContain("title: 'Conteúdo'")
      expect(schema).toContain("name: 'image'")
      expect(schema).toContain("type: 'image'")
      expect(schema).toContain('hotspot: true')
      expect(schema).toContain("name: 'alt'")
      expect(schema).toContain("'Descrição da imagem'")
    }

    expect(storeSchema).toContain("name: 'gallery'")
    expect(storeSchema).toContain("'Galeria do produto'")
    expect(storeSchema).toContain("name: 'galleryVideo'")
    expect(storeSchema).toContain("type: 'file'")
    // Produtos (outside the Loja) share the same mixed image/video gallery
    // pattern as Loja store products — both use galleryImage + galleryVideo.
    expect(productSchema).toContain("name: 'galleryImage'")
    expect(productSchema).toContain("name: 'galleryVideo'")
    expect(productSchema).toContain("type: 'file'")
    expect(storeSchema).toContain("'Variantes, pesos e preços'")
    expect(storeSchema).toContain("'Preço Natural/Cinza sem IVA'")
    expect(storeSchema).toContain("'Preço Castanho/Preto sem IVA'")
    expect(storeSchema).toContain('Rule.required().min(0.01).precision(2)')
    expect(storeSchema).toContain("name: 'flatTransportPrice'")
  })

  test('flat-rate transport products are wired end to end', () => {
    const contentModel = read('src/lib/site-content.ts')
    const storeFallback = read('src/lib/store-fallback.ts')
    const storeShipping = read('src/lib/store-shipping.ts')
    const storeList = read('src/routes/loja/+page.svelte')
    const storeDetailRoute = read('src/routes/loja/[slug]/+page.svelte')
    const cartRoute = read('src/routes/carrinho/+page.svelte')
    const checkoutRoute = read('src/routes/finalizar-compra/+page.svelte')
    const ordersServer = read('src/lib/server/orders.ts')

    expect(contentModel).toContain('flatTransportPrice?: number')
    expect(storeFallback).toContain('flatTransportPrice: 2')
    expect(storeFallback).toContain('flatTransportPrice: product.flatTransportPrice')
    expect(storeShipping).toContain('flatTransportPrice')
    expect(storeShipping).toContain('hasFlatTransport')

    // Every place that builds a StorePricingItem[] for calculateStoreEstimate
    // must forward the product's flatTransportPrice, or a flat-rate product's
    // price would silently fall back to the normal weight-based formula on
    // that one page while working correctly everywhere else.
    for (const route of [storeList, storeDetailRoute, cartRoute, checkoutRoute, ordersServer]) {
      expect(route).toContain('flatTransportPrice')
    }
  })

  test('fallback content remains available when Studio is empty', () => {
    const contentModel = read('src/lib/site-content.ts')

    expect(contentModel).toContain('siteContent?: SanitySiteContent')
    expect(contentModel).toContain('applySiteContentFromSanity')
    expect(contentModel).toContain('whatsapp: ')
    expect(contentModel).toContain('marketingConsent')
    expect(contentModel).toContain('complaintsNote')
    expect(contentModel).toContain('https://www.livroreclamacoes.pt/Pedido/Reclamacao')
    expect(contentModel).toContain('https://www.iubenda.com/privacy-policy/56295339')
    expect(contentModel).toContain('https://www.iubenda.com/privacy-policy/56295339/cookie-policy')
    expect(contentModel).toContain('https://www.youtube.com/watch?v=h1wVIZRj0Hc')
    expect(contentModel).toContain('https://www.youtube.com/watch?v=VIUVlk51iN0')
    expect(contentModel).toContain('https://claculo-de-deck-production.up.railway.app/4NPPcI82N5FpJ7-iqURGm0uMdUpVBy-m')
    expect(contentModel).toContain('/images/partners/abaae.png')
    expect(contentModel).toContain('partnersFromSanity')
    expect(contentModel).toContain('localizedArticle')
    expect(contentModel).toContain('article: localizedArticle')
    expect(contentModel).toContain('products: productCategories.pt')
    expect(contentModel).toContain('storeProductsForLanguage')
    expect(contentModel).toContain('fallback.find((item) => item.slug === slug) ?? fallback[index]')
    expect(contentModel).toContain(
      'const sanityMedia = storeProductMediaFromSanity(product.image, product.gallery, language)',
    )
    expect(contentModel).toContain('const fallbackStoreImages =')
    expect(contentModel).toContain('fallbackStoreImages.map((image) => storeProductMediaImage(image))')
    expect(contentModel).toContain('const images = imagesFromMedia')
    expect(contentModel).not.toContain('[storeProductMediaImage(fallbackImages.product)]')
    expect(contentModel).not.toContain('fallbackMedia')
    expect(contentModel).toContain('transportMultiplier: storeTransportMultiplier')
    expect(contentModel).toContain('storeProducts: storeProductsForLanguage')
    expect(contentModel).toContain('images?: ContentImage[]')
    expect(contentModel).toContain('media?: StoreProductMedia[]')
    expect(contentModel).toContain('storeProductMediaFor')
    expect(contentModel).toContain('caseStudies: caseStudies.pt')
    expect(contentModel).toContain('blogPosts: blogPosts.pt')
    expect(contentModel).toContain('contentFromSanity')
  })

  test('blog posts support structured article authoring', () => {
    const schemaIndex = read('schemaTypes/index.ts')
    const blogSchema = read('schemaTypes/blogPost.ts')
    const localizedArticle = read('schemaTypes/objects/localizedArticle.ts')
    const sanityClient = read('src/lib/sanity.ts')
    const renderer = read('src/lib/components/StructuredArticleBody.svelte')
    const route = read('src/routes/blog/[slug]/+page.svelte')

    expect(schemaIndex).toContain('localizedArticle')
    expect(blogSchema).toContain("name: 'article'")
    expect(blogSchema).toContain("type: 'localizedArticle'")
    expect(blogSchema).toContain("name: 'gallery'")
    expect(localizedArticle).toContain("value: 'h2'")
    expect(localizedArticle).toContain("value: 'bullet'")
    expect(localizedArticle).toContain("name: 'youtubeEmbed'")
    expect(localizedArticle).toContain("name: 'articleTable'")
    expect(sanityClient).toContain('article {')
    expect(sanityClient).toContain('gallery[]')
    expect(sanityClient).toContain('metadata {')
    expect(renderer).toContain('youtubeEmbed')
    expect(route).toContain('article={data.post.article}')
  })

  test('case studies support migrated old-site case pages', () => {
    const caseSchema = read('schemaTypes/caseStudy.ts')
    const sanityClient = read('src/lib/sanity.ts')
    const contentModel = read('src/lib/site-content.ts')
    const route = read('src/routes/casos-de-estudo/[slug]/+page.svelte')
    const importScript = read('scripts/write-case-study-import.ts')

    expect(caseSchema).toContain("name: 'description'")
    expect(caseSchema).toContain("'Descrição do caso'")
    expect(sanityClient).toContain('description')
    expect(contentModel).toContain('description?: string')
    expect(contentModel).toContain('description: localized(item.description')
    expect(route).toContain('data.caseStudy.description || data.caseStudy.summary')
    expect(route).toContain('<p class="article-lead">{lead}</p>')
    expect(route).not.toContain('case-detail-description')
    expect(importScript).toContain('caseStudy-')
    expect(importScript).toContain('case-study-import.ndjson')
  })

  test('shared image galleries lock background scroll', () => {
    const gallery = read('src/lib/components/ImageGallery.svelte')
    const styles = read('src/app.css')

    expect(gallery).toContain("classList.add('lightbox-open')")
    expect(gallery).toContain("event.key === 'ArrowLeft'")
    expect(gallery).toContain("event.key === 'ArrowRight'")
    expect(styles).toContain('html.lightbox-open')
    expect(styles).toContain('body.lightbox-open')
    expect(styles).toContain('object-fit: contain')
  })

  test('postal code formatting keeps full addresses while store zones use four digits', () => {
    expect(normalizePostalCode('2460-209')).toBe('2460-209')
    expect(normalizePostalCode('2460209')).toBe('2460-209')
    expect(normalizeStorePostalCode('2460-209')).toBe('2460')
  })

  test('Loja transport pricing applies the confirmed Alto Alentejo formula', () => {
    expect(storeDispatchZone).toBe('alto-alentejo')
    expect(storeTransportFuelSurchargeRate).toBe(0.1)
    expect(storeTransportMultiplier).toBe(2.5)
    expect(storeVatRate).toBe(0.23)

    const transport = transportEstimateFor('7000-000', 52)
    expect(transport).toMatchObject({
      destination: expect.objectContaining({label: 'Alto Alentejo'}),
      transportZone: 2,
      bracketMaxKg: 75,
      tableNet: 14.47,
      fuelSurchargeNet: 1.45,
      transportNet: 39.79,
    })

    expect(calculateStoreEstimate([{unitPrice: 185, quantity: 1, weightKg: 52}], '7000-000')).toMatchObject(
      {
        productNet: 185,
        totalWeightKg: 52,
        subtotalNet: 224.79,
        vat: 51.7,
        totalGross: 276.49,
      },
    )

    expect(transportEstimateFor('7000-000', 52, {transportMultiplier: 3})).toMatchObject({
      transportNet: 47.75,
    })
  })

  test('flat-rate transport products bypass the weight/zone formula but never disturb other cart lines', () => {
    // A flat-rate line alone: always the flat fee, in every zone, regardless
    // of quantity — this is what "Placas Click" (client-requested €2 flat,
    // any zone) relies on.
    const flatOnlyNear = calculateStoreEstimate(
      [{unitPrice: 12.19, quantity: 1, weightKg: 2.8, flatTransportPrice: 2}],
      '7000-000',
    )
    expect(flatOnlyNear.transport).toMatchObject({transportNet: 2})
    expect(flatOnlyNear.totalGross).toBe(17.45)

    const flatOnlyFar = calculateStoreEstimate(
      [{unitPrice: 12.19, quantity: 20, weightKg: 2.8, flatTransportPrice: 2}],
      '4000-000',
    )
    expect(flatOnlyFar.transport).toMatchObject({transportNet: 2})

    // Mixed cart: the flat fee is additive on top of the normal weight-based
    // transport for the OTHER line, and the flat item's own weight must not
    // leak into that weight-based calculation.
    const baseline = calculateStoreEstimate([{unitPrice: 185, quantity: 1, weightKg: 25}], '1000-000')
    expect(baseline.transport).toMatchObject({transportNet: 31.02})

    const mixed = calculateStoreEstimate(
      [
        {unitPrice: 12.19, quantity: 5, weightKg: 2.8, flatTransportPrice: 2},
        {unitPrice: 185, quantity: 1, weightKg: 25},
      ],
      '1000-000',
    )
    expect(mixed.totalWeightKg).toBe(25)
    expect(mixed.transport).toMatchObject({transportNet: 33.02})

    const overweight = calculateStoreEstimate(
      [{unitPrice: 185, quantity: 1, weightKg: maxStoreTransportWeightKg + 1}],
      '7000-000',
    )
    expect(overweight.transport).toBeNull()
    expect(overweight.transportIssue).toBe('overweight')
  })

  test('store carts use stable Sanity variant keys and retain a legacy fallback', () => {
    const cart = read('src/lib/cart.ts')
    const storeContent = read('src/lib/site-content.ts')
    const storeDetail = read('src/routes/loja/[slug]/+page.svelte')
    const checkout = read('src/routes/finalizar-compra/+page.server.ts')
    const orders = read('src/lib/server/orders.ts')

    expect(storeContent).toContain('key: string')
    expect(storeContent).toContain('key: variant._key')
    expect(cart).toContain('variantKey?: string')
    expect(cart).toContain('storeVariantForCartItem')
    expect(cart).toContain("item.variantKey || `legacy-")
    expect(storeDetail).toContain('variantKey: selectedVariant.key')
    expect(checkout).toContain('raw.variantKey')
    expect(orders).toContain('candidate.key === item.variantKey')
  })

  test('private ecommerce data uses Postgres, not the public Sanity catalogue', () => {
    const packageJson = read('package.json')
    const envExample = read('.env.example')
    const migration = read('migrations/0001_commerce_foundation.sql')
    const db = read('src/lib/server/db.ts')
    const auth = read('src/lib/server/customer-auth.ts')
    const orders = read('src/lib/server/orders.ts')
    const checkout = read('src/routes/finalizar-compra/+page.server.ts')
    const payment = read('src/lib/server/payment.ts')
    const painelOrders = read('src/routes/painel/encomendas/+page.server.ts')

    expect(packageJson).toContain('"db:migrate"')
    expect(packageJson).toContain('"pg"')
    expect(envExample).toContain('DATABASE_URL')
    expect(envExample).toContain('RESEND_API_KEY')
    expect(envExample).toContain('EMAIL_FROM')
    expect(envExample).toContain('ORDERS_TO_EMAIL')
    expect(envExample).toContain('APP_ORIGIN')
    expect(migration).toContain('create table if not exists customers')
    expect(migration).toContain('create table if not exists customer_sessions')
    expect(migration).toContain('create table if not exists orders')
    expect(migration).toContain('create table if not exists order_items')
    expect(migration).toContain('create table if not exists payment_attempts')
    expect(db).toContain('DATABASE_URL')
    expect(auth).toContain('scrypt')
    expect(auth).toContain('httpOnly: true')
    expect(auth).toContain('sameSite')
    expect(auth).toContain('tokenHashOf')
    expect(auth).toContain('password_reset_tokens')
    expect(auth).toContain('email_verification_tokens')
    expect(auth).toContain('Customer session validation failed; continuing as guest.')
    expect(orders).toContain('buildOrderDraft')
    expect(orders).toContain('calculateStoreEstimate')
    expect(orders).toContain('unit_price_net')
    expect(orders).toContain('transport_multiplier')
    expect(checkout).toContain('csrfOk')
    expect(checkout).toContain('sameOriginOk')
    expect(checkout).toContain('buildOrderDraft')
    expect(payment).toContain('failClosed')
    expect(payment).toContain('intentionally disabled')
    expect(painelOrders).toContain('listOrdersForPainel')
  })

  test('checkout never prices an order from client-supplied input', () => {
    const checkout = read('src/routes/finalizar-compra/+page.server.ts')
    const orders = read('src/lib/server/orders.ts')

    // The cart payload from the browser may only carry a product/variant
    // reference (slug, variantIndex, finish, quantity) — never a price. If a
    // price/amount/total field is ever read out of the request here, a
    // tampered payload could set an order's price directly.
    expect(checkout).toMatch(/parseCartItems[\s\S]{0,400}slug:/)
    expect(checkout).not.toMatch(
      /form\.get\(\s*['"](price|unitPrice|totalGross|totalNet|amount|total)['"]/i,
    )

    // buildOrderDraft must derive unitPriceNet by looking the variant up in
    // trusted server-side content, not by trusting a client-sent value.
    expect(orders).toMatch(/unitPriceNet\s*=\s*Number\(variant\.prices\[finish\]\)/)
  })

  test('account and checkout guardrails stay enforced in code and CI', () => {
    const packageJson = read('package.json')
    const auth = read('src/lib/server/customer-auth.ts')
    const rateLimit = read('src/lib/server/rate-limit.ts')
    const checkout = read('src/routes/finalizar-compra/+page.server.ts')
    const crm = read('src/lib/server/crm.ts')
    const orders = read('src/lib/server/orders.ts')
    const formGuard = read('src/lib/server/form-guard.ts')
    const hooks = read('src/hooks.server.ts')
    const previewEnable = read('src/routes/preview/enable/+server.ts')
    const painelActions = read('src/lib/server/painel-actions.ts')
    const painelOrder = read('src/routes/painel/encomendas/[id]/+page.server.ts')
    const staffAuth = read('src/lib/server/auth.ts')
    const migration = read('migrations/0004_customer_address_identity.sql')
    const addresses = read('src/routes/conta/(area)/moradas/+page.server.ts')
    const config = read('svelte.config.js')
    const appHtml = read('src/app.html')

    expect(packageJson).toContain('tests/commerce.spec.ts')
    expect(auth).toContain('delete from email_verification_tokens')
    expect(auth).toContain('delete from password_reset_tokens')
    expect(rateLimit).toContain('const maxBuckets = 5_000')
    expect(rateLimit).toContain('export const rateLimitKey')
    expect(checkout).toContain("rateLimitKey('checkout', getClientAddress())")
    expect(crm).toContain("rateLimit(`crm:ip:${ipHash}`")
    expect(crm).toContain("rateLimit(`crm:email:${emailHash}`")
    expect(checkout).toContain('submissionToken.length < 20')
    expect(checkout).toContain('isValidEmail(values.email)')
    expect(orders).toContain("throw new OrderInputError('Atualize a página antes de finalizar o pedido.')")
    expect(orders).toContain('unique address identity added in migration 0004')
    expect(migration).toContain('customer_addresses_identity_idx')
    expect(migration).toContain('ranked_addresses')
    expect(addresses).toContain('isSupportedStorePostalCode')
    expect(formGuard).toContain('if (referer) return referer.startsWith(`${expectedOrigin}/`)')
    expect(sameOriginOk(null, null, 'https://example.com')).toBe(false)
    expect(sameOriginOk('https://example.com', null, 'https://example.com')).toBe(true)
    expect(sameOriginOk(null, 'https://example.com/contacto', 'https://example.com')).toBe(true)
    expect(hooks).toContain("headers.set('x-content-type-options', 'nosniff')")
    expect(hooks).toContain("headers.set('strict-transport-security', 'max-age=31536000; includeSubDomains')")
    expect(previewEnable).toContain("rateLimitKey('preview-enable', getClientAddress())")
    expect(staffAuth).toContain("staff?.role === 'admin'")
    expect(painelActions).toContain('canManageStaff(event.locals.staff)')
    expect(painelOrder).toContain('if (!locals.staff) error(401')
    expect(config).toContain("mode: 'auto'")
    expect(config).toContain("'frame-ancestors'")
    expect(appHtml).toContain('nonce="%sveltekit.nonce%"')
  })

  test('private route styles do not ship through the global stylesheet', () => {
    const globalStyles = read('src/app.css')
    const accountStyles = read('src/lib/styles/account-checkout.css')
    const accountDashboardStyles = read('src/lib/styles/account.css')
    const painelStyles = read('src/lib/styles/painel.css')
    const accountLayout = read('src/lib/components/AccountLayout.svelte')
    const authLayout = read('src/lib/components/AccountAuthLayout.svelte')
    const checkout = read('src/routes/finalizar-compra/+page.svelte')
    const painelLayout = read('src/routes/painel/+layout.svelte')

    expect(globalStyles).not.toContain('/* ---- Customer account + checkout ---- */')
    expect(globalStyles).not.toContain('/* ---- Backoffice (/painel) ---- */')
    expect(accountStyles).toContain('.checkout-page')
    expect(accountDashboardStyles).toContain('.auth-simple')
    expect(painelStyles).toContain('.painel {')
    expect(accountLayout).toContain("$lib/styles/account-checkout.css")
    expect(authLayout).toContain("$lib/styles/account.css")
    expect(checkout).toContain("$lib/styles/account-checkout.css")
    expect(painelLayout).toContain("$lib/styles/painel.css")
  })

  test('auto-translation pipeline: schema hides EN/ES and tracks a translation hash', () => {
    const localizedString = read('schemaTypes/objects/localizedString.ts')
    const localizedText = read('schemaTypes/objects/localizedText.ts')
    const localizedArticle = read('schemaTypes/objects/localizedArticle.ts')
    const translateContent = read('src/lib/server/translate-content.ts')
    const translateEndpoint = read('src/routes/api/sanity/translate/+server.ts')
    const translateDocument = read('src/lib/server/translate-document.ts')
    const structure = read('sanity.structure.ts')
    const config = read('sanity.config.ts')
    const backfillScript = read('scripts/seed-translation-hashes.ts')
    const envExample = read('.env.example')

    // EN/ES must be hidden (client only ever fills PT), and every shared
    // localized type must carry a translationHash the pipeline can diff
    // against, so republishing unchanged content never re-burns DeepL quota.
    for (const schema of [localizedString, localizedText, localizedArticle]) {
      expect(schema).toContain('translationHash')
    }
    expect(localizedString).toContain("hidden: true")
    expect(localizedText).toContain("hidden: true")
    expect(localizedArticle).toContain('opts.hidden')

    // The tree-walker must be shape-based (works for any localized field,
    // present or future) and never mutate the input it collects/reinserts.
    expect(translateContent).toContain('detectLocalizedKind')
    expect(translateContent).toContain('findLocalizedFields')
    expect(translateContent).toContain('structuredClone')
    expect(translateContent).toContain('_key==')

    // Both the automatic (Sanity webhook) and manual (Studio button) trigger
    // paths must converge on the same orchestrator, and the manual path
    // needs CORS since it's a genuine cross-origin browser request from the
    // Studio's own origin.
    expect(translateEndpoint).toContain('isValidSignature')
    expect(translateEndpoint).toContain('x-sanity-translate-secret')
    expect(translateEndpoint).toContain('access-control-allow-origin')
    expect(translateEndpoint).toContain('translateDocument(')

    // The manual-trigger secret is baked into a public Studio JS bundle, so
    // it can't be treated as a real secret the way the signed webhook can —
    // it gets its own, much tighter rate-limit bucket so a copied-out secret
    // can't be hammered to exhaust DeepL quota.
    expect(translateEndpoint).toContain('sanity-translate-manual')
    expect(translateEndpoint).toContain('viaStudioButton &&')
    expect(translateDocument).toContain('translationHash')

    // A field's hash must only be stamped once BOTH languages succeed, so a
    // partial DeepL failure stays "dirty" and gets retried later rather than
    // being silently marked done.
    expect(translateDocument).toContain('enSlice && esSlice')

    // The manual Studio action and the one-off backfill script must both
    // exist and reuse the same managed-types list / tree-walker rather than
    // duplicating detection logic.
    expect(structure).toContain('export const managedTypes')
    expect(config).toContain('RetranslateAction')
    expect(backfillScript).toContain('findLocalizedFields')
    expect(backfillScript).toContain('!task.currentHash')
    expect(backfillScript).not.toContain('patchPath}.en')
    expect(backfillScript).not.toContain('patchPath}.es')

    expect(envExample).toContain('DEEPL_API_KEY')
    expect(envExample).toContain('SANITY_WEBHOOK_SECRET')
    expect(envExample).toContain('SANITY_STUDIO_TRANSLATE_SECRET')
  })
})

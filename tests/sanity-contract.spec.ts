import {readFileSync} from 'node:fs'
import {expect, test} from '@playwright/test'
import {vercelStegaCombine} from '@vercel/stega'
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
import {
  createBuilderPage,
  createBuilderSection,
  createBuilderSiteSettings,
} from '../src/lib/builder/defaults'
import {validateBuilderPage, validateBuilderSettings} from '../src/lib/builder/validation'
import {documentPanels, siteScopePanels} from '../src/lib/site-editor/model'
import {
  contentFromSanity,
  type SanityCollections,
} from '../src/lib/site-content'
import {textAppearanceStyle} from '../src/lib/text-appearance'
import {breadcrumbListSchema} from '../src/lib/seo'
import {errorCopy} from '../src/lib/error-copy'

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

  test('error copy distinguishes missing pages from unexpected failures in every language', () => {
    expect(errorCopy(404, 'pt').title).toBe('Página não encontrada')
    expect(errorCopy(500, 'pt').title).toBe('Algo correu mal')
    expect(errorCopy(404, 'en').title).toBe('Page not found')
    expect(errorCopy(503, 'es').title).toBe('Algo salió mal')
  })

  test('collection documents are registered in Studio', () => {
    const schemaIndex = read('schemaTypes/index.ts')

    expect(schemaIndex).toContain('websiteSchemaTypes')
    expect(schemaIndex).toContain('siteLanding')
    expect(schemaIndex).toContain('productCategory')
    expect(schemaIndex).toContain('storeCategory')
    expect(schemaIndex).toContain('storeProduct')
    expect(schemaIndex).toContain('caseStudy')
    expect(schemaIndex).toContain('blogPost')
    expect(schemaIndex).toContain('partnerItem')
  })

  test('every editable field the site editor exposes is in the server save allowlist', () => {
    // src/lib/server/site-editor.ts's `editableFields` allowlist filters every save/publish —
    // a field the UI lets someone edit but that's missing from that allowlist gets silently
    // dropped (the UI shows "Guardado" but Sanity never receives it). This test catches that
    // class of bug for any field declared in model.ts's documentPanels/siteScopePanels.
    const siteEditorSource = read('src/lib/server/site-editor.ts')
    const allowlistFor = (typeKey: string): string[] => {
      const match = siteEditorSource.match(new RegExp(`\\b${typeKey}:\\s*\\[([^\\]]*)\\]`, 's'))
      if (!match) throw new Error(`editableFields.${typeKey} not found in site-editor.ts`)
      return [...match[1].matchAll(/'([^']+)'/g)].map((item) => item[1])
    }
    const topLevelFieldNames = (panels: (typeof documentPanels)[string]) =>
      panels.flatMap((panel) => panel.fields.map((field) => field.name))

    for (const [type, panels] of Object.entries(documentPanels)) {
      const allowlist = allowlistFor(type)
      for (const name of topLevelFieldNames(panels)) {
        expect(allowlist, `${type}.${name} is editable but missing from editableFields`).toContain(name)
      }
    }

    // siteLanding is scoped by top-level field (navigation/home/about/…), not documentPanels —
    // each siteScopePanels key IS the document-level field name that must be in the allowlist.
    const siteLandingAllowlist = allowlistFor('siteLanding')
    for (const rootField of Object.keys(siteScopePanels)) {
      expect(
        siteLandingAllowlist,
        `siteLanding.${rootField} is editable but missing from editableFields`,
      ).toContain(rootField)
    }

    // storeCategory has no documentPanels entry (StoreCategoryManager.tsx renders it directly
    // with its own hardcoded fields instead of the generic panel system) — check those by hand.
    const storeCategoryAllowlist = allowlistFor('storeCategory')
    for (const name of ['title', 'slug', 'orderRank']) {
      expect(storeCategoryAllowlist, `storeCategory.${name} is editable but missing from editableFields`).toContain(
        name,
      )
    }
  })

  test('Loja settings expose only clear, used groups in the site editor', () => {
    const panels = siteScopePanels.storePage
    const fieldNames = panels.flatMap((panel) => panel.fields.map((field) => field.name))

    expect(panels.map((panel) => panel.label)).toEqual(['Topo da Loja', 'Cálculo do transporte'])
    expect(fieldNames).toEqual(['hero', 'transportMultiplier'])
  })

  test('typography survives the Sanity adapter used by public pages', () => {
    const stegaFontFamily = vercelStegaCombine('georgia', {
      origin: 'sanity.io',
      href: 'http://localhost:3333/intent/edit/id=siteContent;path=home.hero.title.fontFamily',
    })
    const collections = {
      siteContent: {
        home: {
          hero: {
            title: {
              _type: 'localizedString',
              pt: 'Título com estilo',
              fontFamily: stegaFontFamily,
              fontSize: 64,
              fontSizeMobile: 38,
              fontWeight: 'bold',
            },
          },
        },
      },
      products: [
        {
          _id: 'product.styled',
          slug: {current: 'produto-com-estilo'},
          title: {
            _type: 'localizedString',
            pt: 'Produto com estilo',
            fontFamily: 'inter',
            fontSize: 42,
          },
        },
      ],
    } as unknown as SanityCollections

    const content = contentFromSanity(collections).pt
    expect(content.home.hero.title).toBe('Título com estilo')
    expect(content.home.hero.textAppearance?.title).toEqual(
      expect.objectContaining({fontFamily: 'georgia', fontSize: 64, fontSizeMobile: 38}),
    )
    expect(content.products[0].textAppearance?.title).toEqual(
      expect.objectContaining({fontFamily: 'inter', fontSize: 42}),
    )
    expect(textAppearanceStyle(content.home.hero.textAppearance?.title)).toContain(
      '--cms-text-size-desktop:64px',
    )
    expect(textAppearanceStyle(content.home.hero.textAppearance?.title)).toContain(
      'font-family:Georgia, serif',
    )
  })

  test('hero video prefers whichever source matches kind, then whichever is actually populated', () => {
    // This is the exact drift bug fixed earlier: the site-editor's upload/YouTube tabs
    // could leave `kind` pointing at an empty field while the other field held real
    // content (e.g. uploading a file after previously picking YouTube re-stamps `kind`
    // without clearing youtubeUrl, or vice versa). heroVideoFromSanity must recover by
    // preferring whichever field is actually populated over a stale `kind`.
    const heroVideoWith = (heroVideo: Record<string, unknown>) =>
      contentFromSanity({
        siteContent: {home: {heroVideo}},
      } as unknown as SanityCollections).pt.home.heroVideo

    expect(heroVideoWith({kind: 'upload', fileUrl: 'https://cdn.sanity.io/files/x/upload.mp4'})).toEqual(
      {kind: 'upload', url: 'https://cdn.sanity.io/files/x/upload.mp4'},
    )
    expect(
      heroVideoWith({kind: 'youtube', youtubeUrl: 'https://www.youtube.com/watch?v=abc123'}),
    ).toEqual({kind: 'youtube', url: 'https://www.youtube.com/watch?v=abc123'})

    // Drift: kind says youtube but only a file was actually uploaded — the file wins.
    expect(
      heroVideoWith({kind: 'youtube', fileUrl: 'https://cdn.sanity.io/files/x/upload.mp4'}),
    ).toEqual({kind: 'upload', url: 'https://cdn.sanity.io/files/x/upload.mp4'})
    // Drift: kind says upload but only a YouTube link was actually set — the link wins.
    expect(
      heroVideoWith({kind: 'upload', youtubeUrl: 'https://www.youtube.com/watch?v=abc123'}),
    ).toEqual({kind: 'youtube', url: 'https://www.youtube.com/watch?v=abc123'})

    // Neither field populated — falls back to the built-in placeholder video, not a blank hero.
    const empty = heroVideoWith({kind: 'upload'})
    expect(empty.kind).toBe('youtube')
    expect(empty.url).toContain('youtube.com')
  })

  test('productCategory specs fields localize with PT fallback and default to empty lists', () => {
    const collections = {
      products: [
        {
          _id: 'product.with-specs',
          slug: {current: 'produto-com-especificacoes'},
          title: {_type: 'localizedString', pt: 'Produto com especificações'},
          specs: {
            dimensions: [{_type: 'localizedString', pt: '20 x 30 x 10 cm'}],
            materials: [
              {_type: 'localizedString', pt: 'Plástico reciclado', en: 'Recycled plastic'},
            ],
            specifications: [{_type: 'localizedString', pt: 'Resistente a UV'}],
            advantages: [
              {_type: 'localizedString', pt: 'Sem manutenção'},
              {_type: 'localizedString', pt: 'Fabrico nacional'},
            ],
          },
        },
        {
          _id: 'product.without-specs',
          slug: {current: 'produto-sem-especificacoes'},
          title: {_type: 'localizedString', pt: 'Produto sem especificações'},
        },
      ],
    } as unknown as SanityCollections

    const withSpecs = contentFromSanity(collections).pt.products[0]
    expect(withSpecs.specs).toEqual({
      dimensions: ['20 x 30 x 10 cm'],
      materials: ['Plástico reciclado'],
      specifications: ['Resistente a UV'],
      advantages: ['Sem manutenção', 'Fabrico nacional'],
    })

    // A field only translated into EN should still resolve for the EN reader.
    const withSpecsEn = contentFromSanity(collections).en.products[0]
    expect(withSpecsEn.specs?.materials).toEqual(['Recycled plastic'])
    // Fields with no EN translation fall back to the PT copy rather than going blank.
    expect(withSpecsEn.specs?.dimensions).toEqual(['20 x 30 x 10 cm'])

    // A product with no specs object at all must not throw and must expose
    // empty lists (matching what the /produtos/[slug] page checks before
    // deciding whether to render the specs section), not undefined.
    const withoutSpecs = contentFromSanity(collections).pt.products[1]
    expect(withoutSpecs.specs).toEqual({
      dimensions: [],
      materials: [],
      specifications: [],
      advantages: [],
    })
  })

  test('product content sections support image, uploaded video, copy, and optional actions', () => {
    const collections = {
      products: [
        {
          _id: 'product.with-content-sections',
          slug: {current: 'produto-com-conteudo'},
          title: {_type: 'localizedString', pt: 'Produto com conteúdo'},
          contentSections: [
            {
              _key: 'image-section',
              _type: 'productContentSection',
              mediaKind: 'image',
              mediaSide: 'right',
              surface: 'mint',
              image: {
                _type: 'image',
                asset: {
                  url: 'https://cdn.sanity.io/images/project/dataset/example.jpg',
                  metadata: {dimensions: {aspectRatio: 1.5}},
                },
                alt: {_type: 'localizedString', pt: 'Produto instalado num jardim'},
              },
              label: {_type: 'localizedString', pt: 'Decking aplicado em exterior'},
              labelStyle: 'pill',
              title: {_type: 'localizedString', pt: 'Uma aplicação real', en: 'A real application'},
              text: {_type: 'localizedText', pt: 'Texto por baixo da imagem.'},
              buttonLabel: {_type: 'localizedString', pt: 'Saber mais'},
              buttonUrl: '/contacto',
            },
            {
              _key: 'video-section',
              _type: 'productContentSection',
              mediaKind: 'video',
              mediaSide: 'top',
              surface: 'deep',
              video: {
                kind: 'upload',
                fileUrl: 'https://cdn.sanity.io/files/project/dataset/example.mp4',
                fileName: 'example.mp4',
                mimeType: 'video/mp4',
                captionsUrl: 'https://cdn.sanity.io/files/project/dataset/example.vtt',
              },
              poster: {
                _type: 'image',
                asset: {url: 'https://cdn.sanity.io/images/project/dataset/poster.jpg'},
                alt: {_type: 'localizedString', pt: 'Capa do vídeo'},
              },
              videoTitle: {_type: 'localizedString', pt: 'Demonstração do produto'},
              text: {_type: 'localizedText', pt: 'Texto opcional por baixo do vídeo.'},
            },
          ],
        },
      ],
    } as unknown as SanityCollections

    const product = contentFromSanity(collections).en.products[0]
    expect(product.contentSections).toHaveLength(2)
    expect(product.contentSections?.[0]).toMatchObject({
      key: 'image-section',
      editPath: 'contentSections[_key=="image-section"]',
      mediaKind: 'image',
      mediaSide: 'right',
      surface: 'mint',
      label: 'Decking aplicado em exterior',
      labelStyle: 'pill',
      title: 'A real application',
      text: 'Texto por baixo da imagem.',
      buttonLabel: 'Saber mais',
      buttonUrl: '/contacto',
      image: {
        url: 'https://cdn.sanity.io/images/project/dataset/example.jpg',
        alt: 'Produto instalado num jardim',
        aspectRatio: 1.5,
      },
    })
    expect(product.contentSections?.[1]).toMatchObject({
      key: 'video-section',
      mediaKind: 'video',
      mediaSide: 'top',
      surface: 'deep',
      labelStyle: 'caption',
      text: 'Texto opcional por baixo do vídeo.',
      video: {
        url: 'https://cdn.sanity.io/files/project/dataset/example.mp4',
        title: 'Demonstração do produto',
        mimeType: 'video/mp4',
        captionsUrl: 'https://cdn.sanity.io/files/project/dataset/example.vtt',
        poster: {url: 'https://cdn.sanity.io/images/project/dataset/poster.jpg'},
      },
    })
  })

  test('breadcrumbListSchema builds a positioned, schema.org-shaped ItemList', () => {
    const schema = breadcrumbListSchema([
      {name: 'Início', url: 'https://dafabrica4you.pt/'},
      {name: 'Produtos', url: 'https://dafabrica4you.pt/produtos'},
      {name: 'Decking e Pavimentos', url: 'https://dafabrica4you.pt/produtos/decking-pavimentos-passadicos'},
    ])

    expect(schema['@context']).toBe('https://schema.org')
    expect(schema['@type']).toBe('BreadcrumbList')

    const items = schema.itemListElement as Array<Record<string, unknown>>
    expect(items).toHaveLength(3)
    expect(items.map((item) => item.position)).toEqual([1, 2, 3])
    expect(items.map((item) => item['@type'])).toEqual(['ListItem', 'ListItem', 'ListItem'])
    expect(items[2]).toEqual({
      '@type': 'ListItem',
      position: 3,
      name: 'Decking e Pavimentos',
      item: 'https://dafabrica4you.pt/produtos/decking-pavimentos-passadicos',
    })

    // Names run through the same stega-stripping/whitespace-collapse as other
    // schema builders, so a crumb label copied from the CMS can't leak
    // zero-width markers or raw newlines into the structured data.
    const stegaEncoded = vercelStegaCombine('Loja  \n  Online', {
      origin: 'sanity.io',
      href: 'http://localhost:3333/intent/edit/id=siteContent;path=nav.store',
    })
    const [dirty] = breadcrumbListSchema([{name: stegaEncoded, url: '/loja'}]).itemListElement as Array<
      Record<string, unknown>
    >
    expect(dirty.name).toBe('Loja Online')
  })

  test('standalone builder keeps Sanity credentials and publishing behind the staff server', () => {
    const studioConfig = read('sanity.config.ts')
    const studioStructure = read('sanity.structure.ts')
    const builderPage = read('src/routes/painel/site/+page.svelte')
    const builderApi = read('src/routes/painel/site/api/+server.ts')
    const builderServer = read('src/lib/server/site-editor.ts')
    const builderPreview = read('src/lib/server/builder-preview.ts')
    const editorFixture = read('src/lib/server/site-editor-e2e.ts')

    expect(studioConfig).not.toContain('websiteBuilderPlugin')
    expect(studioStructure).not.toContain(".title('Páginas do construtor')")
    expect(builderPage).toContain("import('$lib/site-editor/editor/SiteEditorApp')")
    expect(builderApi).toContain('sameOriginOk')
    expect(builderApi).toContain('csrfOk')
    expect(builderApi).toContain('canManageStaff')
    expect(builderApi).toContain('SiteEditorConflictError')
    expect(builderServer).toContain("from '$env/dynamic/private'")
    expect(builderServer).toContain('SANITY_WRITE_TOKEN')
    expect(builderServer).toContain("createHash('sha256')")
    expect(builderServer).toContain('createIfNotExists')
    expect(editorFixture).toContain("createHash('sha256')")
    expect(editorFixture).toContain("process.env.NODE_ENV !== 'production'")
    expect(editorFixture).toContain('SITE_EDITOR_E2E_KEY')
    expect(builderPreview).toContain('httpOnly: true')
    expect(builderPreview).toContain("sameSite: 'lax'")
    expect(builderPreview).toContain("headers.get('sec-fetch-dest') !== 'document'")
  })

  test('the live preview uses one sitePage document model and route-scoped collection queries', () => {
    const layoutServer = read('src/routes/+layout.server.ts')
    const layout = read('src/routes/+layout.svelte')
    const builderServer = read('src/lib/server/builder.ts')
    const sanity = read('src/lib/sanity.ts')

    expect(layoutServer).not.toContain('getBuilderPreviewPage')
    expect(layoutServer).not.toContain('builderRenderMode')
    expect(layout).not.toContain('data.builderRenderMode')
    expect(builderServer).not.toContain('_type == "builderPage"')
    expect(sanity).toContain('includeProducts')
    expect(sanity).toContain('includeStore')
    expect(sanity).toContain('includeCases')
    expect(sanity).toContain('includeBlog')
  })

  test('Sanity editing attributes load only inside preview sessions', () => {
    const helper = read('src/lib/sanity-edit-attributes.ts')
    const publicRoutes = [
      'src/routes/produtos/+page.svelte',
      'src/routes/produtos/[slug]/+page.svelte',
      'src/routes/loja/+page.svelte',
      'src/routes/loja/[slug]/+page.svelte',
      'src/routes/blog/[slug]/+page.svelte',
      'src/routes/casos-de-estudo/[slug]/+page.svelte',
    ]

    expect(helper).toContain("import('@sanity/visual-editing/create-data-attribute')")
    for (const route of publicRoutes) {
      const source = read(route)
      expect(source).toContain('loadSanityDataAttributeFactory')
      expect(source).not.toContain(
        "from '@sanity/visual-editing/create-data-attribute'",
      )
    }
  })

  test('builder validation blocks unsafe routes, duplicate pages, links, video, and low contrast', () => {
    const page = createBuilderPage()
    expect(validateBuilderPage(page, [page])).toEqual([])

    const duplicate = {...createBuilderPage(2), route: page.route}
    expect(validateBuilderPage(page, [page, duplicate])).toContainEqual(
      expect.objectContaining({level: 'error', field: 'route'}),
    )

    const unsafeHero = createBuilderSection('builderHeroSection')
    unsafeHero.actions = [
      {
        _type: 'builderLink',
        _key: 'unsafe-link',
        label: {_type: 'localizedString', pt: 'Abrir'},
        href: 'javascript:alert(1)',
      },
    ]
    unsafeHero.media = {...unsafeHero.media, kind: 'video', autoplay: true, muted: false}
    const unsafePage = {...page, sections: [unsafeHero]}
    const unsafeIssues = validateBuilderPage(unsafePage, [unsafePage])
    expect(unsafeIssues).toContainEqual(expect.objectContaining({field: 'actions', level: 'error'}))
    expect(unsafeIssues).toContainEqual(
      expect.objectContaining({field: 'media.muted', level: 'error'}),
    )

    const settings = createBuilderSiteSettings()
    expect(validateBuilderSettings(settings)).toEqual([])
    settings.theme = {...settings.theme, textColor: '#ffffff', fogColor: '#ffffff'}
    expect(validateBuilderSettings(settings)).toContainEqual(
      expect.objectContaining({field: 'theme', level: 'error'}),
    )
  })

  test('public page copy is managed through the website Studio workspace', () => {
    const studioConfig = read('sanity.config.ts')
    const studioStructure = read('sanity.structure.ts')
    const siteSchema = read('schemaTypes/siteLanding.ts')
    const contentModel = read('src/lib/site-content.ts')
    const cartRoute = read('src/routes/carrinho/+page.svelte')
    const storeRoute = read('src/routes/loja/+page.svelte')
    const storeDetailRoute = read('src/routes/loja/[slug]/+page.svelte')
    const catalogueRoute = read('src/routes/catalogo/+page.svelte')
    const aboutRoute = read('src/routes/sobre-nos/+page.svelte')
    const pageHero = read('src/lib/components/PageHero.svelte')
    const layout = read('src/routes/+layout.svelte')
    const globalStyles = read('src/app.css')

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
    expect(studioStructure).toContain("S.documentTypeListItem('storeCategory').title('Categorias')")
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
    expect(siteSchema).toContain("'Página Carrinho'")
    expect(siteSchema).toContain("localizedStringField('cartItems', 'Produtos no carrinho')")
    expect(siteSchema).toContain("'Multiplicador de transporte'")
    expect(siteSchema).toContain("'Página Catálogo'")
    expect(siteSchema).toContain("'Página Contacto'")
    expect(siteSchema).toContain("'Vídeo do topo'")
    expect(siteSchema).toContain("'Parceiros e projetos'")
    expect(siteSchema).not.toContain("'Apresentação da empresa'")
    expect(siteSchema).toContain("'Link do WhatsApp'")
    expect(siteSchema).toContain("'Link do Livro de Reclamações'")
    expect(siteSchema).toContain("'Nota legal do Livro de Reclamações'")
    expect(siteSchema).toContain("'Link da Política de Privacidade'")
    expect(siteSchema).toContain("'Link da Política de Cookies'")
    expect(siteSchema).toContain("'Botão do aviso de cookies'")
    expect(siteSchema).toContain("'Consentimento de contacto'")
    expect(siteSchema).toContain("'Nomes dos campos'")
    expect(siteSchema).toContain("'Primeiro nome'")
    expect(siteSchema).toContain("'Apelido'")
    expect(siteSchema).toContain("'Morada'")
    expect(siteSchema).toContain(
      "copyBlockField('hero', 'Topo da página', undefined, {includeLead: false})",
    )
    expect(siteSchema).not.toContain("'Nome antigo'")
    expect(siteSchema).not.toContain("'Labels antigos do formulário'")
    expect(siteSchema).not.toContain("'Título interno'")
    expect(siteSchema).not.toContain('Este texto já não é apresentado no website')
    expect(siteSchema).not.toContain('hiddenLead')
    expect(siteSchema).not.toContain("'Navigation labels'")
    expect(siteSchema).not.toContain("'Shared labels and contact'")
    expect(siteSchema).not.toContain("'Nota de posicionamento'")
    expect(siteSchema).not.toContain("'Cartões de princípios'")
    expect(siteSchema).not.toContain("'Secção newsletter'")
    expect(siteSchema).not.toContain("title: 'Rodapé'")
    expect(contentModel).toContain("cookieNoticeAccept: 'Aceito'")
    expect(contentModel).toContain("cartItems: 'Carrinho'")
    expect(cartRoute).toContain('content.cartPage')
    expect(cartRoute).not.toContain('labelsByLanguage')
    expect(pageHero).toContain("dataAttribute?.('kicker')")
    expect(pageHero).toContain("dataAttribute?.('title')")
    expect(storeRoute).toContain('dataAttribute={storeHeroDataAttribute}')
    expect(cartRoute).toContain('dataAttribute={cartHeroDataAttribute}')
    expect(cartRoute).toContain("cartPageDataAttribute('summary.pt')")
    expect(cartRoute).toContain("cartPageDataAttribute('cartItems.pt')")
    expect(cartRoute).toContain("cartPageDataAttribute('productSubtotal.pt')")
    expect(cartRoute).toContain("cartPageDataAttribute('totalWeight.pt')")
    expect(cartRoute).toContain("cartPageDataAttribute('transport.pt')")
    expect(cartRoute).toContain("cartPageDataAttribute('iva.pt')")
    expect(cartRoute).toContain("cartPageDataAttribute('finalTotal.pt')")
    expect(cartRoute).toContain("cartPageDataAttribute('request.pt')")
    expect(cartRoute).toContain("cartPageDataAttribute('continueShopping.pt')")
    expect(cartRoute).toContain("cartPageDataAttribute('clear.pt')")
    expect(cartRoute).toContain("cartPageDataAttribute('empty.pt')")
    expect(storeRoute).toContain('content.storePage.sortOptions')
    expect(storeRoute).toContain('content.storePage.delivery')
    expect(storeDetailRoute).toContain('content.storePage.detail')
    expect(catalogueRoute).toContain('content.catalogue.formLabels')
    expect(aboutRoute).toContain('content.about.statement')
    expect(aboutRoute).toContain("siteContentDataAttribute?.('about.statement.kicker.pt')")
    expect(aboutRoute).toContain("siteContentDataAttribute?.('about.statement.title.pt')")
    expect(layout).toContain('content.common.cookieNoticeAccept')
    expect(globalStyles).toContain('.footer-legal > a:hover')
    expect(globalStyles).toContain('.footer-legal > a:focus-visible')
  })

  test('client-facing text fields provide useful writing space without legacy clutter', () => {
    const schemaIndex = read('schemaTypes/index.ts')
    const siteSchema = read('schemaTypes/siteLanding.ts')
    const productSchema = read('schemaTypes/productCategory.ts')
    const storeSchema = read('schemaTypes/storeProduct.ts')
    const caseSchema = read('schemaTypes/caseStudy.ts')
    const blogSchema = read('schemaTypes/blogPost.ts')
    const shortTextSchema = read('schemaTypes/objects/localizedString.ts')
    const longTextSchema = read('schemaTypes/objects/localizedText.ts')

    expect(shortTextSchema).toContain("type: 'text'")
    expect(shortTextSchema).toContain('rows: 2')
    expect(longTextSchema).toContain('rows: 4')

    for (const schema of [siteSchema, productSchema, storeSchema, caseSchema, blogSchema]) {
      expect(schema).toContain("type: 'localizedString'")
    }

    expect(schemaIndex).not.toContain('impactStat')
    expect(siteSchema).not.toContain("name: 'fields'")
    expect(siteSchema).not.toContain("name: 'name',\n        title: 'Nome antigo'")
  })

  test('Loja categories are editable, dynamic, and safe in visual preview', () => {
    const categorySchema = read('schemaTypes/storeCategory.ts')
    const storeSchema = read('schemaTypes/storeProduct.ts')
    const sanityClient = read('src/lib/sanity.ts')
    const contentModel = read('src/lib/site-content.ts')
    const editorModel = read('src/lib/site-editor/model.ts')
    const editorServer = read('src/lib/server/site-editor.ts')
    const editorErrors = read('src/lib/server/site-editor-errors.ts')
    const storeListRoute = read('src/routes/loja/+page.svelte')
    const storeDetailRoute = read('src/routes/loja/[slug]/+page.svelte')
    const cleanupScript = read('scripts/cleanup-removed-website-fields.ts')

    expect(categorySchema).toContain("name: 'storeCategory'")
    expect(categorySchema).toContain("title: 'Nome da categoria'")
    expect(categorySchema).toContain("name: 'slug'")
    expect(categorySchema).toContain("name: 'orderRank'")
    expect(categorySchema).not.toContain("name: 'active'")
    expect(storeSchema).toContain("name: 'category'")
    expect(storeSchema).not.toContain("value: 'bancos'")
    expect(sanityClient).toContain(
      '"storeCategories": select($includeStore => (*[_type == "storeCategory"',
    )
    expect(contentModel).toContain('export const cleanStoreCategory =')
    expect(contentModel).toContain('category: cleanStoreCategory(')
    expect(contentModel).toContain('export const storeCategoryLabel =')
    expect(editorModel).toContain("optionsSource: 'storeCategories'")
    expect(editorServer).toContain("type: 'storeCategory'")
    expect(editorServer).toContain('optionSources: {storeCategories:')
    expect(editorServer).toContain("if (type === 'storeCategory')")
    expect(editorServer).toContain("document._type === 'storeCategory'")
    expect(editorServer).toContain('category == $category')
    expect(editorServer).toContain('SiteEditorCategoryInUseError')
    expect(editorErrors).toContain('Mova-os para outra categoria antes de eliminar')
    expect(storeListRoute).toContain('storeCategoryLabel(content.storePage, product.category)')
    expect(storeDetailRoute).toContain(
      'storeCategoryLabel(content.storePage, data.storeProduct.category)',
    )
    expect(cleanupScript).toContain('_type == "storeCategory" && defined(active)')
  })

  test('CRM leads/profiles live only in Postgres, not Sanity Studio', () => {
    const studioConfig = read('sanity.config.ts')
    const studioStructure = read('sanity.structure.ts')
    const schemaIndex = read('schemaTypes/index.ts')
    const crmServer = read('src/lib/server/crm.ts')
    const contactAction = read('src/routes/contacto/+page.server.ts')
    const formGuard = read('src/lib/server/form-guard.ts')

    // The legacy private Sanity `crm` dataset/workspace was retired after the
    // Postgres migration — leads/profiles/staff accounts live only in
    // Postgres now, and Studio only edits the public website content.
    expect(studioConfig).not.toContain("name: 'crm'")
    expect(studioConfig).not.toContain("basePath: '/crm'")
    expect(studioConfig).not.toContain("dataset: 'crm'")
    expect(studioStructure).not.toContain('crmStructure')
    expect(schemaIndex).not.toContain('crmSchemaTypes')
    expect(crmServer).toContain('databaseConfigured')
    expect(crmServer).toContain('withTransaction')
    expect(crmServer).toContain('insert into crm_client_profiles')
    expect(crmServer).toContain('insert into crm_form_submissions')
    expect(crmServer).toContain('on conflict (email_normalized)')
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
    expect(sanityClient).toContain('_type == "storeCategory"')
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
    expect(sanityClient).toContain('cookieNoticeAccept')
    expect(sanityClient).toContain('marketingConsent')
    expect(sanityClient).toContain('formLabels')
    expect(sanityClient).toContain('heroVideo')
    expect(sanityClient).not.toContain('videoUrl')
    expect(sanityClient).not.toContain('toolUrl')
    expect(sanityClient).toContain('storePage')
    expect(sanityClient).toContain('cartPage')
    expect(sanityClient).toContain('transportMultiplier')
    expect(sanityClient).toContain('_key')
    expect(sanityClient).toContain('priceNatural')
    expect(sanityClient).toContain('priceDark')
    expect(sanityClient).toContain('hasFinishChoice')
    expect(sanityClient).toContain('flatTransportPrice')
    expect(sanityClient).toContain('gallery[]')
    expect(sanityClient).toContain('contentSections[]')
    expect(sanityClient).toContain('"fileUrl": file.asset->url')
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
    expect(contentModel).toContain("lead: '',")
    expect(seedScript).toContain('copyBlockWithoutLead')
    expect(seedScript).toContain(
      'hero: copyBlockWithoutLead((content) => content.productsPage.hero)',
    )
    expect(seedScript).toContain('hero: copyBlockWithoutLead((content) => content.storePage.hero)')
    expect(seedScript).toContain(
      'transportMultiplier: fallbackContent.pt.storePage.transportMultiplier',
    )
    expect(seedScript).toContain('hero: copyBlockWithoutLead((content) => content.catalogue.hero)')
    expect(seedScript).toContain('hero: copyBlockWithoutLead((content) => content.casesPage.hero)')
    expect(seedScript).toContain('hero: copyBlockWithoutLead((content) => content.blogPage.hero)')
    expect(seedScript).not.toContain('content.productsPage.lead')
    expect(seedScript).not.toContain('content.storePage.lead')
    expect(seedScript).not.toContain('content.contactPage.fields')
    expect(seedScript).not.toContain('content.home.heroImage')
    expect(seedScript).not.toContain('content.home.intro')
    expect(seedScript).not.toContain('content.home.impact.lead')
    expect(seedScript).not.toContain('copyBlock((content) => content.about.hero)')
    expect(sanityClient).not.toContain('fields[]')
    expect(cleanupScript).toContain('productsPage.hero.lead')
    expect(cleanupScript).toContain('productsPage.lead')
    expect(cleanupScript).toContain('storePage.hero.lead')
    expect(cleanupScript).toContain('storePage.lead')
    expect(cleanupScript).toContain('catalogue.hero.lead')
    expect(cleanupScript).toContain('casesPage.hero.lead')
    expect(cleanupScript).toContain('blogPage.hero.lead')
    expect(cleanupScript).toContain('contactPage.fields')
    expect(cleanupScript).toContain('contactPage.formLabels.name')
    expect(cleanupScript).toContain("perspective: 'raw'")
    expect(cleanupScript).toContain('home.hero.kicker')
    expect(cleanupScript).toContain('home.heroImage')
    expect(cleanupScript).toContain('home.intro')
    expect(cleanupScript).toContain('home.impact.lead')
    expect(cleanupScript).toContain('about.hero.lead')
  })

  test('visual editing preview is wired through Studio and draft rendering', () => {
    const studioConfig = read('sanity.config.ts')
    const layoutServer = read('src/routes/+layout.server.ts')
    const layout = read('src/routes/+layout.svelte')
    const storeListRoute = read('src/routes/loja/+page.svelte')
    const storeDetailRoute = read('src/routes/loja/[slug]/+page.svelte')
    const storeMediaGallery = read('src/lib/components/StoreMediaGallery.svelte')
    const siteEditorOverlay = read('src/lib/components/SiteEditorOverlay.svelte')
    const productListRoute = read('src/routes/produtos/+page.svelte')
    const productDetailRoute = read('src/routes/produtos/[slug]/+page.svelte')
    const caseDetailRoute = read('src/routes/casos-de-estudo/[slug]/+page.svelte')
    const blogDetailRoute = read('src/routes/blog/[slug]/+page.svelte')
    const contentModel = read('src/lib/site-content.ts')
    const siteEditorModel = read('src/lib/site-editor/model.ts')
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
    expect(studioConfig).toContain(
      "caseStudy: collectionLocation('/casos-de-estudo', 'Caso de estudo')",
    )
    expect(studioConfig).toContain("blogPost: collectionLocation('/blog', 'Artigo do blog')")
    expect(layoutServer).toContain('isPreview(cookies, request.headers)')
    expect(layoutServer).toContain('getSanityCollections(')
    expect(layoutServer).toContain('studioUrl: preview || builderPreview ? sanityStudioUrl :')
    // The preview cookie persists for an hour across any request from that
    // browser, so a plain top-level visit outside Studio must not inherit
    // draft content/the click-to-edit overlay just because the cookie is
    // still set from an earlier Presentation session.
    expect(previewHelpers).toContain('sec-fetch-dest')
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
    expect(layout).toContain("import {stegaClean} from '@sanity/client/stega'")
    expect(layout).toContain('const plainNavigationLabel =')
    expect(layout).toContain('{plainNavigationLabel(item.label)}')
    expect(siteEditorModel).toContain("type: 'navigation'")
    expect(storeListRoute).toContain('$lib/sanity-edit-attributes')
    expect(storeListRoute).toContain("storeProductFieldDataAttribute(product, 'image')")
    expect(storeListRoute).toContain('data-sanity={cardImageDataAttribute}')
    expect(storeDetailRoute).toContain('$lib/sanity-edit-attributes')
    expect(storeDetailRoute).toContain('StoreMediaGallery')
    expect(storeDetailRoute).toContain("storeProductDataAttribute('image')")
    expect(storeDetailRoute).toContain('imageDataAttribute = $derived')
    expect(storeDetailRoute).toContain('dataAttribute={mediaDataAttribute}')
    expect(storeDetailRoute).toContain('data.preview || data.builderPreview')
    expect(storeMediaGallery).toContain('dataAttribute?: (path: string) => string | undefined')
    expect(storeMediaGallery).toContain('entry?.editPath || fallbackEditPath')
    expect(storeMediaGallery).toContain('data-sanity={activeDataAttribute}')
    expect(storeMediaGallery).toContain('data-sanity={thumbAttr}')
    expect(storeMediaGallery).toContain('data-df4y-editor-kind={item.type}')
    expect(storeMediaGallery).toContain('data-df4y-editor-kind={mediaItem.type}')
    expect(siteEditorOverlay).toContain("closest<HTMLElement>('[data-df4y-editor-kind]')")
    expect(siteEditorOverlay).toContain("kind === 'video'")
    expect(contentModel).toContain('editPath?: string')
    expect(contentModel).toContain("imageFromSanity(mainImage, language, fallback, 'image')")
    expect(contentModel).toContain('gallery[_key==')
    expect(productDetailRoute).toContain('$lib/sanity-edit-attributes')
    expect(productDetailRoute).toContain("type: 'productCategory'")
    expect(productDetailRoute).toContain('data.preview || data.builderPreview')
    expect(productDetailRoute).toContain("productDataAttribute?.('title.pt')")
    expect(productDetailRoute).toContain("data-sanity={productDataAttribute?.('description.pt')}")
    expect(productDetailRoute).toContain('>{leadCopy}</p>')
    expect(productDetailRoute).toContain('dataAttribute={imageDataAttribute}')
    expect(productListRoute).toContain("siteContentDataAttribute?.('productsPage.heroImage')")
    expect(productListRoute).toContain('data.preview || data.builderPreview')
    expect(productListRoute).toContain('productDataAttribute(product.studioDocumentId')
    expect(caseDetailRoute).toContain("type: 'caseStudy'")
    expect(caseDetailRoute).toContain('StoreMediaGallery')
    expect(caseDetailRoute).toContain('dataAttribute={imageDataAttribute}')
    expect(caseDetailRoute).not.toContain('case-detail-list')
    expect(caseDetailRoute).not.toContain("caseDataAttribute?.('challenge.pt')")
    expect(blogDetailRoute).toContain("type: 'blogPost'")
    expect(blogDetailRoute).toContain('StoreMediaGallery')
    expect(blogDetailRoute).toContain('dataAttribute={imageDataAttribute}')
    expect(storeDetailRoute).toContain('data-sanity={selectedPriceDataAttribute}')
    expect(storeDetailRoute).toContain('data-sanity={selectedWeightDataAttribute}')
    expect(storeDetailRoute).toContain("data-df4y-editor-kind={selectedPriceDataAttribute ? 'number'")
    expect(storeDetailRoute).toContain("data-df4y-editor-kind={selectedWeightDataAttribute ? 'number'")
    expect(storeDetailRoute).toContain('? labels.productNet : undefined')
    expect(storeDetailRoute).toContain('? labels.weight : undefined')
    expect(siteEditorOverlay).toContain("return 'Editar texto'")
    expect(siteEditorOverlay).toContain('`Editar campo: ${explicitLabel}`')
    expect(siteEditorOverlay).not.toContain('Clique e escreva')
    expect(storeDetailRoute).toContain(
      "effectiveFinish === 'natural' ? 'priceNatural' : 'priceDark'",
    )
    expect(storeDetailRoute).toContain('{#if hasFinishChoice}')
    expect(storeDetailRoute).toContain('.weightKg')
    expect(sanityClient).toContain('previewClient')
    expect(sanityClient).toContain('previewSecretClient')
    expect(sanityClient).toContain("perspective: 'drafts'")
    expect(sanityClient).toContain('stega: {enabled: true, studioUrl}')
    expect(sanityClient).toContain('export const getSanityCollections = async (')
    expect(sanityClient).toContain('requestedScope: SanityCollectionScope = allCollections')
    expect(sanityClient).toContain('getBlogPostDetail')
    expect(previewHelpers).toContain("url.protocol === 'https:'")
    expect(previewHelpers).toContain("sameSite: secure ? ('none' as const) : ('lax' as const)")
    expect(previewEnable).toContain('validatePreviewUrl(previewSecretClient')
    expect(previewEnable).toContain('setPreviewCookie(cookies, url)')
    expect(previewDisable).toContain('clearPreviewCookie(cookies, url)')
    expect(blogDetailServer).toContain(
      'getBlogPostDetail(params.slug, preview || builderPreview)',
    )
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
    const productSections = read('src/lib/components/ProductContentSections.svelte')
    const editorModel = read('src/lib/site-editor/model.ts')
    const storeSchema = read('schemaTypes/storeProduct.ts')
    const caseSchema = read('schemaTypes/caseStudy.ts')
    const blogSchema = read('schemaTypes/blogPost.ts')

    expect(productSchema).not.toContain("name: 'features'")
    expect(productSchema).not.toContain("name: 'applications'")
    expect(productSchema).not.toContain("name: 'videoUrl'")
    expect(productSchema).not.toContain("'Vídeo do produto'")
    expect(productSchema).not.toContain("name: 'toolUrl'")
    expect(productSchema).not.toContain("'Link da ferramenta'")

    for (const schema of [productSchema, storeSchema, caseSchema, blogSchema]) {
      expect(schema).toContain("title: 'Conteúdo'")
      expect(schema).toContain("name: 'image'")
      expect(schema).toContain("type: 'image'")
      expect(schema).toContain('hotspot: true')
      expect(schema).toContain("name: 'alt'")
      expect(schema).toContain("'Descrição da imagem'")
    }

    expect(storeSchema).toContain("name: 'gallery'")
    expect(storeSchema).toContain("title: 'Galeria'")
    expect(storeSchema).toContain("name: 'galleryVideo'")
    expect(storeSchema).toContain("type: 'file'")
    // Produtos (outside the Loja) share the same mixed image/video gallery
    // Loja products use named image/video members; existing Blog and Case images
    // keep their legacy `image` type while gaining the uploaded video member.
    expect(productSchema).toContain("name: 'galleryImage'")
    expect(productSchema).toContain("name: 'galleryVideo'")
    expect(productSchema).toContain("type: 'file'")
    expect(productSchema).toContain("name: 'contentSections'")
    expect(productSchema).toContain("name: 'productContentSection'")
    expect(productSchema).toContain("name: 'mediaKind'")
    expect(productSchema).toContain("name: 'mediaSide'")
    expect(productSchema).toContain("name: 'surface'")
    expect(productSchema).toContain("name: 'buttonLabel'")
    expect(productSchema).toContain("name: 'buttonUrl'")
    expect(editorModel).toContain("label: 'Visual à esquerda'")
    expect(editorModel).toContain("label: 'Visual à direita'")
    expect(editorModel).toContain("label: 'Visual acima'")
    expect(editorModel).toContain("label: 'Verde profundo'")
    expect(editorModel).toContain("label: 'Azul mineral'")
    expect(productSections).toContain('is-${section.mediaSide}')
    expect(productSections).toContain('is-${section.surface}')
    expect(caseSchema).toContain("name: 'galleryVideo'")
    expect(caseSchema).toContain("type: 'file'")
    expect(blogSchema).toContain("name: 'galleryVideo'")
    expect(blogSchema).toContain("type: 'file'")
    expect(storeSchema).toContain("'Opções, pesos e preços'")
    expect(storeSchema).toContain("'Natural/Cinza (sem IVA)'")
    expect(storeSchema).toContain("'Castanho/Preto (sem IVA)'")
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
    expect(contentModel).toContain('/images/partners/abaae.png')
    expect(contentModel).toContain('partnersFromSanity')
    expect(contentModel).toContain('localizedArticle')
    expect(contentModel).toContain('article: localizedArticle')
    expect(contentModel).toContain('products: productCategories.pt')
    expect(contentModel).toContain('storeProductsForLanguage')
    expect(contentModel).toContain('fallback.find((item) => item.slug === slug)')
    expect(contentModel).not.toContain(
      'fallback.find((item) => item.slug === slug) ?? fallback[index]',
    )
    expect(contentModel).toContain(
      'const sanityMedia = storeProductMediaFromSanity(product.image, product.gallery, language)',
    )
    expect(contentModel).toContain('const fallbackStoreImages =')
    expect(contentModel).toContain(
      'fallbackStoreImages.map((image) => storeProductMediaImage(image))',
    )
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
    const editorModel = read('src/lib/site-editor/model.ts')
    const editorStarters = read('src/lib/server/site-editor-starters.ts')
    const route = read('src/routes/casos-de-estudo/[slug]/+page.svelte')
    const importScript = read('scripts/write-case-study-import.ts')

    expect(caseSchema).toContain("name: 'description'")
    expect(caseSchema).toContain("title: 'Descrição'")
    expect(sanityClient).toContain('description')
    expect(contentModel).toContain('description?: string')
    expect(contentModel).toContain('description: localized(item.description')
    expect(route).toContain('data.caseStudy.description || data.caseStudy.summary')
    expect(route).toContain('data-sanity={caseDataAttribute?.(leadFieldPath)}')
    expect(route).toContain('>{lead}</p>')
    expect(route).not.toContain('case-detail-description')
    expect(route).not.toContain('case-detail-list')
    expect(editorModel).not.toContain("localizedText('challenge', 'Desafio')")
    expect(editorModel).not.toContain("localizedText('solution', 'Solução')")
    expect(editorModel).not.toContain("localizedText('result', 'Resultado')")
    expect(editorStarters).not.toContain("challenge: localizedText('')")
    expect(caseSchema.match(/hidden: true/g)?.length ?? 0).toBeGreaterThanOrEqual(3)
    expect(importScript).toContain('caseStudy-')
    expect(importScript).toContain('case-study-import.ndjson')
  })

  test('the shared media gallery locks background scroll', () => {
    const gallery = read('src/lib/components/StoreMediaGallery.svelte')
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

    expect(
      calculateStoreEstimate([{unitPrice: 185, quantity: 1, weightKg: 52}], '7000-000'),
    ).toMatchObject({
      productNet: 185,
      totalWeightKg: 52,
      subtotalNet: 224.79,
      vat: 51.7,
      totalGross: 276.49,
    })

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
    const baseline = calculateStoreEstimate(
      [{unitPrice: 185, quantity: 1, weightKg: 25}],
      '1000-000',
    )
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
    expect(cart).toContain('item.variantKey || `legacy-')
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
    const passwordAuth = read('src/lib/server/password-auth.ts')
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
    expect(passwordAuth).toContain('scrypt')
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
    const staffAuth = read('src/lib/server/staff-auth.ts')
    const migration = read('migrations/0004_customer_address_identity.sql')
    const addresses = read('src/routes/conta/(area)/moradas/+page.server.ts')
    const addressPage = read('src/routes/conta/(area)/moradas/+page.svelte')
    const config = read('svelte.config.js')
    const appHtml = read('src/app.html')

    expect(packageJson).toContain('tests/commerce.spec.ts')
    expect(auth).toContain('delete from email_verification_tokens')
    expect(auth).toContain('delete from password_reset_tokens')
    expect(rateLimit).toContain('const maxBuckets = 5_000')
    expect(rateLimit).toContain('export const rateLimitKey')
    expect(checkout).toContain("rateLimitKey('checkout', getClientAddress())")
    expect(crm).toContain("rateLimitKey('crm-ip', input.ipAddress)")
    expect(orders).toContain('order by address_type asc, created_at asc, id asc')
    expect(orders).not.toContain('order by address_type asc, is_default desc')
    expect(crm).toContain("rateLimitKey('crm-email', emailNormalized)")
    expect(checkout).toContain('submissionToken.length < 20')
    expect(checkout).toContain('isValidEmail(values.email)')
    expect(orders).toContain(
      "throw new OrderInputError('Atualize a página antes de finalizar o pedido.')",
    )
    expect(orders).toContain('unique address identity added in migration 0004')
    expect(migration).toContain('customer_addresses_identity_idx')
    expect(migration).toContain('ranked_addresses')
    expect(addresses).toContain('isSupportedStorePostalCode')
    expect(addressPage).toContain('afterDefaultAction')
    expect(addressPage).toContain(
      'preferredAddressIds = {...preferredAddressIds, [addressType]: addressId}',
    )
    expect(addressPage).not.toContain('afterAddressAction(t.defaultSaved)')
    expect(formGuard).toContain('if (referer) return referer.startsWith(`${expectedOrigin}/`)')
    expect(sameOriginOk(null, null, 'https://example.com')).toBe(false)
    expect(sameOriginOk('https://example.com', null, 'https://example.com')).toBe(true)
    expect(sameOriginOk(null, 'https://example.com/contacto', 'https://example.com')).toBe(true)
    expect(hooks).toContain("headers.set('x-content-type-options', 'nosniff')")
    expect(hooks).toContain(
      "headers.set('strict-transport-security', 'max-age=31536000; includeSubDomains')",
    )
    expect(hooks).toContain('if (!fixtureStaff) await applyPreviewAdminPolicy()')
    expect(hooks.indexOf('const fixtureStaff')).toBeLessThan(
      hooks.indexOf('if (!fixtureStaff) await applyPreviewAdminPolicy()'),
    )
    expect(previewEnable).toContain("rateLimitKey('preview-enable', getClientAddress())")
    expect(staffAuth).toContain("staff?.role === 'admin'")
    expect(painelActions).toContain('canManageStaff(event.locals.staff)')
    expect(painelOrder).toContain('if (!locals.staff) error(401')
    expect(config).toContain("mode: 'auto'")
    expect(config).toContain("'frame-ancestors'")
    expect(appHtml).toContain('nonce="%sveltekit.nonce%"')
  })

  test('the DeepL key override route is admin-gated, CSRF-checked, and validated before persisting', () => {
    const definicoesServer = read('src/routes/painel/definicoes/+page.server.ts')
    const deeplSettings = read('src/lib/server/deepl-settings.ts')
    const appSettings = read('src/lib/server/app-settings.ts')
    const migration = read('migrations/0009_app_settings.sql')

    expect(definicoesServer).toContain("if (!canManageStaff(locals.staff)) error(403")
    expect(definicoesServer).toContain('canManageStaff(locals.staff)')
    expect(definicoesServer.match(/canManageStaff\(locals\.staff\)/g)?.length).toBeGreaterThanOrEqual(3)
    expect(definicoesServer).toContain('sameOriginOk(')
    expect(definicoesServer).toContain('csrfOk(')
    expect(definicoesServer).toContain('await checkDeeplKey(key)')
    expect(definicoesServer.indexOf('await checkDeeplKey(key)')).toBeLessThan(
      definicoesServer.indexOf('await setDeeplApiKeyOverride('),
    )
    expect(deeplSettings).toContain("override || env.DEEPL_API_KEY || null")
    expect(deeplSettings).toContain('export const maskDeeplKey')
    expect(appSettings).toContain('on conflict (key) do update')
    expect(migration).toContain('create table if not exists app_settings')
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
    expect(accountLayout).toContain('$lib/styles/account-checkout.css')
    expect(authLayout).toContain('$lib/styles/account.css')
    expect(checkout).toContain('$lib/styles/account-checkout.css')
    expect(painelLayout).toContain('$lib/styles/painel.css')
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
    expect(localizedString).toContain('hidden: true')
    expect(localizedString).toContain('rows: 2')
    expect(localizedText).toContain('hidden: true')
    expect(localizedArticle).toContain('opts.hidden')

    // The tree-walker must be shape-based (works for any localized field,
    // present or future) and never mutate the input it collects/reinserts.
    expect(translateContent).toContain('detectLocalizedKind')
    expect(translateContent).toContain('findLocalizedFields')
    expect(translateContent).toContain('structuredClone')
    expect(translateContent).toContain('_key==')

    // Translation is webhook-only. The request must carry Sanity's signed
    // body and pass its own rate-limit before it can reach the orchestrator.
    // Keeping browser-triggered secrets out of the Studio bundle avoids
    // presenting a public value as though it were a credential.
    expect(translateEndpoint).toContain('isValidSignature')
    expect(translateEndpoint).toContain('SIGNATURE_HEADER_NAME')
    expect(translateEndpoint).toContain('env.SANITY_WEBHOOK_SECRET')
    expect(translateEndpoint).toContain("rateLimitKey('sanity-translate'")
    expect(translateEndpoint).toContain('translateDocument(')
    expect(translateEndpoint).not.toContain('access-control-allow-origin')
    expect(translateEndpoint).not.toContain('x-sanity-translate-secret')
    expect(translateDocument).toContain('translationHash')

    // A field's hash must only be stamped once BOTH languages succeed, so a
    // partial DeepL failure stays "dirty" and gets retried later rather than
    // being silently marked done.
    expect(translateDocument).toContain('enSlice && esSlice')

    // The webhook and one-off backfill script reuse the same managed-types
    // list and tree-walker rather than duplicating detection logic.
    expect(structure).toContain('export const managedTypes')
    expect(config).not.toContain('RetranslateAction')
    expect(backfillScript).toContain('findLocalizedFields')
    expect(backfillScript).toContain('!task.currentHash')
    expect(backfillScript).not.toContain('patchPath}.en')
    expect(backfillScript).not.toContain('patchPath}.es')

    expect(envExample).toContain('DEEPL_API_KEY')
    expect(envExample).toContain('DEEPL_GLOSSARY_EN')
    expect(envExample).toContain('DEEPL_GLOSSARY_ES')
    expect(envExample).toContain('SANITY_WEBHOOK_SECRET')
    expect(envExample).not.toContain('SANITY_STUDIO_TRANSLATE_SECRET')
  })
})

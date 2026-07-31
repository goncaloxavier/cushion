import {expect, test} from '@playwright/test'
import {
  createBuilderPageSections,
  createBuilderSection,
} from '../src/lib/builder/defaults'
import {buildHomeSections} from '../src/lib/builder/home-sections'
import {
  createManagedCoreSection,
  managedCoreSectionForDocumentType,
  managedCoreSectionForRoot,
  managedDetailSectionDocumentTypes,
  managedPageSectionScopes,
  splitManagedCoreSections,
  withManagedCoreSection,
} from '../src/lib/builder/managed-page-sections'
import {validateBuilderSections} from '../src/lib/builder/validation'
import {contentFromSanity} from '../src/lib/site-content'

test('home sections survive the Sanity content pipeline', async () => {
  const section = {
    _type: 'builderCtaSection',
    _key: 'k1',
    title: {pt: 'Secção livre da página inicial'},
    enabled: true,
  }
  const built = contentFromSanity({
    siteContent: {home: {sections: [section]}},
  } as never)
  expect(built.pt.home.sections).toHaveLength(1)
  expect(built.pt.home.sections[0]).toMatchObject({_type: 'builderCtaSection', _key: 'k1'})
  // Absent in Sanity must mean an empty array, never undefined — the page
  // guards on .length.
  const empty = contentFromSanity({siteContent: {home: {}}} as never)
  expect(empty.pt.home.sections).toEqual([])
})

test('every managed fixed page preserves sections and normalizes an absent list', () => {
  const section = createBuilderSection('builderCtaSection')
  const siteContent = Object.fromEntries(
    managedPageSectionScopes.map(({rootPath}) => [rootPath, {sections: [section]}]),
  )
  const populated = contentFromSanity({siteContent} as never)
  const empty = contentFromSanity({siteContent: {}} as never)

  for (const {rootPath} of managedPageSectionScopes) {
    const populatedPage = (populated.pt as unknown as Record<string, {sections: unknown[]}>)[
      rootPath
    ]
    const emptyPage = (empty.pt as unknown as Record<string, {sections: unknown[]}>)[rootPath]
    expect(populatedPage.sections).toEqual([section])
    expect(emptyPage.sections).toEqual([])
  }
})

test('new editorial sections start with a structured article body', () => {
  const section = createBuilderSection('builderRichTextSection')
  expect(section.body).toEqual({_type: 'localizedArticle', pt: []})
})

test('new hero and action sections start as complete responsive calls to action', () => {
  for (const type of ['builderHeroSection', 'builderCtaSection'] as const) {
    const section = createBuilderSection(type)
    expect(section.enabled).toBe(true)
    expect(section.layout?.mobileColumns).toBe(1)
    expect(section.actions).toHaveLength(1)
    expect(section.actions?.[0]).toMatchObject({
      label: {pt: 'Falar connosco'},
      href: '/contacto',
      style: 'primary',
    })
  }
})

test('free-page starters create the promised section shape and keep the supplied title', () => {
  const essential = createBuilderPageSections('Página essencial de teste', 'essential')
  const visual = createBuilderPageSections('Página visual de teste', 'visual')
  const opening = createBuilderPageSections('Página mínima de teste', 'opening')

  expect(essential.map((section) => section._type)).toEqual([
    'builderHeroSection',
    'builderMediaSection',
    'builderCtaSection',
  ])
  expect(visual.map((section) => section._type)).toEqual([
    'builderHeroSection',
    'builderMediaSection',
    'builderGallerySection',
    'builderCtaSection',
  ])
  expect(opening.map((section) => section._type)).toEqual(['builderHeroSection'])
  expect(essential[0]?.title).toMatchObject({pt: 'Página essencial de teste'})
  expect(createBuilderPageSections('Fallback seguro', 'valor-inválido')[0]?.title).toMatchObject({
    pt: 'Fallback seguro',
  })
  expect(createBuilderPageSections('Fallback seguro', 'valor-inválido')).toHaveLength(3)
})

test('every designed page exposes one valid managed area in the shared section stream', () => {
  const definitions = [
    ...managedPageSectionScopes.map(({rootPath}) => managedCoreSectionForRoot(rootPath)),
    ...managedDetailSectionDocumentTypes.map((type) => managedCoreSectionForDocumentType(type)),
  ]

  for (const definition of definitions) {
    expect(definition).toBeDefined()
    const section = createManagedCoreSection(definition!)
    expect(section).toMatchObject({
      _type: 'builderManagedSection',
      _key: definition!.key,
      component: definition!.component,
      enabled: true,
    })
    expect(validateBuilderSections([section]).filter((issue) => issue.level === 'error')).toEqual([])
  }
})

test('managed areas preserve authored order and split free sections around the designed page', () => {
  const definition = managedCoreSectionForRoot('about')!
  const before = createBuilderSection('builderRichTextSection')
  const after = createBuilderSection('builderCtaSection')
  const persistedCore = {
    ...createManagedCoreSection(definition),
    _key: 'old-managed-key',
    enabled: false,
  }

  const normalized = withManagedCoreSection(
    [before, persistedCore, after, persistedCore],
    definition,
  )
  expect(normalized.map((section) => section._key)).toEqual([
    before._key,
    definition.key,
    after._key,
  ])
  expect(normalized[1]).toMatchObject({
    _type: 'builderManagedSection',
    component: 'aboutCore',
    enabled: false,
  })

  const split = splitManagedCoreSections(normalized, definition)
  expect(split.before).toEqual([before])
  expect(split.core).toEqual(normalized[1])
  expect(split.after).toEqual([after])
})

test('legacy pages gain their designed area without replacing existing free sections', () => {
  const definition = managedCoreSectionForDocumentType('blogPost')!
  const authored = createBuilderSection('builderMediaSection')
  const normalized = withManagedCoreSection([authored], definition)

  expect(normalized).toHaveLength(2)
  expect(normalized[0]).toMatchObject({
    _type: 'builderManagedSection',
    component: 'blogDetailCore',
  })
  expect(normalized[1]).toBe(authored)
})

test('landing migration preserves the four designed blocks in their public order', () => {
  let sequence = 0
  const key = () => `migration-${++sequence}`
  const source = {
    navigation: [
      {
        _key: 'products',
        href: '/produtos',
        label: {pt: 'Produtos', en: 'Products', es: 'Productos'},
      },
    ],
    productsPage: {
      hero: {
        kicker: {pt: 'Produtos', en: 'Products', es: 'Productos'},
        title: {
          pt: 'Soluções para exterior',
          en: 'Outdoor solutions',
          es: 'Soluciones de exterior',
        },
      },
    },
    casesPage: {
      hero: {
        title: {
          pt: 'Projetos em uso real',
          en: 'Projects in real use',
          es: 'Proyectos en uso real',
        },
      },
    },
    home: {
      impact: {
        title: {pt: 'Impacto em números', en: 'Impact in numbers', es: 'Impacto en cifras'},
        stats: [
          {
            _key: 'stat-1',
            title: {pt: '100 t', en: '100 t', es: '100 t'},
            text: {pt: 'Resíduos valorizados', en: 'Recovered waste', es: 'Residuos valorizados'},
          },
        ],
      },
      partners: {
        kicker: {pt: 'Parceiros', en: 'Partners', es: 'Socios'},
        title: {pt: 'Trabalho conjunto', en: 'Working together', es: 'Trabajo conjunto'},
        lead: {
          pt: 'Projetos com impacto.',
          en: 'Projects with impact.',
          es: 'Proyectos con impacto.',
        },
        items: [
          {
            _key: 'partner-1',
            name: 'ABAAE',
            url: 'https://abae.pt',
            logo: {asset: {_ref: 'image-logo-100x100-png'}},
          },
        ],
      },
    },
  }

  const sections = buildHomeSections(source, key)
  expect(sections.map((section) => section.variant)).toEqual([
    'landing-solutions',
    'landing-impact',
    'landing-work',
    'landing-partners',
  ])
  expect(sections[0]).toMatchObject({
    source: 'productCategory',
    title: source.productsPage.hero.title,
    actions: [{href: '/produtos'}],
  })
  expect(sections[1]).toMatchObject({
    title: source.home.impact.title,
    items: [
      {
        _key: 'stat-1',
        value: source.home.impact.stats[0].title,
        label: source.home.impact.stats[0].text,
      },
    ],
  })
  expect(sections[2]).toMatchObject({
    source: 'caseStudy',
    title: source.casesPage.hero.title,
    actions: [{href: '/casos-de-estudo'}],
  })
  expect(sections[3]).toMatchObject({
    eyebrow: source.home.partners.kicker,
    title: source.home.partners.title,
    body: source.home.partners.lead,
    items: [expect.objectContaining({_key: 'partner-1', name: 'ABAAE'})],
  })

  for (const section of sections) {
    expect(section.layout).toMatchObject({
      _type: 'builderLayout',
      width: 'wide',
      spacing: {_type: 'builderSpacing', top: 61, bottom: 61, sides: 24},
    })
    expect(section.layout).not.toHaveProperty('tone')
  }
  expect(validateBuilderSections(sections).filter((issue) => issue.level === 'error')).toEqual([])
})

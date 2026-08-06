import type {
  BuilderCard,
  BuilderLayout,
  BuilderLink,
  BuilderMedia,
  BuilderSection,
  BuilderSectionType,
  BuilderStat,
  BuilderTypography,
  LocalizedValue,
} from '$lib/builder/types'

const timestamp = '2026-08-05T12:00:00.000Z'

const localizedString = (value: string) => ({
  _type: 'localizedString' as const,
  pt: value,
  en: value,
  es: value,
})

const localizedText = (value: string) => ({
  _type: 'localizedText' as const,
  pt: value,
  en: value,
  es: value,
})

const imageRef = (key: string, dimensions = '1600x1000') =>
  `image-sectionfixture${key.padEnd(24, '0')}-${dimensions}-png`

const imageMedia = (key: string, label: string, dimensions = '1600x1000'): BuilderMedia => ({
  _type: 'builderMedia',
  _key: key,
  kind: 'image',
  image: {_type: 'image', asset: {_type: 'reference', _ref: imageRef(key, dimensions)}},
  alt: localizedString(label),
  caption: localizedString(`${label} — legenda de teste`),
  fit: 'contain',
  position: 'center',
})

const videoMedia = (key: string, label: string): BuilderMedia => ({
  _type: 'builderMedia',
  _key: key,
  kind: 'video',
  videoFile: {
    _type: 'file',
    asset: {_type: 'reference', _ref: `file-sectionfixture${key.padEnd(24, '0')}-mp4`},
  },
  poster: {
    _type: 'image',
    asset: {_type: 'reference', _ref: imageRef(`${key}poster`, '1600x900')},
  },
  alt: localizedString(label),
  caption: localizedString(`${label} — vídeo de teste`),
  autoplay: false,
  muted: true,
  loop: false,
  controls: true,
  fit: 'contain',
  position: 'center',
})

const youtubeMedia = (key: string, label: string): BuilderMedia => ({
  _type: 'builderMedia',
  _key: key,
  kind: 'youtube',
  youtubeUrl: 'https://www.youtube.com/watch?v=VIUVlk51iN0',
  poster: {
    _type: 'image',
    asset: {_type: 'reference', _ref: imageRef(`${key}poster`, '1600x900')},
  },
  alt: localizedString(label),
  caption: localizedString(`${label} — YouTube de teste`),
  controls: true,
  fit: 'contain',
  position: 'center',
})

const action = (
  key: string,
  label: string,
  style: NonNullable<BuilderLink['style']> = 'primary',
): BuilderLink => ({
  _type: 'builderLink',
  _key: key,
  label: localizedString(label),
  href: '/contacto',
  style,
  newTab: false,
  ariaLabel: localizedString(label),
})

const typography = (
  kind: 'title' | 'body',
  align: NonNullable<BuilderTypography['align']> = 'left',
): BuilderTypography => ({
  _type: 'builderTypography',
  fontFamily: 'inherit',
  fontSize:
    kind === 'title'
      ? {desktop: 48, tablet: 42, mobile: 34}
      : {desktop: 18, tablet: 18, mobile: 17},
  fontWeight: kind === 'title' ? '700' : '400',
  align,
  lineHeight: kind === 'title' ? 1.08 : 1.55,
  maxWidth: kind === 'title' ? 24 : 54,
})

const layout = (
  surface: NonNullable<BuilderLayout['surface']> = 'white',
  width: NonNullable<BuilderLayout['width']> = 'wide',
  columns = 3,
  spacing = 64,
): BuilderLayout => ({
  _type: 'builderLayout',
  surface,
  width,
  columns,
  mobileColumns: 1,
  gap: 24,
  verticalAlign: 'center',
  reverseOnMobile: false,
  spacing: {_type: 'builderSpacing', top: spacing, bottom: spacing, sides: 24},
})

const baseSection = (
  type: BuilderSectionType,
  key: string,
  title: string,
  surface: NonNullable<BuilderLayout['surface']> = 'white',
): BuilderSection => ({
  _type: type,
  _key: key,
  internalLabel: title,
  enabled: true,
  eyebrow: localizedString('Secção de demonstração'),
  title: localizedString(title),
  body: localizedText('Conteúdo completo para validar a apresentação desta secção no editor e no site.'),
  titleStyle: typography('title'),
  bodyStyle: typography('body'),
  layout: layout(surface),
})

const articleBody = {
  _type: 'localizedArticle' as const,
  pt: [
    {
      _key: 'section-rich-heading',
      _type: 'block',
      style: 'h3',
      markDefs: [],
      children: [
        {_key: 'section-rich-heading-span', _type: 'span', marks: [], text: 'Estrutura editorial'},
      ],
    },
    {
      _key: 'section-rich-copy',
      _type: 'block',
      style: 'normal',
      markDefs: [],
      children: [
        {
          _key: 'section-rich-copy-span',
          _type: 'span',
          marks: [],
          text: 'Um parágrafo que confirma texto corrido, hierarquia e largura de leitura.',
        },
      ],
    },
    {
      _key: 'section-rich-list-one',
      _type: 'block',
      style: 'normal',
      listItem: 'bullet',
      level: 1,
      markDefs: [],
      children: [
        {_key: 'section-rich-list-one-span', _type: 'span', marks: [], text: 'Primeiro ponto'},
      ],
    },
    {
      _key: 'section-rich-list-two',
      _type: 'block',
      style: 'normal',
      listItem: 'bullet',
      level: 1,
      markDefs: [],
      children: [
        {_key: 'section-rich-list-two-span', _type: 'span', marks: [], text: 'Segundo ponto'},
      ],
    },
    {
      _key: 'section-rich-table',
      _type: 'articleTable',
      columns: ['Opção', 'Resultado'],
      rows: [
        {
          _key: 'section-rich-table-row',
          _type: 'articleTableRow',
          cells: ['Estrutura', 'Preservada'],
        },
      ],
    },
  ],
  en: [],
  es: [],
}

const cards = (): BuilderCard[] =>
  Array.from({length: 4}, (_, index) => ({
    _type: 'builderCard',
    _key: `section-card-${index + 1}`,
    eyebrow: localizedString(`Destaque ${index + 1}`),
    title: localizedString(`Cartão ${index + 1}`),
    body: localizedText('Texto curto, legível e consistente dentro da grelha.'),
    ...(index === 0
      ? {media: imageMedia('card-media-one', 'Aplicação exterior num jardim', '1200x900')}
      : {}),
    action: action(`card-action-${index + 1}`, 'Saber mais', 'text'),
  }))

const stats = (): BuilderStat[] =>
  Array.from({length: 4}, (_, index) => ({
    _type: 'builderStat',
    _key: `section-stat-${index + 1}`,
    value: localizedString(`${(index + 1) * 10}+`),
    label: localizedString(`Indicador ${index + 1}`),
  }))

const partners = () =>
  Array.from({length: 4}, (_, index) => ({
    _type: 'builderPartner',
    _key: `section-partner-${index + 1}`,
    name: `Parceiro ${index + 1}`,
    url: 'https://example.com',
    text: localizedText('Entidade parceira com trabalho ambiental.'),
    logoTone: index % 2 ? 'dark' : 'light',
    logo: {
      _type: 'image',
      asset: {
        _type: 'reference',
        _ref: imageRef(`partnerlogo${index + 1}`, '640x320'),
      },
      alt: localizedString(`Logótipo do Parceiro ${index + 1}`),
    },
  }))

const galleryItems = (prefix: string): BuilderMedia[] => [
  imageMedia(`${prefix}-image`, 'Imagem da galeria', '1400x1000'),
  videoMedia(`${prefix}-video`, 'Vídeo da galeria'),
  youtubeMedia(`${prefix}-youtube`, 'Vídeo YouTube da galeria'),
]

const heroSection = (key: string, variant: string): BuilderSection => ({
  ...baseSection('builderHeroSection', key, `Destaque ${variant}`, 'deep'),
  variant,
  minHeight: 560,
  media: imageMedia(`${key}-media`, `Imagem do destaque ${variant}`, '1600x1000'),
  actions: [action(`${key}-primary`, 'Ação principal'), action(`${key}-secondary`, 'Ação secundária', 'secondary')],
})

const mediaSection = (key: string, mediaSide: string): BuilderSection => ({
  ...baseSection('builderMediaSection', key, `Imagem ${mediaSide}`, 'fog'),
  mediaSide,
  media: imageMedia(`${key}-media`, `Imagem colocada ${mediaSide}`, '1200x900'),
  actions: [action(`${key}-action`, 'Ver detalhes', 'text')],
})

const gallerySection = (key: string, presentation: string, columns = 3): BuilderSection => ({
  ...baseSection('builderGallerySection', key, `Galeria ${presentation}`, 'white'),
  presentation,
  items: galleryItems(key),
  layout: layout('white', 'wide', columns),
})

const cardSection = (key: string, columns = 4): BuilderSection => ({
  ...baseSection('builderCardsSection', key, `Cartões em ${columns} colunas`, 'fog'),
  items: cards(),
  cardStyle: 'outlined',
  layout: layout('fog', 'wide', columns),
})

const collectionSection = (
  key: string,
  source: NonNullable<BuilderSection['source']>,
): BuilderSection => ({
  ...baseSection('builderCollectionSection', key, `Lista de ${source}`, 'fog'),
  source,
  limit: 3,
  showSearch: false,
  showPagination: false,
  layout: layout('fog', 'wide', 3),
})

const contactSection = (
  key: string,
  formKind: NonNullable<BuilderSection['formKind']>,
): BuilderSection => ({
  ...baseSection('builderContactSection', key, `Contacto ${formKind}`, 'mint'),
  formKind,
  showContactDetails: true,
})

const typographySections = (): BuilderSection[] => {
  const textWithConflictingAppearance = (
    value: string,
    type: 'localizedString' | 'localizedText',
  ): LocalizedValue => ({
    ...(type === 'localizedString' ? localizedString(value) : localizedText(value)),
    // Deliberately conflict with the section controls. Older migrated content
    // can still carry these fields, and the dedicated section typography must
    // win once the client makes a choice there.
    fontFamily: 'arial',
    fontSize: 18,
    fontSizeTablet: 18,
    fontSizeMobile: 18,
    fontWeight: '400',
    textAlign: 'left',
  })
  const title = (value: string) => textWithConflictingAppearance(value, 'localizedString')
  const body = (value: string) => textWithConflictingAppearance(value, 'localizedText')
  const titleStyle: BuilderTypography = {
    ...typography('title', 'center'),
    fontFamily: 'georgia',
    fontSize: {desktop: 64, tablet: 52, mobile: 40},
    fontWeight: '700',
  }
  const bodyStyle: BuilderTypography = {
    ...typography('body', 'right'),
    fontFamily: 'times-new-roman',
    fontSize: {desktop: 21, tablet: 20, mobile: 18},
    fontWeight: '700',
  }
  const partnersWithTextAppearance = () =>
    partners().map((partner, index) =>
      index
        ? partner
        : {
            ...partner,
            text: {
              ...localizedText('Descricao de parceiro formatada'),
              fontFamily: 'georgia',
              fontSize: 16,
              fontWeight: '700',
              fontStyle: 'italic',
              textAlign: 'right',
            },
          },
    )
  const styled = (
    section: BuilderSection,
    heading: string,
    options: {body?: boolean} = {},
  ): BuilderSection => ({
    ...section,
    title: title(heading),
    titleStyle,
    ...(options.body === false
      ? {}
      : {
          body: body(`Texto formatado em ${heading.toLowerCase()}`),
          bodyStyle,
        }),
  })

  return [
    styled(heroSection('typography-hero', 'split'), 'Tipografia no destaque'),
    styled(mediaSection('typography-media', 'right'), 'Tipografia com imagem'),
    styled(
      {
        ...baseSection('builderRichTextSection', 'typography-rich-text', 'Tipografia editorial', 'white'),
        body: articleBody,
      },
      'Tipografia editorial',
      {body: false},
    ),
    styled(gallerySection('typography-gallery', 'gallery'), 'Tipografia na galeria'),
    styled(cardSection('typography-cards'), 'Tipografia nos cartoes'),
    styled(
      {
        ...baseSection('builderStatsSection', 'typography-stats', 'Tipografia nos numeros', 'deep'),
        items: stats(),
        layout: layout('deep', 'wide', 4),
      },
      'Tipografia nos numeros',
    ),
    styled(
      collectionSection('typography-collection', 'productCategory'),
      'Tipografia na lista',
    ),
    styled(
      {
        ...baseSection('builderPartnersSection', 'typography-partners', 'Tipografia em parceiros', 'white'),
        items: partnersWithTextAppearance(),
        layout: layout('white', 'wide', 4),
      },
      'Tipografia em parceiros',
    ),
    styled(
      {
        ...baseSection('builderCtaSection', 'typography-cta', 'Tipografia na chamada', 'fog'),
        actions: [action('typography-cta-action', 'Continuar')],
      },
      'Tipografia na chamada',
    ),
    styled(contactSection('typography-contact', 'contact'), 'Tipografia no contacto'),
    styled(
      {
        ...mediaSection('typography-product-feature', 'left'),
        variant: 'product-feature',
      },
      'Tipografia no produto',
    ),
    styled(
      {
        ...collectionSection('typography-landing-collection', 'productCategory'),
        variant: 'landing-solutions',
      },
      'Tipografia na lista inicial',
      {body: false},
    ),
    styled(
      {
        ...collectionSection('typography-landing-work', 'caseStudy'),
        variant: 'landing-work',
      },
      'Tipografia nos casos iniciais',
      {body: false},
    ),
    styled(
      {
        ...baseSection('builderStatsSection', 'typography-landing-impact', 'Tipografia no impacto', 'deep'),
        variant: 'landing-impact',
        items: stats(),
        layout: layout('deep', 'wide', 4),
      },
      'Tipografia no impacto',
      {body: false},
    ),
    styled(
      {
        ...baseSection('builderPartnersSection', 'typography-landing-partners', 'Tipografia nos parceiros iniciais', 'white'),
        variant: 'landing-partners',
        items: partnersWithTextAppearance(),
        layout: layout('white', 'wide', 4),
      },
      'Tipografia nos parceiros iniciais',
    ),
    {
      ...baseSection('builderCardsSection', 'typography-nested-text', 'Tipografia em texto interno', 'fog'),
      title: localizedString('Texto interno'),
      body: localizedText('Campos internos usam a sua propria formatacao.'),
      cardStyle: 'outlined',
      layout: layout('fog', 'wide', 1),
      items: [
        {
          ...cards()[0],
          _key: 'typography-nested-card',
          eyebrow: {
            ...localizedString('Etiqueta interna'),
            fontFamily: 'georgia',
            fontSize: 17,
            fontWeight: '700',
            textAlign: 'right',
          },
          title: {
            ...localizedString('Cartao interno'),
            fontFamily: 'times-new-roman',
            fontSize: 28,
            fontWeight: '700',
            textAlign: 'center',
          },
          body: {
            ...localizedText('Texto interno formatado'),
            fontFamily: 'georgia',
            fontSize: 19,
            fontStyle: 'italic',
            textAlign: 'right',
          },
        },
      ],
    },
  ]
}

const completeSections = (): BuilderSection[] => [
  heroSection('type-hero', 'split'),
  mediaSection('type-media', 'right'),
  {
    ...baseSection('builderRichTextSection', 'type-rich-text', 'Texto editorial', 'white'),
    body: articleBody,
  },
  gallerySection('type-gallery', 'gallery'),
  cardSection('type-cards'),
  {
    ...baseSection('builderStatsSection', 'type-stats', 'Resultados em números', 'deep'),
    items: stats(),
    layout: layout('deep', 'wide', 4),
  },
  collectionSection('type-collection', 'productCategory'),
  {
    ...baseSection('builderPartnersSection', 'type-partners', 'Parceiros e projetos', 'white'),
    items: partners(),
    layout: layout('white', 'wide', 4),
  },
  {
    ...baseSection('builderCtaSection', 'type-cta', 'Vamos avançar com o projeto', 'blue'),
    actions: [
      action('type-cta-primary', 'Falar connosco'),
      action('type-cta-secondary', 'Ver produtos', 'secondary'),
      action('type-cta-text', 'Ler mais', 'text'),
    ],
  },
  contactSection('type-contact', 'contact'),
]

const optionSections = (group: string): BuilderSection[] => {
  if (group === 'hero') {
    return ['split', 'overlay', 'editorial', 'media-first'].map((variant) =>
      heroSection(`hero-${variant}`, variant),
    )
  }

  if (group === 'media') {
    return ['left', 'right', 'top', 'bottom'].map((side) =>
      mediaSection(`media-${side}`, side),
    )
  }

  if (group === 'gallery') {
    return ['gallery', 'grid', 'rail'].map((presentation) =>
      gallerySection(`gallery-${presentation}`, presentation),
    )
  }

  if (group === 'columns') {
    return [1, 2, 3, 4].map((columns) => cardSection(`columns-${columns}`, columns))
  }

  if (group === 'collection') {
    return (['productCategory', 'storeProduct', 'caseStudy', 'blogPost'] as const).map((source) =>
      collectionSection(`collection-${source}`, source),
    )
  }

  if (group === 'contact') {
    return (['contact', 'quote', 'catalogue'] as const).map((kind) =>
      contactSection(`contact-${kind}`, kind),
    )
  }

  if (group === 'alignment') {
    return (['left', 'center', 'right'] as const).map((align) => ({
      ...baseSection('builderCtaSection', `alignment-${align}`, `Título alinhado à ${align}`, 'deep'),
      titleStyle: typography('title', align),
      bodyStyle: typography('body', align),
      actions: [action(`alignment-${align}-action`, 'Botão de exemplo')],
    }))
  }

  if (group === 'typography') return typographySections()

  if (group === 'layout') {
    const widths = (['narrow', 'content', 'wide', 'full'] as const).map((width) => ({
      ...baseSection('builderCtaSection', `width-${width}`, `Largura ${width}`, 'fog'),
      layout: layout('fog', width),
      actions: [action(`width-${width}-action`, 'Continuar')],
    }))
    const surfaces = (['white', 'fog', 'mint', 'deep', 'blue', 'transparent'] as const).map(
      (surface) => ({
        ...baseSection('builderCtaSection', `surface-${surface}`, `Fundo ${surface}`, surface),
        actions: [action(`surface-${surface}-action`, 'Continuar')],
      }),
    )
    const spacings = [
      ['compact', 40],
      ['normal', 64],
      ['wide', 96],
    ] as const
    return [
      ...widths,
      ...surfaces,
      ...spacings.map(([name, amount]) => ({
        ...baseSection('builderCtaSection', `spacing-${name}`, `Espaçamento ${name}`, 'white'),
        layout: layout('white', 'wide', 3, amount),
        actions: [action(`spacing-${name}-action`, 'Continuar')],
      })),
    ]
  }

  return completeSections()
}

export const sectionFixturePage = (group = 'types') => ({
  _id: `sitePage.section-fixture-${group}`,
  _type: 'sitePage',
  _createdAt: timestamp,
  _updatedAt: timestamp,
  _rev: `fixture-sections-${group}-1`,
  editorVersion: 1,
  title: `Matriz de secções: ${group}`,
  route: `/matriz-seccoes/${group}`,
  active: true,
  sections: group === 'types' ? completeSections() : optionSections(group),
})

export const managedSectionFixture = () => ({
  page: {
    _id: 'sitePage.managed-section-fixture',
    _type: 'sitePage',
    _createdAt: timestamp,
    _updatedAt: timestamp,
    _rev: 'fixture-managed-sections-1',
    editorVersion: 1,
    title: 'Matriz de composição gerida',
    route: '/matriz-seccoes/managed',
    active: true,
    sections: [
      mediaSection('managed-before', 'top'),
      {
        _type: 'builderManagedSection',
        _key: 'managed-fixture-core',
        component: 'productDetailCore',
        internalLabel: 'Conteúdo principal',
        enabled: true,
      },
      gallerySection('managed-after-gallery', 'gallery'),
    ],
  },
  core: {
    component: 'productDetailCore' as const,
    key: 'managed-fixture-core',
    label: 'Conteúdo principal',
    description: 'Área principal entre secções editáveis',
    panelIds: ['content'],
  },
})

import type {
  BuilderLayout,
  BuilderPage,
  BuilderSection,
  BuilderSectionType,
  BuilderSiteSettings,
} from './types'

export const createBuilderKey = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 16)
  }

  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 9)}`
}

export const builderSectionDefinitions: Array<{
  type: BuilderSectionType
  title: string
  description: string
}> = [
  {
    type: 'builderHeroSection',
    title: 'Destaque principal',
    description: 'Abertura forte com texto, ações e imagem ou vídeo.',
  },
  {
    type: 'builderRichTextSection',
    title: 'Texto editorial',
    description: 'Conteúdo longo com títulos, listas, imagens e tabelas.',
  },
  {
    type: 'builderMediaSection',
    title: 'Texto com media',
    description: 'Texto ao lado de uma imagem ou vídeo.',
  },
  {
    type: 'builderGallerySection',
    title: 'Galeria',
    description: 'Conjunto de imagens e vídeos.',
  },
  {
    type: 'builderCardsSection',
    title: 'Cartões',
    description: 'Conteúdo repetido numa grelha organizada.',
  },
  {
    type: 'builderStatsSection',
    title: 'Números de impacto',
    description: 'Valores e indicadores com contexto.',
  },
  {
    type: 'builderCollectionSection',
    title: 'Lista automática',
    description: 'Produtos, loja, casos ou artigos vindos do CMS.',
  },
  {
    type: 'builderPartnersSection',
    title: 'Parceiros',
    description: 'Logótipos, projetos e ligações de parceiros.',
  },
  {
    type: 'builderCtaSection',
    title: 'Chamada para ação',
    description: 'Mensagem curta com um ou mais botões.',
  },
  {
    type: 'builderContactSection',
    title: 'Bloco de contacto',
    description: 'Encaminha para contacto, orçamento ou pedido de catálogo.',
  },
]

export const builderSectionTitle = (type: BuilderSectionType) =>
  builderSectionDefinitions.find((item) => item.type === type)?.title ?? 'Secção'

const defaultLayout = (surface: BuilderLayout['surface'] = 'fog'): BuilderLayout => ({
  _type: 'builderLayout',
  width: 'wide',
  columns: 1,
  mobileColumns: 1,
  gap: 24,
  surface,
  verticalAlign: 'center',
  reverseOnMobile: false,
  spacing: {_type: 'builderSpacing', top: 64, bottom: 64, sides: 24},
})

const shortText = (value = '') => ({_type: 'localizedString' as const, pt: value})
const longText = (value = '') => ({_type: 'localizedText' as const, pt: value})

export const createBuilderSection = (type: BuilderSectionType): BuilderSection => {
  if (type === 'builderManagedSection') {
    throw new Error('As áreas principais são criadas pela página e não podem ser adicionadas.')
  }

  const base: BuilderSection = {
    _type: type,
    _key: createBuilderKey(),
    internalLabel: builderSectionTitle(type),
    enabled: true,
    layout: defaultLayout(),
  }

  if (type === 'builderHeroSection') {
    return {
      ...base,
      title: shortText('Título principal da página'),
      body: longText('Explique a proposta desta página de forma clara e direta.'),
      titleStyle: {
        _type: 'builderTypography',
        fontFamily: 'inherit',
        fontSize: {desktop: 64, tablet: 52, mobile: 40},
        fontWeight: '700',
        align: 'inherit',
        lineHeight: 1.02,
        color: 'inherit',
        maxWidth: 20,
      },
      bodyStyle: {
        _type: 'builderTypography',
        fontFamily: 'inherit',
        fontSize: {desktop: 20, tablet: 19, mobile: 18},
        fontWeight: '400',
        lineHeight: 1.5,
        maxWidth: 46,
      },
      variant: 'split',
      minHeight: 640,
      media: {
        _type: 'builderMedia',
        kind: 'image',
        fit: 'cover',
        position: 'center',
        alt: shortText(),
      },
      layout: defaultLayout('deep'),
      actions: [],
    }
  }

  if (type === 'builderRichTextSection') {
    return {
      ...base,
      title: shortText('Novo conteúdo'),
      body: {_type: 'localizedArticle', pt: []},
    }
  }

  if (type === 'builderMediaSection') {
    return {
      ...base,
      title: shortText('Texto com imagem ou vídeo'),
      body: longText('Descreva o conteúdo e o valor desta secção.'),
      mediaSide: 'right',
      media: {
        _type: 'builderMedia',
        kind: 'image',
        fit: 'contain',
        position: 'center',
        alt: shortText(),
      },
    }
  }

  if (type === 'builderGallerySection') {
    return {
      ...base,
      title: shortText('Galeria'),
      body: longText(),
      items: [],
      presentation: 'gallery',
      layout: {...defaultLayout('white'), columns: 3},
    }
  }

  if (type === 'builderCardsSection') {
    return {
      ...base,
      title: shortText('Conteúdo em destaque'),
      body: longText(),
      items: [],
      cardStyle: 'outlined',
      layout: {...defaultLayout('fog'), columns: 3, mobileColumns: 1},
    }
  }

  if (type === 'builderStatsSection') {
    return {
      ...base,
      title: shortText('Impacto em números'),
      body: longText(),
      items: [],
      layout: {...defaultLayout('deep'), columns: 4, mobileColumns: 2},
    }
  }

  if (type === 'builderCollectionSection') {
    return {
      ...base,
      title: shortText('Conteúdo recente'),
      body: longText(),
      source: 'productCategory',
      limit: 6,
      layout: {...defaultLayout('fog'), columns: 3, mobileColumns: 1},
    }
  }

  if (type === 'builderPartnersSection') {
    return {
      ...base,
      title: shortText('Parceiros e projetos'),
      body: longText(),
      items: [],
      layout: {...defaultLayout('white'), columns: 4, mobileColumns: 2},
    }
  }

  if (type === 'builderCtaSection') {
    return {
      ...base,
      title: shortText('Vamos falar sobre o seu projeto'),
      body: longText('Diga-nos o que precisa e ajudamos a encontrar a solução certa.'),
      actions: [],
      layout: defaultLayout('deep'),
    }
  }

  return {
    ...base,
    title: shortText('Fale connosco'),
    body: longText('Envie os dados essenciais. A equipa responde com o próximo passo.'),
    formKind: 'contact',
    showContactDetails: true,
  }
}

export const createBuilderPage = (pageNumber = 1): BuilderPage => {
  const publishedId = `builderPage-${createBuilderKey()}`
  const now = new Date().toISOString()
  return {
    _id: `drafts.${publishedId}`,
    _type: 'builderPage',
    _createdAt: now,
    _updatedAt: now,
    _rev: '',
    builderVersion: 1,
    title: pageNumber === 1 ? 'Página inicial' : `Nova página ${pageNumber}`,
    route: pageNumber === 1 ? '/' : `/nova-pagina-${pageNumber}`,
    pageKind: pageNumber === 1 ? 'home' : 'standard',
    active: true,
    sections: [createBuilderSection('builderHeroSection')],
    seo: {
      _type: 'builderSeo',
      title: shortText(),
      description: longText(),
      noIndex: pageNumber !== 1,
    },
  }
}

export const createBuilderSiteSettings = (): BuilderSiteSettings => {
  const now = new Date().toISOString()
  return {
    _id: 'drafts.builderSiteSettings',
    _type: 'builderSiteSettings',
    _createdAt: now,
    _updatedAt: now,
    _rev: '',
    builderVersion: 1,
    navigation: [],
    accountLabel: shortText('Conta'),
    cartLabel: shortText('Carrinho'),
    contactLabel: shortText('Contacto'),
    theme: {
      headingFont: 'space-grotesk',
      bodyFont: 'space-grotesk',
      textColor: '#10231f',
      mutedColor: '#49605a',
      deepColor: '#073f45',
      greenColor: '#2f8b69',
      blueColor: '#17657a',
      yellowColor: '#d7bd35',
      fogColor: '#eef7f3',
      mintColor: '#dcefe7',
      radius: 6,
      motion: 'balanced',
    },
    rendererMode: 'legacy',
  }
}

const cloneWithFreshKeys = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(cloneWithFreshKeys)
  if (!value || typeof value !== 'object') return value

  const next: Record<string, unknown> = {}
  for (const [key, child] of Object.entries(value)) {
    next[key] = key === '_key' ? createBuilderKey() : cloneWithFreshKeys(child)
  }
  return next
}

export const duplicateBuilderSection = (section: BuilderSection): BuilderSection => {
  const clone = cloneWithFreshKeys(section) as BuilderSection
  clone._key = createBuilderKey()
  clone.internalLabel = `${section.internalLabel || builderSectionTitle(section._type)} (cópia)`
  return clone
}

import {defineArrayMember, defineField, defineType} from 'sanity'

const localizedStringField = (name: string, title: string, description?: string) =>
  defineField({name, title, description, type: 'localizedString'})

const localizedTextField = (name: string, title: string, description?: string) =>
  defineField({name, title, description, type: 'localizedText'})

const commonSectionFields = () => [
  defineField({
    name: 'internalLabel',
    title: 'Nome no editor',
    description: 'Ajuda a reconhecer esta secção. Não aparece no site.',
    type: 'string',
  }),
  defineField({
    name: 'anchor',
    title: 'Âncora',
    description: 'Opcional. Permite ligar diretamente a esta secção.',
    type: 'string',
    validation: (Rule) =>
      Rule.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {name: 'âncora', invert: false}).warning(
        'Use letras minúsculas, números e hífen.',
      ),
  }),
  defineField({
    name: 'enabled',
    title: 'Mostrar no site',
    type: 'boolean',
    initialValue: true,
  }),
  defineField({name: 'layout', title: 'Composição', type: 'builderLayout'}),
]

const headingFields = () => [
  localizedStringField('eyebrow', 'Etiqueta'),
  localizedStringField('title', 'Título'),
  localizedTextField('body', 'Texto'),
  defineField({name: 'titleStyle', title: 'Aspeto do título', type: 'builderTypography'}),
  defineField({name: 'bodyStyle', title: 'Aspeto do texto', type: 'builderTypography'}),
]

const actionsField = () =>
  defineField({
    name: 'actions',
    title: 'Botões e ligações',
    type: 'array',
    of: [defineArrayMember({type: 'builderLink'})],
    validation: (Rule) => Rule.max(4),
  })

const sectionPreview = (fallbackTitle: string) => ({
  select: {label: 'internalLabel', title: 'title.pt', enabled: 'enabled'},
  prepare: ({label, title, enabled}: {label?: string; title?: string; enabled?: boolean}) => ({
    title: label || title || fallbackTitle,
    subtitle: enabled === false ? `${fallbackTitle} · oculta` : fallbackTitle,
  }),
})

export const builderHeroSection = defineType({
  name: 'builderHeroSection',
  title: 'Destaque principal',
  type: 'object',
  fields: [
    ...commonSectionFields(),
    ...headingFields(),
    actionsField(),
    defineField({name: 'media', title: 'Imagem ou vídeo', type: 'builderMedia'}),
    defineField({
      name: 'variant',
      title: 'Composição do destaque',
      type: 'string',
      initialValue: 'split',
      options: {
        list: [
          {title: 'Texto e imagem', value: 'split'},
          {title: 'Texto sobre a imagem', value: 'overlay'},
          {title: 'Editorial', value: 'editorial'},
          {title: 'Imagem primeiro', value: 'media-first'},
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'minHeight',
      title: 'Altura mínima',
      type: 'number',
      initialValue: 640,
      validation: (Rule) => Rule.min(320).max(1080),
    }),
  ],
  preview: sectionPreview('Destaque principal'),
})

export const builderRichTextSection = defineType({
  name: 'builderRichTextSection',
  title: 'Texto editorial',
  type: 'object',
  fields: [
    ...commonSectionFields(),
    localizedStringField('eyebrow', 'Etiqueta'),
    localizedStringField('title', 'Título'),
    defineField({name: 'body', title: 'Conteúdo', type: 'localizedArticle'}),
    actionsField(),
    defineField({name: 'titleStyle', title: 'Aspeto do título', type: 'builderTypography'}),
  ],
  preview: sectionPreview('Texto editorial'),
})

export const builderMediaSection = defineType({
  name: 'builderMediaSection',
  title: 'Texto com imagem ou vídeo',
  type: 'object',
  fields: [
    ...commonSectionFields(),
    ...headingFields(),
    actionsField(),
    defineField({name: 'media', title: 'Imagem ou vídeo', type: 'builderMedia'}),
    defineField({
      name: 'mediaSide',
      title: 'Posição no computador',
      type: 'string',
      initialValue: 'right',
      options: {
        list: [
          {title: 'Esquerda', value: 'left'},
          {title: 'Direita', value: 'right'},
          {title: 'Acima', value: 'top'},
          {title: 'Abaixo', value: 'bottom'},
        ],
        layout: 'radio',
      },
    }),
  ],
  preview: sectionPreview('Texto com imagem ou vídeo'),
})

export const builderGallerySection = defineType({
  name: 'builderGallerySection',
  title: 'Galeria',
  type: 'object',
  fields: [
    ...commonSectionFields(),
    ...headingFields(),
    defineField({
      name: 'items',
      title: 'Imagens e vídeos',
      type: 'array',
      of: [defineArrayMember({type: 'builderMedia'})],
      validation: (Rule) => Rule.min(1).max(30),
    }),
    defineField({
      name: 'presentation',
      title: 'Apresentação',
      type: 'string',
      initialValue: 'grid',
      options: {
        list: [
          {title: 'Grelha', value: 'grid'},
          {title: 'Imagem principal e miniaturas', value: 'gallery'},
          {title: 'Faixa horizontal', value: 'rail'},
        ],
        layout: 'radio',
      },
    }),
  ],
  preview: sectionPreview('Galeria'),
})

export const builderCardsSection = defineType({
  name: 'builderCardsSection',
  title: 'Cartões',
  type: 'object',
  fields: [
    ...commonSectionFields(),
    ...headingFields(),
    defineField({
      name: 'items',
      title: 'Cartões',
      type: 'array',
      of: [defineArrayMember({type: 'builderCard'})],
      validation: (Rule) => Rule.min(1).max(16),
    }),
    defineField({
      name: 'cardStyle',
      title: 'Aspeto',
      type: 'string',
      initialValue: 'outlined',
      options: {
        list: [
          {title: 'Contorno', value: 'outlined'},
          {title: 'Plano', value: 'flat'},
          {title: 'Imagem editorial', value: 'editorial'},
        ],
        layout: 'radio',
      },
    }),
  ],
  preview: sectionPreview('Cartões'),
})

export const builderStatsSection = defineType({
  name: 'builderStatsSection',
  title: 'Números de impacto',
  type: 'object',
  fields: [
    ...commonSectionFields(),
    ...headingFields(),
    defineField({
      name: 'items',
      title: 'Números',
      type: 'array',
      of: [defineArrayMember({type: 'builderStat'})],
      validation: (Rule) => Rule.min(1).max(8),
    }),
  ],
  preview: sectionPreview('Números de impacto'),
})

export const builderCollectionSection = defineType({
  name: 'builderCollectionSection',
  title: 'Lista automática',
  type: 'object',
  fields: [
    ...commonSectionFields(),
    ...headingFields(),
    defineField({
      name: 'source',
      title: 'Conteúdo',
      type: 'string',
      initialValue: 'productCategory',
      options: {
        list: [
          {title: 'Produtos', value: 'productCategory'},
          {title: 'Produtos da loja', value: 'storeProduct'},
          {title: 'Casos de estudo', value: 'caseStudy'},
          {title: 'Artigos do blog', value: 'blogPost'},
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'limit',
      title: 'Quantidade',
      type: 'number',
      initialValue: 6,
      validation: (Rule) => Rule.integer().min(1).max(24),
    }),
    defineField({
      name: 'showSearch',
      title: 'Mostrar pesquisa',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'showPagination',
      title: 'Mostrar paginação',
      type: 'boolean',
      initialValue: false,
    }),
    actionsField(),
  ],
  preview: sectionPreview('Lista automática'),
})

export const builderPartnersSection = defineType({
  name: 'builderPartnersSection',
  title: 'Parceiros e projetos',
  type: 'object',
  fields: [
    ...commonSectionFields(),
    ...headingFields(),
    defineField({
      name: 'items',
      title: 'Parceiros',
      type: 'array',
      of: [defineArrayMember({type: 'partnerItem'})],
      validation: (Rule) => Rule.min(1).max(24),
    }),
  ],
  preview: sectionPreview('Parceiros e projetos'),
})

export const builderCtaSection = defineType({
  name: 'builderCtaSection',
  title: 'Chamada para ação',
  type: 'object',
  fields: [
    ...commonSectionFields(),
    ...headingFields(),
    actionsField(),
    defineField({name: 'media', title: 'Imagem ou vídeo de fundo', type: 'builderMedia'}),
  ],
  preview: sectionPreview('Chamada para ação'),
})

export const builderContactSection = defineType({
  name: 'builderContactSection',
  title: 'Formulário de contacto',
  type: 'object',
  fields: [
    ...commonSectionFields(),
    ...headingFields(),
    defineField({
      name: 'formKind',
      title: 'Tipo de formulário',
      type: 'string',
      initialValue: 'contact',
      options: {
        list: [
          {title: 'Contacto geral', value: 'contact'},
          {title: 'Pedido de orçamento', value: 'quote'},
          {title: 'Pedido de catálogo', value: 'catalogue'},
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'showContactDetails',
      title: 'Mostrar email, telefone e redes',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: sectionPreview('Formulário de contacto'),
})

export const builderSectionTypes = [
  builderHeroSection,
  builderRichTextSection,
  builderMediaSection,
  builderGallerySection,
  builderCardsSection,
  builderStatsSection,
  builderCollectionSection,
  builderPartnersSection,
  builderCtaSection,
  builderContactSection,
]

export const builderSectionMembers = builderSectionTypes.map((section) =>
  defineArrayMember({type: section.name}),
)

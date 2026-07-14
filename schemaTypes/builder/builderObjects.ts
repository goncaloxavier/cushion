import {defineArrayMember, defineField, defineType} from 'sanity'

const localizedStringField = (name: string, title: string, description?: string) =>
  defineField({name, title, description, type: 'localizedString'})

const localizedTextField = (name: string, title: string, description?: string) =>
  defineField({name, title, description, type: 'localizedText'})

const responsiveNumberFields = (
  defaults: {desktop: number; tablet: number; mobile: number},
  range: {min: number; max: number},
) => [
  defineField({
    name: 'desktop',
    title: 'Computador',
    type: 'number',
    initialValue: defaults.desktop,
    validation: (Rule) => Rule.min(range.min).max(range.max),
  }),
  defineField({
    name: 'tablet',
    title: 'Tablet',
    type: 'number',
    initialValue: defaults.tablet,
    validation: (Rule) => Rule.min(range.min).max(range.max),
  }),
  defineField({
    name: 'mobile',
    title: 'Telemóvel',
    type: 'number',
    initialValue: defaults.mobile,
    validation: (Rule) => Rule.min(range.min).max(range.max),
  }),
]

export const builderResponsiveFontSize = defineType({
  name: 'builderResponsiveFontSize',
  title: 'Tamanho responsivo',
  type: 'object',
  fields: responsiveNumberFields({desktop: 48, tablet: 40, mobile: 34}, {min: 10, max: 120}),
})

export const builderTypography = defineType({
  name: 'builderTypography',
  title: 'Tipografia',
  type: 'object',
  options: {collapsible: true, collapsed: true},
  fields: [
    defineField({
      name: 'fontFamily',
      title: 'Fonte',
      type: 'string',
      initialValue: 'inherit',
      options: {
        list: [
          {title: 'Tema da página', value: 'inherit'},
          {title: 'Space Grotesk', value: 'space-grotesk'},
          {title: 'Inter', value: 'inter'},
          {title: 'Arial', value: 'arial'},
          {title: 'Georgia', value: 'georgia'},
          {title: 'Times New Roman', value: 'times-new-roman'},
        ],
        layout: 'dropdown',
      },
    }),
    defineField({name: 'fontSize', title: 'Tamanho', type: 'builderResponsiveFontSize'}),
    defineField({
      name: 'fontWeight',
      title: 'Peso',
      type: 'string',
      initialValue: 'inherit',
      options: {
        list: [
          {title: 'Tema da página', value: 'inherit'},
          {title: 'Regular', value: '400'},
          {title: 'Médio', value: '500'},
          {title: 'Semibold', value: '600'},
          {title: 'Negrito', value: '700'},
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'align',
      title: 'Alinhamento',
      type: 'string',
      initialValue: 'inherit',
      options: {
        list: [
          {title: 'Tema da secção', value: 'inherit'},
          {title: 'Esquerda', value: 'left'},
          {title: 'Centro', value: 'center'},
          {title: 'Direita', value: 'right'},
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'lineHeight',
      title: 'Espaço entre linhas',
      type: 'number',
      initialValue: 1.15,
      validation: (Rule) => Rule.min(0.9).max(2).precision(2),
    }),
    defineField({
      name: 'color',
      title: 'Cor',
      type: 'string',
      initialValue: 'inherit',
      options: {
        list: [
          {title: 'Tema da secção', value: 'inherit'},
          {title: 'Texto principal', value: 'text'},
          {title: 'Texto suave', value: 'muted'},
          {title: 'Branco', value: 'white'},
          {title: 'Verde', value: 'green'},
          {title: 'Azul mineral', value: 'blue'},
          {title: 'Amarelo de destaque', value: 'yellow'},
        ],
      },
    }),
    defineField({
      name: 'maxWidth',
      title: 'Largura máxima do texto',
      description: 'Número aproximado de caracteres por linha.',
      type: 'number',
      initialValue: 22,
      validation: (Rule) => Rule.min(10).max(80),
    }),
  ],
})

export const builderSpacing = defineType({
  name: 'builderSpacing',
  title: 'Espaçamento',
  type: 'object',
  options: {columns: 2},
  fields: [
    defineField({
      name: 'top',
      title: 'Acima',
      type: 'number',
      initialValue: 64,
      validation: (Rule) => Rule.min(0).max(240),
    }),
    defineField({
      name: 'bottom',
      title: 'Abaixo',
      type: 'number',
      initialValue: 64,
      validation: (Rule) => Rule.min(0).max(240),
    }),
    defineField({
      name: 'sides',
      title: 'Laterais',
      type: 'number',
      initialValue: 24,
      validation: (Rule) => Rule.min(0).max(120),
    }),
  ],
})

export const builderLayout = defineType({
  name: 'builderLayout',
  title: 'Composição',
  type: 'object',
  options: {collapsible: true, collapsed: true},
  fields: [
    defineField({
      name: 'width',
      title: 'Largura',
      type: 'string',
      initialValue: 'wide',
      options: {
        list: [
          {title: 'Leitura', value: 'narrow'},
          {title: 'Conteúdo', value: 'content'},
          {title: 'Larga', value: 'wide'},
          {title: 'Ecrã completo', value: 'full'},
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'columns',
      title: 'Colunas no computador',
      type: 'number',
      initialValue: 1,
      validation: (Rule) => Rule.integer().min(1).max(4),
    }),
    defineField({
      name: 'mobileColumns',
      title: 'Colunas no telemóvel',
      type: 'number',
      initialValue: 1,
      validation: (Rule) => Rule.integer().min(1).max(2),
    }),
    defineField({
      name: 'gap',
      title: 'Espaço entre elementos',
      type: 'number',
      initialValue: 24,
      validation: (Rule) => Rule.min(0).max(96),
    }),
    defineField({
      name: 'surface',
      title: 'Fundo',
      type: 'string',
      initialValue: 'fog',
      options: {
        list: [
          {title: 'Branco', value: 'white'},
          {title: 'Névoa', value: 'fog'},
          {title: 'Verde claro', value: 'mint'},
          {title: 'Verde profundo', value: 'deep'},
          {title: 'Azul mineral', value: 'blue'},
          {title: 'Transparente', value: 'transparent'},
        ],
      },
    }),
    defineField({
      name: 'verticalAlign',
      title: 'Alinhamento vertical',
      type: 'string',
      initialValue: 'center',
      options: {
        list: [
          {title: 'Topo', value: 'start'},
          {title: 'Centro', value: 'center'},
          {title: 'Base', value: 'end'},
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'reverseOnMobile',
      title: 'Inverter ordem no telemóvel',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({name: 'spacing', title: 'Margens da secção', type: 'builderSpacing'}),
  ],
})

export const builderLink = defineType({
  name: 'builderLink',
  title: 'Botão ou link',
  type: 'object',
  fields: [
    localizedStringField('label', 'Texto'),
    defineField({
      name: 'href',
      title: 'Destino',
      description: 'Página do site, âncora, email, telefone ou link externo.',
      type: 'string',
      validation: (Rule) =>
        Rule.custom((value) => {
          if (!value) return 'Escolha um destino.'
          if (/^(\/|#|https?:\/\/|mailto:|tel:)/.test(value)) return true
          return 'Use /pagina, #secção, https://, mailto: ou tel:.'
        }),
    }),
    defineField({
      name: 'style',
      title: 'Aspeto',
      type: 'string',
      initialValue: 'primary',
      options: {
        list: [
          {title: 'Principal', value: 'primary'},
          {title: 'Secundário', value: 'secondary'},
          {title: 'Só texto', value: 'text'},
        ],
        layout: 'radio',
      },
    }),
    defineField({name: 'newTab', title: 'Abrir num novo separador', type: 'boolean'}),
    localizedStringField(
      'ariaLabel',
      'Descrição acessível',
      'Opcional. Use quando o texto do botão não explica claramente o destino.',
    ),
  ],
  preview: {
    select: {title: 'label.pt', subtitle: 'href'},
    prepare: ({title, subtitle}) => ({title: title || 'Botão sem texto', subtitle}),
  },
})

export const builderMedia = defineType({
  name: 'builderMedia',
  title: 'Imagem ou vídeo',
  type: 'object',
  fields: [
    defineField({
      name: 'kind',
      title: 'Tipo',
      type: 'string',
      initialValue: 'image',
      options: {
        list: [
          {title: 'Imagem', value: 'image'},
          {title: 'Vídeo carregado', value: 'video'},
          {title: 'Vídeo YouTube', value: 'youtube'},
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'image',
      title: 'Imagem',
      type: 'image',
      options: {hotspot: true},
      hidden: ({parent}) => parent?.kind !== 'image',
    }),
    defineField({
      name: 'videoFile',
      title: 'Ficheiro de vídeo',
      type: 'file',
      options: {accept: 'video/*'},
      hidden: ({parent}) => parent?.kind !== 'video',
    }),
    defineField({
      name: 'youtubeUrl',
      title: 'Link do YouTube',
      type: 'url',
      hidden: ({parent}) => parent?.kind !== 'youtube',
      validation: (Rule) => Rule.uri({scheme: ['https']}),
    }),
    localizedStringField(
      'alt',
      'Descrição',
      'Descreva a imagem ou o objetivo do vídeo para leitores de ecrã.',
    ),
    localizedStringField('caption', 'Legenda'),
    defineField({
      name: 'fit',
      title: 'Enquadramento',
      type: 'string',
      initialValue: 'cover',
      options: {
        list: [
          {title: 'Preencher sem esticar', value: 'cover'},
          {title: 'Mostrar tudo', value: 'contain'},
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'position',
      title: 'Foco',
      type: 'string',
      initialValue: 'center',
      options: {
        list: [
          {title: 'Centro', value: 'center'},
          {title: 'Topo', value: 'top'},
          {title: 'Base', value: 'bottom'},
          {title: 'Esquerda', value: 'left'},
          {title: 'Direita', value: 'right'},
        ],
      },
    }),
    defineField({
      name: 'autoplay',
      title: 'Reproduzir automaticamente',
      type: 'boolean',
      initialValue: false,
      hidden: ({parent}) => parent?.kind === 'image',
    }),
    defineField({
      name: 'muted',
      title: 'Sem som',
      type: 'boolean',
      initialValue: true,
      hidden: ({parent}) => parent?.kind === 'image',
      validation: (Rule) =>
        Rule.custom((value, context) => {
          const parent = context.parent as {autoplay?: boolean} | undefined
          return parent?.autoplay && !value ? 'Vídeo automático tem de começar sem som.' : true
        }),
    }),
    defineField({
      name: 'loop',
      title: 'Repetir vídeo',
      type: 'boolean',
      initialValue: false,
      hidden: ({parent}) => parent?.kind === 'image',
    }),
    defineField({
      name: 'controls',
      title: 'Mostrar controlos',
      type: 'boolean',
      initialValue: true,
      hidden: ({parent}) => parent?.kind === 'image',
    }),
  ],
  preview: {
    select: {kind: 'kind', image: 'image', title: 'alt.pt'},
    prepare: ({kind, image, title}) => ({
      title: title || (kind === 'image' ? 'Imagem' : 'Vídeo'),
      subtitle: kind === 'youtube' ? 'YouTube' : kind === 'video' ? 'Vídeo carregado' : 'Imagem',
      media: image,
    }),
  },
})

export const builderCard = defineType({
  name: 'builderCard',
  title: 'Cartão',
  type: 'object',
  fields: [
    localizedStringField('eyebrow', 'Etiqueta'),
    localizedStringField('title', 'Título'),
    localizedTextField('body', 'Texto'),
    defineField({name: 'media', title: 'Imagem ou vídeo', type: 'builderMedia'}),
    defineField({name: 'action', title: 'Ligação', type: 'builderLink'}),
  ],
  preview: {
    select: {title: 'title.pt', subtitle: 'body.pt', media: 'media.image'},
    prepare: ({title, subtitle, media}) => ({title: title || 'Cartão sem título', subtitle, media}),
  },
})

export const builderStat = defineType({
  name: 'builderStat',
  title: 'Número de destaque',
  type: 'object',
  fields: [localizedStringField('value', 'Valor'), localizedStringField('label', 'Explicação')],
  preview: {
    select: {title: 'value.pt', subtitle: 'label.pt'},
  },
})

export const builderNavItem = defineType({
  name: 'builderNavItem',
  title: 'Ligação de navegação',
  type: 'object',
  fields: [
    localizedStringField('label', 'Texto'),
    defineField({
      name: 'href',
      title: 'Destino',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'placement',
      title: 'Onde aparece',
      type: 'string',
      initialValue: 'primary',
      options: {
        list: [
          {title: 'Navegação principal', value: 'primary'},
          {title: 'Ações da conta', value: 'utility'},
          {title: 'Só no rodapé', value: 'footer'},
        ],
      },
    }),
    defineField({
      name: 'visibleDesktop',
      title: 'Mostrar no computador',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'visibleMobile',
      title: 'Mostrar no telemóvel',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({name: 'newTab', title: 'Abrir num novo separador', type: 'boolean'}),
  ],
  preview: {
    select: {title: 'label.pt', subtitle: 'href'},
    prepare: ({title, subtitle}) => ({title: title || 'Ligação sem texto', subtitle}),
  },
})

export const builderFooterColumn = defineType({
  name: 'builderFooterColumn',
  title: 'Coluna do rodapé',
  type: 'object',
  fields: [
    localizedStringField('title', 'Título'),
    defineField({
      name: 'links',
      title: 'Ligações',
      type: 'array',
      of: [defineArrayMember({type: 'builderLink'})],
    }),
  ],
  preview: {
    select: {title: 'title.pt', links: 'links'},
    prepare: ({title, links}) => ({
      title: title || 'Coluna sem título',
      subtitle: `${Array.isArray(links) ? links.length : 0} ligações`,
    }),
  },
})

export const builderSeo = defineType({
  name: 'builderSeo',
  title: 'Pesquisa e partilha',
  type: 'object',
  options: {collapsible: true, collapsed: true},
  fields: [
    localizedStringField('title', 'Título SEO', 'Idealmente entre 30 e 60 caracteres.'),
    localizedTextField('description', 'Descrição SEO', 'Idealmente entre 120 e 160 caracteres.'),
    defineField({
      name: 'shareImage',
      title: 'Imagem de partilha',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({name: 'noIndex', title: 'Não mostrar nos motores de pesquisa', type: 'boolean'}),
  ],
})

export const builderObjectTypes = [
  builderResponsiveFontSize,
  builderTypography,
  builderSpacing,
  builderLayout,
  builderLink,
  builderMedia,
  builderCard,
  builderStat,
  builderNavItem,
  builderFooterColumn,
  builderSeo,
]

import {defineArrayMember, defineField, defineType} from 'sanity'

const articleBlocks = [
  defineArrayMember({
    type: 'block',
    styles: [
      {title: 'Parágrafo', value: 'normal'},
      {title: 'Título de secção', value: 'h2'},
      {title: 'Subtítulo', value: 'h3'},
      {title: 'Citação', value: 'blockquote'},
    ],
    lists: [
      {title: 'Lista com marcadores', value: 'bullet'},
      {title: 'Lista numerada', value: 'number'},
    ],
    marks: {
      decorators: [
        {title: 'Negrito', value: 'strong'},
        {title: 'Itálico', value: 'em'},
      ],
      annotations: [
        defineArrayMember({
          name: 'link',
          title: 'Link',
          type: 'object',
          fields: [
            defineField({
              name: 'href',
              title: 'URL',
              type: 'url',
              validation: (Rule) =>
                Rule.uri({
                  allowRelative: true,
                  scheme: ['http', 'https', 'mailto', 'tel'],
                }),
            }),
          ],
        }),
      ],
    },
  }),
  defineArrayMember({
    type: 'image',
    title: 'Imagem no artigo',
    description: 'Imagem inserida no corpo do artigo. No site aparece inteira, sem corte.',
    options: {hotspot: false},
    fields: [
      defineField({
        name: 'alt',
        title: 'Descrição alternativa',
        description: 'Texto curto para acessibilidade. Diga o que aparece na imagem.',
        type: 'string',
      }),
      defineField({
        name: 'caption',
        title: 'Legenda',
        type: 'text',
        rows: 2,
      }),
    ],
  }),
  defineArrayMember({
    name: 'youtubeEmbed',
    title: 'Vídeo YouTube',
    type: 'object',
    fields: [
      defineField({
        name: 'url',
        title: 'Link do YouTube',
        type: 'url',
        validation: (Rule) => Rule.uri({scheme: ['https']}),
      }),
      defineField({
        name: 'title',
        title: 'Título acessível',
        description: 'Usado por leitores de ecrã e no iframe.',
        type: 'string',
      }),
      defineField({
        name: 'caption',
        title: 'Legenda',
        type: 'text',
        rows: 2,
      }),
    ],
    preview: {
      select: {
        title: 'title',
        subtitle: 'url',
      },
      prepare: ({title, subtitle}) => ({
        title: title || 'Vídeo YouTube',
        subtitle,
      }),
    },
  }),
  defineArrayMember({
    name: 'articleTable',
    title: 'Tabela',
    type: 'object',
    fields: [
      defineField({
        name: 'columns',
        title: 'Cabeçalhos',
        description: 'Use a mesma quantidade de células em cada linha.',
        type: 'array',
        of: [defineArrayMember({type: 'string'})],
        validation: (Rule) => Rule.min(1).max(6),
      }),
      defineField({
        name: 'rows',
        title: 'Linhas',
        type: 'array',
        of: [
          defineArrayMember({
            name: 'articleTableRow',
            title: 'Linha',
            type: 'object',
            fields: [
              defineField({
                name: 'cells',
                title: 'Células',
                type: 'array',
                of: [defineArrayMember({type: 'text', rows: 2})],
              }),
            ],
            preview: {
              select: {
                cells: 'cells',
              },
              prepare: ({cells}) => ({
                title: Array.isArray(cells) ? cells.filter(Boolean).join(' | ') : 'Linha',
              }),
            },
          }),
        ],
      }),
    ],
    preview: {
      select: {
        columns: 'columns',
        rows: 'rows',
      },
      prepare: ({columns, rows}) => ({
        title: 'Tabela',
        subtitle: `${Array.isArray(columns) ? columns.length : 0} colunas, ${
          Array.isArray(rows) ? rows.length : 0
        } linhas`,
      }),
    },
  }),
]

const localizedArticleField = (name: 'pt' | 'en' | 'es', title: string) =>
  defineField({
    name,
    title,
    type: 'array',
    of: articleBlocks,
  })

export const localizedArticle = defineType({
  name: 'localizedArticle',
  title: 'Artigo estruturado em vários idiomas',
  type: 'object',
  fields: [
    localizedArticleField('pt', 'Português'),
    localizedArticleField('en', 'Inglês'),
    localizedArticleField('es', 'Espanhol'),
  ],
})

import {defineField, defineType} from 'sanity'

export const blogPost = defineType({
  name: 'blogPost',
  title: 'Artigo do blog',
  type: 'document',
  groups: [
    {name: 'conteudo', title: 'Conteúdo', default: true},
    {name: 'imagem', title: 'Imagem'},
    {name: 'publicacao', title: 'Publicação'},
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Título do artigo',
      description: 'Título público do artigo.',
      type: 'localizedString',
      group: 'conteudo',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Endereço da página',
      description: 'Parte final do URL. Gere a partir do título em Português e evite alterar depois de publicado.',
      type: 'slug',
      group: 'conteudo',
      options: {source: 'title.pt', maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Imagem de capa',
      description: 'Imagem usada na listagem do blog e na página do artigo.',
      type: 'image',
      group: 'imagem',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Descrição da imagem',
          description: 'Texto simples para acessibilidade. Diga o que se vê na imagem.',
          type: 'localizedString',
        }),
      ],
    }),
    defineField({
      name: 'publishedAt',
      title: 'Data de publicação',
      description: 'Data visível no artigo e usada para ordenar a listagem.',
      type: 'date',
      group: 'publicacao',
      initialValue: () => new Date().toISOString().slice(0, 10),
    }),
    defineField({
      name: 'category',
      title: 'Tema',
      description: 'Categoria curta do artigo. Exemplo: Ambiente, Projetos, Materiais.',
      type: 'localizedString',
      group: 'publicacao',
    }),
    defineField({
      name: 'excerpt',
      title: 'Resumo curto',
      description: 'Texto curto para a listagem. Deve explicar porque vale a pena abrir o artigo.',
      type: 'localizedText',
      group: 'conteudo',
    }),
    defineField({
      name: 'body',
      title: 'Texto do artigo',
      description: 'Conteúdo principal do artigo.',
      type: 'localizedText',
      group: 'conteudo',
    }),
  ],
  preview: {
    select: {
      title: 'title.pt',
      subtitle: 'publishedAt',
      media: 'image',
    },
  },
})

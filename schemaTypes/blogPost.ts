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
      description: 'Título público no Blog.',
      type: 'localizedString',
      group: 'conteudo',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Endereço da página',
      description: 'Gere a partir do título e evite alterar depois de publicar.',
      type: 'slug',
      group: 'conteudo',
      options: {source: 'title.pt', maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Imagem de capa',
      description: 'Usada na listagem e na página do artigo.',
      type: 'image',
      group: 'imagem',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Descrição da imagem',
          description: 'Para acessibilidade. Diga o que se vê.',
          type: 'localizedString',
          validation: (Rule) => Rule.required().warning('Adicione uma descrição para leitores de ecrã.'),
        }),
      ],
    }),
    defineField({
      name: 'gallery',
      title: 'Galeria',
      description: 'Imagens adicionais. O site mostra-as sem corte.',
      type: 'array',
      group: 'imagem',
      of: [
        {
          type: 'image',
          options: {hotspot: false},
          fields: [
            defineField({
              name: 'alt',
              title: 'Descrição da imagem',
              description: 'Para acessibilidade. Diga o que se vê.',
              type: 'localizedString',
              validation: (Rule) => Rule.required().warning('Adicione uma descrição para leitores de ecrã.'),
            }),
          ],
        },
      ],
    }),
    defineField({
      name: 'publishedAt',
      title: 'Data de publicação',
      description: 'Visível no artigo e usada na ordenação.',
      type: 'date',
      group: 'publicacao',
      initialValue: () => new Date().toISOString().slice(0, 10),
    }),
    defineField({
      name: 'category',
      title: 'Tema',
      description: 'Exemplo: Ambiente, Projetos ou Materiais.',
      type: 'localizedString',
      group: 'publicacao',
    }),
    defineField({
      name: 'excerpt',
      title: 'Resumo',
      description: 'Texto curto apresentado na listagem.',
      type: 'localizedText',
      group: 'conteudo',
    }),
    defineField({
      name: 'article',
      title: 'Conteúdo do artigo',
      description: 'Use títulos, listas, links, imagens, vídeos e tabelas.',
      type: 'localizedArticle',
      group: 'conteudo',
    }),
    defineField({
      name: 'body',
      title: 'Texto simples (artigos antigos)',
      description: 'Use apenas quando o conteúdo estruturado estiver vazio.',
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

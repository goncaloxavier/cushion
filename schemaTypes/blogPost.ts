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
      description:
        'Parte final do URL. Gere a partir do título em Português e evite alterar depois de publicado.',
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
      name: 'gallery',
      title: 'Galeria do artigo',
      description: 'Imagens extra para a página do artigo. O site mostra-as inteiras, sem corte.',
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
              description: 'Texto simples para acessibilidade.',
              type: 'localizedString',
            }),
          ],
        },
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
      name: 'article',
      title: 'Artigo estruturado',
      description:
        'Campo principal para editar artigos como no site: secções, subtítulos, listas, links, imagens, vídeos e tabelas.',
      type: 'localizedArticle',
      group: 'conteudo',
    }),
    defineField({
      name: 'body',
      title: 'Texto legado do artigo',
      description:
        'Fallback em texto simples usado pela importação antiga. Para artigos novos ou revisões, use o campo estruturado acima.',
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

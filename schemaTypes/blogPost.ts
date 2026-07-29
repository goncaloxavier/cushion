import {defineField, defineType} from 'sanity'
import {videoCaptionsField} from './components/videoCaptionsField'
import {builderSectionMembers} from './builder/builderSections'

export const blogPost = defineType({
  name: 'blogPost',
  title: 'Artigo do blog',
  type: 'document',
  groups: [
    {name: 'conteudo', title: 'Conteúdo', default: true},
    {name: 'imagem', title: 'Imagem'},
    {name: 'seccoes', title: 'Conteúdo da página'},
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
      description: 'Imagens e vídeos adicionais. O site mostra-os sem corte.',
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
        defineField({
          name: 'galleryVideo',
          title: 'Vídeo carregado',
          description: 'Ficheiro de vídeo apresentado na galeria do artigo.',
          type: 'file',
          options: {accept: 'video/mp4,video/webm,video/quicktime'},
          fields: [
            defineField({
              name: 'title',
              title: 'Título do vídeo',
              description: 'Identifica o vídeo no player e para leitores de ecrã.',
              type: 'localizedString',
            }),
            videoCaptionsField(),
            defineField({
              name: 'poster',
              title: 'Imagem de capa',
              description: 'Opcional. Aparece antes da reprodução.',
              type: 'image',
              options: {hotspot: true},
              fields: [
                defineField({
                  name: 'alt',
                  title: 'Descrição da imagem',
                  type: 'localizedString',
                }),
              ],
            }),
          ],
        }),
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
    defineField({
      name: 'sections',
      title: 'Conteúdo da página',
      description:
        'Organize a apresentação atual e acrescente galerias, destaques ou chamadas para ação.',
      type: 'array',
      group: 'seccoes',
      of: builderSectionMembers,
      validation: (Rule) => Rule.max(30),
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

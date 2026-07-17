import {defineField, defineType} from 'sanity'

export const caseStudy = defineType({
  name: 'caseStudy',
  title: 'Caso de estudo',
  type: 'document',
  groups: [
    {name: 'conteudo', title: 'Conteúdo', default: true},
    {name: 'imagens', title: 'Imagens e vídeos'},
    {name: 'organizacao', title: 'Organização'},
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Nome do projeto',
      description: 'Título público do caso.',
      type: 'localizedString',
      group: 'conteudo',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Endereço da página',
      description: 'Gere a partir do nome e evite alterar depois de publicar.',
      type: 'slug',
      group: 'conteudo',
      options: {source: 'title.pt', maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Imagem principal',
      description: 'Usada na listagem e na página do caso.',
      type: 'image',
      group: 'imagens',
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
      description: 'Imagens e vídeos adicionais do projeto.',
      type: 'array',
      group: 'imagens',
      of: [
        {
          type: 'image',
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
        },
        defineField({
          name: 'galleryVideo',
          title: 'Vídeo carregado',
          description: 'Ficheiro de vídeo apresentado na galeria do caso.',
          type: 'file',
          options: {accept: 'video/mp4,video/webm,video/quicktime'},
          fields: [
            defineField({
              name: 'title',
              title: 'Título do vídeo',
              description: 'Identifica o vídeo no player e para leitores de ecrã.',
              type: 'localizedString',
            }),
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
      name: 'location',
      title: 'Localização',
      description: 'Exemplo: Moita ou Torres do Mondego.',
      type: 'string',
      group: 'conteudo',
    }),
    defineField({
      name: 'summary',
      title: 'Resumo',
      description: 'Frase curta sobre o projeto.',
      type: 'localizedText',
      group: 'conteudo',
    }),
    defineField({
      name: 'description',
      title: 'Descrição',
      description: 'Texto principal para um caso simples.',
      type: 'localizedText',
      group: 'conteudo',
    }),
    defineField({
      name: 'challenge',
      title: 'Desafio',
      description: 'Opcional. Problema inicial do espaço.',
      type: 'localizedText',
      group: 'conteudo',
      hidden: true,
    }),
    defineField({
      name: 'solution',
      title: 'Solução',
      description: 'Opcional. O que foi feito.',
      type: 'localizedText',
      group: 'conteudo',
      hidden: true,
    }),
    defineField({
      name: 'result',
      title: 'Resultado',
      description: 'Opcional. Benefício final do projeto.',
      type: 'localizedText',
      group: 'conteudo',
      hidden: true,
    }),
    defineField({
      name: 'orderRank',
      title: 'Ordem de apresentação',
      description: 'O número mais baixo aparece primeiro.',
      type: 'number',
      group: 'organizacao',
      initialValue: 100,
    }),
  ],
  preview: {
    select: {
      title: 'title.pt',
      subtitle: 'location',
      media: 'image',
    },
  },
})

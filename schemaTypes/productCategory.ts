import {defineField, defineType} from 'sanity'

export const productCategory = defineType({
  name: 'productCategory',
  title: 'Produto',
  type: 'document',
  groups: [
    {name: 'conteudo', title: 'Conteúdo', default: true},
    {name: 'imagens', title: 'Imagens'},
    {name: 'organizacao', title: 'Organização'},
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Nome do produto',
      description: 'Nome público da solução.',
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
      description: 'Usada na listagem e na página do produto.',
      type: 'image',
      group: 'imagens',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Descrição da imagem',
          description: 'Para acessibilidade. Diga o que se vê.',
          type: 'localizedString',
          validation: (Rule) =>
            Rule.required().warning('Adicione uma descrição para leitores de ecrã.'),
        }),
      ],
    }),
    defineField({
      name: 'gallery',
      title: 'Galeria',
      description: 'Imagens e vídeos adicionais.',
      type: 'array',
      group: 'imagens',
      of: [
        defineField({
          name: 'galleryImage',
          title: 'Imagem da galeria',
          type: 'image',
          options: {hotspot: true},
          fields: [
            defineField({
              name: 'alt',
              title: 'Descrição da imagem',
              description: 'Para acessibilidade. Diga o que se vê.',
              type: 'localizedString',
              validation: (Rule) =>
                Rule.required().warning('Adicione uma descrição para leitores de ecrã.'),
            }),
          ],
        }),
        defineField({
          name: 'galleryVideo',
          title: 'Vídeo carregado',
          description: 'Ficheiro de vídeo para aparecer na galeria da página do produto.',
          type: 'file',
          options: {
            accept: 'video/mp4,video/webm,video/quicktime',
          },
          fields: [
            defineField({
              name: 'title',
              title: 'Título do vídeo',
              description: 'Identifica o vídeo no player.',
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
                  description: 'Para acessibilidade. Diga o que se vê.',
                  type: 'localizedString',
                  validation: (Rule) =>
                    Rule.required().warning('Adicione uma descrição para leitores de ecrã.'),
                }),
              ],
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'description',
      title: 'Descrição',
      description: 'Texto principal da página.',
      type: 'localizedText',
      group: 'conteudo',
    }),
    defineField({
      name: 'dimensions',
      title: 'Dimensões',
      description: 'Opcional. Medidas disponíveis, uma por linha.',
      type: 'array',
      group: 'conteudo',
      of: [{type: 'localizedString'}],
    }),
    defineField({
      name: 'materials',
      title: 'Materiais',
      description: 'Opcional. Materiais usados, um por linha.',
      type: 'array',
      group: 'conteudo',
      of: [{type: 'localizedString'}],
    }),
    defineField({
      name: 'specifications',
      title: 'Especificações',
      description: 'Opcional. Características técnicas, uma por linha.',
      type: 'array',
      group: 'conteudo',
      of: [{type: 'localizedString'}],
    }),
    defineField({
      name: 'advantages',
      title: 'Vantagens',
      description: 'Opcional. Vantagens do produto, uma por linha.',
      type: 'array',
      group: 'conteudo',
      of: [{type: 'localizedString'}],
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
      subtitle: 'description.pt',
      media: 'image',
    },
  },
})

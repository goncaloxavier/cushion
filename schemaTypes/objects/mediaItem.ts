import {defineField, defineType} from 'sanity'

const localizedStringField = (name: string, title: string, description?: string) =>
  defineField({
    name,
    title,
    description,
    type: 'localizedString',
  })

const localizedTextField = (name: string, title: string, description?: string) =>
  defineField({
    name,
    title,
    description,
    type: 'localizedText',
  })

const imageWithAltField = (name: string, title: string, description?: string) =>
  defineField({
    name,
    title,
    description,
    type: 'image',
    options: {hotspot: true},
    fields: [
      defineField({
        name: 'alt',
        title: 'Descrição da imagem',
        description: 'Texto simples para acessibilidade. Diga o que se vê na imagem.',
        type: 'localizedString',
      }),
    ],
  })

export const mediaItem = defineType({
  name: 'mediaItem',
  title: 'Media: imagem ou vídeo',
  type: 'object',
  fields: [
    defineField({
      name: 'kind',
      title: 'Tipo de media',
      type: 'string',
      initialValue: 'image',
      options: {
        layout: 'radio',
        list: [
          {title: 'Imagem', value: 'image'},
          {title: 'Vídeo YouTube', value: 'youtube'},
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    localizedStringField('title', 'Título curto'),
    localizedTextField('caption', 'Legenda'),
    defineField({
      ...imageWithAltField('image', 'Imagem', 'Usada quando este item é uma imagem.'),
      hidden: ({parent}) => parent?.kind === 'youtube',
    }),
    defineField({
      name: 'youtubeUrl',
      title: 'Link do YouTube',
      description: 'Cole o link normal do YouTube. O website transforma-o num vídeo incorporado.',
      type: 'url',
      hidden: ({parent}) => parent?.kind === 'image',
    }),
    defineField({
      ...imageWithAltField(
        'poster',
        'Imagem de capa opcional',
        'Opcional para vídeos. Se ficar vazio, o website usa a capa do YouTube.',
      ),
      hidden: ({parent}) => parent?.kind === 'image',
    }),
  ],
  preview: {
    select: {
      title: 'title.pt',
      kind: 'kind',
      media: 'image',
    },
    prepare({title, kind, media}) {
      return {
        title: title || 'Media',
        subtitle: kind === 'youtube' ? 'Vídeo YouTube' : 'Imagem',
        media,
      }
    },
  },
})

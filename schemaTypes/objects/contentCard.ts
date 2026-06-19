import {defineField, defineType} from 'sanity'

export const contentCard = defineType({
  name: 'contentCard',
  title: 'Cartão de conteúdo',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Título',
      type: 'localizedString',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'text',
      title: 'Texto',
      type: 'localizedText',
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'title.pt',
      subtitle: 'text.pt',
    },
  },
})

import {defineField, defineType} from 'sanity'

export const contentCard = defineType({
  name: 'contentCard',
  title: 'Content card',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'localizedString',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'text',
      title: 'Text',
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

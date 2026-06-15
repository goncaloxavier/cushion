import {defineField, defineType} from 'sanity'

export const impactStat = defineType({
  name: 'impactStat',
  title: 'Impact stat',
  type: 'object',
  fields: [
    defineField({
      name: 'value',
      title: 'Value',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'label',
      title: 'Label',
      type: 'localizedString',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'note',
      title: 'Note',
      type: 'localizedString',
    }),
  ],
  preview: {
    select: {
      title: 'value',
      subtitle: 'label.pt',
    },
  },
})

import {defineField, defineType} from 'sanity'

export const impactStat = defineType({
  name: 'impactStat',
  title: 'Métrica de impacto',
  type: 'object',
  fields: [
    defineField({
      name: 'value',
      title: 'Valor',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'label',
      title: 'Legenda',
      type: 'localizedString',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'note',
      title: 'Nota',
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

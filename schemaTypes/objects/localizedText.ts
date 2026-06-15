import {defineField, defineType} from 'sanity'

export const localizedText = defineType({
  name: 'localizedText',
  title: 'Localized long text',
  type: 'object',
  fields: [
    defineField({
      name: 'pt',
      title: 'Português',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'en',
      title: 'English',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'es',
      title: 'Español',
      type: 'text',
      rows: 3,
    }),
  ],
})

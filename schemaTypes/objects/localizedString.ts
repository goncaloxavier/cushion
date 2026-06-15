import {defineField, defineType} from 'sanity'

export const localizedString = defineType({
  name: 'localizedString',
  title: 'Localized short text',
  type: 'object',
  fields: [
    defineField({
      name: 'pt',
      title: 'Português',
      type: 'string',
    }),
    defineField({
      name: 'en',
      title: 'English',
      type: 'string',
    }),
    defineField({
      name: 'es',
      title: 'Español',
      type: 'string',
    }),
  ],
})

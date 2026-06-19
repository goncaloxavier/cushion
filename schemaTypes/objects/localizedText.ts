import {defineField, defineType} from 'sanity'

export const localizedText = defineType({
  name: 'localizedText',
  title: 'Texto longo em vários idiomas',
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
      title: 'Inglês',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'es',
      title: 'Espanhol',
      type: 'text',
      rows: 3,
    }),
  ],
})

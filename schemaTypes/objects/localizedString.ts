import {defineField, defineType} from 'sanity'

export const localizedString = defineType({
  name: 'localizedString',
  title: 'Texto curto em vários idiomas',
  type: 'object',
  fields: [
    defineField({
      name: 'pt',
      title: 'Português',
      type: 'string',
    }),
    defineField({
      name: 'en',
      title: 'Inglês',
      type: 'string',
    }),
    defineField({
      name: 'es',
      title: 'Espanhol',
      type: 'string',
    }),
  ],
})

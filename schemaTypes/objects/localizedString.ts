import {defineField, defineType} from 'sanity'

export const localizedString = defineType({
  name: 'localizedString',
  title: 'Texto curto em vários idiomas',
  type: 'object',
  fields: [
    defineField({
      name: 'pt',
      title: 'Português',
      type: 'text',
      rows: 2,
    }),
    defineField({
      name: 'en',
      title: 'Inglês',
      type: 'text',
      rows: 2,
      hidden: true,
      readOnly: true,
    }),
    defineField({
      name: 'es',
      title: 'Espanhol',
      type: 'text',
      rows: 2,
      hidden: true,
      readOnly: true,
    }),
    defineField({
      name: 'translationHash',
      title: 'Hash de tradução (uso interno)',
      description: 'Gerido automaticamente. Não editar.',
      type: 'string',
      hidden: true,
      readOnly: true,
    }),
  ],
})

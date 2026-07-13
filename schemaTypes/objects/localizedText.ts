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
      rows: 4,
    }),
    defineField({
      name: 'en',
      title: 'Inglês',
      type: 'text',
      rows: 4,
      hidden: true,
      readOnly: true,
    }),
    defineField({
      name: 'es',
      title: 'Espanhol',
      type: 'text',
      rows: 4,
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

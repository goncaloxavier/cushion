import {defineField, defineType} from 'sanity'
import {LocalizedTextInput} from '../components/LocalizedTextInput'

const appearanceFields = [
  defineField({name: 'fontFamily', title: 'Fonte', type: 'string', hidden: true}),
  defineField({name: 'fontSize', title: 'Tamanho', type: 'number', hidden: true}),
  defineField({name: 'fontSizeTablet', title: 'Tamanho no tablet', type: 'number', hidden: true}),
  defineField({name: 'fontSizeMobile', title: 'Tamanho no telemóvel', type: 'number', hidden: true}),
  defineField({name: 'fontWeight', title: 'Peso', type: 'string', hidden: true}),
  defineField({name: 'fontStyle', title: 'Estilo', type: 'string', hidden: true}),
  defineField({name: 'textAlign', title: 'Alinhamento', type: 'string', hidden: true}),
  defineField({name: 'lineHeight', title: 'Espaçamento', type: 'string', hidden: true}),
  defineField({name: 'color', title: 'Cor', type: 'string', hidden: true}),
]

export const localizedText = defineType({
  name: 'localizedText',
  title: 'Texto longo em vários idiomas',
  type: 'object',
  components: {input: LocalizedTextInput},
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
    ...appearanceFields,
  ],
})

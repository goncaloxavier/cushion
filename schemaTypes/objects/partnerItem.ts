import {defineField, defineType} from 'sanity'

const localizedTextField = (name: string, title: string, description?: string) =>
  defineField({
    name,
    title,
    description,
    type: 'localizedText',
  })

export const partnerItem = defineType({
  name: 'partnerItem',
  title: 'Parceiro',
  type: 'object',
  fields: [
    defineField({
      name: 'name',
      title: 'Nome',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'url',
      title: 'Link',
      type: 'url',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'logo',
      title: 'Logotipo',
      type: 'image',
      options: {hotspot: false},
      fields: [
        defineField({
          name: 'alt',
          title: 'Descrição da imagem',
          description: 'Texto simples para acessibilidade. Exemplo: Logotipo Eco-Escolas.',
          type: 'localizedString',
        }),
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'logoTone',
      title: 'Fundo do logotipo',
      description: 'Use fundo escuro quando o logotipo for branco ou muito claro.',
      type: 'string',
      initialValue: 'light',
      options: {
        layout: 'radio',
        list: [
          {title: 'Claro', value: 'light'},
          {title: 'Escuro', value: 'dark'},
        ],
      },
    }),
    localizedTextField('text', 'Texto curto', 'Explique a ligação ou o contexto deste parceiro.'),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'url',
      media: 'logo',
    },
  },
})

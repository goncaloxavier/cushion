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
      description: 'Nome público da entidade ou projeto.',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'url',
      title: 'Link',
      description: 'Página oficial da entidade ou projeto.',
      type: 'url',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'logo',
      title: 'Logotipo',
      description: 'Use uma imagem nítida e com margem suficiente.',
      type: 'image',
      options: {hotspot: false},
      fields: [
        defineField({
          name: 'alt',
          title: 'Descrição da imagem',
          description: 'Exemplo: Logotipo Eco-Escolas.',
          type: 'localizedString',
          validation: (Rule) => Rule.required().warning('Adicione uma descrição para leitores de ecrã.'),
        }),
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'logoTone',
      title: 'Fundo do logotipo',
      description: 'Escolha escuro para logotipos brancos ou muito claros.',
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
    localizedTextField('text', 'Descrição', 'Explique a ligação a este parceiro.'),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'url',
      media: 'logo',
    },
  },
})

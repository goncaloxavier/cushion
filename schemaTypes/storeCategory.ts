import {defineField, defineType} from 'sanity'

export const storeCategory = defineType({
  name: 'storeCategory',
  title: 'Categoria da Loja',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Nome da categoria',
      description: 'Nome mostrado nos filtros e nos produtos da Loja.',
      type: 'localizedString',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Identificador',
      description: 'Gere a partir do nome. Evite alterar depois de associar produtos.',
      type: 'slug',
      options: {source: 'title.pt', maxLength: 64},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'orderRank',
      title: 'Ordem de apresentação',
      description: 'O número mais baixo aparece primeiro.',
      type: 'number',
      initialValue: 100,
    }),
  ],
  preview: {
    select: {
      title: 'title.pt',
      slug: 'slug.current',
    },
    prepare({title, slug}) {
      return {
        title: title || 'Categoria sem nome',
        subtitle: slug || 'Sem identificador',
      }
    },
  },
})

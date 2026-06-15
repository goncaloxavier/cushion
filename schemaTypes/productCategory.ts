import {defineField, defineType} from 'sanity'

export const productCategory = defineType({
  name: 'productCategory',
  title: 'Product category',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'localizedString',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {source: 'title.pt', maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Image',
      description: 'Upload the main image used on the product listing and product detail page.',
      type: 'image',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt text',
          description: 'Describe the image for accessibility in Portuguese, English, and Spanish.',
          type: 'localizedString',
        }),
      ],
    }),
    defineField({
      name: 'gallery',
      title: 'Product gallery',
      description: 'Optional extra images for the product detail gallery and zoom view.',
      type: 'array',
      of: [
        {
          type: 'image',
          options: {hotspot: true},
          fields: [
            defineField({
              name: 'alt',
              title: 'Alt text',
              description: 'Describe the image for accessibility in Portuguese, English, and Spanish.',
              type: 'localizedString',
            }),
          ],
        },
      ],
    }),
    defineField({
      name: 'summary',
      title: 'Short summary',
      type: 'localizedText',
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'localizedText',
    }),
    defineField({
      name: 'features',
      title: 'Feature tags',
      type: 'array',
      of: [{type: 'localizedString'}],
    }),
    defineField({
      name: 'applications',
      title: 'Applications',
      type: 'array',
      of: [{type: 'localizedString'}],
    }),
    defineField({
      name: 'orderRank',
      title: 'Sort order',
      type: 'number',
      initialValue: 100,
    }),
  ],
  preview: {
    select: {
      title: 'title.pt',
      subtitle: 'summary.pt',
      media: 'image',
    },
  },
})

import {defineField, defineType} from 'sanity'

export const caseStudy = defineType({
  name: 'caseStudy',
  title: 'Case study',
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
      title: 'Project image',
      description: 'Upload the project image used on the case-study listing and detail page.',
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
      title: 'Project gallery',
      description: 'Optional extra images for the case-study detail gallery and zoom view.',
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
      name: 'location',
      title: 'Location',
      type: 'string',
    }),
    defineField({
      name: 'productArea',
      title: 'Product area',
      type: 'localizedString',
    }),
    defineField({
      name: 'summary',
      title: 'Summary',
      type: 'localizedText',
    }),
    defineField({
      name: 'challenge',
      title: 'Challenge',
      type: 'localizedText',
    }),
    defineField({
      name: 'solution',
      title: 'Solution',
      type: 'localizedText',
    }),
    defineField({
      name: 'result',
      title: 'Result',
      type: 'localizedText',
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
      subtitle: 'location',
      media: 'image',
    },
  },
})

import {defineField, defineType} from 'sanity'

export const siteLanding = defineType({
  name: 'siteLanding',
  title: 'Landing page',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Internal title',
      type: 'string',
      initialValue: 'DaFábrica4You landing page',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'heroEyebrow',
      title: 'Hero eyebrow',
      type: 'localizedString',
    }),
    defineField({
      name: 'heroTitle',
      title: 'Hero title',
      type: 'localizedString',
    }),
    defineField({
      name: 'heroLead',
      title: 'Hero lead',
      type: 'localizedText',
    }),
    defineField({
      name: 'heroPrimaryCta',
      title: 'Hero primary CTA',
      type: 'localizedString',
    }),
    defineField({
      name: 'heroSecondaryCta',
      title: 'Hero secondary CTA',
      type: 'localizedString',
    }),
    defineField({
      name: 'introKicker',
      title: 'Intro kicker',
      type: 'localizedString',
    }),
    defineField({
      name: 'introTitle',
      title: 'Intro title',
      type: 'localizedString',
    }),
    defineField({
      name: 'introBody',
      title: 'Intro body',
      type: 'localizedText',
    }),
    defineField({
      name: 'productsKicker',
      title: 'Products kicker',
      type: 'localizedString',
    }),
    defineField({
      name: 'productsTitle',
      title: 'Products title',
      type: 'localizedString',
    }),
    defineField({
      name: 'productsLead',
      title: 'Products lead',
      type: 'localizedText',
    }),
    defineField({
      name: 'products',
      title: 'Product cards',
      type: 'array',
      of: [{type: 'contentCard'}],
    }),
    defineField({
      name: 'impactKicker',
      title: 'Impact kicker',
      type: 'localizedString',
    }),
    defineField({
      name: 'impactTitle',
      title: 'Impact title',
      type: 'localizedString',
    }),
    defineField({
      name: 'impactLead',
      title: 'Impact lead',
      type: 'localizedText',
    }),
    defineField({
      name: 'impactStats',
      title: 'Impact stats',
      type: 'array',
      of: [{type: 'impactStat'}],
    }),
    defineField({
      name: 'benefitsKicker',
      title: 'Benefits kicker',
      type: 'localizedString',
    }),
    defineField({
      name: 'benefitsTitle',
      title: 'Benefits title',
      type: 'localizedString',
    }),
    defineField({
      name: 'benefits',
      title: 'Benefits',
      type: 'array',
      of: [{type: 'contentCard'}],
    }),
    defineField({
      name: 'processKicker',
      title: 'Process kicker',
      type: 'localizedString',
    }),
    defineField({
      name: 'processTitle',
      title: 'Process title',
      type: 'localizedString',
    }),
    defineField({
      name: 'processSteps',
      title: 'Process steps',
      type: 'array',
      of: [{type: 'contentCard'}],
    }),
    defineField({
      name: 'contactKicker',
      title: 'Contact kicker',
      type: 'localizedString',
    }),
    defineField({
      name: 'contactTitle',
      title: 'Contact title',
      type: 'localizedString',
    }),
    defineField({
      name: 'contactBody',
      title: 'Contact body',
      type: 'localizedText',
    }),
    defineField({
      name: 'contactEmail',
      title: 'Contact email',
      type: 'email',
    }),
    defineField({
      name: 'contactPhone',
      title: 'Contact phone',
      type: 'string',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'heroTitle.pt',
    },
  },
})

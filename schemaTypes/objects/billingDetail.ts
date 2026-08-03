import {defineField, defineType} from 'sanity'

/**
 * A single row of the invoicing details: a label and the value it names.
 *
 * The split is deliberate. The label is localized, because "Capital social"
 * should read "Share capital" in English. The value is a plain string and stays
 * outside the localized shape entirely, because it is a NIF, a certidão code, a
 * registered address — identifiers that mean nothing translated and everything
 * verbatim. Anything the auto-translation pipeline can reach, it will eventually
 * rewrite; the safest way to protect a legal identifier is to keep it somewhere
 * the translator never walks.
 */
export const billingDetail = defineType({
  name: 'billingDetail',
  title: 'Dado de faturação',
  type: 'object',
  fields: [
    defineField({
      name: 'label',
      title: 'Designação',
      description: 'Ex.: NIF, Capital social, Certidão permanente.',
      type: 'localizedString',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'value',
      title: 'Valor',
      description: 'Apresentado tal como escrito, igual em todos os idiomas.',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'label.pt',
      subtitle: 'value',
    },
  },
})

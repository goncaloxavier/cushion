import {defineField, defineType} from 'sanity'

// One downloadable file, used by every surface that offers documents: product
// and store detail pages, and the two listing pages. Sharing the shape keeps
// the editor panel, the renderer and the query identical everywhere — a client
// who learns to attach a datasheet to a product already knows how to attach a
// catalogue to the listing.
export const downloadItem = defineType({
  name: 'downloadItem',
  title: 'Ficheiro',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Nome apresentado',
      description: 'Como o ficheiro aparece no site. Ex.: Ficha técnica do decking',
      type: 'localizedString',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'file',
      title: 'Ficheiro PDF',
      description: 'Apenas PDF, até 20 MB.',
      type: 'file',
      options: {accept: 'application/pdf'},
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {title: 'title.pt', subtitle: 'file.asset.originalFilename'},
    prepare: ({title, subtitle}) => ({
      title: title || 'Ficheiro sem nome',
      subtitle: subtitle || 'Sem ficheiro carregado',
    }),
  },
})

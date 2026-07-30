import {defineField, defineType} from 'sanity'
import {builderSectionMembers} from './builderSections'

const routePattern = /^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*\/)*[a-z0-9]*(?:-[a-z0-9]+)*$/

export const builderPage = defineType({
  name: 'builderPage',
  title: 'Página do construtor',
  type: 'document',
  groups: [
    {name: 'content', title: 'Página', default: true},
    {name: 'seo', title: 'Pesquisa e partilha'},
    {name: 'advanced', title: 'Avançado'},
  ],
  fields: [
    defineField({
      name: 'builderVersion',
      title: 'Versão do construtor',
      type: 'number',
      initialValue: 1,
      readOnly: true,
      hidden: true,
      group: 'advanced',
    }),
    defineField({
      name: 'title',
      title: 'Nome da página',
      description: 'Usado no editor e na navegação. Pode ser alterado sem mudar o endereço.',
      type: 'string',
      validation: (Rule) => Rule.required().min(2).max(80),
      group: 'content',
    }),
    defineField({
      name: 'route',
      title: 'Endereço',
      description: 'Exemplo: /sobre-nos. A página inicial usa apenas /.',
      type: 'string',
      validation: (Rule) =>
        Rule.required().custom((value) =>
          typeof value === 'string' && routePattern.test(value)
            ? true
            : 'Use um endereço como /, /sobre-nos ou /produtos/decking.',
        ),
      group: 'content',
    }),
    defineField({
      name: 'pageKind',
      title: 'Tipo de página',
      type: 'string',
      initialValue: 'standard',
      options: {
        list: [
          {title: 'Página normal', value: 'standard'},
          {title: 'Página inicial', value: 'home'},
          {title: 'Listagem', value: 'listing'},
          {title: 'Detalhe', value: 'detail'},
          {title: 'Contacto', value: 'contact'},
          {title: 'Legal', value: 'legal'},
        ],
      },
      group: 'content',
    }),
    defineField({
      name: 'active',
      title: 'Página ativa',
      description: 'Uma página inativa não é publicada pelo novo renderer.',
      type: 'boolean',
      initialValue: true,
      group: 'content',
    }),
    defineField({
      name: 'sections',
      title: 'Conteúdo da página',
      type: 'array',
      of: builderSectionMembers,
      validation: (Rule) =>
        Rule.custom((sections) => {
          if (!Array.isArray(sections)) return true

          const anchors = sections
            .map((section) =>
              section && typeof section === 'object' && 'anchor' in section
                ? String(section.anchor || '')
                : '',
            )
            .filter(Boolean)
          return anchors.length === new Set(anchors).size
            ? true
            : 'As âncoras têm de ser únicas nesta página.'
        }),
      group: 'content',
    }),
    defineField({name: 'seo', title: 'Pesquisa e partilha', type: 'builderSeo', group: 'seo'}),
    defineField({
      name: 'migrationSource',
      title: 'Origem da migração',
      type: 'string',
      readOnly: true,
      hidden: true,
      group: 'advanced',
    }),
  ],
  orderings: [
    {title: 'Endereço', name: 'routeAsc', by: [{field: 'route', direction: 'asc'}]},
    {title: 'Atualização', name: 'updatedDesc', by: [{field: '_updatedAt', direction: 'desc'}]},
  ],
  preview: {
    select: {title: 'title', route: 'route', active: 'active', sections: 'sections'},
    prepare: ({title, route, active, sections}) => ({
      title: title || 'Página sem nome',
      subtitle: `${route || 'Sem endereço'} · ${Array.isArray(sections) ? sections.length : 0} secções${
        active === false ? ' · inativa' : ''
      }`,
    }),
  },
})

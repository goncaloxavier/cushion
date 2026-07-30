import {defineField, defineType} from 'sanity'
import {builderSectionMembers} from './builder/builderSections'

const routePattern = /^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*\/)*[a-z0-9]+(?:-[a-z0-9]+)*$/

export const sitePage = defineType({
  name: 'sitePage',
  title: 'Página livre',
  type: 'document',
  groups: [
    {name: 'content', title: 'Página', default: true},
    {name: 'seo', title: 'Pesquisa e partilha'},
  ],
  fields: [
    defineField({
      name: 'editorVersion',
      title: 'Versão do editor',
      type: 'number',
      initialValue: 1,
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: 'title',
      title: 'Nome da página',
      description: 'Usado no editor. O texto vive no conteúdo da página.',
      type: 'string',
      validation: (Rule) => Rule.required().min(2).max(80),
      group: 'content',
    }),
    defineField({
      name: 'route',
      title: 'Endereço',
      description: 'Exemplo: /sustentabilidade ou /servicos/consultoria.',
      type: 'string',
      validation: (Rule) =>
        Rule.required().custom((value) =>
          typeof value === 'string' && routePattern.test(value)
            ? true
            : 'Use um endereço como /sustentabilidade ou /servicos/consultoria.',
        ),
      group: 'content',
    }),
    defineField({
      name: 'active',
      title: 'Página visível',
      description: 'Desative para preparar a página sem a mostrar publicamente.',
      type: 'boolean',
      initialValue: true,
      group: 'content',
    }),
    defineField({
      name: 'sections',
      title: 'Conteúdo da página',
      description: 'Adicione secções e arraste para alterar a ordem.',
      type: 'array',
      of: builderSectionMembers,
      group: 'content',
    }),
    defineField({
      name: 'seo',
      title: 'Pesquisa e partilha',
      type: 'builderSeo',
      group: 'seo',
    }),
  ],
  orderings: [
    {title: 'Endereço', name: 'routeAsc', by: [{field: 'route', direction: 'asc'}]},
    {title: 'Atualização', name: 'updatedDesc', by: [{field: '_updatedAt', direction: 'desc'}]},
  ],
  preview: {
    select: {title: 'title', route: 'route', active: 'active'},
    prepare: ({title, route, active}) => ({
      title: title || 'Página sem nome',
      subtitle: `${route || 'Sem endereço'}${active === false ? ' · oculta' : ''}`,
    }),
  },
})

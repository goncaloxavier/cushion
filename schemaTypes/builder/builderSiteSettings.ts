import {defineArrayMember, defineField, defineType} from 'sanity'

const localizedStringField = (name: string, title: string, description?: string) =>
  defineField({name, title, description, type: 'localizedString'})

const colorField = (name: string, title: string, initialValue: string) =>
  defineField({
    name,
    title,
    type: 'string',
    initialValue,
    validation: (Rule) => Rule.regex(/^#[0-9a-fA-F]{6}$/, {name: 'cor hexadecimal'}),
  })

export const builderSiteSettings = defineType({
  name: 'builderSiteSettings',
  title: 'Definições do construtor',
  type: 'document',
  groups: [
    {name: 'navigation', title: 'Navegação', default: true},
    {name: 'footer', title: 'Rodapé'},
    {name: 'theme', title: 'Tema'},
    {name: 'publishing', title: 'Publicação'},
  ],
  fields: [
    defineField({
      name: 'builderVersion',
      title: 'Versão do construtor',
      type: 'number',
      initialValue: 1,
      readOnly: true,
      hidden: true,
    }),
    defineField({
      name: 'logo',
      title: 'Logótipo principal',
      type: 'image',
      options: {hotspot: false},
      group: 'navigation',
    }),
    defineField({
      name: 'logoLight',
      title: 'Logótipo para fundos escuros',
      type: 'image',
      options: {hotspot: false},
      group: 'navigation',
    }),
    localizedStringField('logoAlt', 'Descrição do logótipo', 'Exemplo: DaFábrica4You'),
    defineField({
      name: 'navigation',
      title: 'Ligações do cabeçalho',
      type: 'array',
      of: [defineArrayMember({type: 'builderNavItem'})],
      validation: (Rule) => Rule.max(16),
      group: 'navigation',
    }),
    localizedStringField('accountLabel', 'Texto da conta'),
    localizedStringField('cartLabel', 'Texto do carrinho'),
    localizedStringField('contactLabel', 'Texto do contacto'),
    defineField({
      name: 'footerColumns',
      title: 'Colunas do rodapé',
      type: 'array',
      of: [defineArrayMember({type: 'builderFooterColumn'})],
      validation: (Rule) => Rule.max(5),
      group: 'footer',
    }),
    localizedStringField('copyright', 'Texto legal do rodapé'),
    defineField({
      name: 'theme',
      title: 'Tema visual',
      type: 'object',
      group: 'theme',
      fields: [
        defineField({
          name: 'headingFont',
          title: 'Fonte dos títulos',
          type: 'string',
          initialValue: 'space-grotesk',
          options: {
            list: [
              {title: 'Space Grotesk', value: 'space-grotesk'},
              {title: 'Inter', value: 'inter'},
              {title: 'Arial', value: 'arial'},
              {title: 'Georgia', value: 'georgia'},
              {title: 'Times New Roman', value: 'times-new-roman'},
            ],
          },
        }),
        defineField({
          name: 'bodyFont',
          title: 'Fonte do texto',
          type: 'string',
          initialValue: 'space-grotesk',
          options: {
            list: [
              {title: 'Space Grotesk', value: 'space-grotesk'},
              {title: 'Inter', value: 'inter'},
              {title: 'Arial', value: 'arial'},
              {title: 'Georgia', value: 'georgia'},
              {title: 'Times New Roman', value: 'times-new-roman'},
            ],
          },
        }),
        colorField('textColor', 'Texto principal', '#10231f'),
        colorField('mutedColor', 'Texto secundário', '#49605a'),
        colorField('deepColor', 'Verde profundo', '#073f45'),
        colorField('greenColor', 'Verde de ação', '#2f8b69'),
        colorField('blueColor', 'Azul mineral', '#17657a'),
        colorField('yellowColor', 'Amarelo de destaque', '#d7bd35'),
        colorField('fogColor', 'Fundo névoa', '#eef7f3'),
        colorField('mintColor', 'Fundo verde claro', '#dcefe7'),
        defineField({
          name: 'radius',
          title: 'Raio dos cantos',
          type: 'number',
          initialValue: 6,
          validation: (Rule) => Rule.min(0).max(16),
        }),
        defineField({
          name: 'motion',
          title: 'Movimento',
          type: 'string',
          initialValue: 'balanced',
          options: {
            list: [
              {title: 'Reduzido', value: 'reduced'},
              {title: 'Equilibrado', value: 'balanced'},
              {title: 'Expressivo', value: 'expressive'},
            ],
            layout: 'radio',
          },
        }),
      ],
    }),
    defineField({
      name: 'rendererMode',
      title: 'Renderer público',
      description:
        'Mantenha “Site atual” até todas as páginas do construtor estarem migradas e validadas.',
      type: 'string',
      initialValue: 'legacy',
      options: {
        list: [
          {title: 'Site atual', value: 'legacy'},
          {title: 'Construtor', value: 'builder'},
        ],
        layout: 'radio',
      },
      group: 'publishing',
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    prepare: () => ({title: 'Definições do construtor'}),
  },
})

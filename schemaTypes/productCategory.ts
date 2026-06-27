import {defineField, defineType} from 'sanity'

export const productCategory = defineType({
  name: 'productCategory',
  title: 'Produto',
  type: 'document',
  groups: [
    {name: 'conteudo', title: 'Conteúdo', default: true},
    {name: 'imagens', title: 'Imagens'},
    {name: 'organizacao', title: 'Organização'},
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Nome do produto',
      description: 'Nome visível no site. Preencha primeiro em Português; os outros idiomas podem vir a seguir.',
      type: 'localizedString',
      group: 'conteudo',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Endereço da página',
      description: 'Parte final do URL. Normalmente basta gerar a partir do nome em Português e não mexer depois.',
      type: 'slug',
      group: 'conteudo',
      options: {source: 'title.pt', maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Imagem principal',
      description: 'Imagem usada na listagem de produtos e no topo da página do produto.',
      type: 'image',
      group: 'imagens',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Descrição da imagem',
          description: 'Texto simples para acessibilidade. Exemplo: “Deck em plástico reciclado junto a jardim”.',
          type: 'localizedString',
        }),
      ],
    }),
    defineField({
      name: 'gallery',
      title: 'Galeria do produto',
      description: 'Imagens extra para a página do produto e a vista ampliada.',
      type: 'array',
      group: 'imagens',
      of: [
        {
          type: 'image',
          options: {hotspot: true},
          fields: [
            defineField({
              name: 'alt',
              title: 'Descrição da imagem',
              description: 'Texto simples para acessibilidade.',
              type: 'localizedString',
            }),
          ],
        },
      ],
    }),
    defineField({
      name: 'summary',
      title: 'Resumo curto',
      description: 'Frase curta para a listagem. Deve explicar rapidamente onde o produto é útil.',
      type: 'localizedText',
      group: 'conteudo',
    }),
    defineField({
      name: 'description',
      title: 'Descrição da página',
      description: 'Texto principal da página do produto. Claro, comercial e sem ser demasiado longo.',
      type: 'localizedText',
      group: 'conteudo',
    }),
    defineField({
      name: 'orderRank',
      title: 'Ordem de apresentação',
      description: 'Número mais baixo aparece primeiro na listagem.',
      type: 'number',
      group: 'organizacao',
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

import {defineField, defineType} from 'sanity'

const categoryOptions = [
  {title: 'Bancos', value: 'bancos'},
  {title: 'Mesas e conjuntos', value: 'mesas'},
  {title: 'Cadeiras', value: 'cadeiras'},
  {title: 'Resíduos', value: 'residuos'},
  {title: 'Cultivo', value: 'cultivo'},
]

export const storeProduct = defineType({
  name: 'storeProduct',
  title: 'Produto da loja',
  type: 'document',
  groups: [
    {name: 'conteudo', title: 'Conteúdo', default: true},
    {name: 'precos', title: 'Preços'},
    {name: 'imagens', title: 'Imagens'},
    {name: 'organizacao', title: 'Organização'},
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Nome do produto',
      type: 'localizedString',
      group: 'conteudo',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Endereço da página',
      type: 'slug',
      group: 'conteudo',
      options: {source: 'title.pt', maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Categoria',
      type: 'string',
      group: 'conteudo',
      options: {list: categoryOptions, layout: 'radio'},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'summary',
      title: 'Resumo curto',
      description: 'Frase simples para explicar o produto na Loja.',
      type: 'localizedText',
      group: 'conteudo',
    }),
    defineField({
      name: 'cataloguePage',
      title: 'Página no catálogo PDF',
      type: 'number',
      group: 'conteudo',
    }),
    defineField({
      name: 'image',
      title: 'Imagem principal',
      description:
        'Fotografia principal usada no cartão da Loja e como primeira imagem da página do produto.',
      type: 'image',
      group: 'imagens',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Descrição da imagem',
          type: 'localizedString',
        }),
      ],
    }),
    defineField({
      name: 'gallery',
      title: 'Galeria do produto',
      description:
        'Fotografias adicionais para a página do produto. A imagem principal já aparece primeiro; aqui entram outros ângulos ou detalhes.',
      type: 'array',
      group: 'imagens',
      of: [
        defineField({
          name: 'galleryImage',
          title: 'Imagem da galeria',
          type: 'image',
          options: {hotspot: true},
          fields: [
            defineField({
              name: 'alt',
              title: 'Descrição da imagem',
              type: 'localizedString',
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'variants',
      title: 'Medidas e preços',
      description:
        'Cada linha pode ser uma medida, versão com/sem tampa, ou outra variante comercial.',
      type: 'array',
      group: 'precos',
      of: [
        {
          type: 'object',
          name: 'storeProductVariant',
          title: 'Variante',
          fields: [
            defineField({
              name: 'label',
              title: 'Nome da variante',
              type: 'localizedString',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'dimensions',
              title: 'Dimensões / notas técnicas',
              type: 'array',
              of: [{type: 'localizedString'}],
            }),
            defineField({
              name: 'weightKg',
              title: 'Peso (kg)',
              type: 'number',
            }),
            defineField({
              name: 'priceNatural',
              title: 'Preço Natural/Cinza',
              type: 'number',
              validation: (Rule) => Rule.required().min(0),
            }),
            defineField({
              name: 'priceDark',
              title: 'Preço Castanho/Preto',
              type: 'number',
              validation: (Rule) => Rule.required().min(0),
            }),
            defineField({
              name: 'note',
              title: 'Nota da variante',
              type: 'localizedText',
            }),
          ],
          preview: {
            select: {
              title: 'label.pt',
              priceNatural: 'priceNatural',
              priceDark: 'priceDark',
            },
            prepare({title, priceNatural, priceDark}) {
              return {
                title: title || 'Variante',
                subtitle: `${priceNatural ?? '-'} EUR / ${priceDark ?? '-'} EUR`,
              }
            },
          },
        },
      ],
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'active',
      title: 'Mostrar na Loja',
      type: 'boolean',
      group: 'organizacao',
      initialValue: true,
    }),
    defineField({
      name: 'orderRank',
      title: 'Ordem de apresentação',
      type: 'number',
      group: 'organizacao',
      initialValue: 100,
    }),
  ],
  preview: {
    select: {
      title: 'title.pt',
      subtitle: 'category',
      media: 'image',
    },
  },
})

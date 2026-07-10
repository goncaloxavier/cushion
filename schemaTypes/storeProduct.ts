import {defineField, defineType} from 'sanity'

const categoryOptions = [
  {title: 'Bancos', value: 'bancos'},
  {title: 'Mesas e conjuntos', value: 'mesas'},
  {title: 'Cadeiras', value: 'cadeiras'},
  {title: 'Decking', value: 'decking'},
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
      description: 'Frase simples para explicar o produto no cartão e na página da Loja.',
      type: 'localizedText',
      group: 'conteudo',
    }),
    defineField({
      name: 'hasFinishChoice',
      title: 'Tem escolha de acabamento/cor',
      description:
        'Desative quando o produto só tem um preço e não deve mostrar Natural/Cinza ou Castanho/Preto ao cliente.',
      type: 'boolean',
      group: 'organizacao',
      initialValue: true,
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
          validation: (Rule) => Rule.required().warning('Adicione uma descrição para leitores de ecrã.'),
        }),
      ],
    }),
    defineField({
      name: 'gallery',
      title: 'Galeria do produto',
      description:
        'Fotografias e vídeos carregados para a página do produto. A imagem principal já aparece primeiro; aqui entram outros ângulos, detalhes ou vídeos curtos.',
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
              validation: (Rule) => Rule.required().warning('Adicione uma descrição para leitores de ecrã.'),
            }),
          ],
        }),
        defineField({
          name: 'galleryVideo',
          title: 'Vídeo carregado',
          description: 'Ficheiro de vídeo para aparecer na galeria do produto da Loja.',
          type: 'file',
          options: {
            accept: 'video/mp4,video/webm,video/quicktime',
          },
          fields: [
            defineField({
              name: 'title',
              title: 'Título do vídeo',
              description: 'Texto curto usado no player e na miniatura.',
              type: 'localizedString',
            }),
            defineField({
              name: 'poster',
              title: 'Imagem de capa',
              description: 'Opcional. Usada como capa antes de abrir/reproduzir o vídeo.',
              type: 'image',
              options: {hotspot: true},
              fields: [
                defineField({
                  name: 'alt',
                  title: 'Descrição da imagem',
                  type: 'localizedString',
                  validation: (Rule) => Rule.required().warning('Adicione uma descrição para leitores de ecrã.'),
                }),
              ],
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'variants',
      title: 'Variantes, pesos e preços',
      description:
        'Cada linha é uma opção comprável. O website usa estes preços e pesos para calcular transporte, IVA e total final.',
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
              description: 'Exemplo: 2000 mm, Com tampa, 750 x 750 mm.',
              type: 'localizedString',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'dimensions',
              title: 'Dimensões visíveis',
              description: 'Linhas curtas que aparecem na página do produto.',
              type: 'array',
              of: [{type: 'localizedString'}],
            }),
            defineField({
              name: 'weightKg',
              title: 'Peso (kg)',
              description:
                'Obrigatório para calcular transporte. Use o peso da unidade desta variante.',
              type: 'number',
              validation: (Rule) => Rule.required().min(0.01).precision(2),
            }),
            defineField({
              name: 'priceNatural',
              title: 'Preço Natural/Cinza sem IVA',
              description:
                'Preço base da unidade, sem IVA e sem transporte. O website calcula transporte e IVA depois.',
              type: 'number',
              validation: (Rule) => Rule.required().min(0).precision(2),
            }),
            defineField({
              name: 'priceDark',
              title: 'Preço Castanho/Preto sem IVA',
              description:
                'Preço base da unidade, sem IVA e sem transporte. O website calcula transporte e IVA depois.',
              type: 'number',
              validation: (Rule) => Rule.required().min(0).precision(2),
            }),
            defineField({
              name: 'note',
              title: 'Nota opcional da variante',
              description: 'Use apenas quando esta variante precisar de uma explicação extra.',
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
      name: 'flatTransportPrice',
      title: 'Transporte fixo (todas as zonas)',
      description:
        'Opcional. Quando definido, ignora o cálculo normal de transporte por peso/zona e cobra sempre este valor fixo para este produto, em qualquer zona do país. Use apenas para produtos leves onde o transporte calculado por peso não faz sentido.',
      type: 'number',
      group: 'precos',
      validation: (Rule) => Rule.min(0).precision(2),
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

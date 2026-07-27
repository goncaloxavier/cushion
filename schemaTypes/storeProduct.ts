import {defineField, defineType} from 'sanity'
import {videoCaptionsField} from './components/videoCaptionsField'

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
      description: 'Nome público na Loja.',
      type: 'localizedString',
      group: 'conteudo',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Endereço da página',
      description: 'Gere a partir do nome e evite alterar depois de publicar.',
      type: 'slug',
      group: 'conteudo',
      options: {source: 'title.pt', maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Categoria',
      description: 'Escolha o identificador definido em “Categorias da Loja”.',
      type: 'string',
      group: 'conteudo',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'summary',
      title: 'Resumo',
      description: 'Explique o produto numa frase curta.',
      type: 'localizedText',
      group: 'conteudo',
    }),
    defineField({
      name: 'hasFinishChoice',
      title: 'Permitir escolha de acabamento',
      description: 'Desative quando existe apenas um acabamento e um preço.',
      type: 'boolean',
      group: 'organizacao',
      initialValue: true,
    }),
    defineField({
      name: 'image',
      title: 'Imagem principal',
      description: 'Usada no cartão e na página do produto.',
      type: 'image',
      group: 'imagens',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Descrição da imagem',
          description: 'Para acessibilidade. Diga o que se vê.',
          type: 'localizedString',
          validation: (Rule) => Rule.required().warning('Adicione uma descrição para leitores de ecrã.'),
        }),
      ],
    }),
    defineField({
      name: 'gallery',
      title: 'Galeria',
      description: 'Outros ângulos, detalhes e vídeos. A imagem principal já aparece primeiro.',
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
              description: 'Para acessibilidade. Diga o que se vê.',
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
              description: 'Identifica o vídeo no player.',
              type: 'localizedString',
            }),
            videoCaptionsField(),
            defineField({
              name: 'poster',
              title: 'Imagem de capa',
              description: 'Opcional. Aparece antes da reprodução.',
              type: 'image',
              options: {hotspot: true},
              fields: [
                defineField({
                  name: 'alt',
                  title: 'Descrição da imagem',
                  description: 'Para acessibilidade. Diga o que se vê.',
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
      title: 'Opções, pesos e preços',
      description: 'Cada item é uma opção comprável. Preços sem IVA.',
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
              title: 'Nome da opção',
              description: 'Exemplo: 2000 mm, Com tampa, 750 x 750 mm.',
              type: 'localizedString',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'dimensions',
              title: 'Dimensões',
              description: 'Uma medida ou característica por linha.',
              type: 'array',
              of: [{type: 'localizedString'}],
            }),
            defineField({
              name: 'weightKg',
              title: 'Peso (kg)',
              description: 'Peso de uma unidade. Usado no transporte.',
              type: 'number',
              validation: (Rule) => Rule.required().min(0.01).precision(2),
            }),
            defineField({
              name: 'priceNatural',
              title: 'Natural/Cinza (sem IVA)',
              description: 'Preço de uma unidade, sem transporte.',
              type: 'number',
              validation: (Rule) => Rule.required().min(0).precision(2),
            }),
            defineField({
              name: 'priceDark',
              title: 'Castanho/Preto (sem IVA)',
              description: 'Preço de uma unidade, sem transporte.',
              type: 'number',
              validation: (Rule) => Rule.required().min(0).precision(2),
            }),
            defineField({
              name: 'note',
              title: 'Nota da opção',
              description: 'Opcional. Aparece junto às características.',
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
      title: 'Transporte fixo',
      description: 'Opcional. Substitui o cálculo por peso e zona para este produto.',
      type: 'number',
      group: 'precos',
      validation: (Rule) => Rule.min(0).precision(2),
    }),
    defineField({
      name: 'active',
      title: 'Mostrar na Loja',
      description: 'Desative para ocultar sem apagar.',
      type: 'boolean',
      group: 'organizacao',
      initialValue: true,
    }),
    defineField({
      name: 'orderRank',
      title: 'Ordem de apresentação',
      description: 'O número mais baixo aparece primeiro.',
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

import {defineField, defineType} from 'sanity'

export const caseStudy = defineType({
  name: 'caseStudy',
  title: 'Caso de estudo',
  type: 'document',
  groups: [
    {name: 'conteudo', title: 'Conteúdo', default: true},
    {name: 'imagens', title: 'Imagens'},
    {name: 'organizacao', title: 'Organização'},
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Nome do projeto',
      description: 'Título público do caso de estudo.',
      type: 'localizedString',
      group: 'conteudo',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Endereço da página',
      description: 'Parte final do URL. Gere a partir do título em Português e evite alterar depois de publicado.',
      type: 'slug',
      group: 'conteudo',
      options: {source: 'title.pt', maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Imagem principal',
      description: 'Imagem usada na listagem de casos e na página de detalhe.',
      type: 'image',
      group: 'imagens',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Descrição da imagem',
          description: 'Texto simples para acessibilidade. Diga o que se vê na fotografia.',
          type: 'localizedString',
        }),
      ],
    }),
    defineField({
      name: 'gallery',
      title: 'Galeria do projeto',
      description: 'Imagens extra para a página do caso e a vista ampliada.',
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
      name: 'location',
      title: 'Localização',
      description: 'Local ou zona do projeto. Exemplo: Moita, Torres do Mondego.',
      type: 'string',
      group: 'conteudo',
    }),
    defineField({
      name: 'productArea',
      title: 'Área do produto',
      description: 'Categoria ou tipo de solução usada no projeto.',
      type: 'localizedString',
      group: 'conteudo',
    }),
    defineField({
      name: 'summary',
      title: 'Resumo',
      description: 'Frase curta para a listagem de casos.',
      type: 'localizedText',
      group: 'conteudo',
    }),
    defineField({
      name: 'challenge',
      title: 'Desafio',
      description: 'O problema inicial do cliente ou do espaço.',
      type: 'localizedText',
      group: 'conteudo',
    }),
    defineField({
      name: 'solution',
      title: 'Solução',
      description: 'O que foi feito e que material/abordagem foi usado.',
      type: 'localizedText',
      group: 'conteudo',
    }),
    defineField({
      name: 'result',
      title: 'Resultado',
      description: 'Benefício final: menos manutenção, mais segurança, melhor uso do espaço, etc.',
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
      subtitle: 'location',
      media: 'image',
    },
  },
})

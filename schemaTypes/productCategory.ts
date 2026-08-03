import {defineField, defineType} from 'sanity'
import {videoCaptionsField} from './components/videoCaptionsField'
import {builderSectionMembers} from './builder/builderSections'

export const productCategory = defineType({
  name: 'productCategory',
  title: 'Produto',
  type: 'document',
  groups: [
    {name: 'conteudo', title: 'Conteúdo', default: true},
    {name: 'imagens', title: 'Imagens'},
    {name: 'seccoes', title: 'Conteúdo da página'},
    {name: 'organizacao', title: 'Organização'},
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Nome do produto',
      description: 'Nome público da solução.',
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
      name: 'image',
      title: 'Imagem principal',
      description: 'Usada na listagem e na página do produto.',
      type: 'image',
      group: 'imagens',
      options: {hotspot: true},
      fields: [
        defineField({
          name: 'alt',
          title: 'Descrição da imagem',
          description: 'Para acessibilidade. Diga o que se vê.',
          type: 'localizedString',
          validation: (Rule) =>
            Rule.required().warning('Adicione uma descrição para leitores de ecrã.'),
        }),
      ],
    }),
    defineField({
      name: 'gallery',
      title: 'Galeria',
      description: 'Imagens e vídeos adicionais.',
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
              validation: (Rule) =>
                Rule.required().warning('Adicione uma descrição para leitores de ecrã.'),
            }),
          ],
        }),
        defineField({
          name: 'galleryVideo',
          title: 'Vídeo carregado',
          description: 'Ficheiro de vídeo para aparecer na galeria da página do produto.',
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
                  validation: (Rule) =>
                    Rule.required().warning('Adicione uma descrição para leitores de ecrã.'),
                }),
              ],
            }),
          ],
        }),
      ],
    }),
    defineField({
      name: 'description',
      title: 'Descrição',
      description: 'Texto principal da página.',
      type: 'localizedText',
      group: 'conteudo',
    }),
    defineField({
      name: 'contentSections',
      title: 'Blocos antigos',
      description: 'Campo técnico oculto, mantido apenas para migrar conteúdo antigo.',
      type: 'array',
      group: 'seccoes',
      hidden: true,
      validation: (Rule) => Rule.max(12),
      of: [
        defineField({
          name: 'productContentSection',
          title: 'Secção',
          type: 'object',
          fields: [
            defineField({
              name: 'mediaSide',
              title: 'Composição',
              description: 'Escolha onde aparece a imagem ou o vídeo no computador.',
              type: 'string',
              initialValue: 'left',
              options: {
                list: [
                  {title: 'Visual à esquerda', value: 'left'},
                  {title: 'Visual à direita', value: 'right'},
                  {title: 'Visual acima', value: 'top'},
                ],
                layout: 'radio',
              },
            }),
            defineField({
              name: 'surface',
              title: 'Fundo da secção',
              description: 'As cores do texto adaptam-se automaticamente ao fundo.',
              type: 'string',
              initialValue: 'white',
              options: {
                list: [
                  {title: 'Branco', value: 'white'},
                  {title: 'Névoa', value: 'fog'},
                  {title: 'Verde claro', value: 'mint'},
                  {title: 'Verde profundo', value: 'deep'},
                  {title: 'Azul mineral', value: 'blue'},
                ],
                layout: 'radio',
              },
            }),
            defineField({
              name: 'mediaKind',
              title: 'Conteúdo visual',
              description: 'Escolha uma imagem ou um vídeo.',
              type: 'string',
              initialValue: 'image',
              options: {
                list: [
                  {title: 'Imagem', value: 'image'},
                  {title: 'Vídeo', value: 'video'},
                ],
                layout: 'radio',
              },
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'image',
              title: 'Imagem',
              type: 'image',
              options: {hotspot: true},
              hidden: ({parent}) => parent?.mediaKind !== 'image',
              fields: [
                defineField({
                  name: 'alt',
                  title: 'Descrição da imagem',
                  description: 'Para acessibilidade. Diga o que se vê.',
                  type: 'localizedString',
                  validation: (Rule) =>
                    Rule.required().warning('Adicione uma descrição para leitores de ecrã.'),
                }),
              ],
            }),
            defineField({
              name: 'video',
              title: 'Vídeo',
              description: 'Carregue um ficheiro ou cole um link do YouTube.',
              type: 'object',
              hidden: ({parent}) => parent?.mediaKind !== 'video',
              fields: [
                defineField({
                  name: 'kind',
                  title: 'Origem',
                  type: 'string',
                  initialValue: 'youtube',
                  options: {
                    list: [
                      {title: 'Vídeo carregado', value: 'upload'},
                      {title: 'Link do YouTube', value: 'youtube'},
                    ],
                    layout: 'radio',
                  },
                }),
                defineField({
                  name: 'file',
                  title: 'Ficheiro de vídeo',
                  type: 'file',
                  options: {accept: 'video/mp4,video/webm,video/quicktime'},
                  hidden: ({parent}) => parent?.kind !== 'upload',
                }),
                {
                  ...videoCaptionsField(),
                  hidden: ({parent}: {parent?: {kind?: string}}) => parent?.kind !== 'upload',
                },
                defineField({
                  name: 'youtubeUrl',
                  title: 'Link do YouTube',
                  type: 'url',
                  hidden: ({parent}) => parent?.kind !== 'youtube',
                  validation: (Rule) => Rule.uri({scheme: ['https']}),
                }),
              ],
            }),
            defineField({
              name: 'poster',
              title: 'Imagem de capa do vídeo',
              description: 'Opcional. Aparece enquanto o vídeo carrega.',
              type: 'image',
              options: {hotspot: true},
              hidden: ({parent}) => parent?.mediaKind !== 'video',
              fields: [
                defineField({
                  name: 'alt',
                  title: 'Descrição da imagem',
                  description: 'Para acessibilidade. Diga o que se vê.',
                  type: 'localizedString',
                }),
              ],
            }),
            defineField({
              name: 'videoTitle',
              title: 'Nome do vídeo',
              description: 'Identifica o vídeo para leitores de ecrã.',
              type: 'localizedString',
              hidden: ({parent}) => parent?.mediaKind !== 'video',
            }),
            defineField({
              name: 'label',
              title: 'Rótulo',
              description:
                'Opcional. Pequeno destaque sobre a imagem ou o vídeo, por exemplo "Decking aplicado em exterior".',
              type: 'localizedString',
            }),
            defineField({
              name: 'labelStyle',
              title: 'Estilo do rótulo',
              description: 'Só é usado quando preenche o rótulo acima.',
              type: 'string',
              initialValue: 'caption',
              options: {
                list: [
                  {title: 'Legenda por baixo da imagem', value: 'caption'},
                  {title: 'Selo sobre a imagem', value: 'pill'},
                  {title: 'Texto acima do título', value: 'eyebrow'},
                ],
                layout: 'radio',
              },
            }),
            defineField({
              name: 'title',
              title: 'Título',
              description: 'Opcional.',
              type: 'localizedString',
            }),
            defineField({
              name: 'text',
              title: 'Texto',
              description: 'Opcional.',
              type: 'localizedText',
            }),
            defineField({
              name: 'buttonLabel',
              title: 'Texto do botão',
              description: 'Opcional. Só aparece quando também indicar um destino.',
              type: 'localizedString',
            }),
            defineField({
              name: 'buttonUrl',
              title: 'Destino do botão',
              description: 'Opcional. Página do site ou ligação externa.',
              type: 'url',
              validation: (Rule) => Rule.uri({scheme: ['http', 'https'], allowRelative: true}),
            }),
          ],
          validation: (Rule) =>
            Rule.custom((value) => {
              const section = value as
                | {
                    mediaKind?: string
                    image?: {asset?: {_ref?: string}}
                    video?: {file?: {asset?: {_ref?: string}}; youtubeUrl?: string}
                    buttonLabel?: {pt?: string}
                    buttonUrl?: string
                  }
                | undefined
              if (!section) return true
              if (section.mediaKind === 'image' && !section.image?.asset?._ref) {
                return 'Adicione a imagem desta secção.'
              }
              if (
                section.mediaKind === 'video' &&
                !section.video?.file?.asset?._ref &&
                !section.video?.youtubeUrl?.trim()
              ) {
                return 'Carregue um vídeo ou indique um link do YouTube.'
              }
              const hasButtonLabel = Boolean(section.buttonLabel?.pt?.trim())
              const hasButtonUrl = Boolean(section.buttonUrl?.trim())
              if (hasButtonLabel !== hasButtonUrl) {
                return 'Preencha o texto e o destino do botão, ou deixe ambos vazios.'
              }
              return true
            }),
          preview: {
            select: {
              title: 'title.pt',
              mediaKind: 'mediaKind',
              image: 'image',
              poster: 'poster',
            },
            prepare: ({title, mediaKind, image, poster}) => ({
              title: title || (mediaKind === 'video' ? 'Secção com vídeo' : 'Secção com imagem'),
              subtitle: mediaKind === 'video' ? 'Vídeo' : 'Imagem',
              media: mediaKind === 'video' ? poster : image,
            }),
          },
        }),
      ],
    }),
    defineField({
      name: 'documentsTitle',
      title: 'Título dos ficheiros',
      description: 'Texto acima dos downloads. Deixe vazio para usar o texto global.',
      type: 'localizedString',
      group: 'conteudo',
    }),
    defineField({
      name: 'documents',
      title: 'Ficheiros para download',
      description: 'PDFs que o cliente pode transferir nesta página. Deixe vazio para não mostrar nada.',
      type: 'array',
      of: [{type: 'downloadItem'}],
      validation: (Rule) => Rule.max(12),
      group: 'conteudo',
    }),
    defineField({
      name: 'sections',
      title: 'Conteúdo da página',
      description:
        'Organize a apresentação atual e acrescente imagem, vídeo, texto, galerias ou chamadas para ação.',
      type: 'array',
      group: 'seccoes',
      of: builderSectionMembers,
      validation: (Rule) => Rule.max(30),
    }),
    defineField({
      name: 'dimensions',
      title: 'Dimensões',
      description: 'Opcional. Medidas disponíveis, uma por linha.',
      type: 'array',
      group: 'conteudo',
      of: [{type: 'localizedString'}],
    }),
    defineField({
      name: 'materials',
      title: 'Materiais',
      description: 'Opcional. Materiais usados, um por linha.',
      type: 'array',
      group: 'conteudo',
      of: [{type: 'localizedString'}],
    }),
    defineField({
      name: 'specifications',
      title: 'Especificações',
      description: 'Opcional. Características técnicas, uma por linha.',
      type: 'array',
      group: 'conteudo',
      of: [{type: 'localizedString'}],
    }),
    defineField({
      name: 'advantages',
      title: 'Vantagens',
      description: 'Opcional. Vantagens do produto, uma por linha.',
      type: 'array',
      group: 'conteudo',
      of: [{type: 'localizedString'}],
    }),
    defineField({
      name: 'active',
      title: 'Mostrar na página Produtos',
      description:
        'Desative para publicar e rever pelo endereço direto sem mostrar este produto nas listas ou nos motores de pesquisa.',
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
      subtitle: 'description.pt',
      media: 'image',
    },
  },
})

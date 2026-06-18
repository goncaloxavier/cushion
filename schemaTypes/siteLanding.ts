import {defineField, defineType} from 'sanity'

const localizedStringField = (name: string, title: string, description?: string) =>
  defineField({
    name,
    title,
    description,
    type: 'localizedString',
  })

const localizedTextField = (name: string, title: string, description?: string) =>
  defineField({
    name,
    title,
    description,
    type: 'localizedText',
  })

const copyBlockField = (name: string, title: string, description?: string) =>
  defineField({
    name,
    title,
    description,
    type: 'object',
    options: {collapsible: true},
    fields: [
      localizedStringField(
        'kicker',
        'Etiqueta pequena',
        'Texto curto acima do título, quando existir.',
      ),
      localizedStringField('title', 'Título principal', 'O título visível nesta zona da página.'),
      localizedTextField('lead', 'Texto de apoio', 'Texto curto logo abaixo do título.'),
    ],
  })

const pageImageField = (name: string, title: string, description?: string) =>
  defineField({
    name,
    title,
    description,
    type: 'image',
    options: {hotspot: true},
    fields: [
      defineField({
        name: 'alt',
        title: 'Descrição da imagem',
        description: 'Texto simples para acessibilidade. Diga o que se vê na imagem.',
        type: 'localizedString',
      }),
    ],
  })

const contentCardsField = (name: string, title: string, description?: string) =>
  defineField({
    name,
    title,
    description,
    type: 'array',
    of: [{type: 'contentCard'}],
  })

const mediaItemsField = (name: string, title: string, description?: string) =>
  defineField({
    name,
    title,
    description,
    type: 'array',
    of: [{type: 'mediaItem'}],
  })

const partnerItemsField = (name: string, title: string, description?: string) =>
  defineField({
    name,
    title,
    description,
    type: 'array',
    of: [{type: 'partnerItem'}],
  })

const localizedStringListField = (name: string, title: string, description?: string) =>
  defineField({
    name,
    title,
    description,
    type: 'array',
    of: [{type: 'localizedString'}],
  })

const pageSectionField = (
  name: string,
  title: string,
  fields: ReturnType<typeof defineField>[],
  description?: string,
) =>
  defineField({
    name,
    title,
    description,
    type: 'object',
    group: 'pages',
    options: {collapsible: true, collapsed: true},
    fields,
  })

export const siteLanding = defineType({
  name: 'siteLanding',
  title: 'Conteúdo do site',
  type: 'document',
  groups: [
    {name: 'pages', title: 'Páginas', default: true},
    {name: 'contact', title: 'Contacto e rodapé'},
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Título interno',
      type: 'string',
      initialValue: 'Conteúdo do site DaFábrica4You',
      validation: (Rule) => Rule.required(),
      hidden: true,
    }),
    pageSectionField(
      'home',
      'Página inicial',
      [
        copyBlockField(
          'hero',
          'Primeira secção',
          'Título e introdução principal da página inicial.',
        ),
        pageImageField(
          'heroImage',
          'Imagem principal da primeira secção',
          'Imagem grande no topo da página inicial. Serve também de capa do vídeo do topo, quando existir.',
        ),
        defineField({
          name: 'heroVideoUrl',
          title: 'Vídeo do topo (YouTube)',
          description:
            'Opcional. Cole o link do vídeo institucional para o mostrar no topo da página inicial, por cima da imagem principal. Se ficar vazio, o topo mostra apenas a imagem.',
          type: 'url',
        }),
        copyBlockField(
          'intro',
          'Apresentação da empresa',
          'Explicação curta sobre a empresa usada depois da primeira secção.',
        ),
        defineField({
          name: 'impact',
          title: 'Impacto e prova',
          description: 'Números e texto curto que dão credibilidade à página inicial.',
          type: 'object',
          options: {collapsible: true},
          fields: [
            localizedStringField('title', 'Título da secção'),
            localizedTextField('lead', 'Texto da secção'),
            contentCardsField('stats', 'Números de impacto'),
          ],
        }),
        defineField({
          name: 'manifesto',
          title: 'Nota de posicionamento',
          description: 'Frase curta usada para dar personalidade à apresentação da marca.',
          type: 'object',
          options: {collapsible: true},
          fields: [
            localizedTextField('quote', 'Frase'),
            localizedStringField('attribution', 'Assinatura pequena'),
          ],
        }),
        defineField({
          name: 'mediaShowcase',
          title: 'Galeria de media',
          description:
            'Galeria de fotografias e/ou vídeos do YouTube para a página inicial. Pode ter só imagens, só vídeos, ou os dois juntos. O vídeo do topo é definido no campo "Vídeo do topo".',
          type: 'object',
          options: {collapsible: true},
          fields: [
            localizedStringField('kicker', 'Etiqueta pequena'),
            localizedStringField('title', 'Título da secção'),
            localizedTextField('lead', 'Texto da secção'),
            mediaItemsField('items', 'Vídeos e imagens'),
          ],
        }),
        defineField({
          name: 'partners',
          title: 'Parceiros e projetos',
          description: 'Logotipos e textos curtos para entidades parceiras e projetos relevantes.',
          type: 'object',
          options: {collapsible: true},
          fields: [
            localizedStringField('kicker', 'Etiqueta pequena'),
            localizedStringField('title', 'Título da secção'),
            localizedTextField('lead', 'Texto da secção'),
            partnerItemsField('items', 'Parceiros'),
          ],
        }),
      ],
      'Edite os textos públicos da página inicial. A composição visual continua controlada pelo website.',
    ),
    pageSectionField(
      'about',
      'Página Sobre',
      [
        copyBlockField('hero', 'Primeira secção'),
        contentCardsField('timeline', 'Momentos da empresa'),
        contentCardsField('principles', 'Cartões de princípios'),
      ],
      'Edite o título, introdução, momentos e princípios da página Sobre.',
    ),
    pageSectionField(
      'productsPage',
      'Página Produtos',
      [
        copyBlockField('hero', 'Primeira secção'),
        pageImageField(
          'heroImage',
          'Imagem principal da primeira secção',
          'Imagem grande usada no topo da página de produtos.',
        ),
        localizedTextField('lead', 'Texto junto à contagem de produtos'),
      ],
      'Edite apenas os textos da listagem de produtos. Cada produto é editado na área Produtos.',
    ),
    pageSectionField(
      'catalogue',
      'Página Catálogo',
      [
        copyBlockField('hero', 'Primeira secção'),
        defineField({
          name: 'estimate',
          title: 'Explicação do orçamento',
          description:
            'Bloco principal e cartões pequenos sobre os fatores que influenciam o preço.',
          type: 'object',
          options: {collapsible: true},
          fields: [
            localizedStringField('kicker', 'Etiqueta pequena'),
            localizedStringField('title', 'Título da secção'),
            localizedTextField('lead', 'Texto da secção'),
            contentCardsField('cards', 'Fatores de preço'),
            localizedStringField('checklistTitle', 'Título da checklist'),
            localizedStringListField('checklist', 'Itens da checklist'),
          ],
        }),
        localizedTextField('note', 'Nota do catálogo'),
        contentCardsField('quoteFlow', 'Passos para pedir orçamento'),
      ],
      'Edite a página Catálogo: introdução, explicação do orçamento, checklist e passos do pedido.',
    ),
    pageSectionField(
      'casesPage',
      'Página Casos',
      [
        copyBlockField('hero', 'Primeira secção'),
        pageImageField(
          'heroImage',
          'Imagem principal da primeira secção',
          'Imagem grande usada no topo da listagem de casos.',
        ),
      ],
      'Edite o título e introdução da listagem de casos. Cada caso é editado na área Casos de estudo.',
    ),
    pageSectionField(
      'blogPage',
      'Página Blog',
      [
        copyBlockField('hero', 'Primeira secção'),
        pageImageField(
          'heroImage',
          'Imagem principal da primeira secção',
          'Imagem grande usada no topo da listagem do blog.',
        ),
        copyBlockField('newsletter', 'Secção newsletter'),
      ],
      'Edite a introdução do Blog e a newsletter. Cada artigo é editado na área Artigos do blog.',
    ),
    pageSectionField(
      'contactPage',
      'Página Contacto',
      [
        copyBlockField('hero', 'Primeira secção'),
        localizedStringListField('fields', 'Campos do formulário'),
      ],
      'Edite o título, texto introdutório e labels do formulário de contacto.',
    ),
    defineField({
      name: 'common',
      title: 'Dados de contacto',
      description: 'Usado na página de contacto e no rodapé.',
      type: 'object',
      group: 'contact',
      options: {collapsible: true},
      fields: [
        defineField({
          name: 'contactEmail',
          title: 'Email de contacto',
          type: 'email',
        }),
        defineField({
          name: 'contactPhone',
          title: 'Telefone de contacto',
          type: 'string',
        }),
        defineField({
          name: 'whatsappUrl',
          title: 'Link do WhatsApp',
          description: 'Exemplo: https://wa.me/351914746637',
          type: 'url',
        }),
        localizedStringField('whatsappLabel', 'Texto do botão WhatsApp'),
        localizedStringField('socialLabel', 'Título das redes sociais'),
        defineField({
          name: 'youtubeUrl',
          title: 'Link YouTube',
          type: 'url',
        }),
        defineField({
          name: 'facebookUrl',
          title: 'Link Facebook',
          type: 'url',
        }),
        defineField({
          name: 'instagramUrl',
          title: 'Link Instagram',
          type: 'url',
        }),
        defineField({
          name: 'complaintsUrl',
          title: 'Link Livro de Reclamações',
          description: 'Use o endereço oficial ou o link específico da empresa quando existir.',
          type: 'url',
        }),
        localizedStringField('complaintsLabel', 'Texto do Livro de Reclamações'),
        localizedTextField(
          'complaintsNote',
          'Texto legal junto ao Livro de Reclamações',
          'Mostrado sempre que o link do Livro de Reclamações aparece.',
        ),
        localizedTextField('marketingConsent', 'Consentimento de dados/marketing'),
      ],
    }),
    defineField({
      name: 'footer',
      title: 'Rodapé',
      type: 'object',
      group: 'contact',
      options: {collapsible: true},
      fields: [localizedStringField('line', 'Frase curta do rodapé')],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'home.hero.title.pt',
    },
  },
})

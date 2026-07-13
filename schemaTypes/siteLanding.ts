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

const copyBlockField = (
  name: string,
  title: string,
  description?: string,
  options: {includeKicker?: boolean; includeLead?: boolean} = {},
) => {
  const fields = [localizedStringField('title', 'Título', 'Título visível nesta zona.')]

  if (options.includeKicker !== false) {
    fields.unshift(localizedStringField('kicker', 'Etiqueta', 'Texto curto acima do título.'))
  }

  if (options.includeLead !== false) {
    fields.push(localizedTextField('lead', 'Texto', 'Aparece abaixo do título.'))
  }

  return defineField({
    name,
    title,
    description,
    type: 'object',
    options: {collapsible: true},
    fields,
  })
}

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
        description: 'Para acessibilidade. Diga o que se vê.',
        type: 'localizedString',
        validation: (Rule) => Rule.required().warning('Adicione uma descrição para leitores de ecrã.'),
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

const contactFormLabelsField = () =>
  defineField({
    name: 'formLabels',
    title: 'Nomes dos campos',
    description: 'Texto visível junto a cada campo do formulário.',
    type: 'object',
    options: {collapsible: true},
    fields: [
      localizedStringField('firstName', 'Primeiro nome'),
      localizedStringField('lastName', 'Apelido'),
      localizedStringField('email', 'Email'),
      localizedStringField('phone', 'Telefone'),
      localizedStringField('address', 'Morada'),
      localizedStringField('postalCode', 'Código postal'),
      localizedStringField('locality', 'Localidade'),
      localizedStringField('message', 'Mensagem'),
    ],
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
    pageSectionField(
      'home',
      'Página inicial',
      [
        copyBlockField(
          'hero',
          'Topo da página',
          'Título principal.',
          {includeKicker: false, includeLead: false},
        ),
        defineField({
          name: 'heroVideoUrl',
          title: 'Vídeo do topo',
          description: 'Opcional. Cole o link do vídeo no YouTube.',
          type: 'url',
        }),
        defineField({
          name: 'impact',
          title: 'Impacto e prova',
          description: 'Título e números de impacto.',
          type: 'object',
          options: {collapsible: true},
          fields: [
            localizedStringField('title', 'Título'),
            contentCardsField('stats', 'Números'),
          ],
        }),
        defineField({
          name: 'partners',
          title: 'Parceiros e projetos',
          description: 'Entidades, projetos, logotipos e links.',
          type: 'object',
          options: {collapsible: true},
          fields: [
            localizedStringField('kicker', 'Etiqueta'),
            localizedStringField('title', 'Título'),
            localizedTextField('lead', 'Texto'),
            partnerItemsField('items', 'Parceiros'),
          ],
        }),
      ],
      'Textos, vídeo e parceiros da página inicial.',
    ),
    pageSectionField(
      'about',
      'Página Sobre',
      [
        copyBlockField('hero', 'Topo da página', undefined, {includeLead: false}),
        contentCardsField('timeline', 'Momentos da empresa'),
      ],
      'Título e momentos da empresa.',
    ),
    pageSectionField(
      'productsPage',
      'Página Produtos',
      [
        copyBlockField('hero', 'Topo da página', undefined, {includeLead: false}),
        pageImageField('heroImage', 'Imagem principal', 'Imagem usada no topo da página.'),
      ],
      'Topo da listagem. Edite cada solução na área Produtos.',
    ),
    pageSectionField(
      'storePage',
      'Página Loja',
      [
        copyBlockField('hero', 'Topo da página', undefined, {includeLead: false}),
        defineField({
          name: 'transportMultiplier',
          title: 'Multiplicador de transporte',
          description: 'Multiplica o custo de transporte antes do IVA. Valor atual: 2,5.',
          type: 'number',
          initialValue: 2.5,
          validation: (Rule) => Rule.min(0.1).max(20).precision(2),
        }),
      ],
      'Topo e cálculo de transporte. Produtos e preços ficam na área Loja.',
    ),
    pageSectionField(
      'catalogue',
      'Página Catálogo',
      [
        copyBlockField('hero', 'Topo da página', undefined, {includeLead: false}),
        localizedStringField('ctaLabel', 'Texto do botão'),
        defineField({
          name: 'estimate',
          title: 'Pedido de catálogo',
          description: 'Explica como pedir o catálogo.',
          type: 'object',
          options: {collapsible: true},
          fields: [
            localizedStringField('kicker', 'Etiqueta'),
            localizedStringField('title', 'Título'),
            localizedTextField('lead', 'Texto'),
            localizedStringField('checklistTitle', 'Título da lista'),
            localizedStringListField('checklist', 'Itens da lista'),
          ],
        }),
      ],
      'Topo, instruções e botão do formulário.',
    ),
    pageSectionField(
      'casesPage',
      'Página Casos',
      [
        copyBlockField('hero', 'Topo da página', undefined, {includeLead: false}),
        pageImageField('heroImage', 'Imagem principal', 'Imagem usada no topo da página.'),
      ],
      'Topo da listagem. Edite cada projeto na área Casos de estudo.',
    ),
    pageSectionField(
      'blogPage',
      'Página Blog',
      [
        copyBlockField('hero', 'Topo da página', undefined, {includeLead: false}),
        pageImageField('heroImage', 'Imagem principal', 'Imagem usada no topo da página.'),
      ],
      'Topo da listagem. Edite cada artigo na área Artigos do blog.',
    ),
    pageSectionField(
      'contactPage',
      'Página Contacto',
      [
        copyBlockField('hero', 'Topo da página'),
        contactFormLabelsField(),
      ],
      'Topo e nomes visíveis dos campos.',
    ),
    defineField({
      name: 'common',
      title: 'Contacto, redes e legal',
      description: 'Informação usada no contacto e no rodapé.',
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
        localizedStringField('socialLabel', 'Nome das redes sociais'),
        defineField({
          name: 'youtubeUrl',
          title: 'Link do YouTube',
          type: 'url',
        }),
        defineField({
          name: 'facebookUrl',
          title: 'Link do Facebook',
          type: 'url',
        }),
        defineField({
          name: 'instagramUrl',
          title: 'Link do Instagram',
          type: 'url',
        }),
        defineField({
          name: 'complaintsUrl',
          title: 'Link do Livro de Reclamações',
          description: 'Link oficial da empresa.',
          type: 'url',
        }),
        localizedStringField('complaintsLabel', 'Texto do Livro de Reclamações'),
        localizedTextField(
          'complaintsNote',
          'Nota legal do Livro de Reclamações',
          'Aparece junto ao link.',
        ),
        defineField({
          name: 'privacyPolicyUrl',
          title: 'Link da Política de Privacidade',
          type: 'url',
        }),
        localizedStringField('privacyPolicyLabel', 'Nome da Política de Privacidade'),
        defineField({
          name: 'cookiePolicyUrl',
          title: 'Link da Política de Cookies',
          type: 'url',
        }),
        localizedStringField('cookiePolicyLabel', 'Nome da Política de Cookies'),
        localizedTextField(
          'marketingConsent',
          'Consentimento de contacto',
          'Texto apresentado junto à caixa de consentimento.',
        ),
        localizedStringField(
          'privacyConsentPrefix',
          'Texto antes da Política de Privacidade',
          'Exemplo: “Eu concordo com a”. O link é adicionado automaticamente.',
        ),
      ],
    }),
  ],
  preview: {
    select: {
      subtitle: 'home.hero.title.pt',
    },
    prepare: ({subtitle}) => ({title: 'Conteúdo do site', subtitle}),
  },
})

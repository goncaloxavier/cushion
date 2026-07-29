import {defineField, defineType} from 'sanity'
import {builderSectionMembers} from './builder/builderSections'
import {videoCaptionsField} from './components/videoCaptionsField'

const localizedStringField = (
  name: string,
  title: string,
  description?: string,
  options: {hidden?: boolean} = {},
) =>
  defineField({
    name,
    title,
    description,
    type: 'localizedString',
    hidden: options.hidden,
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
        validation: (Rule) =>
          Rule.required().warning('Adicione uma descrição para leitores de ecrã.'),
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

const builderSectionsField = () =>
  defineField({
    name: 'sections',
    title: 'Conteúdo da página',
    description:
      'Organize o conteúdo atual e acrescente novas secções sem alterar a estrutura aprovada.',
    type: 'array',
    of: builderSectionMembers,
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

const storePostalGateField = () =>
  defineField({
    name: 'postalGate',
    title: 'Entrada por código postal',
    description: 'Textos da janela apresentada antes de abrir a Loja.',
    type: 'object',
    options: {collapsible: true, collapsed: true},
    fields: [
      localizedStringField('kicker', 'Etiqueta'),
      localizedStringField('title', 'Título'),
      localizedTextField('lead', 'Texto'),
      localizedStringField('field', 'Nome do campo'),
      localizedStringField('placeholder', 'Exemplo do código postal'),
      localizedStringField('submit', 'Botão para entrar'),
      localizedStringField('update', 'Botão para atualizar'),
      localizedStringField('close', 'Texto para fechar'),
      localizedStringField('incomplete', 'Erro de código incompleto'),
      localizedTextField('unsupported', 'Erro de zona não suportada'),
    ],
  })

const storeDetailLabelsField = () =>
  defineField({
    name: 'detail',
    title: 'Página de produto',
    description: 'Textos comuns apresentados nos detalhes dos produtos da Loja.',
    type: 'object',
    options: {collapsible: true, collapsed: true},
    fields: [
      localizedStringField('back', 'Voltar à Loja'),
      localizedStringField('category', 'Categoria'),
      localizedStringField('variant', 'Medida ou variante'),
      localizedStringField('finish', 'Acabamento'),
      localizedStringField('dimensions', 'Dimensões'),
      localizedStringField('weight', 'Peso'),
      localizedStringField('selectedPrice', 'Preço selecionado'),
      localizedStringField('productNet', 'Produto sem IVA'),
      localizedStringField('transport', 'Transporte'),
      localizedStringField('totalWithVat', 'Total com IVA'),
      localizedStringField('ivaIncluded', 'Nota de IVA incluído'),
      localizedStringField('deliveryPostcode', 'Zona de entrega'),
      localizedStringField('changePostcode', 'Alterar código postal'),
      localizedStringField('transportPending', 'Transporte por confirmar'),
      localizedTextField('transportOverweight', 'Aviso de excesso de peso'),
      localizedStringField('addToCart', 'Adicionar ao carrinho'),
      localizedStringField('added', 'Aviso de produto adicionado'),
      localizedStringField('viewCart', 'Ver carrinho'),
      localizedStringField('imagePending', 'Aviso de imagem em falta'),
      localizedStringField('quantity', 'Quantidade'),
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
    defineField({
      name: 'navigation',
      title: 'Navegação do site',
      description: 'Ligações apresentadas no cabeçalho e no menu móvel. Arraste para ordenar.',
      type: 'array',
      group: 'pages',
      of: [
        defineField({
          name: 'navigationItem',
          title: 'Ligação',
          type: 'object',
          fields: [
            localizedStringField('label', 'Nome', 'Texto visível no menu.'),
            defineField({
              name: 'href',
              title: 'Destino',
              description: 'Exemplo: /loja ou https://exemplo.pt.',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'placement',
              title: 'Zona',
              type: 'string',
              initialValue: 'primary',
              options: {
                list: [
                  {title: 'Menu principal', value: 'primary'},
                  {title: 'Ações do cabeçalho', value: 'utility'},
                ],
                layout: 'radio',
              },
            }),
            defineField({
              name: 'visibleDesktop',
              title: 'Mostrar no computador',
              type: 'boolean',
              initialValue: true,
            }),
            defineField({
              name: 'visibleMobile',
              title: 'Mostrar no telemóvel',
              type: 'boolean',
              initialValue: true,
            }),
            defineField({
              name: 'newTab',
              title: 'Abrir num novo separador',
              type: 'boolean',
              initialValue: false,
            }),
          ],
          preview: {
            select: {title: 'label.pt', subtitle: 'href'},
          },
        }),
      ],
    }),
    pageSectionField(
      'home',
      'Página inicial',
      [
        copyBlockField('hero', 'Topo da página', 'Título principal.', {
          includeKicker: false,
          includeLead: false,
        }),
        defineField({
          name: 'heroVideo',
          title: 'Vídeo do topo',
          description: 'Opcional. Carregue um vídeo ou cole um link do YouTube',
          type: 'object',
          options: {collapsible: true},
          fields: [
            defineField({
              name: 'kind',
              title: 'Origem do vídeo',
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
        localizedStringField('heroVideoLabel', 'Texto do botão do vídeo'),
        localizedStringField('heroVideoCloseLabel', 'Texto para fechar o vídeo'),
        defineField({
          name: 'impact',
          title: 'Impacto e prova',
          description: 'Título e números de impacto.',
          type: 'object',
          options: {collapsible: true},
          fields: [localizedStringField('title', 'Título'), contentCardsField('stats', 'Números')],
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
        builderSectionsField(),
      ],
      'Textos, vídeo, parceiros e conteúdo da página inicial.',
    ),
    pageSectionField(
      'about',
      'Página Sobre',
      [
        copyBlockField('hero', 'Topo da página', undefined, {includeLead: false}),
        copyBlockField('statement', 'Apresentação da história', undefined, {includeLead: false}),
        contentCardsField('timeline', 'Momentos da empresa'),
        builderSectionsField(),
      ],
      'Título, apresentação e momentos da empresa.',
    ),
    pageSectionField(
      'productsPage',
      'Página Produtos',
      [
        copyBlockField('hero', 'Topo da página', undefined, {includeLead: false}),
        pageImageField('heroImage', 'Imagem principal', 'Imagem usada no topo da página.'),
        defineField({
          name: 'documentsTitle',
          title: 'Título dos ficheiros',
          description: 'Texto acima dos downloads. Deixe vazio para usar o texto global.',
          type: 'localizedString',
        }),
        defineField({
          name: 'documents',
          title: 'Ficheiros para download',
          description:
            'PDFs que o cliente pode transferir nesta página. Deixe vazio para não mostrar nada.',
          type: 'array',
          of: [{type: 'downloadItem'}],
          validation: (Rule) => Rule.max(12),
        }),
        builderSectionsField(),
      ],
      'Topo da listagem. Edite cada solução na área Produtos.',
    ),
    pageSectionField(
      'storePage',
      'Página Loja',
      [
        copyBlockField('hero', 'Topo da página', undefined, {includeLead: false}),
        defineField({
          name: 'documentsTitle',
          title: 'Título dos ficheiros',
          description: 'Texto acima dos downloads. Deixe vazio para usar o texto global.',
          type: 'localizedString',
        }),
        defineField({
          name: 'documents',
          title: 'Ficheiros para download',
          description:
            'PDFs que o cliente pode transferir nesta página. Deixe vazio para não mostrar nada.',
          type: 'array',
          of: [{type: 'downloadItem'}],
          validation: (Rule) => Rule.max(12),
        }),
        {...localizedStringField('searchLabel', 'Nome da pesquisa'), hidden: true},
        {...localizedStringField('categoryLabel', 'Nome das categorias'), hidden: true},
        {...localizedStringField('finishLabel', 'Nome dos acabamentos'), hidden: true},
        {...localizedStringField('sortLabel', 'Nome da ordenação'), hidden: true},
        {...localizedStringField('allCategoriesLabel', 'Todas as categorias'), hidden: true},
        defineField({
          name: 'sortOptions',
          title: 'Opções de ordenação',
          type: 'object',
          hidden: true,
          options: {collapsible: true, collapsed: true},
          fields: [
            localizedStringField('featured', 'Destaque'),
            localizedStringField('priceAsc', 'Preço crescente'),
            localizedStringField('priceDesc', 'Preço decrescente'),
            localizedStringField('name', 'Nome'),
          ],
        }),
        defineField({
          name: 'finishLabels',
          title: 'Nomes dos acabamentos',
          type: 'object',
          hidden: true,
          options: {collapsible: true, collapsed: true},
          fields: [
            localizedStringField('natural', 'Natural'),
            localizedStringField('dark', 'Escuro'),
          ],
        }),
        {...localizedStringField('priceFromLabel', 'Texto antes do preço'), hidden: true},
        {...localizedStringField('requestLabel', 'Texto para pedir proposta'), hidden: true},
        {...localizedStringField('noResults', 'Sem resultados'), hidden: true},
        {...localizedStringField('vatNote', 'Nota sobre o IVA'), hidden: true},
        defineField({
          name: 'delivery',
          title: 'Transporte e preços',
          type: 'object',
          hidden: true,
          options: {collapsible: true, collapsed: true},
          fields: [
            localizedStringField('postcode', 'Nome da zona'),
            localizedStringField('change', 'Alterar código postal'),
            localizedStringField('cardPriceWithDelivery', 'Preço com transporte e IVA'),
            localizedStringField('cardPriceWithoutDelivery', 'Preço sem transporte'),
          ],
        }),
        {...storePostalGateField(), hidden: true},
        {...storeDetailLabelsField(), hidden: true},
        defineField({
          name: 'transportMultiplier',
          title: 'Multiplicador de transporte',
          description: 'Multiplica o custo de transporte antes do IVA. Valor atual: 2,5.',
          type: 'number',
          initialValue: 2.5,
          validation: (Rule) => Rule.min(0.1).max(20).precision(2),
        }),
        builderSectionsField(),
      ],
      'Topo e cálculo de transporte. Produtos e preços ficam na área Loja.',
    ),
    pageSectionField(
      'cartPage',
      'Página Carrinho',
      [
        copyBlockField('hero', 'Topo da página', undefined, {includeLead: false}),
        localizedStringField('cartItems', 'Produtos no carrinho'),
        localizedStringField('empty', 'Carrinho vazio'),
        localizedStringField('continueShopping', 'Continuar na Loja'),
        localizedStringField('clear', 'Limpar carrinho'),
        localizedTextField('clearConfirm', 'Confirmação para limpar'),
        localizedStringField('request', 'Finalizar pedido'),
        localizedStringField('quantity', 'Quantidade'),
        localizedStringField('remove', 'Remover produto'),
        localizedStringField('removed', 'Aviso de produto removido'),
        localizedStringField('finish', 'Acabamento'),
        localizedStringField('unitPrice', 'Preço unitário'),
        localizedStringField('total', 'Total da linha'),
        localizedStringField('productSubtotal', 'Subtotal dos produtos'),
        localizedStringField('transport', 'Transporte'),
        localizedStringField('iva', 'IVA'),
        localizedStringField('finalTotal', 'Total final'),
        localizedStringField('deliveryPostcode', 'Zona de entrega'),
        localizedStringField('changePostcode', 'Alterar código postal'),
        localizedStringField('totalWeight', 'Peso total'),
        localizedStringField('transportPending', 'Transporte por confirmar'),
        localizedTextField('transportOverweight', 'Aviso de excesso de peso'),
        localizedStringField('summary', 'Resumo'),
        localizedStringField('product', 'Produto'),
        builderSectionsField(),
      ],
      'Textos visíveis no carrinho e no resumo do pedido.',
    ),
    pageSectionField(
      'returnsPolicy',
      'Política de devoluções',
      [
        localizedStringField('kicker', 'Etiqueta'),
        localizedStringField('title', 'Título'),
        localizedTextField('lead', 'Texto'),
        localizedStringListField('conditions', 'Condições'),
        builderSectionsField(),
      ],
      'Texto e lista de condições da política de devoluções.',
    ),
    pageSectionField(
      'catalogue',
      'Página Catálogo',
      [
        copyBlockField('hero', 'Topo da página', undefined, {includeLead: false}),
        localizedStringField('ctaLabel', 'Texto do botão'),
        contactFormLabelsField(),
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
        builderSectionsField(),
      ],
      'Topo, instruções e botão do formulário.',
    ),
    pageSectionField(
      'casesPage',
      'Página Casos',
      [
        copyBlockField('hero', 'Topo da página', undefined, {includeLead: false}),
        pageImageField('heroImage', 'Imagem principal', 'Imagem usada no topo da página.'),
        builderSectionsField(),
      ],
      'Topo da listagem. Edite cada projeto na área Casos de estudo.',
    ),
    pageSectionField(
      'blogPage',
      'Página Blog',
      [
        copyBlockField('hero', 'Topo da página', undefined, {includeLead: false}),
        pageImageField('heroImage', 'Imagem principal', 'Imagem usada no topo da página.'),
        builderSectionsField(),
      ],
      'Topo da listagem. Edite cada artigo na área Artigos do blog.',
    ),
    pageSectionField(
      'contactPage',
      'Página Contacto',
      [
        copyBlockField('hero', 'Topo da página'),
        contactFormLabelsField(),
        builderSectionsField(),
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
        localizedStringField('readMore', 'Ler mais'),
        localizedStringField('requestQuote', 'Pedir orçamento'),
        localizedStringField('exploreProducts', 'Explorar produtos'),
        localizedStringField('viewCases', 'Ver casos'),
        localizedStringField('allProducts', 'Todos os produtos'),
        localizedStringField('latestPosts', 'Artigos recentes'),
        localizedStringField('challenge', 'Desafio', undefined, {hidden: true}),
        localizedStringField('solution', 'Solução', undefined, {hidden: true}),
        localizedStringField('result', 'Resultado', undefined, {hidden: true}),
        localizedStringField('emailLabel', 'Nome do email'),
        localizedStringField('phoneLabel', 'Nome do telefone'),
        localizedStringField('backToProducts', 'Voltar aos produtos'),
        localizedStringField('backToCases', 'Voltar aos casos'),
        localizedStringField('backToBlog', 'Voltar ao blog'),
        localizedStringField('searchProducts', 'Pesquisar produtos'),
        localizedStringField('searchCases', 'Pesquisar casos'),
        localizedStringField('searchPosts', 'Pesquisar artigos'),
        localizedStringField('searchPlaceholder', 'Texto dentro da pesquisa'),
        localizedStringField('noResults', 'Sem resultados'),
        localizedStringField('pageLabel', 'Nome da paginação'),
        localizedStringField('previous', 'Página anterior'),
        localizedStringField('next', 'Página seguinte'),
        localizedStringField('zoomImage', 'Ampliar imagem'),
        localizedStringField('downloadsTitle', 'Título dos ficheiros para download'),
        localizedStringField('close', 'Fechar'),
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
        localizedTextField('cookieNoticeMessage', 'Mensagem do aviso de cookies'),
        localizedStringField('cookieNoticeLearnMore', 'Ligação do aviso de cookies'),
        localizedStringField('cookieNoticeAccept', 'Botão do aviso de cookies'),
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

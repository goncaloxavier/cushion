import {defaultStoreCategoryOptions} from '$lib/store-categories'
import type {SiteEditorField, SiteEditorPanel} from './types'

const localizedString = (name: string, label: string, description?: string): SiteEditorField => ({
  name,
  label,
  description,
  type: 'localizedString',
})

const localizedText = (name: string, label: string, description?: string): SiteEditorField => ({
  name,
  label,
  description,
  type: 'localizedText',
  rows: 5,
})

const image = (name: string, label = 'Imagem', description?: string): SiteEditorField => ({
  name,
  label,
  description,
  type: 'image',
})

const copyBlock = (name: string, label: string, lead = false): SiteEditorField => ({
  name,
  label,
  type: 'object',
  fields: [
    localizedString('kicker', 'Etiqueta', 'Texto curto acima do título.'),
    localizedString('title', 'Título'),
    ...(lead ? [localizedText('lead', 'Texto de apoio')] : []),
  ],
})

const contentCardItem: SiteEditorField = {
  name: 'item',
  label: 'Item',
  type: 'object',
  fields: [localizedString('title', 'Título'), localizedText('text', 'Texto')],
}

const navItem: SiteEditorField = {
  name: 'item',
  label: 'Ligação',
  type: 'object',
  fields: [
    localizedString('label', 'Nome'),
    {name: 'href', label: 'Destino', type: 'string', description: 'Exemplo: /loja ou https://…'},
    {
      name: 'placement',
      label: 'Zona',
      type: 'select',
      options: [
        {label: 'Navegação principal', value: 'primary'},
        {label: 'Ações do cabeçalho', value: 'utility'},
      ],
    },
    {name: 'visibleDesktop', label: 'Mostrar no computador', type: 'boolean'},
    {name: 'visibleMobile', label: 'Mostrar no telemóvel', type: 'boolean'},
    {name: 'newTab', label: 'Abrir num novo separador', type: 'boolean'},
  ],
}

const gallery: SiteEditorField = {
  name: 'gallery',
  label: 'Galeria',
  type: 'gallery',
  description: 'Imagens e vídeos apresentados nesta página',
}

const contactFormLabelFields = [
  localizedString('firstName', 'Primeiro nome'),
  localizedString('lastName', 'Apelido'),
  localizedString('email', 'Email'),
  localizedString('phone', 'Telefone'),
  localizedString('address', 'Morada'),
  localizedString('postalCode', 'Código postal'),
  localizedString('locality', 'Localidade'),
  localizedString('message', 'Mensagem'),
]

const baseDocumentPanels = (titleLabel: string): SiteEditorPanel[] => [
  {
    id: 'content',
    label: 'Conteúdo',
    fields: [
      {...localizedString('title', titleLabel), required: true},
      {name: 'slug', label: 'Endereço da página', type: 'slug'},
    ],
  },
]

export const siteScopePanels: Record<string, SiteEditorPanel[]> = {
  navigation: [
    {
      id: 'navigation',
      label: 'Cabeçalho',
      description: 'A ordem desta lista é a ordem apresentada no site',
      fields: [
        {
          name: 'navigation',
          label: 'Navegação',
          type: 'navigation',
          item: navItem,
        },
      ],
    },
  ],
  home: [
    {
      id: 'home-main',
      label: 'Página inicial',
      fields: [
        {
          name: 'hero',
          label: 'Topo da página',
          type: 'object',
          fields: [localizedString('title', 'Título principal')],
        },
        {
          name: 'heroVideo',
          label: 'Vídeo do topo',
          description: 'Opcional. Carregue um vídeo ou cole um link do YouTube',
          type: 'video',
        },
        localizedString('heroVideoLabel', 'Texto do botão do vídeo'),
        localizedString('heroVideoCloseLabel', 'Texto para fechar o vídeo'),
        {
          name: 'impact',
          label: 'Impacto e prova',
          type: 'object',
          fields: [
            localizedString('title', 'Título'),
            {name: 'stats', label: 'Números', type: 'array', item: contentCardItem},
          ],
        },
        {
          name: 'partners',
          label: 'Parceiros e projetos',
          type: 'object',
          fields: [
            localizedString('kicker', 'Etiqueta'),
            localizedString('title', 'Título'),
            localizedText('lead', 'Texto'),
            {
              name: 'items',
              label: 'Parceiros',
              type: 'array',
              item: {
                name: 'item',
                label: 'Parceiro',
                type: 'object',
                fields: [
                  {name: 'name', label: 'Nome', type: 'string'},
                  {name: 'url', label: 'Ligação', type: 'url'},
                  image('logo', 'Logótipo'),
                  localizedText('text', 'Texto'),
                ],
              },
            },
          ],
        },
      ],
    },
  ],
  about: [
    {
      id: 'about-main',
      label: 'Página Sobre',
      fields: [
        copyBlock('hero', 'Topo da página'),
        copyBlock('statement', 'Apresentação da história'),
        {name: 'timeline', label: 'Momentos da empresa', type: 'array', item: contentCardItem},
      ],
    },
  ],
  productsPage: [
    {
      id: 'products-page',
      label: 'Página Produtos',
      fields: [copyBlock('hero', 'Topo da página'), image('heroImage', 'Imagem principal')],
    },
  ],
  storePage: [
    {
      id: 'store-page-hero',
      label: 'Topo da Loja',
      description: 'Título e etiqueta apresentados no início da Loja',
      fields: [copyBlock('hero', 'Texto do topo')],
    },
    {
      id: 'store-page-transport',
      label: 'Cálculo do transporte',
      description: 'Valor global usado para calcular o transporte em toda a Loja',
      fields: [
        {
          name: 'transportMultiplier',
          label: 'Multiplicador de transporte',
          description: 'Aplicado ao preço da transportadora antes do IVA',
          type: 'number',
          min: 0.1,
          max: 20,
          step: 0.1,
        },
      ],
    },
  ],
  cartPage: [
    {
      id: 'cart-page',
      label: 'Página Carrinho',
      fields: [
        copyBlock('hero', 'Topo da página'),
        localizedString('cartItems', 'Produtos no carrinho'),
        localizedString('empty', 'Carrinho vazio'),
        localizedString('continueShopping', 'Continuar na Loja'),
        localizedString('clear', 'Limpar carrinho'),
        localizedText('clearConfirm', 'Confirmação para limpar'),
        localizedString('request', 'Finalizar pedido'),
        localizedString('quantity', 'Quantidade'),
        localizedString('remove', 'Remover produto'),
        localizedString('removed', 'Aviso de produto removido'),
        localizedString('finish', 'Acabamento'),
        localizedString('unitPrice', 'Preço unitário'),
        localizedString('total', 'Total da linha'),
        localizedString('productSubtotal', 'Subtotal dos produtos'),
        localizedString('transport', 'Transporte'),
        localizedString('iva', 'IVA'),
        localizedString('finalTotal', 'Total final'),
        localizedString('deliveryPostcode', 'Zona de entrega'),
        localizedString('changePostcode', 'Alterar código postal'),
        localizedString('totalWeight', 'Peso total'),
        localizedString('transportPending', 'Transporte por confirmar'),
        localizedText('transportOverweight', 'Aviso de excesso de peso'),
        localizedString('summary', 'Resumo'),
        localizedString('product', 'Produto'),
      ],
    },
  ],
  catalogue: [
    {
      id: 'catalogue-page',
      label: 'Página Catálogo',
      fields: [
        copyBlock('hero', 'Topo da página'),
        localizedString('ctaLabel', 'Texto do botão'),
        {
          name: 'formLabels',
          label: 'Nomes dos campos',
          type: 'object',
          fields: contactFormLabelFields,
        },
        {
          name: 'estimate',
          label: 'Pedido de catálogo',
          type: 'object',
          fields: [
            localizedString('kicker', 'Etiqueta'),
            localizedString('title', 'Título'),
            localizedText('lead', 'Texto'),
            localizedString('checklistTitle', 'Título da lista'),
            {
              name: 'checklist',
              label: 'Itens',
              type: 'array',
              item: localizedString('item', 'Item'),
            },
          ],
        },
      ],
    },
  ],
  casesPage: [
    {
      id: 'cases-page',
      label: 'Página Casos',
      fields: [copyBlock('hero', 'Topo da página'), image('heroImage', 'Imagem principal')],
    },
  ],
  blogPage: [
    {
      id: 'blog-page',
      label: 'Página Blog',
      fields: [copyBlock('hero', 'Topo da página'), image('heroImage', 'Imagem principal')],
    },
  ],
  contactPage: [
    {
      id: 'contact-page',
      label: 'Página Contacto',
      fields: [
        copyBlock('hero', 'Topo da página', true),
        {
          name: 'formLabels',
          label: 'Nomes dos campos',
          type: 'object',
          fields: [
            localizedString('firstName', 'Primeiro nome'),
            localizedString('lastName', 'Apelido'),
            localizedString('email', 'Email'),
            localizedString('phone', 'Telefone'),
            localizedString('address', 'Morada'),
            localizedString('postalCode', 'Código postal'),
            localizedString('locality', 'Localidade'),
            localizedString('message', 'Mensagem'),
          ],
        },
      ],
    },
  ],
  returnsPolicy: [
    {
      id: 'returns-policy',
      label: 'Política de devoluções',
      fields: [
        localizedString('kicker', 'Etiqueta'),
        localizedString('title', 'Título'),
        localizedText('lead', 'Texto'),
        {
          name: 'conditions',
          label: 'Condições',
          type: 'array',
          item: localizedString('item', 'Condição'),
        },
      ],
    },
  ],
  common: [
    {
      id: 'contact',
      label: 'Contacto e redes',
      fields: [
        {name: 'contactEmail', label: 'Email', type: 'email'},
        {name: 'contactPhone', label: 'Telefone', type: 'string'},
        {name: 'whatsappUrl', label: 'WhatsApp', type: 'url'},
        localizedString('whatsappLabel', 'Texto do WhatsApp'),
        {name: 'instagramUrl', label: 'Instagram', type: 'url'},
        {name: 'facebookUrl', label: 'Facebook', type: 'url'},
        {name: 'youtubeUrl', label: 'YouTube', type: 'url'},
      ],
    },
    {
      id: 'legal',
      label: 'Rodapé e legal',
      fields: [
        localizedString('complaintsLabel', 'Livro de Reclamações'),
        {name: 'complaintsUrl', label: 'Ligação do Livro de Reclamações', type: 'url'},
        localizedText('complaintsNote', 'Nota legal'),
        localizedString('privacyPolicyLabel', 'Política de Privacidade'),
        {name: 'privacyPolicyUrl', label: 'Ligação da Política de Privacidade', type: 'url'},
        localizedString('cookiePolicyLabel', 'Política de Cookies'),
        {name: 'cookiePolicyUrl', label: 'Ligação da Política de Cookies', type: 'url'},
        localizedText('cookieNoticeMessage', 'Mensagem do aviso de cookies'),
        localizedString('cookieNoticeLearnMore', 'Ligação do aviso de cookies'),
        localizedString('cookieNoticeAccept', 'Botão do aviso de cookies'),
        localizedText('marketingConsent', 'Consentimento de contacto'),
        localizedString('privacyConsentPrefix', 'Texto antes da política'),
      ],
    },
    {
      id: 'shared-copy',
      label: 'Textos partilhados',
      description: 'Botões, pesquisa, paginação e ligações repetidas no site',
      fields: [
        localizedString('readMore', 'Ler mais'),
        localizedString('requestQuote', 'Pedir orçamento'),
        localizedString('exploreProducts', 'Explorar produtos'),
        localizedString('viewCases', 'Ver casos'),
        localizedString('allProducts', 'Todos os produtos'),
        localizedString('latestPosts', 'Artigos recentes'),
        localizedString('emailLabel', 'Email'),
        localizedString('phoneLabel', 'Telefone'),
        localizedString('backToProducts', 'Voltar aos produtos'),
        localizedString('backToCases', 'Voltar aos casos'),
        localizedString('backToBlog', 'Voltar ao blog'),
        localizedString('searchProducts', 'Pesquisar produtos'),
        localizedString('searchCases', 'Pesquisar casos'),
        localizedString('searchPosts', 'Pesquisar artigos'),
        localizedString('searchPlaceholder', 'Texto da pesquisa'),
        localizedString('noResults', 'Sem resultados'),
        localizedString('pageLabel', 'Paginação'),
        localizedString('previous', 'Anterior'),
        localizedString('next', 'Seguinte'),
        localizedString('zoomImage', 'Ampliar imagem'),
        localizedString('close', 'Fechar'),
      ],
    },
  ],
}

export const documentPanels: Record<string, SiteEditorPanel[]> = {
  productCategory: [
    {
      ...baseDocumentPanels('Nome da solução')[0],
      fields: [
        ...baseDocumentPanels('Nome da solução')[0].fields,
        localizedText('summary', 'Resumo'),
        localizedText('description', 'Descrição'),
      ],
    },
    {id: 'media', label: 'Imagens e vídeos', fields: [image('image', 'Imagem principal'), gallery]},
    {
      id: 'organization',
      label: 'Organização',
      fields: [{name: 'orderRank', label: 'Ordem', type: 'number', step: 1}],
    },
  ],
  storeCategory: [
    {
      id: 'content',
      label: 'Categoria',
      description: 'Nome e identificador usados nos filtros da Loja',
      fields: [{...localizedString('title', 'Nome da categoria'), required: true}],
    },
    {
      id: 'organization',
      label: 'Ordem',
      description: 'Escolha a posição da categoria no filtro',
      fields: [{name: 'orderRank', label: 'Ordem de apresentação', type: 'number', step: 1}],
    },
  ],
  storeProduct: [
    {
      ...baseDocumentPanels('Nome do produto')[0],
      fields: [
        ...baseDocumentPanels('Nome do produto')[0].fields,
        {
          name: 'category',
          label: 'Categoria',
          type: 'select',
          description: 'As categorias são geridas em Conteúdo > Categorias da Loja',
          options: defaultStoreCategoryOptions,
          optionsSource: 'storeCategories',
        },
        localizedText('summary', 'Resumo'),
      ],
    },
    {
      id: 'pricing',
      label: 'Opções, pesos e preços',
      fields: [
        {name: 'hasFinishChoice', label: 'Permitir escolha de acabamento', type: 'boolean'},
        {
          name: 'variants',
          label: 'Opções compráveis',
          type: 'array',
          item: {
            name: 'item',
            label: 'Opção',
            type: 'object',
            fields: [
              localizedString('label', 'Nome da opção'),
              {
                name: 'dimensions',
                label: 'Dimensões',
                type: 'array',
                item: localizedString('item', 'Medida'),
              },
              {name: 'weightKg', label: 'Peso (kg)', type: 'number', min: 0.01, step: 0.01},
              {
                name: 'priceNatural',
                label: 'Natural/Cinza sem IVA',
                type: 'number',
                min: 0,
                step: 0.01,
              },
              {
                name: 'priceDark',
                label: 'Castanho/Preto sem IVA',
                type: 'number',
                min: 0,
                step: 0.01,
              },
              localizedText('note', 'Nota'),
            ],
          },
        },
        {name: 'flatTransportPrice', label: 'Transporte fixo', type: 'number', min: 0, step: 0.01},
      ],
    },
    {id: 'media', label: 'Imagens e vídeos', fields: [image('image', 'Imagem principal'), gallery]},
    {
      id: 'organization',
      label: 'Visibilidade',
      fields: [
        {name: 'active', label: 'Mostrar na Loja', type: 'boolean'},
        {name: 'orderRank', label: 'Ordem', type: 'number', step: 1},
      ],
    },
  ],
  caseStudy: [
    {
      ...baseDocumentPanels('Nome do caso')[0],
      fields: [
        ...baseDocumentPanels('Nome do caso')[0].fields,
        localizedString('location', 'Local'),
        localizedText('summary', 'Resumo'),
        localizedText('description', 'Descrição'),
      ],
    },
    {id: 'media', label: 'Imagens e vídeos', fields: [image('image', 'Imagem principal'), gallery]},
    {
      id: 'organization',
      label: 'Organização',
      fields: [{name: 'orderRank', label: 'Ordem', type: 'number', step: 1}],
    },
  ],
  blogPost: [
    {
      id: 'article-details',
      label: 'Informação do artigo',
      description: 'Título, data, tema e resumo',
      fields: [
        ...baseDocumentPanels('Título do artigo')[0].fields,
        {name: 'publishedAt', label: 'Data de publicação', type: 'date'},
        localizedString('category', 'Tema'),
        localizedText('excerpt', 'Resumo'),
      ],
    },
    {
      id: 'article-content',
      label: 'Texto do artigo',
      description: 'Parágrafos, títulos, imagens e vídeos',
      fields: [
        {
          name: 'article',
          label: 'Texto do artigo',
          description: 'Escreva e formate o artigo num único documento',
          type: 'article',
        },
      ],
    },
    {
      id: 'media',
      label: 'Capa e galeria',
      description: 'Imagem de capa e ficheiros adicionais',
      fields: [image('image', 'Imagem de capa'), gallery],
    },
  ],
  sitePage: [
    {
      id: 'page',
      label: 'Página',
      fields: [
        {name: 'title', label: 'Nome da página', type: 'string', required: true},
        {
          name: 'route',
          label: 'Endereço',
          type: 'string',
          description: 'Exemplo: /sustentabilidade',
          required: true,
        },
        {name: 'active', label: 'Mostrar no site', type: 'boolean'},
        {name: 'sections', label: 'Estrutura da página', type: 'sections'},
      ],
    },
    {
      id: 'seo',
      label: 'Pesquisa e partilha',
      fields: [
        {
          name: 'seo',
          label: 'SEO',
          type: 'object',
          fields: [
            localizedString('title', 'Título nos motores de pesquisa'),
            localizedText('description', 'Descrição nos motores de pesquisa'),
            {name: 'noIndex', label: 'Ocultar dos motores de pesquisa', type: 'boolean'},
          ],
        },
      ],
    },
  ],
}

export const panelsForEditorNode = (documentType: string | undefined, rootPath?: string) => {
  if (documentType === 'siteLanding' && rootPath?.startsWith('navigation[')) {
    return [
      {
        id: 'navigation-item',
        label: 'Ligação do cabeçalho',
        fields: navItem.fields ?? [],
      },
    ]
  }
  if (documentType === 'siteLanding' && rootPath) return siteScopePanels[rootPath] ?? []
  return (documentType && documentPanels[documentType]) || []
}

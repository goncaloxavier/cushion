import {defaultStoreCategoryOptions} from '$lib/store-categories'
import type {SiteEditorField, SiteEditorPanel} from './types'

const localizedString = (
  name: string,
  label: string,
  description?: string,
  placeholder?: string,
): SiteEditorField => ({
  name,
  label,
  description,
  placeholder,
  type: 'localizedString',
})

const localizedText = (
  name: string,
  label: string,
  description?: string,
  placeholder?: string,
): SiteEditorField => ({
  name,
  label,
  description,
  placeholder,
  type: 'localizedText',
  rows: 5,
})

const image = (name: string, label = 'Imagem', description?: string): SiteEditorField => ({
  name,
  label,
  description,
  type: 'image',
})

const copyBlock = (
  name: string,
  label: string,
  lead = false,
  placeholders: {kicker?: string; title?: string; lead?: string} = {},
): SiteEditorField => ({
  name,
  label,
  type: 'object',
  fields: [
    localizedString(
      'kicker',
      'Etiqueta',
      'Texto curto acima do título',
      placeholders.kicker ?? 'Ex.: Sobre nós',
    ),
    localizedString(
      'title',
      'Título',
      undefined,
      placeholders.title ?? 'Ex.: Feito para durar no exterior',
    ),
    ...(lead
      ? [
          localizedText(
            'lead',
            'Texto de apoio',
            undefined,
            placeholders.lead ?? 'Ex.: Uma frase curta que resume o que esta página oferece.',
          ),
        ]
      : []),
  ],
})

const contentCardItem: SiteEditorField = {
  name: 'item',
  label: 'Item',
  type: 'object',
  fields: [
    localizedString('title', 'Título', undefined, 'Ex.: 12 anos de garantia'),
    localizedText(
      'text',
      'Texto',
      undefined,
      'Ex.: Resistente aos raios UV, à chuva e à salinidade.',
    ),
  ],
}

const navItem: SiteEditorField = {
  name: 'item',
  label: 'Ligação',
  type: 'object',
  fields: [
    localizedString('label', 'Nome', undefined, 'Ex.: Sustentabilidade'),
    {
      name: 'href',
      label: 'Destino',
      type: 'string',
      description: 'Exemplo: /loja ou https://…',
      placeholder: '/sustentabilidade',
    },
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

const productContentSectionItem: SiteEditorField = {
  name: 'item',
  label: 'Secção',
  type: 'object',
  fields: [
    {
      name: 'mediaKind',
      label: 'Conteúdo visual',
      type: 'select',
      required: true,
      options: [
        {label: 'Imagem', value: 'image'},
        {label: 'Vídeo', value: 'video'},
      ],
    },
    {
      ...image('image', 'Imagem'),
      visibleWhen: {sibling: 'mediaKind', equals: 'image'},
    },
    {
      name: 'video',
      label: 'Vídeo',
      description: 'Carregue um ficheiro ou cole um link do YouTube',
      type: 'video',
      visibleWhen: {sibling: 'mediaKind', equals: 'video'},
    },
    {
      ...image('poster', 'Imagem de capa', 'Opcional. Aparece enquanto o vídeo carrega'),
      visibleWhen: {sibling: 'mediaKind', equals: 'video'},
    },
    {
      ...localizedString(
        'videoTitle',
        'Nome do vídeo',
        'Identifica o vídeo para leitores de ecrã',
        'Ex.: Deck instalado num terraço',
      ),
      visibleWhen: {sibling: 'mediaKind', equals: 'video'},
    },
    localizedString(
      'title',
      'Título por baixo',
      'Opcional',
      'Ex.: Planeie o seu espaço',
    ),
    localizedText(
      'text',
      'Texto por baixo',
      'Opcional',
      'Ex.: Veja a aplicação em contexto e conheça as opções disponíveis.',
    ),
    localizedString(
      'buttonLabel',
      'Texto do botão',
      'Opcional. Preencha também o destino',
      'Ex.: Abrir simulador',
    ),
    {
      name: 'buttonUrl',
      label: 'Destino do botão',
      description: 'Opcional. Página do site ou ligação externa',
      placeholder: 'https://…',
      type: 'url',
    },
  ],
}

const contactFormLabelFields = [
  localizedString('firstName', 'Primeiro nome', undefined, 'Ex.: Primeiro nome'),
  localizedString('lastName', 'Apelido', undefined, 'Ex.: Apelido'),
  localizedString('email', 'Email', undefined, 'Ex.: Email'),
  localizedString('phone', 'Telefone', undefined, 'Ex.: Telefone'),
  localizedString('address', 'Morada', undefined, 'Ex.: Morada'),
  localizedString('postalCode', 'Código postal', undefined, 'Ex.: Código postal'),
  localizedString('locality', 'Localidade', undefined, 'Ex.: Localidade'),
  localizedString('message', 'Mensagem', undefined, 'Ex.: Mensagem'),
]

const baseDocumentPanels = (titleLabel: string, titlePlaceholder?: string): SiteEditorPanel[] => [
  {
    id: 'content',
    label: 'Conteúdo',
    fields: [
      {...localizedString('title', titleLabel, undefined, titlePlaceholder), required: true},
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
          fields: [
            localizedString(
              'title',
              'Título principal',
              undefined,
              'Ex.: Transformamos resíduos em soluções que duram',
            ),
          ],
        },
        {
          name: 'heroVideo',
          label: 'Vídeo do topo',
          description: 'Opcional. Carregue um vídeo ou cole um link do YouTube',
          type: 'video',
        },
        localizedString(
          'heroVideoLabel',
          'Texto do botão do vídeo',
          undefined,
          'Ex.: Ver vídeo institucional',
        ),
        localizedString(
          'heroVideoCloseLabel',
          'Texto para fechar o vídeo',
          undefined,
          'Ex.: Fechar vídeo',
        ),
        {
          name: 'impact',
          label: 'Impacto e prova',
          type: 'object',
          fields: [
            localizedString(
              'title',
              'Título',
              undefined,
              'Ex.: Menos desperdício, mais futuro',
            ),
            {name: 'stats', label: 'Números', type: 'array', item: contentCardItem},
          ],
        },
        {
          name: 'partners',
          label: 'Parceiros e projetos',
          type: 'object',
          fields: [
            localizedString('kicker', 'Etiqueta', undefined, 'Ex.: Parceiros'),
            localizedString('title', 'Título', undefined, 'Ex.: Quem confia em nós'),
            localizedText(
              'lead',
              'Texto',
              undefined,
              'Ex.: Empresas e projetos que já transformaram resíduos em soluções duradouras.',
            ),
            {
              name: 'items',
              label: 'Parceiros',
              type: 'array',
              item: {
                name: 'item',
                label: 'Parceiro',
                type: 'object',
                fields: [
                  {
                    name: 'name',
                    label: 'Nome',
                    type: 'string',
                    placeholder: 'Ex.: Câmara Municipal de Condeixa',
                  },
                  {name: 'url', label: 'Ligação', type: 'url', placeholder: 'https://…'},
                  image('logo', 'Logótipo'),
                  localizedText(
                    'text',
                    'Texto',
                    undefined,
                    'Ex.: Parceria na requalificação de espaços públicos.',
                  ),
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
        copyBlock('hero', 'Topo da página', false, {
          kicker: 'Ex.: Sobre nós',
          title: 'Ex.: Feito para durar no exterior',
        }),
        copyBlock('statement', 'Apresentação da história', false, {
          kicker: 'Ex.: A nossa história',
          title: 'Ex.: Do resíduo ao produto acabado',
        }),
        {name: 'timeline', label: 'Momentos da empresa', type: 'array', item: contentCardItem},
      ],
    },
  ],
  productsPage: [
    {
      id: 'products-page',
      label: 'Página Produtos',
      fields: [
        copyBlock('hero', 'Topo da página', false, {
          kicker: 'Ex.: Produtos',
          title: 'Ex.: Soluções para exterior que não precisam de manutenção',
        }),
        image('heroImage', 'Imagem principal'),
      ],
    },
  ],
  storePage: [
    {
      id: 'store-page-hero',
      label: 'Topo da Loja',
      description: 'Título e etiqueta apresentados no início da Loja',
      fields: [
        copyBlock('hero', 'Texto do topo', false, {
          kicker: 'Ex.: Loja',
          title: 'Ex.: Produtos com preço para pedido direto',
        }),
      ],
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
        copyBlock('hero', 'Topo da página', false, {
          kicker: 'Ex.: Carrinho',
          title: 'Ex.: O seu carrinho',
        }),
        localizedString('cartItems', 'Produtos no carrinho', undefined, 'Ex.: Produtos no carrinho'),
        localizedString('empty', 'Carrinho vazio', undefined, 'Ex.: O seu carrinho está vazio'),
        localizedString(
          'continueShopping',
          'Continuar na Loja',
          undefined,
          'Ex.: Continuar a comprar',
        ),
        localizedString('clear', 'Limpar carrinho', undefined, 'Ex.: Limpar carrinho'),
        localizedText(
          'clearConfirm',
          'Confirmação para limpar',
          undefined,
          'Ex.: Tem a certeza que quer remover todos os produtos?',
        ),
        localizedString('request', 'Finalizar pedido', undefined, 'Ex.: Finalizar pedido'),
        localizedString('quantity', 'Quantidade', undefined, 'Ex.: Quantidade'),
        localizedString('remove', 'Remover produto', undefined, 'Ex.: Remover'),
        localizedString(
          'removed',
          'Aviso de produto removido',
          undefined,
          'Ex.: Produto removido do carrinho',
        ),
        localizedString('finish', 'Acabamento', undefined, 'Ex.: Acabamento'),
        localizedString('unitPrice', 'Preço unitário', undefined, 'Ex.: Preço unitário'),
        localizedString('total', 'Total da linha', undefined, 'Ex.: Total'),
        localizedString(
          'productSubtotal',
          'Subtotal dos produtos',
          undefined,
          'Ex.: Subtotal',
        ),
        localizedString('transport', 'Transporte', undefined, 'Ex.: Transporte'),
        localizedString('iva', 'IVA', undefined, 'Ex.: IVA'),
        localizedString('finalTotal', 'Total final', undefined, 'Ex.: Total a pagar'),
        localizedString(
          'deliveryPostcode',
          'Zona de entrega',
          undefined,
          'Ex.: Código postal de entrega',
        ),
        localizedString(
          'changePostcode',
          'Alterar código postal',
          undefined,
          'Ex.: Alterar código postal',
        ),
        localizedString('totalWeight', 'Peso total', undefined, 'Ex.: Peso total'),
        localizedString(
          'transportPending',
          'Transporte por confirmar',
          undefined,
          'Ex.: Indique o código postal para calcular o transporte',
        ),
        localizedText(
          'transportOverweight',
          'Aviso de excesso de peso',
          undefined,
          'Ex.: Este pedido excede o limite de peso da transportadora. Contacte-nos para uma solução.',
        ),
        localizedString('summary', 'Resumo', undefined, 'Ex.: Resumo do pedido'),
        localizedString('product', 'Produto', undefined, 'Ex.: Produto'),
      ],
    },
  ],
  catalogue: [
    {
      id: 'catalogue-page',
      label: 'Página Catálogo',
      fields: [
        copyBlock('hero', 'Topo da página', false, {
          kicker: 'Ex.: Catálogo',
          title: 'Ex.: Peça o catálogo completo',
        }),
        localizedString('ctaLabel', 'Texto do botão', undefined, 'Ex.: Pedir catálogo'),
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
            localizedString('kicker', 'Etiqueta', undefined, 'Ex.: Pedido de catálogo'),
            localizedString('title', 'Título', undefined, 'Ex.: Receba o catálogo por email'),
            localizedText(
              'lead',
              'Texto',
              undefined,
              'Ex.: Preencha os seus dados e enviamos o catálogo completo.',
            ),
            localizedString(
              'checklistTitle',
              'Título da lista',
              undefined,
              'Ex.: No formulário, indique',
            ),
            {
              name: 'checklist',
              label: 'Itens',
              type: 'array',
              item: localizedString(
                'item',
                'Item',
                undefined,
                'Ex.: O tipo de produto que procura',
              ),
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
      fields: [
        copyBlock('hero', 'Topo da página', false, {
          kicker: 'Ex.: Casos de estudo',
          title: 'Ex.: Projetos reais, resultados duradouros',
        }),
        image('heroImage', 'Imagem principal'),
      ],
    },
  ],
  blogPage: [
    {
      id: 'blog-page',
      label: 'Página Blog',
      fields: [
        copyBlock('hero', 'Topo da página', false, {
          kicker: 'Ex.: Blog',
          title: 'Ex.: Ideias e novidades sobre exterior sustentável',
        }),
        image('heroImage', 'Imagem principal'),
      ],
    },
  ],
  contactPage: [
    {
      id: 'contact-page',
      label: 'Página Contacto',
      fields: [
        copyBlock('hero', 'Topo da página', true, {
          kicker: 'Ex.: Contacto',
          title: 'Ex.: Fale connosco',
          lead: 'Ex.: Tire dúvidas ou peça um orçamento sem compromisso.',
        }),
        {
          name: 'formLabels',
          label: 'Nomes dos campos',
          type: 'object',
          fields: contactFormLabelFields,
        },
      ],
    },
  ],
  returnsPolicy: [
    {
      id: 'returns-policy',
      label: 'Política de devoluções',
      fields: [
        localizedString('kicker', 'Etiqueta', undefined, 'Ex.: Política'),
        localizedString('title', 'Título', undefined, 'Ex.: Política de devoluções'),
        localizedText(
          'lead',
          'Texto',
          undefined,
          'Ex.: Aceitamos devoluções, nas seguintes condições:',
        ),
        {
          name: 'conditions',
          label: 'Condições',
          type: 'array',
          item: localizedString(
            'item',
            'Condição',
            undefined,
            'Ex.: Produto entregue à empresa de logística ao nível da rua',
          ),
        },
      ],
    },
  ],
  common: [
    {
      id: 'contact',
      label: 'Contacto e redes',
      fields: [
        {
          name: 'contactEmail',
          label: 'Email',
          type: 'email',
          placeholder: 'Ex.: geral@dafabrica4you.pt',
        },
        {
          name: 'contactPhone',
          label: 'Telefone',
          type: 'string',
          placeholder: 'Ex.: +351 239 000 000',
        },
        {name: 'whatsappUrl', label: 'WhatsApp', type: 'url', placeholder: 'https://wa.me/351…'},
        localizedString(
          'whatsappLabel',
          'Texto do WhatsApp',
          undefined,
          'Ex.: Fale connosco no WhatsApp',
        ),
        {
          name: 'instagramUrl',
          label: 'Instagram',
          type: 'url',
          placeholder: 'https://instagram.com/…',
        },
        {
          name: 'facebookUrl',
          label: 'Facebook',
          type: 'url',
          placeholder: 'https://facebook.com/…',
        },
        {
          name: 'youtubeUrl',
          label: 'YouTube',
          type: 'url',
          placeholder: 'https://youtube.com/@…',
        },
      ],
    },
    {
      id: 'legal',
      label: 'Rodapé e legal',
      fields: [
        localizedString(
          'complaintsLabel',
          'Livro de Reclamações',
          undefined,
          'Ex.: Livro de Reclamações',
        ),
        {
          name: 'complaintsUrl',
          label: 'Ligação do Livro de Reclamações',
          type: 'url',
          placeholder: 'https://www.livroreclamacoes.pt/…',
        },
        localizedText(
          'complaintsNote',
          'Nota legal',
          undefined,
          'Ex.: Enquanto entidade prestadora de bens e/ou serviços, disponibilizamos Livro de Reclamações físico e eletrónico.',
        ),
        localizedString(
          'privacyPolicyLabel',
          'Política de Privacidade',
          undefined,
          'Ex.: Política de Privacidade',
        ),
        {
          name: 'privacyPolicyUrl',
          label: 'Ligação da Política de Privacidade',
          type: 'url',
          placeholder: '/politica-de-privacidade',
        },
        localizedString(
          'cookiePolicyLabel',
          'Política de Cookies',
          undefined,
          'Ex.: Política de Cookies',
        ),
        {
          name: 'cookiePolicyUrl',
          label: 'Ligação da Política de Cookies',
          type: 'url',
          placeholder: '/politica-de-cookies',
        },
        localizedText(
          'cookieNoticeMessage',
          'Mensagem do aviso de cookies',
          undefined,
          'Ex.: Utilizamos cookies para melhorar a sua experiência no site.',
        ),
        localizedString(
          'cookieNoticeLearnMore',
          'Ligação do aviso de cookies',
          undefined,
          'Ex.: Saber mais',
        ),
        localizedString(
          'cookieNoticeAccept',
          'Botão do aviso de cookies',
          undefined,
          'Ex.: Aceitar',
        ),
        localizedText(
          'marketingConsent',
          'Consentimento de contacto',
          undefined,
          'Ex.: Aceito receber comunicações da DaFábrica4You.',
        ),
        localizedString(
          'privacyConsentPrefix',
          'Texto antes da política',
          undefined,
          'Ex.: Ao submeter, aceita a nossa',
        ),
      ],
    },
    {
      id: 'shared-copy',
      label: 'Textos partilhados',
      description: 'Botões, pesquisa, paginação e ligações repetidas no site',
      fields: [
        localizedString('readMore', 'Ler mais', undefined, 'Ex.: Ler mais'),
        localizedString('requestQuote', 'Pedir orçamento', undefined, 'Ex.: Pedir orçamento'),
        localizedString(
          'exploreProducts',
          'Explorar produtos',
          undefined,
          'Ex.: Explorar produtos',
        ),
        localizedString('viewCases', 'Ver casos', undefined, 'Ex.: Ver casos'),
        localizedString('allProducts', 'Todos os produtos', undefined, 'Ex.: Todos os produtos'),
        localizedString('latestPosts', 'Artigos recentes', undefined, 'Ex.: Artigos recentes'),
        localizedString('emailLabel', 'Email', undefined, 'Ex.: Email'),
        localizedString('phoneLabel', 'Telefone', undefined, 'Ex.: Telefone'),
        localizedString(
          'backToProducts',
          'Voltar aos produtos',
          undefined,
          'Ex.: Voltar aos produtos',
        ),
        localizedString('backToCases', 'Voltar aos casos', undefined, 'Ex.: Voltar aos casos'),
        localizedString('backToBlog', 'Voltar ao blog', undefined, 'Ex.: Voltar ao blog'),
        localizedString(
          'searchProducts',
          'Pesquisar produtos',
          undefined,
          'Ex.: Pesquisar produtos',
        ),
        localizedString('searchCases', 'Pesquisar casos', undefined, 'Ex.: Pesquisar casos'),
        localizedString('searchPosts', 'Pesquisar artigos', undefined, 'Ex.: Pesquisar artigos'),
        localizedString(
          'searchPlaceholder',
          'Texto da pesquisa',
          undefined,
          'Ex.: O que procura?',
        ),
        localizedString('noResults', 'Sem resultados', undefined, 'Ex.: Sem resultados'),
        localizedString('pageLabel', 'Paginação', undefined, 'Ex.: Página'),
        localizedString('previous', 'Anterior', undefined, 'Ex.: Anterior'),
        localizedString('next', 'Seguinte', undefined, 'Ex.: Seguinte'),
        localizedString('zoomImage', 'Ampliar imagem', undefined, 'Ex.: Ampliar imagem'),
        localizedString('close', 'Fechar', undefined, 'Ex.: Fechar'),
      ],
    },
  ],
}

export const documentPanels: Record<string, SiteEditorPanel[]> = {
  productCategory: [
    {
      ...baseDocumentPanels('Nome da solução', 'Ex.: Bancos para exterior')[0],
      fields: [
        ...baseDocumentPanels('Nome da solução', 'Ex.: Bancos para exterior')[0].fields,
        localizedText(
          'description',
          'Descrição',
          undefined,
          'Ex.: Bancos robustos em plástico reciclado, prontos a instalar em espaços públicos. Sistema modular com fixação simples e acabamento resistente a raios UV, chuva e variações de temperatura.',
        ),
      ],
    },
    {id: 'media', label: 'Imagens e vídeos', fields: [image('image', 'Imagem principal'), gallery]},
    {
      id: 'specs',
      label: 'Especificações técnicas',
      description: 'Opcional. Lista de características do produto',
      fields: [
        {
          name: 'dimensions',
          label: 'Dimensões',
          type: 'array',
          item: localizedString('item', 'Medida', undefined, 'Ex.: 1800 × 450 × 800 mm'),
        },
        {
          name: 'materials',
          label: 'Materiais',
          type: 'array',
          item: localizedString('item', 'Material', undefined, 'Ex.: Plástico reciclado castanho'),
        },
        {
          name: 'specifications',
          label: 'Especificações',
          type: 'array',
          item: localizedString(
            'item',
            'Especificação',
            undefined,
            'Ex.: Estrutura reforçada com perfil de aço galvanizado',
          ),
        },
        {
          name: 'advantages',
          label: 'Vantagens',
          type: 'array',
          item: localizedString(
            'item',
            'Vantagem',
            undefined,
            'Ex.: Não precisa de pintura nem verniz',
          ),
        },
      ],
    },
    {
      id: 'content-sections',
      label: 'Conteúdo adicional',
      description: 'Imagem ou vídeo, com texto e botão opcionais por baixo',
      fields: [
        {
          name: 'contentSections',
          label: 'Secções da página',
          type: 'array',
          item: productContentSectionItem,
        },
      ],
    },
    {
      id: 'organization',
      label: 'Organização',
      fields: [{name: 'orderRank', label: 'Ordem', type: 'number', step: 1}],
    },
  ],
  storeProduct: [
    {
      ...baseDocumentPanels('Nome do produto', 'Ex.: Banco Gavião')[0],
      fields: [
        ...baseDocumentPanels('Nome do produto', 'Ex.: Banco Gavião')[0].fields,
        {
          name: 'category',
          label: 'Categoria',
          type: 'select',
          description: 'As categorias são geridas em Conteúdo > Categorias da Loja',
          options: defaultStoreCategoryOptions,
          optionsSource: 'storeCategories',
        },
        localizedText(
          'summary',
          'Resumo',
          undefined,
          'Ex.: Banco em plástico reciclado com estrutura reforçada, pronto a instalar.',
        ),
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
              localizedString('label', 'Nome da opção', undefined, 'Ex.: 180 cm'),
              {
                name: 'dimensions',
                label: 'Dimensões',
                type: 'array',
                item: localizedString('item', 'Medida', undefined, 'Ex.: 1800 × 450 × 800 mm'),
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
              localizedText(
                'note',
                'Nota',
                undefined,
                'Ex.: Inclui kit de fixação ao solo',
              ),
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
      ...baseDocumentPanels('Nome do caso', 'Ex.: Proteção de piscina na Trofa')[0],
      fields: [
        ...baseDocumentPanels('Nome do caso', 'Ex.: Proteção de piscina na Trofa')[0].fields,
        localizedString('location', 'Local', undefined, 'Ex.: Trofa, Porto'),
        localizedText(
          'summary',
          'Resumo',
          undefined,
          'Ex.: Vedação em plástico reciclado para delimitar e proteger uma zona de piscina.',
        ),
        localizedText(
          'description',
          'Descrição',
          undefined,
          'Ex.: Substituição de uma vedação em madeira degradada por um sistema modular em plástico reciclado, sem necessidade de manutenção.',
        ),
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
        ...baseDocumentPanels('Título do artigo', 'Ex.: Como escolher materiais para exterior')[0]
          .fields,
        {name: 'publishedAt', label: 'Data de publicação', type: 'date'},
        localizedString('category', 'Tema', undefined, 'Ex.: Sustentabilidade'),
        localizedText(
          'excerpt',
          'Resumo',
          undefined,
          'Ex.: Um guia rápido para escolher materiais duradouros para espaços exteriores.',
        ),
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
        {
          name: 'title',
          label: 'Nome da página',
          type: 'string',
          required: true,
          placeholder: 'Ex.: Sustentabilidade',
        },
        {
          name: 'route',
          label: 'Endereço',
          type: 'string',
          description: 'Exemplo: /sustentabilidade',
          placeholder: '/sustentabilidade',
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
            localizedString(
              'title',
              'Título nos motores de pesquisa',
              undefined,
              'Ex.: Sustentabilidade | DaFábrica4You',
            ),
            localizedText(
              'description',
              'Descrição nos motores de pesquisa',
              undefined,
              'Ex.: Conheça o processo de reciclagem que transforma resíduos em produtos duradouros para exterior.',
            ),
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

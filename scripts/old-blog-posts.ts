// Migrated content from the previous DaFábrica4You blog (https://www.dafabrica4you.pt/blog/).
// Portuguese is the source; English and Spanish are faithful translations (no added claims).
// This file is the reviewable artifact — edit here, then run `npm run import:blog`.

export type Localized = {pt: string; en: string; es: string}

export type OldBlogPost = {
  slug: string
  publishedAt: string // YYYY-MM-DD
  coverImageUrl: string
  title: Localized
  category: Localized
  excerpt: Localized
  body: Localized
}

type OldBlogSource = Pick<OldBlogPost, 'slug' | 'publishedAt' | 'coverImageUrl'>
type OldBlogContent = Pick<OldBlogPost, 'title' | 'category' | 'excerpt' | 'body'>

const oldBlogSources = [
  {
    slug: 'agricultura-urbana',
    publishedAt: '2026-05-31',
    coverImageUrl:
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200001092-dc8f5dc8f7/Agricultura%20urbana.jpeg?ph=828f6b5e7d',
  },
  {
    slug: 'nao-faz-sentido-autarquias-continuarem-a-investir-com-mobiliario-urbano-de-madeira-e-metal',
    publishedAt: '2025-10-25',
    coverImageUrl:
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200001069-76f1576f17/Banco%20Podre.jpeg?ph=828f6b5e7d',
  },
  {
    slug: 'varios-opcoes-de-compostagem',
    publishedAt: '2025-10-25',
    coverImageUrl:
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200001065-0cb2b0cb2d/Compostores%20com%20Pergula%20de%20sombreamento-8.jpeg?ph=828f6b5e7d',
  },
  {
    slug: 'residuos-organicos-um-problema-grave',
    publishedAt: '2025-01-12',
    coverImageUrl:
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000907-495a9495ac/Compostagem-6.png?ph=828f6b5e7d',
  },
  {
    slug: 'compostagem-urbana-comunitaria',
    publishedAt: '2024-12-22',
    coverImageUrl:
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000904-d2551d2553/Compostagem.png?ph=828f6b5e7d',
  },
  {
    slug: 'gestao-de-residuos-regime-de-incentivos',
    publishedAt: '2024-12-14',
    coverImageUrl:
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000902-a981ea9822/Mulher%20com%20pl%C3%A1stico.jpeg?ph=828f6b5e7d',
  },
  {
    slug: 'o-que-fazer-com-residuos-de-plastico',
    publishedAt: '2024-11-18',
    coverImageUrl:
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000895-f1a40f1a43/Ilha%20de%20pl%C3%A1stico-6.jpeg?ph=828f6b5e7d',
  },
  {
    slug: 'problema-da-poluicao-de-plasticos-nas-praias',
    publishedAt: '2024-11-10',
    coverImageUrl:
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000881-02e0102e04/Pl%C3%A1sticos%20nas%20praias.jpeg?ph=828f6b5e7d',
  },
  {
    slug: 'problema-da-madeira-no-mobiliario-urbano',
    publishedAt: '2024-10-08',
    coverImageUrl:
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000879-e9b80e9b81/Banco%20podre.png?ph=828f6b5e7d',
  },
  {
    slug: 'compostagem-caseira',
    publishedAt: '2024-10-08',
    coverImageUrl:
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000877-2c93d2c940/tinywow_Cuidar%20do%20meio%20ambiente%20%C3%A9%20cuidar%20de%20n%C3%B3s%20mesmos._66419039.png?ph=828f6b5e7d',
  },
  {
    slug: 'seca-no-algarve-em-2024',
    publishedAt: '2024-01-15',
    coverImageUrl:
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000698-09e3609e38/Terra%20Seca-1.jpeg?ph=828f6b5e7d',
  },
  {
    slug: 'os-municipios-portugueses-a-partir-de-1-de-janeiro-de-2024-tem-que-recolher-residuos-organicos',
    publishedAt: '2024-01-04',
    coverImageUrl:
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000634-5565655658/Biores%C3%ADduos.jpeg?ph=828f6b5e7d',
  },
  {
    slug: 'o-aumento-das-temperaturas-globais-em-2023',
    publishedAt: '2023-12-14',
    coverImageUrl:
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000540-19e5619e58/Incendios%201-4.jpeg?ph=828f6b5e7d',
  },
  {
    slug: '50-bilioes-de-pedacos-de-plastico-no-mar-e-irrecuperavel',
    publishedAt: '2023-11-19',
    coverImageUrl:
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000514-9d4869d487/Ilha%20de%20pl%C3%A1stico-2.jpeg?ph=828f6b5e7d',
  },
  {
    slug: 'escassez-de-chuva-em-portugal',
    publishedAt: '2023-11-19',
    coverImageUrl:
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000512-677496774a/Terra%20Seca.jpeg?ph=828f6b5e7d',
  },
  {
    slug: 'guia-para-fazer-uma-boa-compostagem',
    publishedAt: '2023-11-19',
    coverImageUrl:
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000510-a6329a632b/Compostagem.jpeg?ph=828f6b5e7d',
  },
  {
    slug: 'compostagem-nas-escolas',
    publishedAt: '2023-11-19',
    coverImageUrl:
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000508-ed2b2ed2b4/Compostagem%20em%20Escolas.jpeg?ph=828f6b5e7d',
  },
  {
    slug: 'uso-da-compostagem-na-jardinagem',
    publishedAt: '2023-11-11',
    coverImageUrl:
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000493-bfceebfcf1/Trees.png?ph=828f6b5e7d',
  },
  {
    slug: 'como-plastico-entra-na-cadeia-alimentar-dos-humanos',
    publishedAt: '2023-11-01',
    coverImageUrl:
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000491-a451ca451e/Tartaruga%201.jpeg?ph=828f6b5e7d',
  },
  {
    slug: 'problema-do-lixo-de-equipamentos-informaticos-e-telemoveis',
    publishedAt: '2023-10-22',
    coverImageUrl:
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000489-c52b6c52b8/Lixo%20eetr%C3%B3nico.jpeg?ph=828f6b5e7d',
  },
  {
    slug: 'usar-como-materia-prima-os-residuos-do-ecoponto-amarelo',
    publishedAt: '2023-10-21',
    coverImageUrl:
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000487-741f7741f9/Ecoponto%20Canvas.png?ph=828f6b5e7d',
  },
  {
    slug: 'madeira-fica-podre-em-pouco-tempo-para-alem-do-problema-ambiental-com-o-corte-de-arvores',
    publishedAt: '2023-09-26',
    coverImageUrl:
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000483-41cdd41cde/Madeira%20fica%20podre%20em%20pouco%20tempo%2C%20para%20al%C3%A9m%20do%20problema%20ambiental%2C%20com%20o%20corte%20de%20%C3%A1rvores.png?ph=828f6b5e7d',
  },
  {
    slug: 'julho-bate-recordes-como-o-mes-mais-quente-ja-registado',
    publishedAt: '2023-08-16',
    coverImageUrl:
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000477-dbd37dbd3a/Mes%20quente.jpeg?ph=828f6b5e7d',
  },
  {
    slug: 'a-problematica-dos-residuos-de-vestuario',
    publishedAt: '2023-08-06',
    coverImageUrl:
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000475-dfd10dfd15/Roupa%20problema%20ambiental.png?ph=828f6b5e7d',
  },
  {
    slug: 'causas-do-aquecimento-global-e-solucoes',
    publishedAt: '2023-07-28',
    coverImageUrl:
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000472-4e07a4e07c/Aquecimento%20global.png?ph=828f6b5e7d',
  },
  {
    slug: 'compreender-o-aumento-da-temperatura-global-e-o-seu-impacto-nos-incendios-florestais',
    publishedAt: '2023-07-26',
    coverImageUrl:
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000470-b84c8b84cb/Incendios%201.jpeg?ph=828f6b5e7d',
  },
  {
    slug: 'como-a-compostagem-pode-reduzir-o-impacto-dos-aterros-sanitarios',
    publishedAt: '2023-07-17',
    coverImageUrl:
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000466-b3234b3237/Aterro.jpeg?ph=828f6b5e7d',
  },
  {
    slug: 'a-importancia-da-separacao-do-lixo',
    publishedAt: '2023-07-17',
    coverImageUrl:
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000464-a9cf0a9cf3/Ecoponto%20Amarelo%202.jpeg?ph=828f6b5e7d',
  },
  {
    slug: 'plastico-nos-oceanos',
    publishedAt: '2023-07-16',
    coverImageUrl:
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000461-940aa940ae/Ilha%20de%20pl%C3%A1stico.jpeg?ph=828f6b5e7d',
  },
  {
    slug: 'gases-efeito-de-estufa',
    publishedAt: '2023-07-14',
    coverImageUrl:
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000459-5398153985/Antartida.jpeg?ph=828f6b5e7d',
  },
  {
    slug: 'abate-de-arvores',
    publishedAt: '2023-07-13',
    coverImageUrl:
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000457-a410ba410e/Arvores.jpeg?ph=828f6b5e7d',
  },
  {
    slug: 'o-drama-dos-microplasticos-nos-oceanos',
    publishedAt: '2023-07-10',
    coverImageUrl:
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000455-c87f0c87f2/Micropl%C3%A1sticos.png?ph=828f6b5e7d',
  },
  {
    slug: 'reflita-antes-de-comprar-um-produto-embalado-em-garrafas-de-plastico',
    publishedAt: '2022-07-09',
    coverImageUrl:
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000256-9e4c29e4c5/O%20que%20acontece%20quando%20compra%20um%20produto%20embalado%20em%20garrafas%20de%20pl%C3%A1stico%21.png?ph=828f6b5e7d',
  },
  {
    slug: 'subida-da-temperatura-em-portugal',
    publishedAt: '2022-06-06',
    coverImageUrl:
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000223-05dcd05dcf/Pordata%20subida%20temperatura.JPG?ph=828f6b5e7d',
  },
  {
    slug: 'plasticos-nos-oceanos',
    publishedAt: '2022-04-13',
    coverImageUrl:
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000211-b1a85b1a88/Plastics.PNG?ph=828f6b5e7d',
  },
  {
    slug: 'o-mundo-caminha-para-a-catastrofe',
    publishedAt: '2022-03-26',
    coverImageUrl:
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000210-5409554097/Climate%20Change.PNG?ph=828f6b5e7d',
  },
  {
    slug: 'como-contribuir-para-drama-dos-plasticos',
    publishedAt: '2022-03-04',
    coverImageUrl:
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000208-a4b75a4b78/Plastico%20National%20Geografic-7.PNG?ph=828f6b5e7d',
  },
  {
    slug: 'nao-existe-planeta-b',
    publishedAt: '2022-02-26',
    coverImageUrl:
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000203-613596135b/Ecoponto.png?ph=828f6b5e7d',
  },
  {
    slug: 'a-organizacao-meteorologica-mundial-omm-informa-que-catastrofes-e-enchentes-aumentaram-134-desde-2000-se-comparado-com-decadas-anteriores',
    publishedAt: '2022-02-06',
    coverImageUrl:
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000190-df837df83b/Inunda%C3%A7%C3%B5es%20DaFabrica4you.PNG?ph=828f6b5e7d',
  },
  {
    slug: 'nova-parceria-promove-sustentabilidade-usando-comercio-eletronico',
    publishedAt: '2022-01-28',
    coverImageUrl:
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000184-d8131d8133/Capture%202.PNG?ph=828f6b5e7d',
  },
  {
    slug: 'novo-recorde-no-artico-faz-soar-o-alarme-sobre-mudanca-climatica',
    publishedAt: '2021-12-20',
    coverImageUrl:
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000173-2e1f02e1f3/Artico.PNG?ph=828f6b5e7d',
  },
  {
    slug: 'aproveitamento-de-residuos',
    publishedAt: '2021-12-01',
    coverImageUrl:
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000168-7afa47afa6/Reciclagem%20de%20res%C3%ADduos%20de%20pl%C3%A1stico.jpg?ph=828f6b5e7d',
  },
  {
    slug: 'ultima-central-a-carvao-em-portugal-parou-a-producao',
    publishedAt: '2021-11-21',
    coverImageUrl:
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000158-3405e34061/Carv%C3%A3o.PNG?ph=828f6b5e7d',
  },
  {
    slug: 'cop-26',
    publishedAt: '2021-11-13',
    coverImageUrl:
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000157-d3463d3466/Climate%20Changes.PNG?ph=828f6b5e7d',
  },
  {
    slug: 'infiltracoes-salitre',
    publishedAt: '2021-11-07',
    coverImageUrl:
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000156-b7a86b7a88/Infiltra%C3%A7%C3%B5es.PNG?ph=828f6b5e7d',
  },
  {
    slug: 'os-jovens-a-darem-o-exemplo-na-cop26',
    publishedAt: '2021-11-06',
    coverImageUrl:
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000154-093e7093ea/Residuos%20Pl%C3%A1stico-1.PNG?ph=828f6b5e7d',
  },
  {
    slug: 'nossos-lideres-abandonam-cop-26-sem-resultados-de-facto',
    publishedAt: '2021-11-03',
    coverImageUrl:
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000151-04dee04df0/COP%2026-7.PNG?ph=828f6b5e7d',
  },
  {
    slug: 'cop-26-reuniao-climatica-de-glasgow',
    publishedAt: '2021-10-31',
    coverImageUrl:
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000149-6c39e6c3a0/COP%2026.PNG?ph=828f6b5e7d',
  },
  {
    slug: 'residuos-de-plastico-e-reciclagem-na-ue-factos-e-numeros',
    publishedAt: '2021-10-29',
    coverImageUrl:
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000139-27d5227d54/Plasticos%20Parlamento%20Europeu1%20.PNG?ph=828f6b5e7d',
  },
  {
    slug: 'poluicao-por-plasticos-deve-duplicar-ate-2030',
    publishedAt: '2021-10-27',
    coverImageUrl:
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000135-0c5e40c5e6/Pl%C3%A1sticos.PNG?ph=828f6b5e7d',
  },
  {
    slug: 'porque-garrafas-de-plastico-sao-uma-drama',
    publishedAt: '2021-10-22',
    coverImageUrl:
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000122-eef79eef7b/Plastico%20.PNG?ph=828f6b5e7d',
  },
  {
    slug: 'porque-plastico-e-um-drama',
    publishedAt: '2021-10-22',
    coverImageUrl:
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000121-0acb10acb3/Plastico%20National%20Geografic.PNG?ph=828f6b5e7d',
  },
  {
    slug: 'consumo-de-plastico',
    publishedAt: '2021-10-18',
    coverImageUrl:
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000072-e9d6ee9d70/Residuos%20Pl%C3%A1stico.PNG?ph=828f6b5e7d',
  },
  {
    slug: 'extincoes-em-massa',
    publishedAt: '2021-10-18',
    coverImageUrl:
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000071-8a40f8a410/Abate%20de%20Arvores%202-1.PNG?ph=828f6b5e7d',
  },
  {
    slug: 'este-e-um-artigo-com-imagens',
    publishedAt: '2021-10-18',
    coverImageUrl:
      'https://828f6b5e7d.clvaw-cdnwnd.com/8c0f3f483d4bfe6ba28c64a2287a3521/200000069-5546c5546f/Abate%20de%20Arvores%203.PNG?ph=828f6b5e7d',
  },
] as const satisfies readonly OldBlogSource[]

type OldBlogSlug = (typeof oldBlogSources)[number]['slug']

const oldBlogContent: Record<OldBlogSlug, OldBlogContent> = {
  'agricultura-urbana': {
    title: {
      pt: 'Agricultura Urbana',
      en: 'Urban Agriculture',
      es: 'Agricultura Urbana',
    },
    category: {
      pt: 'Ambiente',
      en: 'Environment',
      es: 'Medio ambiente',
    },
    excerpt: {
      pt: 'Cultivar nas cidades reduz emissões, aproxima os alimentos de quem os consome e transforma espaços urbanos em ecossistemas mais resilientes.',
      en: 'Growing food in cities cuts emissions, brings food closer to the people who eat it, and turns urban spaces into more resilient ecosystems.',
      es: 'Cultivar en las ciudades reduce emisiones, acerca los alimentos a quien los consume y convierte los espacios urbanos en ecosistemas más resilientes.',
    },
    body: {
      pt: `A agricultura urbana é a prática de cultivar plantas, criar animais e processar alimentos dentro das cidades ou nas suas periferias (áreas periurbanas).

Ao contrário da agricultura tradicional, que depende de grandes extensões de terra no meio rural, adapta-se ao tecido urbano. Pode ser feita em quintais residenciais, varandas, telhados de prédios, terrenos baldios, hortas comunitárias e até em instalações verticais de alta tecnologia que utilizam hidroponia (cultivo na água, sem solo).

Esta prática vai muito além de produzir alimentos: transforma as cidades em ecossistemas mais sustentáveis e resilientes. Como os alimentos são produzidos onde são consumidos, elimina-se a necessidade de transporte de longa distância, reduzindo a emissão de gases poluentes. A vegetação ajuda a absorver o calor urbano e baixa a temperatura ambiente, e facilita a compostagem local, transformando restos de comida em adubo orgânico para a própria horta.

Garante produtos colhidos na hora, livres de pesticidas e com maior valor nutricional, cria uma rede de segurança alimentar para comunidades vulneráveis e reduz a dependência de mercados externos. Cuidar de uma horta funciona como terapia e reduz o stress, e as hortas comunitárias fortalecem os laços entre vizinhos. Cultivar os próprios vegetais e ervas aromáticas ajuda a reduzir a conta do supermercado, cria postos de trabalho locais e transforma terrenos abandonados em áreas verdes produtivas.

Segundo dados da ONU (FAO), a agricultura urbana já é responsável por cerca de 15% a 20% dos alimentos consumidos no mundo, desempenhando um papel crucial no futuro das cidades sustentáveis.

Montar uma mini-horta num apartamento é uma excelente forma de trazer mais verde para o dia a dia e ter temperos frescos à mão. Mesmo com pouco espaço ou pouca luz solar, é possível ter sucesso. Os recipientes podem ser de plástico, cerâmica ou materiais reciclados (garrafas PET, pacotes de leite), desde que tenham furos no fundo para a água escorrer. Coloca-se uma camada de argila expandida ou pedras no fundo para a água não acumular nas raízes, uma manta de drenagem por cima das pedras, e terra vegetal de boa qualidade, de preferência já misturada com composto orgânico ou húmus de minhoca.

Para quem está a começar, o ideal são ervas aromáticas e temperos, resistentes e de crescimento rápido. Quase todas as plantas comestíveis precisam de pelo menos 3 a 4 horas de luz solar direta por dia, por isso convém colocar a horta na varanda ou junto à janela mais soalheira. O maior erro dos iniciantes é regar em demasia: antes de regar, ponha o dedo na terra a cerca de 2 cm; se estiver húmida, espere. Por fim, ir colhendo as folhas mais externas estimula o crescimento de novos rebentos.`,
      en: `Urban agriculture is the practice of growing plants, raising animals, and processing food within cities or on their outskirts (peri-urban areas).

Unlike traditional farming, which depends on large stretches of rural land, it adapts to the urban fabric. It can take place in back gardens, balconies, building rooftops, vacant lots, community gardens, and even high-tech vertical installations using hydroponics (growing in water, without soil).

The practice goes far beyond producing food: it turns cities into more sustainable and resilient ecosystems. Because food is produced where it is consumed, the need for long-distance transport disappears, cutting polluting emissions. Vegetation helps absorb urban heat and lowers the ambient temperature, and it makes local composting easier, turning food scraps into organic fertiliser for the garden itself.

It delivers freshly harvested produce, free of pesticides and with higher nutritional value, creates a food-security safety net for vulnerable communities, and reduces dependence on outside markets. Tending a garden works as therapy and reduces stress, and community gardens strengthen ties between neighbours. Growing your own vegetables and herbs helps lower the supermarket bill, creates local jobs, and turns abandoned plots into productive green areas.

According to the UN (FAO), urban agriculture already accounts for roughly 15% to 20% of the food consumed worldwide, playing a crucial role in the future of sustainable cities.

Setting up a mini-garden in a flat is an excellent way to bring more green into daily life and keep fresh herbs on hand. Even with little space or sunlight, success is possible. Containers can be plastic, ceramic, or recycled materials (PET bottles, milk cartons), as long as they have drainage holes at the bottom. Add a layer of expanded clay or stones at the bottom so water does not pool around the roots, a drainage mat over the stones, and good-quality soil, ideally already mixed with organic compost or worm humus.

For beginners, aromatic herbs and seasonings are ideal — hardy and fast-growing. Almost all edible plants need at least 3 to 4 hours of direct sunlight a day, so place the garden on the balcony or by the sunniest window. The most common beginner mistake is overwatering: before watering, put a finger about 2 cm into the soil; if it is damp, wait. Finally, harvesting the outer leaves regularly encourages new shoots to grow.`,
      es: `La agricultura urbana es la práctica de cultivar plantas, criar animales y procesar alimentos dentro de las ciudades o en sus periferias (áreas periurbanas).

A diferencia de la agricultura tradicional, que depende de grandes extensiones de tierra rural, se adapta al tejido urbano. Puede realizarse en patios residenciales, balcones, azoteas de edificios, terrenos baldíos, huertos comunitarios e incluso en instalaciones verticales de alta tecnología que utilizan hidroponía (cultivo en agua, sin suelo).

Esta práctica va mucho más allá de producir alimentos: transforma las ciudades en ecosistemas más sostenibles y resilientes. Como los alimentos se producen donde se consumen, se elimina la necesidad de transporte de larga distancia, reduciendo la emisión de gases contaminantes. La vegetación ayuda a absorber el calor urbano y baja la temperatura ambiente, y facilita el compostaje local, convirtiendo los restos de comida en abono orgánico para el propio huerto.

Garantiza productos recién cosechados, libres de pesticidas y con mayor valor nutricional, crea una red de seguridad alimentaria para comunidades vulnerables y reduce la dependencia de mercados externos. Cuidar un huerto funciona como terapia y reduce el estrés, y los huertos comunitarios fortalecen los lazos entre vecinos. Cultivar las propias verduras y hierbas aromáticas ayuda a reducir la factura del supermercado, crea empleo local y transforma terrenos abandonados en áreas verdes productivas.

Según datos de la ONU (FAO), la agricultura urbana ya es responsable de cerca del 15% al 20% de los alimentos consumidos en el mundo, desempeñando un papel crucial en el futuro de las ciudades sostenibles.

Montar un mini-huerto en un apartamento es una excelente forma de traer más verde al día a día y tener condimentos frescos a mano. Incluso con poco espacio o poca luz solar es posible tener éxito. Los recipientes pueden ser de plástico, cerámica o materiales reciclados (botellas PET, envases de leche), siempre que tengan agujeros en el fondo para que escurra el agua. Se coloca una capa de arcilla expandida o piedras en el fondo para que el agua no se acumule en las raíces, una manta de drenaje sobre las piedras y tierra vegetal de buena calidad, preferiblemente ya mezclada con compost orgánico o humus de lombriz.

Para quien empieza, lo ideal son las hierbas aromáticas y los condimentos, resistentes y de crecimiento rápido. Casi todas las plantas comestibles necesitan al menos 3 a 4 horas de luz solar directa al día, por lo que conviene colocar el huerto en el balcón o junto a la ventana más soleada. El mayor error de los principiantes es regar en exceso: antes de regar, meta el dedo en la tierra unos 2 cm; si está húmeda, espere. Por último, ir cosechando las hojas más externas estimula el crecimiento de nuevos brotes.`,
    },
  },
  'nao-faz-sentido-autarquias-continuarem-a-investir-com-mobiliario-urbano-de-madeira-e-metal': {
    title: {
      pt: 'Não faz sentido as autarquias continuarem a investir em mobiliário urbano de madeira e/ou metal',
      en: 'It makes no sense for municipalities to keep investing in wooden and/or metal street furniture',
      es: 'No tiene sentido que los municipios sigan invirtiendo en mobiliario urbano de madera y/o metal',
    },
    category: {
      pt: 'Materiais',
      en: 'Materials',
      es: 'Materiales',
    },
    excerpt: {
      pt: 'O mobiliário urbano feito com resíduos do ecoponto amarelo dura mais, dispensa manutenção e não apodrece nem enferruja — vantagens claras face à madeira e ao metal.',
      en: 'Street furniture made from yellow-bin waste lasts longer, needs no maintenance, and neither rots nor rusts — clear advantages over wood and metal.',
      es: 'El mobiliario urbano hecho con residuos del contenedor amarillo dura más, no requiere mantenimiento y no se pudre ni se oxida: ventajas claras frente a la madera y el metal.',
    },
    body: {
      pt: `O mobiliário urbano produzido a partir de resíduos do ecoponto amarelo (sobretudo plástico e, por vezes, metal reciclado) oferece um conjunto significativo de vantagens face aos materiais tradicionais, como a madeira e o metal virgem. Este material é muitas vezes referido como "plástico madeira".

Vantagens ambientais. Promove a economia circular, dando uma segunda vida a resíduos que de outra forma acabariam em aterro ou no meio ambiente. Reduz a extração de recursos, diminuindo a necessidade de cortar árvores ou de extrair e processar minérios. Exige significativamente menos energia na produção do que o plástico virgem ou o metal, e ajuda a reduzir o volume de resíduos enviados para aterro.

Durabilidade e resistência. O plástico reciclado não absorve humidade, sendo imune à chuva, neve e geadas: não apodrece, não lasca e não abre fendas. É totalmente imune ao ataque de insetos (como térmitas) e fungos que degradam a madeira. Ao contrário do ferro, não enferruja nem sofre corrosão, mantendo a integridade estrutural durante muito mais tempo, mesmo em ambientes agressivos como áreas costeiras. A elevada durabilidade traduz-se numa vida útil muito mais longa.

Manutenção e custo. Dispensa por completo os tratamentos periódicos que a madeira exige (pintura, envernizamento ou impermeabilização). A superfície não porosa é fácil de limpar, bastando água e sabão. Embora o custo inicial possa ser comparável ou ligeiramente superior ao da madeira não tratada, a ausência de manutenção e a longevidade tornam-no mais económico ao longo do ciclo de vida. Tem ainda boa resistência ao vandalismo, e o seu peso e robustez dificultam o furto.`,
      en: `Street furniture made from yellow-bin waste (mainly plastic and, at times, recycled metal) offers a significant set of advantages over traditional materials such as wood and virgin metal. This material is often referred to as "plastic timber".

Environmental advantages. It promotes the circular economy, giving a second life to waste that would otherwise end up in landfill or in the environment. It reduces resource extraction, lowering the need to fell trees or to extract and process ores. It requires significantly less energy to produce than virgin plastic or metal, and it helps reduce the volume of waste sent to landfill.

Durability and resistance. Recycled plastic does not absorb moisture, making it immune to rain, snow, and frost: it does not rot, splinter, or crack. It is completely immune to attack by insects (such as termites) and the fungi that degrade wood. Unlike iron, it does not rust or corrode, keeping its structural integrity for far longer, even in harsh environments such as coastal areas. Its high durability translates into a much longer service life.

Maintenance and cost. It does away entirely with the periodic treatments wood requires (painting, varnishing, or waterproofing). The non-porous surface is easy to clean with just soap and water. Although the initial cost may be comparable to or slightly higher than untreated wood, the absence of maintenance and its longevity make it more economical over its life cycle. It also resists vandalism well, and its weight and sturdiness make it hard to steal.`,
      es: `El mobiliario urbano producido a partir de residuos del contenedor amarillo (sobre todo plástico y, a veces, metal reciclado) ofrece un conjunto significativo de ventajas frente a los materiales tradicionales, como la madera y el metal virgen. Este material se denomina a menudo "plástico madera".

Ventajas ambientales. Promueve la economía circular, dando una segunda vida a residuos que de otro modo acabarían en vertedero o en el medio ambiente. Reduce la extracción de recursos, disminuyendo la necesidad de talar árboles o de extraer y procesar minerales. Exige bastante menos energía en su producción que el plástico virgen o el metal, y ayuda a reducir el volumen de residuos enviados a vertedero.

Durabilidad y resistencia. El plástico reciclado no absorbe humedad, siendo inmune a la lluvia, la nieve y las heladas: no se pudre, no se astilla y no se agrieta. Es totalmente inmune al ataque de insectos (como las termitas) y de los hongos que degradan la madera. A diferencia del hierro, no se oxida ni sufre corrosión, manteniendo su integridad estructural durante mucho más tiempo, incluso en ambientes agresivos como las zonas costeras. Su elevada durabilidad se traduce en una vida útil mucho más larga.

Mantenimiento y coste. Prescinde por completo de los tratamientos periódicos que exige la madera (pintura, barnizado o impermeabilización). La superficie no porosa es fácil de limpiar, basta con agua y jabón. Aunque el coste inicial puede ser comparable o ligeramente superior al de la madera sin tratar, la ausencia de mantenimiento y su longevidad lo hacen más económico a lo largo de su ciclo de vida. Además, resiste bien el vandalismo, y su peso y robustez dificultan el robo.`,
    },
  },
  'varios-opcoes-de-compostagem': {
    title: {
      pt: 'Várias opções de compostagem',
      en: 'Several composting options',
      es: 'Varias opciones de compostaje',
    },
    category: {
      pt: 'Compostagem',
      en: 'Composting',
      es: 'Compostaje',
    },
    excerpt: {
      pt: 'Da compostagem doméstica à industrial: as vantagens e desvantagens de cada escala e método para valorizar a matéria orgânica e desviar resíduos do aterro.',
      en: 'From home to industrial composting: the pros and cons of each scale and method for valuing organic matter and diverting waste from landfill.',
      es: 'Del compostaje doméstico al industrial: ventajas y desventajas de cada escala y método para valorizar la materia orgánica y desviar residuos del vertedero.',
    },
    body: {
      pt: `Os métodos de compostagem mais comuns podem ser divididos por escala e tecnologia: compostagem doméstica (feita pelo próprio gerador de resíduos em casa, normalmente em compostores); compostagem comunitária ou de proximidade (feita por um grupo de pessoas numa pequena área — bairro, condomínio, escola); e compostagem centralizada/industrial, em grandes unidades de tratamento com tecnologias mais avançadas, como as leiras por revolvimento (windrow) e os bio-reatores ou contentores fechados (in-vessel).

Compostagem doméstica. Recicla na origem e reduz a quantidade de resíduos recolhidos e depositados em aterro, com baixo custo de implementação e composto disponível para uso próprio no jardim ou horta. Em contrapartida, exige espaço exterior e dedicação, é menos aconselhável para grandes quantidades de carne, peixe, laticínios ou alimentos gordurosos, pode ser lenta e inconsistente, e depende da correta separação na origem e de alguma formação.

Compostagem comunitária. Trata os resíduos perto do local onde são gerados, com tecnologia simples e custos reduzidos, promove a interação social e desvia de aterro quantidades maiores em áreas urbanas densas sem espaço para compostagem doméstica. Requer, no entanto, gestão e manutenção por um grupo, um espaço adequado no espaço público e atenção para evitar odores ou a atração de insetos e roedores; a capacidade é limitada pela área e pelo número de participantes.

Compostagem centralizada/industrial. Recebe os biorresíduos recolhidos seletivamente. Nas leiras por revolvimento, a tecnologia é comprovada e versátil, com custos de operação moderados e bom controlo de temperatura, mas exige grandes áreas de terreno, torna mais difícil o controlo de odores e lixiviados e tem um ciclo longo, podendo ainda emitir gases com efeito de estufa. Nos bio-reatores fechados, o controlo ambiental é otimizado (temperatura, humidade, oxigénio), as emissões e odores são captados e tratados, o processo é mais rápido e ocupa menos espaço — em troca de custos iniciais elevados, maior complexidade de operação, mais consumo de energia e necessidade de pré-tratamento do material.

Em geral, a principal vantagem da compostagem, em qualquer método, é a valorização da matéria orgânica, transformando um resíduo num composto que enriquece o solo e contribui para reduzir a deposição em aterro e as emissões de metano. A desvantagem comum é a necessidade de um controlo rigoroso dos parâmetros (humidade, oxigénio, temperatura e proporção de carbono/azoto) para garantir a qualidade do composto e evitar odores ou contaminantes.`,
      en: `The most common composting methods can be divided by scale and technology: home composting (done by the waste generator at home, usually in composters); community or proximity composting (done by a group of people in a small area — neighbourhood, building, school); and centralised/industrial composting, in large treatment plants with more advanced technologies such as turned windrows and closed bio-reactors or in-vessel containers.

Home composting. It recycles at source and reduces the amount of waste collected and sent to landfill, with low implementation cost and compost available for use in your own garden. On the other hand, it requires outdoor space and dedication, is less advisable for large amounts of meat, fish, dairy, or greasy food, can be slow and inconsistent, and depends on correct sorting at source and some training.

Community composting. It treats waste close to where it is generated, with simple technology and low costs, promotes social interaction, and diverts larger amounts from landfill in dense urban areas with no room for home composting. It does, however, require management and maintenance by a group, suitable space in the public realm, and care to avoid odours or attracting insects and rodents; capacity is limited by the area and the number of participants.

Centralised/industrial composting. It receives separately collected bio-waste. In turned windrows, the technology is proven and versatile, with moderate operating costs and good temperature control, but it requires large areas of land, makes odour and leachate control harder, and has a long cycle, potentially emitting greenhouse gases. In closed bio-reactors, environmental control is optimised (temperature, humidity, oxygen), emissions and odours are captured and treated, the process is faster and takes up less space — in exchange for high upfront costs, greater operating complexity, higher energy use, and the need to pre-treat the material.

In general, the main advantage of composting, with any method, is the valuing of organic matter, turning waste into compost that enriches the soil and helps reduce landfilling and methane emissions. The common drawback is the need for rigorous control of the parameters (moisture, oxygen, temperature, and carbon/nitrogen ratio) to ensure compost quality and avoid odours or contaminants.`,
      es: `Los métodos de compostaje más comunes pueden dividirse por escala y tecnología: compostaje doméstico (realizado por el propio generador de residuos en casa, normalmente en compostadores); compostaje comunitario o de proximidad (realizado por un grupo de personas en una pequeña área — barrio, comunidad, escuela); y compostaje centralizado/industrial, en grandes unidades de tratamiento con tecnologías más avanzadas, como las pilas por volteo (windrow) y los biorreactores o contenedores cerrados (in-vessel).

Compostaje doméstico. Recicla en origen y reduce la cantidad de residuos recogidos y depositados en vertedero, con bajo coste de implantación y compost disponible para uso propio en el jardín o huerto. En cambio, exige espacio exterior y dedicación, es menos aconsejable para grandes cantidades de carne, pescado, lácteos o alimentos grasos, puede ser lento e inconsistente, y depende de la correcta separación en origen y de cierta formación.

Compostaje comunitario. Trata los residuos cerca de donde se generan, con tecnología sencilla y costes reducidos, promueve la interacción social y desvía del vertedero mayores cantidades en áreas urbanas densas sin espacio para el compostaje doméstico. Requiere, no obstante, gestión y mantenimiento por un grupo, un espacio adecuado en el espacio público y atención para evitar olores o la atracción de insectos y roedores; la capacidad está limitada por el área y el número de participantes.

Compostaje centralizado/industrial. Recibe los biorresiduos recogidos selectivamente. En las pilas por volteo, la tecnología es probada y versátil, con costes de operación moderados y buen control de temperatura, pero exige grandes superficies de terreno, dificulta el control de olores y lixiviados y tiene un ciclo largo, pudiendo además emitir gases de efecto invernadero. En los biorreactores cerrados, el control ambiental es óptimo (temperatura, humedad, oxígeno), las emisiones y olores se captan y tratan, el proceso es más rápido y ocupa menos espacio — a cambio de costes iniciales elevados, mayor complejidad de operación, más consumo de energía y necesidad de pretratar el material.

En general, la principal ventaja del compostaje, en cualquier método, es la valorización de la materia orgánica, convirtiendo un residuo en compost que enriquece el suelo y contribuye a reducir el depósito en vertedero y las emisiones de metano. La desventaja común es la necesidad de un control riguroso de los parámetros (humedad, oxígeno, temperatura y proporción de carbono/nitrógeno) para garantizar la calidad del compost y evitar olores o contaminantes.`,
    },
  },
  'residuos-organicos-um-problema-grave': {
    title: {
      pt: 'Resíduos orgânicos, um problema grave',
      en: 'Organic waste: a serious problem',
      es: 'Residuos orgánicos: un problema grave',
    },
    category: {
      pt: 'Compostagem',
      en: 'Composting',
      es: 'Compostaje',
    },
    excerpt: {
      pt: 'Os biorresíduos desperdiçados pesam no clima, nos aterros e nos recursos naturais; separar e compostar é uma resposta prática e urgente.',
      en: 'Wasted bio-waste weighs on the climate, landfills, and natural resources; sorting and composting are practical, urgent responses.',
      es: 'Los biorresiduos desperdiciados pesan sobre el clima, los vertederos y los recursos naturales; separar y compostar es una respuesta práctica y urgente.',
    },
    body: {
      pt: `Produzir centenas de quilos de resíduos orgânicos por ano é mais do que uma estatística: revela hábitos de consumo, desperdício alimentar e falta de valorização de materiais que poderiam voltar ao solo. Quando restos de comida e resíduos verdes seguem para aterro, perdem-se nutrientes e aumenta-se a emissão de gases com efeito de estufa.

A União Europeia tem metas exigentes para reduzir resíduos e aumentar a reciclagem, e Portugal precisa de responder com recolha seletiva, compostagem, educação ambiental e melhores infraestruturas. Separar biorresíduos em casa, nas escolas, nos restaurantes e nos municípios é uma parte essencial dessa mudança.

A compostagem transforma um problema diário num recurso. Produz fertilizante natural, reduz o volume enviado para aterro e aproxima as pessoas do ciclo real dos alimentos. O papel dos cidadãos é simples mas decisivo: separar corretamente, evitar desperdício, apoiar soluções locais e exigir políticas públicas coerentes.`,
      en: `Producing hundreds of kilos of organic waste each year is more than a statistic: it reveals consumption habits, food waste, and a failure to value materials that could return to the soil. When food scraps and green waste go to landfill, nutrients are lost and greenhouse-gas emissions increase.

The European Union has demanding goals to reduce waste and increase recycling, and Portugal must respond with selective collection, composting, environmental education, and better infrastructure. Sorting bio-waste at home, in schools, in restaurants, and across municipalities is an essential part of that shift.

Composting turns a daily problem into a resource. It produces natural fertiliser, reduces the volume sent to landfill, and reconnects people with the real cycle of food. Citizens have a simple but decisive role: sort correctly, avoid waste, support local solutions, and demand coherent public policies.`,
      es: `Producir cientos de kilos de residuos orgánicos al año es más que una estadística: revela hábitos de consumo, desperdicio alimentario y una falta de valorización de materiales que podrían volver al suelo. Cuando los restos de comida y los residuos verdes van al vertedero, se pierden nutrientes y aumentan las emisiones de gases de efecto invernadero.

La Unión Europea tiene metas exigentes para reducir residuos y aumentar el reciclaje, y Portugal debe responder con recogida selectiva, compostaje, educación ambiental y mejores infraestructuras. Separar biorresiduos en casa, en las escuelas, en los restaurantes y en los municipios es una parte esencial de ese cambio.

El compostaje convierte un problema diario en un recurso. Produce fertilizante natural, reduce el volumen enviado al vertedero y acerca a las personas al ciclo real de los alimentos. El papel de la ciudadanía es sencillo pero decisivo: separar correctamente, evitar el desperdicio, apoyar soluciones locales y exigir políticas públicas coherentes.`,
    },
  },
  'compostagem-urbana-comunitaria': {
    title: {
      pt: 'Compostagem urbana comunitária',
      en: 'Community urban composting',
      es: 'Compostaje urbano comunitario',
    },
    category: {
      pt: 'Compostagem',
      en: 'Composting',
      es: 'Compostaje',
    },
    excerpt: {
      pt: 'A compostagem comunitária aproxima a gestão dos biorresíduos de quem os produz e torna visível o valor da matéria orgânica.',
      en: 'Community composting brings bio-waste management closer to the people who generate it and makes the value of organic matter visible.',
      es: 'El compostaje comunitario acerca la gestión de biorresiduos a quien los genera y hace visible el valor de la materia orgánica.',
    },
    body: {
      pt: `A compostagem urbana comunitária é uma resposta prática para bairros, condomínios, escolas e espaços onde nem todas as pessoas têm quintal ou horta própria. Em vez de enviar restos orgânicos para recolha indiferenciada, a comunidade organiza um ponto de compostagem e acompanha o processo.

Este modelo reduz resíduos, cria composto para jardins e hortas locais e funciona também como ferramenta educativa. Para resultar, precisa de regras simples, responsáveis identificados, boa comunicação e manutenção regular, sobretudo no controlo de humidade, arejamento e materiais colocados no compostor.

Quando bem gerida, a compostagem comunitária transforma uma obrigação ambiental numa prática partilhada. As pessoas veem o resíduo mudar de estado, percebem o valor do solo e ganham hábitos mais conscientes.`,
      en: `Community urban composting is a practical answer for neighbourhoods, apartment buildings, schools, and places where not everyone has a garden or vegetable patch. Instead of sending organic scraps into mixed waste, the community organises a composting point and follows the process.

This model reduces waste, creates compost for local gardens, and also works as an educational tool. To succeed, it needs simple rules, identified caretakers, clear communication, and regular maintenance, especially around moisture, aeration, and the materials added to the composter.

When well managed, community composting turns an environmental obligation into a shared practice. People see waste change state, understand the value of soil, and build more conscious habits.`,
      es: `El compostaje urbano comunitario es una respuesta práctica para barrios, comunidades, escuelas y lugares donde no todas las personas tienen patio o huerto propio. En vez de enviar los restos orgánicos a la basura mezclada, la comunidad organiza un punto de compostaje y acompaña el proceso.

Este modelo reduce residuos, crea compost para jardines y huertos locales y funciona también como herramienta educativa. Para que resulte, necesita reglas simples, responsables identificados, buena comunicación y mantenimiento regular, sobre todo en el control de humedad, aireación y materiales añadidos al compostador.

Cuando está bien gestionado, el compostaje comunitario convierte una obligación ambiental en una práctica compartida. Las personas ven cómo cambia el residuo, entienden el valor del suelo y construyen hábitos más conscientes.`,
    },
  },
  'gestao-de-residuos-regime-de-incentivos': {
    title: {
      pt: 'Gestão de resíduos: regime de incentivos',
      en: 'Waste management: incentive schemes',
      es: 'Gestión de residuos: sistemas de incentivos',
    },
    category: {
      pt: 'Resíduos',
      en: 'Waste',
      es: 'Residuos',
    },
    excerpt: {
      pt: 'Premiar bons hábitos de separação e reciclagem pode ajudar a transformar a gestão de resíduos numa responsabilidade mais próxima dos cidadãos.',
      en: 'Rewarding good sorting and recycling habits can help make waste management a responsibility that citizens feel more directly.',
      es: 'Premiar buenos hábitos de separación y reciclaje puede acercar la gestión de residuos a la responsabilidad diaria de la ciudadanía.',
    },
    body: {
      pt: `Um regime de incentivos para resíduos parte de uma ideia simples: quem separa melhor, reduz desperdício e encaminha corretamente os materiais deve ser reconhecido por esse comportamento. O objetivo não é apenas cobrar pelo que se deita fora, mas criar uma relação mais justa entre hábitos, custos e impacto ambiental.

Sistemas deste tipo podem combinar recolha seletiva, medição de quantidades, benefícios tarifários, pontos de recompensa ou programas comunitários. Quando são bem desenhados, aumentam a participação, reduzem contaminação nos ecopontos e dão às pessoas uma razão concreta para mudar rotinas.

O desafio está na simplicidade e na confiança. As regras têm de ser claras, os dados bem protegidos e os incentivos suficientemente relevantes. A tecnologia pode ajudar, mas a educação ambiental e o acompanhamento local continuam a ser decisivos.`,
      en: `A waste incentive scheme starts from a simple idea: people who sort better, reduce waste, and send materials to the right stream should be recognised for that behaviour. The goal is not only to charge for what is thrown away, but to create a fairer relationship between habits, costs, and environmental impact.

Systems like this can combine selective collection, quantity measurement, tariff benefits, reward points, or community programmes. When they are well designed, they increase participation, reduce contamination in recycling bins, and give people a concrete reason to change routines.

The challenge lies in simplicity and trust. Rules must be clear, data must be protected, and incentives must be meaningful enough. Technology can help, but environmental education and local support remain decisive.`,
      es: `Un sistema de incentivos para residuos parte de una idea sencilla: quien separa mejor, reduce desperdicio y encamina correctamente los materiales debe ser reconocido por ese comportamiento. El objetivo no es solo cobrar por lo que se tira, sino crear una relación más justa entre hábitos, costes e impacto ambiental.

Estos sistemas pueden combinar recogida selectiva, medición de cantidades, beneficios tarifarios, puntos de recompensa o programas comunitarios. Cuando están bien diseñados, aumentan la participación, reducen la contaminación en los contenedores de reciclaje y dan a las personas una razón concreta para cambiar rutinas.

El reto está en la simplicidad y la confianza. Las reglas deben ser claras, los datos bien protegidos y los incentivos suficientemente relevantes. La tecnología puede ayudar, pero la educación ambiental y el acompañamiento local siguen siendo decisivos.`,
    },
  },
  'o-que-fazer-com-residuos-de-plastico': {
    title: {
      pt: 'O que fazer com resíduos de plástico',
      en: 'What to do with plastic waste',
      es: 'Qué hacer con los residuos de plástico',
    },
    category: {
      pt: 'Plásticos',
      en: 'Plastics',
      es: 'Plásticos',
    },
    excerpt: {
      pt: 'Reduzir, separar, reciclar e transformar resíduos de plástico em novos produtos são passos complementares para enfrentar um problema global.',
      en: 'Reducing, sorting, recycling, and turning plastic waste into new products are complementary steps in tackling a global problem.',
      es: 'Reducir, separar, reciclar y transformar residuos plásticos en nuevos productos son pasos complementarios para afrontar un problema global.',
    },
    body: {
      pt: `Os resíduos de plástico tornaram-se um problema ambiental global porque estão em embalagens, objetos descartáveis, equipamentos e cadeias de consumo muito rápidas. Quando são mal geridos, acabam no solo, nos rios, no mar e nos habitats de vida selvagem.

A resposta começa antes do ecoponto: reduzir consumos desnecessários, escolher produtos duráveis e evitar descartáveis sempre que possível. Depois, a separação correta permite que embalagens e outros materiais sigam para reciclagem, evitando contaminações que tornam o processo mais difícil.

Também é importante criar procura para materiais reciclados. Transformar resíduos do ecoponto amarelo em mobiliário urbano, estruturas, perfis e soluções duráveis demonstra que o plástico pode deixar de ser descartável e passar a ser matéria-prima para produtos úteis e resistentes.`,
      en: `Plastic waste has become a global environmental problem because it is present in packaging, disposable objects, equipment, and very fast consumption chains. When it is poorly managed, it ends up in soil, rivers, the sea, and wildlife habitats.

The response begins before the recycling bin: reduce unnecessary consumption, choose durable products, and avoid disposables whenever possible. Then, correct sorting allows packaging and other materials to go to recycling, avoiding contamination that makes the process harder.

It is also important to create demand for recycled materials. Turning yellow-bin waste into street furniture, structures, profiles, and durable solutions shows that plastic can stop being disposable and become raw material for useful, resistant products.`,
      es: `Los residuos plásticos se han convertido en un problema ambiental global porque están en envases, objetos desechables, equipos y cadenas de consumo muy rápidas. Cuando se gestionan mal, terminan en el suelo, los ríos, el mar y los hábitats de vida silvestre.

La respuesta empieza antes del contenedor: reducir consumos innecesarios, elegir productos duraderos y evitar desechables siempre que sea posible. Después, una separación correcta permite que los envases y otros materiales vayan al reciclaje, evitando contaminaciones que dificultan el proceso.

También es importante crear demanda para materiales reciclados. Transformar residuos del contenedor amarillo en mobiliario urbano, estructuras, perfiles y soluciones duraderas demuestra que el plástico puede dejar de ser desechable y convertirse en materia prima para productos útiles y resistentes.`,
    },
  },
  'problema-da-poluicao-de-plasticos-nas-praias': {
    title: {
      pt: 'O problema da poluição de plásticos nas praias',
      en: 'The problem of plastic pollution on beaches',
      es: 'El problema de la contaminación por plásticos en las playas',
    },
    category: {
      pt: 'Oceanos',
      en: 'Oceans',
      es: 'Océanos',
    },
    excerpt: {
      pt: 'As praias mostram de forma visível o caminho errado dos plásticos: consumo rápido, má gestão, fragmentação e impacto na vida marinha.',
      en: 'Beaches visibly show the wrong path of plastics: fast consumption, poor management, fragmentation, and impact on marine life.',
      es: 'Las playas muestran de forma visible el camino equivocado de los plásticos: consumo rápido, mala gestión, fragmentación e impacto en la vida marina.',
    },
    body: {
      pt: `A poluição por plásticos nas praias é uma das faces mais visíveis de uma cadeia de gestão mal resolvida. Garrafas, sacos, embalagens, tampas, redes e fragmentos chegam ao areal por abandono direto, vento, rios, drenagens urbanas e atividades marítimas.

O impacto vai além da aparência. Animais marinhos podem ingerir plástico ou ficar presos em resíduos; os materiais fragmentam-se em microplásticos; e as comunidades costeiras perdem qualidade ambiental, turística e económica. Limpezas de praia ajudam, mas chegam tarde no ciclo do problema.

A prevenção é mais eficaz: reduzir descartáveis, melhorar recolha e separação, responsabilizar produtores e consumidores, e valorizar materiais reciclados. Cada plástico que não chega à praia é um custo ambiental evitado.`,
      en: `Plastic pollution on beaches is one of the most visible faces of an unresolved waste-management chain. Bottles, bags, packaging, caps, nets, and fragments reach the sand through direct littering, wind, rivers, urban drainage, and maritime activity.

The impact goes beyond appearance. Marine animals can ingest plastic or become trapped in waste; materials fragment into microplastics; and coastal communities lose environmental, tourism, and economic value. Beach clean-ups help, but they arrive late in the problem cycle.

Prevention is more effective: reduce disposables, improve collection and sorting, hold producers and consumers accountable, and value recycled materials. Every piece of plastic that does not reach the beach is an environmental cost avoided.`,
      es: `La contaminación por plásticos en las playas es una de las caras más visibles de una cadena de gestión de residuos mal resuelta. Botellas, bolsas, envases, tapones, redes y fragmentos llegan a la arena por abandono directo, viento, ríos, drenaje urbano y actividad marítima.

El impacto va más allá del aspecto. Los animales marinos pueden ingerir plástico o quedar atrapados en residuos; los materiales se fragmentan en microplásticos; y las comunidades costeras pierden valor ambiental, turístico y económico. Las limpiezas de playa ayudan, pero llegan tarde en el ciclo del problema.

La prevención es más eficaz: reducir desechables, mejorar la recogida y separación, responsabilizar a productores y consumidores, y valorizar materiales reciclados. Cada plástico que no llega a la playa es un coste ambiental evitado.`,
    },
  },
  'problema-da-madeira-no-mobiliario-urbano': {
    title: {
      pt: 'O problema da madeira no mobiliário urbano',
      en: 'The problem with wood in street furniture',
      es: 'El problema de la madera en el mobiliario urbano',
    },
    category: {
      pt: 'Materiais',
      en: 'Materials',
      es: 'Materiales',
    },
    excerpt: {
      pt: 'A madeira exposta em espaço público exige manutenção, degrada-se com humidade e pode gerar custos recorrentes para autarquias.',
      en: 'Wood exposed in public space needs maintenance, degrades with moisture, and can create recurring costs for municipalities.',
      es: 'La madera expuesta en el espacio público exige mantenimiento, se degrada con la humedad y puede generar costes recurrentes para los municipios.',
    },
    body: {
      pt: `A madeira tem lugar em muitos contextos, mas no mobiliário urbano fica sujeita a chuva, sol, variações térmicas, fungos, insetos e utilização intensiva. Sem manutenção frequente, pode rachar, apodrecer, perder resistência e tornar-se desconfortável ou insegura.

Para as autarquias, o problema raramente é apenas o custo inicial. Pinturas, vernizes, substituições e intervenções criam despesa contínua, além de períodos em que bancos, papeleiras, vedações ou passadiços deixam de estar em boas condições.

Materiais reciclados de longa duração oferecem uma alternativa circular. Perfis de plástico reciclado não apodrecem, não enferrujam, resistem melhor à humidade e valorizam resíduos que já existem. A escolha do material deve olhar para todo o ciclo de vida, não apenas para o preço de compra.`,
      en: `Wood has its place in many contexts, but in street furniture it is exposed to rain, sun, temperature changes, fungi, insects, and intensive use. Without frequent maintenance, it can crack, rot, lose strength, and become uncomfortable or unsafe.

For municipalities, the issue is rarely just the initial cost. Paint, varnish, replacements, and interventions create ongoing expense, as well as periods when benches, bins, fencing, or walkways are no longer in good condition.

Long-lasting recycled materials offer a circular alternative. Recycled-plastic profiles do not rot or rust, resist moisture better, and give value to waste that already exists. Material choice should consider the whole life cycle, not only the purchase price.`,
      es: `La madera tiene su lugar en muchos contextos, pero en el mobiliario urbano queda expuesta a lluvia, sol, cambios térmicos, hongos, insectos y uso intensivo. Sin mantenimiento frecuente, puede agrietarse, pudrirse, perder resistencia y volverse incómoda o insegura.

Para los municipios, el problema rara vez es solo el coste inicial. Pinturas, barnices, sustituciones e intervenciones generan gasto continuo, además de periodos en que bancos, papeleras, vallas o pasarelas dejan de estar en buen estado.

Los materiales reciclados de larga duración ofrecen una alternativa circular. Los perfiles de plástico reciclado no se pudren ni se oxidan, resisten mejor la humedad y valorizan residuos que ya existen. La elección del material debe mirar todo el ciclo de vida, no solo el precio de compra.`,
    },
  },
  'compostagem-caseira': {
    title: {
      pt: 'Compostagem caseira',
      en: 'Home composting',
      es: 'Compostaje doméstico',
    },
    category: {
      pt: 'Compostagem',
      en: 'Composting',
      es: 'Compostaje',
    },
    excerpt: {
      pt: 'Com poucos cuidados, restos de cozinha e jardim podem transformar-se em composto útil para vasos, hortas e jardins.',
      en: 'With a few precautions, kitchen and garden scraps can become useful compost for pots, vegetable patches, and gardens.',
      es: 'Con pocos cuidados, los restos de cocina y jardín pueden transformarse en compost útil para macetas, huertos y jardines.',
    },
    body: {
      pt: `A compostagem caseira permite tratar parte dos resíduos orgânicos no local onde são produzidos. Cascas de fruta e legumes, borras de café, folhas secas, pequenas podas e outros materiais biodegradáveis podem transformar-se num composto rico para o solo.

O equilíbrio é essencial. Materiais verdes, mais húmidos e ricos em azoto, devem ser misturados com materiais secos, como folhas, cartão sem tinta e pequenos ramos. O compostor precisa de ar, humidade moderada e alguma mistura para evitar odores e acelerar a decomposição.

Além de reduzir o lixo indiferenciado, a compostagem caseira cria consciência. Quem acompanha o processo percebe melhor o valor da matéria orgânica e passa a olhar para os resíduos como parte de um ciclo.`,
      en: `Home composting makes it possible to treat part of organic waste where it is produced. Fruit and vegetable peels, coffee grounds, dry leaves, small prunings, and other biodegradable materials can become rich compost for the soil.

Balance is essential. Green materials, which are wetter and rich in nitrogen, should be mixed with dry materials such as leaves, unprinted cardboard, and small branches. The composter needs air, moderate moisture, and some mixing to avoid odours and speed up decomposition.

Besides reducing mixed waste, home composting builds awareness. Anyone who follows the process understands the value of organic matter better and starts seeing waste as part of a cycle.`,
      es: `El compostaje doméstico permite tratar parte de los residuos orgánicos en el lugar donde se producen. Cáscaras de frutas y verduras, posos de café, hojas secas, pequeñas podas y otros materiales biodegradables pueden convertirse en un compost rico para el suelo.

El equilibrio es esencial. Los materiales verdes, más húmedos y ricos en nitrógeno, deben mezclarse con materiales secos, como hojas, cartón sin tinta y pequeñas ramas. El compostador necesita aire, humedad moderada y algo de mezcla para evitar olores y acelerar la descomposición.

Además de reducir la basura mezclada, el compostaje doméstico crea conciencia. Quien acompaña el proceso entiende mejor el valor de la materia orgánica y empieza a ver los residuos como parte de un ciclo.`,
    },
  },
  'seca-no-algarve-em-2024': {
    title: {
      pt: 'Seca no Algarve em 2024',
      en: 'Drought in the Algarve in 2024',
      es: 'Sequía en el Algarve en 2024',
    },
    category: {
      pt: 'Clima',
      en: 'Climate',
      es: 'Clima',
    },
    excerpt: {
      pt: 'A escassez de água no Algarve mostra como a gestão hídrica, o consumo e a adaptação climática já são temas de urgência local.',
      en: 'Water scarcity in the Algarve shows how water management, consumption, and climate adaptation are already urgent local issues.',
      es: 'La escasez de agua en el Algarve muestra cómo la gestión hídrica, el consumo y la adaptación climática ya son urgencias locales.',
    },
    body: {
      pt: `A seca no Algarve em 2024 tornou visível uma pressão que se vinha acumulando: menos chuva, reservas limitadas, consumo elevado e atividades económicas muito dependentes de água. Quando a escassez se prolonga, agricultura, turismo, espaços verdes e abastecimento urbano entram em tensão.

A resposta não pode depender apenas de esperar por chuva. É necessário reduzir perdas nas redes, reutilizar água sempre que possível, adaptar culturas e jardins, investir em eficiência e proteger solos que ajudam a reter humidade. Cada decisão local conta.

As alterações climáticas tornam estes episódios mais prováveis e mais duros. Falar de seca é falar de planeamento, responsabilidade coletiva e escolhas que evitem transformar uma dificuldade temporária numa crise permanente.`,
      en: `The drought in the Algarve in 2024 made visible a pressure that had been building: less rain, limited reserves, high consumption, and economic activities that depend heavily on water. When scarcity lasts, agriculture, tourism, green spaces, and urban supply all come under strain.

The response cannot rely only on waiting for rain. It is necessary to reduce network losses, reuse water whenever possible, adapt crops and gardens, invest in efficiency, and protect soils that help retain moisture. Every local decision matters.

Climate change makes these episodes more likely and more severe. Talking about drought means talking about planning, collective responsibility, and choices that prevent a temporary difficulty from becoming a permanent crisis.`,
      es: `La sequía en el Algarve en 2024 hizo visible una presión que venía acumulándose: menos lluvia, reservas limitadas, alto consumo y actividades económicas muy dependientes del agua. Cuando la escasez se prolonga, agricultura, turismo, zonas verdes y abastecimiento urbano entran en tensión.

La respuesta no puede depender solo de esperar lluvia. Es necesario reducir pérdidas en las redes, reutilizar agua siempre que sea posible, adaptar cultivos y jardines, invertir en eficiencia y proteger suelos que ayudan a retener humedad. Cada decisión local cuenta.

El cambio climático vuelve estos episodios más probables y más duros. Hablar de sequía es hablar de planificación, responsabilidad colectiva y decisiones que eviten transformar una dificultad temporal en una crisis permanente.`,
    },
  },
  'os-municipios-portugueses-a-partir-de-1-de-janeiro-de-2024-tem-que-recolher-residuos-organicos':
    {
      title: {
        pt: 'Municípios portugueses e a recolha de resíduos orgânicos',
        en: 'Portuguese municipalities and organic-waste collection',
        es: 'Municipios portugueses y recogida de residuos orgánicos',
      },
      category: {
        pt: 'Resíduos',
        en: 'Waste',
        es: 'Residuos',
      },
      excerpt: {
        pt: 'A recolha seletiva de biorresíduos exige contentores, logística, comunicação e participação dos cidadãos para sair do papel.',
        en: 'Selective bio-waste collection needs bins, logistics, communication, and citizen participation to work in practice.',
        es: 'La recogida selectiva de biorresiduos necesita contenedores, logística, comunicación y participación ciudadana para funcionar de verdad.',
      },
      body: {
        pt: `A obrigação de recolher resíduos orgânicos coloca os municípios perante uma mudança importante na gestão urbana. Não basta instalar contentores castanhos; é preciso planear rotas, adaptar tratamento, formar equipas e explicar aos cidadãos o que deve ou não entrar neste fluxo.

Os biorresíduos têm valor quando são separados corretamente. Podem seguir para compostagem ou digestão anaeróbia, produzindo composto, energia e redução de emissões. Misturados com lixo indiferenciado, perdem esse potencial e aumentam custos.

A implementação depende de confiança. As pessoas precisam de perceber que o esforço de separar tem destino útil. Comunicação clara, proximidade, fiscalização proporcional e exemplos visíveis de composto aplicado em jardins e espaços públicos ajudam a consolidar o hábito.`,
        en: `The obligation to collect organic waste places municipalities before an important change in urban management. Installing brown bins is not enough; routes must be planned, treatment adapted, teams trained, and citizens told clearly what should and should not enter this stream.

Bio-waste has value when it is sorted correctly. It can go to composting or anaerobic digestion, producing compost, energy, and lower emissions. Mixed with general waste, it loses that potential and increases costs.

Implementation depends on trust. People need to understand that the effort to sort has a useful destination. Clear communication, local support, proportionate enforcement, and visible examples of compost used in gardens and public spaces help consolidate the habit.`,
        es: `La obligación de recoger residuos orgánicos coloca a los municipios ante un cambio importante en la gestión urbana. No basta con instalar contenedores marrones; hay que planificar rutas, adaptar tratamiento, formar equipos y explicar claramente a la ciudadanía qué debe entrar o no en este flujo.

Los biorresiduos tienen valor cuando se separan correctamente. Pueden ir a compostaje o digestión anaerobia, produciendo compost, energía y reducción de emisiones. Mezclados con basura indiferenciada, pierden ese potencial y aumentan costes.

La implementación depende de la confianza. Las personas necesitan entender que el esfuerzo de separar tiene un destino útil. Comunicación clara, proximidad, fiscalización proporcional y ejemplos visibles de compost aplicado en jardines y espacios públicos ayudan a consolidar el hábito.`,
      },
    },
  'o-aumento-das-temperaturas-globais-em-2023': {
    title: {
      pt: 'O aumento das temperaturas globais em 2023',
      en: 'The rise in global temperatures in 2023',
      es: 'El aumento de las temperaturas globales en 2023',
    },
    category: {
      pt: 'Clima',
      en: 'Climate',
      es: 'Clima',
    },
    excerpt: {
      pt: 'O calor extremo de 2023 reforçou a urgência de reduzir emissões, adaptar cidades e proteger comunidades vulneráveis.',
      en: 'The extreme heat of 2023 reinforced the urgency of reducing emissions, adapting cities, and protecting vulnerable communities.',
      es: 'El calor extremo de 2023 reforzó la urgencia de reducir emisiones, adaptar ciudades y proteger comunidades vulnerables.',
    },
    body: {
      pt: `O aumento das temperaturas globais em 2023 confirmou uma tendência preocupante: ondas de calor mais frequentes, incêndios mais severos, secas prolongadas e pressão acrescida sobre saúde, agricultura e recursos hídricos.

As causas estão ligadas sobretudo à acumulação de gases com efeito de estufa, resultantes da queima de combustíveis fósseis, desflorestação e modelos de produção e consumo muito intensivos. O aquecimento global não é um conceito distante; aparece na qualidade do ar, na água disponível e no risco de eventos extremos.

A resposta tem duas frentes. Mitigar, reduzindo emissões e desperdício; e adaptar, preparando cidades, edifícios, zonas verdes e sistemas de proteção civil para um clima mais instável. Cada setor tem de fazer a sua parte.`,
      en: `The rise in global temperatures in 2023 confirmed a worrying trend: more frequent heat waves, more severe fires, prolonged droughts, and greater pressure on health, agriculture, and water resources.

The causes are mainly linked to the accumulation of greenhouse gases from burning fossil fuels, deforestation, and highly intensive production and consumption models. Global warming is not a distant concept; it appears in air quality, available water, and the risk of extreme events.

The response has two fronts. Mitigation, by reducing emissions and waste; and adaptation, by preparing cities, buildings, green areas, and civil-protection systems for a more unstable climate. Every sector has a role to play.`,
      es: `El aumento de las temperaturas globales en 2023 confirmó una tendencia preocupante: olas de calor más frecuentes, incendios más severos, sequías prolongadas y mayor presión sobre la salud, la agricultura y los recursos hídricos.

Las causas están ligadas sobre todo a la acumulación de gases de efecto invernadero procedentes de la quema de combustibles fósiles, la deforestación y modelos de producción y consumo muy intensivos. El calentamiento global no es un concepto distante; aparece en la calidad del aire, el agua disponible y el riesgo de eventos extremos.

La respuesta tiene dos frentes. Mitigar, reduciendo emisiones y desperdicio; y adaptar, preparando ciudades, edificios, zonas verdes y sistemas de protección civil para un clima más inestable. Cada sector debe hacer su parte.`,
    },
  },
  '50-bilioes-de-pedacos-de-plastico-no-mar-e-irrecuperavel': {
    title: {
      pt: '50 biliões de pedaços de plástico no mar são irrecuperáveis',
      en: '50 trillion pieces of plastic at sea are unrecoverable',
      es: '50 billones de fragmentos de plástico en el mar son irrecuperables',
    },
    category: {
      pt: 'Oceanos',
      en: 'Oceans',
      es: 'Océanos',
    },
    excerpt: {
      pt: 'Quando o plástico chega ao oceano e se fragmenta, a limpeza deixa de ser suficiente: a prioridade tem de ser travar a entrada.',
      en: 'When plastic reaches the ocean and fragments, clean-up is no longer enough: the priority must be stopping it from entering.',
      es: 'Cuando el plástico llega al océano y se fragmenta, la limpieza ya no basta: la prioridad debe ser impedir su entrada.',
    },
    body: {
      pt: `A ideia de biliões de fragmentos de plástico no mar mostra a escala do problema. Depois de entrar no oceano, o plástico é transportado por correntes, degradado pelo sol e pelo sal, e parte-se em pedaços cada vez menores. Muitos tornam-se praticamente impossíveis de recuperar.

As consequências atingem aves, peixes, mamíferos marinhos e a própria cadeia alimentar. A remoção é importante em zonas costeiras, mas não resolve o problema quando os fragmentos já estão dispersos em mar aberto ou transformados em microplásticos.

Por isso, a prioridade é atuar em terra: reduzir descartáveis, melhorar recolha, evitar perdas em transporte, reciclar mais e transformar resíduos em produtos duráveis. O plástico que não entra no mar é o único que ainda controlamos totalmente.`,
      en: `The idea of trillions of plastic fragments at sea shows the scale of the problem. Once plastic enters the ocean, it is carried by currents, degraded by sun and salt, and broken into ever smaller pieces. Many become practically impossible to recover.

The consequences affect birds, fish, marine mammals, and the food chain itself. Removal is important in coastal areas, but it does not solve the problem once fragments are dispersed in open water or turned into microplastics.

That is why the priority is action on land: reduce disposables, improve collection, prevent losses during transport, recycle more, and turn waste into durable products. Plastic that never reaches the sea is the only plastic we still fully control.`,
      es: `La idea de billones de fragmentos de plástico en el mar muestra la escala del problema. Una vez que el plástico entra en el océano, es transportado por corrientes, degradado por el sol y la sal, y se rompe en piezas cada vez más pequeñas. Muchas se vuelven prácticamente imposibles de recuperar.

Las consecuencias afectan a aves, peces, mamíferos marinos y a la propia cadena alimentaria. La retirada es importante en zonas costeras, pero no resuelve el problema cuando los fragmentos ya están dispersos en alta mar o convertidos en microplásticos.

Por eso, la prioridad es actuar en tierra: reducir desechables, mejorar la recogida, evitar pérdidas en el transporte, reciclar más y transformar residuos en productos duraderos. El plástico que no entra en el mar es el único que todavía controlamos por completo.`,
    },
  },
  'escassez-de-chuva-em-portugal': {
    title: {
      pt: 'Escassez de chuva em Portugal',
      en: 'Rain scarcity in Portugal',
      es: 'Escasez de lluvia en Portugal',
    },
    category: {
      pt: 'Clima',
      en: 'Climate',
      es: 'Clima',
    },
    excerpt: {
      pt: 'A falta de chuva pressiona reservas, agricultura e território, exigindo poupança, reutilização e planeamento de longo prazo.',
      en: 'Lack of rain pressures reserves, agriculture, and territory, demanding savings, reuse, and long-term planning.',
      es: 'La falta de lluvia presiona reservas, agricultura y territorio, exigiendo ahorro, reutilización y planificación a largo plazo.',
    },
    body: {
      pt: `A escassez de chuva em Portugal afeta muito mais do que a paisagem. Reservas de água diminuem, solos perdem humidade, culturas ficam vulneráveis e aumenta a pressão sobre rios, aquíferos e abastecimento urbano.

Num clima mais irregular, a gestão da água precisa de deixar de ser reativa. É necessário reduzir perdas nas redes, promover reutilização, escolher espécies vegetais mais adaptadas, melhorar retenção de água no solo e evitar consumos que não fazem sentido em períodos de seca.

Poupar água não é apenas uma resposta de emergência. É uma cultura de uso responsável que deve entrar em casas, empresas, escolas, municípios e projetos de espaço público.`,
      en: `Rain scarcity in Portugal affects much more than the landscape. Water reserves fall, soils lose moisture, crops become vulnerable, and pressure increases on rivers, aquifers, and urban supply.

In a more irregular climate, water management must stop being reactive. It is necessary to reduce network losses, promote reuse, choose better-adapted plant species, improve water retention in soil, and avoid consumption that makes no sense during drought periods.

Saving water is not only an emergency response. It is a culture of responsible use that must enter homes, companies, schools, municipalities, and public-space projects.`,
      es: `La escasez de lluvia en Portugal afecta mucho más que al paisaje. Las reservas de agua disminuyen, los suelos pierden humedad, los cultivos se vuelven vulnerables y aumenta la presión sobre ríos, acuíferos y abastecimiento urbano.

En un clima más irregular, la gestión del agua debe dejar de ser reactiva. Es necesario reducir pérdidas en las redes, promover la reutilización, elegir especies vegetales más adaptadas, mejorar la retención de agua en el suelo y evitar consumos que no tienen sentido en periodos de sequía.

Ahorrar agua no es solo una respuesta de emergencia. Es una cultura de uso responsable que debe entrar en hogares, empresas, escuelas, municipios y proyectos de espacio público.`,
    },
  },
  'guia-para-fazer-uma-boa-compostagem': {
    title: {
      pt: 'Guia para fazer uma boa compostagem',
      en: 'A guide to good composting',
      es: 'Guía para hacer un buen compostaje',
    },
    category: {
      pt: 'Compostagem',
      en: 'Composting',
      es: 'Compostaje',
    },
    excerpt: {
      pt: 'Uma boa compostagem depende de equilíbrio entre materiais verdes e secos, humidade, ar e paciência.',
      en: 'Good composting depends on balance between green and dry materials, moisture, air, and patience.',
      es: 'Un buen compostaje depende del equilibrio entre materiales verdes y secos, humedad, aire y paciencia.',
    },
    body: {
      pt: `Fazer uma boa compostagem começa por separar corretamente os materiais. Restos de frutas e legumes, borras de café e relva fresca fornecem azoto; folhas secas, cartão limpo, pequenos ramos e serradura sem tratamento ajudam a equilibrar carbono e estrutura.

O compostor deve manter-se húmido como uma esponja espremida, mas nunca encharcado. Também precisa de ar, por isso convém misturar de tempos a tempos e evitar camadas compactas. Maus odores costumam indicar excesso de humidade, falta de materiais secos ou pouca ventilação.

Com tempo, o volume diminui e surge um composto escuro, solto e com cheiro a terra. Esse material pode ser usado em hortas, jardins e vasos, fechando o ciclo dos biorresíduos em vez de os enviar para aterro.`,
      en: `Good composting starts with sorting materials correctly. Fruit and vegetable scraps, coffee grounds, and fresh grass provide nitrogen; dry leaves, clean cardboard, small branches, and untreated sawdust help balance carbon and structure.

The composter should stay moist like a squeezed sponge, but never waterlogged. It also needs air, so it should be mixed from time to time and compact layers should be avoided. Bad smells usually indicate excess moisture, lack of dry materials, or poor ventilation.

With time, the volume shrinks and a dark, loose compost with an earthy smell appears. This material can be used in vegetable patches, gardens, and pots, closing the bio-waste cycle instead of sending it to landfill.`,
      es: `Hacer un buen compostaje empieza por separar correctamente los materiales. Restos de frutas y verduras, posos de café y césped fresco aportan nitrógeno; hojas secas, cartón limpio, pequeñas ramas y serrín sin tratamiento ayudan a equilibrar carbono y estructura.

El compostador debe mantenerse húmedo como una esponja escurrida, pero nunca encharcado. También necesita aire, por eso conviene mezclar de vez en cuando y evitar capas compactas. Los malos olores suelen indicar exceso de humedad, falta de materiales secos o poca ventilación.

Con el tiempo, el volumen disminuye y aparece un compost oscuro, suelto y con olor a tierra. Ese material puede usarse en huertos, jardines y macetas, cerrando el ciclo de los biorresiduos en vez de enviarlos al vertedero.`,
    },
  },
  'compostagem-nas-escolas': {
    title: {
      pt: 'Compostagem nas escolas',
      en: 'Composting in schools',
      es: 'Compostaje en las escuelas',
    },
    category: {
      pt: 'Educação ambiental',
      en: 'Environmental education',
      es: 'Educación ambiental',
    },
    excerpt: {
      pt: 'Nas escolas, a compostagem liga ciência, cidadania e rotina diária, mostrando aos alunos que os resíduos podem voltar a ser recurso.',
      en: 'In schools, composting connects science, citizenship, and daily routine, showing students that waste can become a resource again.',
      es: 'En las escuelas, el compostaje conecta ciencia, ciudadanía y rutina diaria, mostrando al alumnado que los residuos pueden volver a ser recurso.',
    },
    body: {
      pt: `A compostagem nas escolas é uma ferramenta prática de educação ambiental. Permite que os alunos observem decomposição, microrganismos, ciclos de nutrientes e responsabilidade coletiva, não como teoria distante, mas como algo que acontece no recreio ou na horta escolar.

O processo pode envolver cantinas, salas de aula, clubes ambientais e equipas operacionais. Separar restos vegetais, alimentar o compostor, medir humidade, registar temperaturas e usar o composto em plantas cria aprendizagem ativa.

Além de reduzir resíduos, a escola passa a dar exemplo à comunidade. Crianças e jovens levam hábitos para casa e ajudam a normalizar a separação dos biorresíduos.`,
      en: `Composting in schools is a practical tool for environmental education. It allows students to observe decomposition, microorganisms, nutrient cycles, and collective responsibility not as distant theory, but as something happening in the playground or school garden.

The process can involve canteens, classrooms, environmental clubs, and operational teams. Sorting vegetable scraps, feeding the composter, measuring moisture, recording temperatures, and using compost on plants creates active learning.

Besides reducing waste, the school becomes an example for the community. Children and young people take habits home and help make bio-waste sorting normal.`,
      es: `El compostaje en las escuelas es una herramienta práctica de educación ambiental. Permite que el alumnado observe descomposición, microorganismos, ciclos de nutrientes y responsabilidad colectiva, no como teoría distante, sino como algo que ocurre en el patio o en el huerto escolar.

El proceso puede implicar comedores, aulas, clubes ambientales y equipos operativos. Separar restos vegetales, alimentar el compostador, medir humedad, registrar temperaturas y usar el compost en plantas crea aprendizaje activo.

Además de reducir residuos, la escuela pasa a dar ejemplo a la comunidad. Niños y jóvenes llevan hábitos a casa y ayudan a normalizar la separación de biorresiduos.`,
    },
  },
  'uso-da-compostagem-na-jardinagem': {
    title: {
      pt: 'Uso da compostagem na jardinagem',
      en: 'Using compost in gardening',
      es: 'Uso del compostaje en jardinería',
    },
    category: {
      pt: 'Jardinagem',
      en: 'Gardening',
      es: 'Jardinería',
    },
    excerpt: {
      pt: 'O composto melhora o solo, retém humidade e reduz a necessidade de fertilizantes sintéticos em jardins e hortas.',
      en: 'Compost improves soil, retains moisture, and reduces the need for synthetic fertilisers in gardens and vegetable patches.',
      es: 'El compost mejora el suelo, retiene humedad y reduce la necesidad de fertilizantes sintéticos en jardines y huertos.',
    },
    body: {
      pt: `Na jardinagem, o composto é um aliado discreto mas poderoso. Misturado no solo, melhora a estrutura, aumenta a matéria orgânica, ajuda a reter água e fornece nutrientes de libertação gradual.

Pode ser aplicado em canteiros, hortas, árvores, vasos e relvados, sempre em doses adequadas e preferencialmente bem maturado. Um composto ainda fresco pode aquecer, libertar odores ou competir por azoto; por isso, o tempo de cura é importante.

Usar composto fecha o ciclo entre resíduos orgânicos e espaços verdes. Menos resíduos seguem para aterro e mais vida regressa ao solo.`,
      en: `In gardening, compost is a quiet but powerful ally. Mixed into soil, it improves structure, increases organic matter, helps retain water, and provides slow-release nutrients.

It can be used in flower beds, vegetable patches, trees, pots, and lawns, always in suitable amounts and preferably well matured. Compost that is still fresh can heat up, release odours, or compete for nitrogen, so curing time matters.

Using compost closes the cycle between organic waste and green spaces. Less waste goes to landfill and more life returns to the soil.`,
      es: `En jardinería, el compost es un aliado discreto pero potente. Mezclado con el suelo, mejora la estructura, aumenta la materia orgánica, ayuda a retener agua y aporta nutrientes de liberación gradual.

Puede aplicarse en parterres, huertos, árboles, macetas y céspedes, siempre en dosis adecuadas y preferiblemente bien maduro. Un compost todavía fresco puede calentarse, liberar olores o competir por nitrógeno; por eso el tiempo de maduración importa.

Usar compost cierra el ciclo entre residuos orgánicos y zonas verdes. Menos residuos van al vertedero y más vida vuelve al suelo.`,
    },
  },
  'como-plastico-entra-na-cadeia-alimentar-dos-humanos': {
    title: {
      pt: 'Como o plástico entra na cadeia alimentar dos humanos',
      en: 'How plastic enters the human food chain',
      es: 'Cómo entra el plástico en la cadena alimentaria humana',
    },
    category: {
      pt: 'Plásticos',
      en: 'Plastics',
      es: 'Plásticos',
    },
    excerpt: {
      pt: 'Os microplásticos podem passar do ambiente para animais, água, sal e alimentos, tornando a poluição plástica também uma questão de saúde.',
      en: 'Microplastics can move from the environment into animals, water, salt, and food, making plastic pollution a health issue too.',
      es: 'Los microplásticos pueden pasar del ambiente a animales, agua, sal y alimentos, convirtiendo la contaminación plástica también en un asunto de salud.',
    },
    body: {
      pt: `O plástico entra na cadeia alimentar quando resíduos abandonados se fragmentam em partículas cada vez menores. Esses microplásticos podem ser ingeridos por organismos marinhos, acumular-se em sedimentos, circular na água e chegar indiretamente aos alimentos.

O problema não está apenas no peixe. Partículas podem ser detetadas em sal, água, poeiras e em cadeias de produção muito diversas. A investigação continua a estudar os efeitos na saúde humana, mas a prevenção ambiental é já uma obrigação.

Reduzir plástico descartável, melhorar a recolha, reciclar corretamente e escolher materiais duráveis ajuda a cortar o problema na origem. Quanto menos plástico se dispersar, menor a probabilidade de regressar à mesa.`,
      en: `Plastic enters the food chain when abandoned waste fragments into ever smaller particles. These microplastics can be ingested by marine organisms, accumulate in sediments, circulate in water, and indirectly reach food.

The problem is not limited to fish. Particles can be found in salt, water, dust, and very different production chains. Research continues to study the effects on human health, but environmental prevention is already an obligation.

Reducing disposable plastic, improving collection, recycling correctly, and choosing durable materials helps cut the problem at source. The less plastic disperses, the lower the chance that it returns to the table.`,
      es: `El plástico entra en la cadena alimentaria cuando los residuos abandonados se fragmentan en partículas cada vez más pequeñas. Estos microplásticos pueden ser ingeridos por organismos marinos, acumularse en sedimentos, circular en el agua y llegar indirectamente a los alimentos.

El problema no está solo en el pescado. Pueden detectarse partículas en sal, agua, polvo y cadenas de producción muy diversas. La investigación sigue estudiando los efectos sobre la salud humana, pero la prevención ambiental ya es una obligación.

Reducir plástico desechable, mejorar la recogida, reciclar correctamente y elegir materiales duraderos ayuda a cortar el problema en origen. Cuanto menos plástico se disperse, menor será la probabilidad de que vuelva a la mesa.`,
    },
  },
  'problema-do-lixo-de-equipamentos-informaticos-e-telemoveis': {
    title: {
      pt: 'O problema do lixo de equipamentos informáticos e telemóveis',
      en: 'The problem of computer and mobile-phone e-waste',
      es: 'El problema de los residuos de equipos informáticos y móviles',
    },
    category: {
      pt: 'Resíduos',
      en: 'Waste',
      es: 'Residuos',
    },
    excerpt: {
      pt: 'O lixo eletrónico mistura metais valiosos, plásticos e componentes perigosos; por isso deve ser reparado, reutilizado ou encaminhado corretamente.',
      en: 'E-waste combines valuable metals, plastics, and hazardous components; it should therefore be repaired, reused, or correctly collected.',
      es: 'La basura electrónica mezcla metales valiosos, plásticos y componentes peligrosos; por eso debe repararse, reutilizarse o recogerse correctamente.',
    },
    body: {
      pt: `Computadores, telemóveis e outros equipamentos eletrónicos têm ciclos de substituição cada vez mais curtos. Quando deixam de ser usados, tornam-se resíduos complexos, com plásticos, vidro, metais raros, baterias e componentes que podem contaminar se forem descartados no lixo comum.

A melhor resposta é prolongar a vida útil: reparar, atualizar, doar ou vender equipamentos ainda funcionais. Quando já não há utilização possível, devem seguir para pontos de recolha próprios, onde materiais valiosos podem ser recuperados e componentes perigosos tratados com segurança.

O lixo eletrónico mostra que reciclar não chega se continuarmos a consumir como se os recursos fossem ilimitados. Durabilidade, reparabilidade e recolha responsável têm de fazer parte da decisão de compra.`,
      en: `Computers, mobile phones, and other electronic equipment have ever shorter replacement cycles. When they stop being used, they become complex waste, with plastics, glass, rare metals, batteries, and components that can pollute if discarded with general rubbish.

The best response is to extend service life: repair, upgrade, donate, or sell equipment that still works. When use is no longer possible, it should go to proper collection points, where valuable materials can be recovered and hazardous components treated safely.

E-waste shows that recycling is not enough if we keep consuming as if resources were unlimited. Durability, repairability, and responsible collection must be part of the purchase decision.`,
      es: `Ordenadores, teléfonos móviles y otros equipos electrónicos tienen ciclos de sustitución cada vez más cortos. Cuando dejan de usarse, se convierten en residuos complejos, con plásticos, vidrio, metales raros, baterías y componentes que pueden contaminar si se tiran a la basura común.

La mejor respuesta es alargar la vida útil: reparar, actualizar, donar o vender equipos todavía funcionales. Cuando ya no es posible usarlos, deben ir a puntos de recogida adecuados, donde se pueden recuperar materiales valiosos y tratar componentes peligrosos con seguridad.

La basura electrónica muestra que reciclar no basta si seguimos consumiendo como si los recursos fueran ilimitados. Durabilidad, reparabilidad y recogida responsable deben formar parte de la decisión de compra.`,
    },
  },
  'usar-como-materia-prima-os-residuos-do-ecoponto-amarelo': {
    title: {
      pt: 'Usar resíduos do ecoponto amarelo como matéria-prima',
      en: 'Using yellow-bin waste as raw material',
      es: 'Usar residuos del contenedor amarillo como materia prima',
    },
    category: {
      pt: 'Economia circular',
      en: 'Circular economy',
      es: 'Economía circular',
    },
    excerpt: {
      pt: 'A DaFábrica4You valoriza resíduos do ecoponto amarelo, transformando-os em produtos duráveis para espaço público e privado.',
      en: 'DaFábrica4You gives value to yellow-bin waste by turning it into durable products for public and private spaces.',
      es: 'DaFábrica4You valoriza residuos del contenedor amarillo convirtiéndolos en productos duraderos para espacios públicos y privados.',
    },
    body: {
      pt: `Usar resíduos do ecoponto amarelo como matéria-prima é uma aplicação concreta de economia circular. Em vez de tratar plástico como fim de linha, o material é selecionado, transformado e convertido em perfis e produtos com nova utilidade.

Esta abordagem reduz a necessidade de matérias-primas virgens e cria procura para resíduos que já existem. Bancos, vedações, passadiços, floreiras, compostores e outras soluções podem incorporar plástico reciclado com elevada durabilidade.

O valor está na mudança de lógica: o resíduo deixa de ser apenas custo de gestão e passa a ser recurso industrial. Para isso, a separação correta no ecoponto amarelo continua a ser a primeira etapa essencial.`,
      en: `Using yellow-bin waste as raw material is a concrete application of the circular economy. Instead of treating plastic as the end of the line, the material is sorted, transformed, and converted into profiles and products with new utility.

This approach reduces the need for virgin raw materials and creates demand for waste that already exists. Benches, fencing, walkways, planters, composters, and other solutions can incorporate recycled plastic with high durability.

The value lies in the change of logic: waste stops being only a management cost and becomes an industrial resource. For that to happen, correct sorting in the yellow bin remains the essential first step.`,
      es: `Usar residuos del contenedor amarillo como materia prima es una aplicación concreta de la economía circular. En vez de tratar el plástico como final de línea, el material se selecciona, transforma y convierte en perfiles y productos con nueva utilidad.

Este enfoque reduce la necesidad de materias primas vírgenes y crea demanda para residuos que ya existen. Bancos, vallas, pasarelas, jardineras, compostadores y otras soluciones pueden incorporar plástico reciclado con alta durabilidad.

El valor está en el cambio de lógica: el residuo deja de ser solo un coste de gestión y pasa a ser un recurso industrial. Para ello, la separación correcta en el contenedor amarillo sigue siendo el primer paso esencial.`,
    },
  },
  'madeira-fica-podre-em-pouco-tempo-para-alem-do-problema-ambiental-com-o-corte-de-arvores': {
    title: {
      pt: 'A madeira apodrece e agrava o corte de árvores',
      en: 'Wood rots and adds pressure to tree felling',
      es: 'La madera se pudre y aumenta la presión sobre la tala',
    },
    category: {
      pt: 'Materiais',
      en: 'Materials',
      es: 'Materiales',
    },
    excerpt: {
      pt: 'Em aplicações exteriores, a madeira degradada obriga a substituições frequentes e aumenta a pressão sobre recursos naturais.',
      en: 'In outdoor applications, degraded wood requires frequent replacement and increases pressure on natural resources.',
      es: 'En aplicaciones exteriores, la madera degradada exige sustituciones frecuentes y aumenta la presión sobre recursos naturales.',
    },
    body: {
      pt: `A madeira exposta ao exterior pode degradar-se rapidamente quando enfrenta humidade, chuva, sol e fungos. Mesmo tratada, exige manutenção e substituição ao longo do tempo, sobretudo em mobiliário urbano e estruturas sujeitas a uso intenso.

O problema ambiental não está apenas no apodrecimento. Cada substituição significa mais extração, transporte, tratamento químico e resíduos. Quando a aplicação exige resistência prolongada, faz sentido comparar alternativas com base no ciclo de vida completo.

O plástico reciclado oferece uma resposta para muitos destes usos: não apodrece, não enferruja e valoriza resíduos já existentes. Escolher materiais duráveis é também uma forma de proteger árvores.`,
      en: `Wood exposed outdoors can degrade quickly when it faces moisture, rain, sun, and fungi. Even treated wood requires maintenance and replacement over time, especially in street furniture and structures subject to intensive use.

The environmental problem is not only rotting. Each replacement means more extraction, transport, chemical treatment, and waste. When an application requires long-lasting resistance, alternatives should be compared across the full life cycle.

Recycled plastic offers an answer for many of these uses: it does not rot, does not rust, and gives value to existing waste. Choosing durable materials is also a way to protect trees.`,
      es: `La madera expuesta al exterior puede degradarse rápidamente cuando enfrenta humedad, lluvia, sol y hongos. Incluso tratada, exige mantenimiento y sustitución con el tiempo, sobre todo en mobiliario urbano y estructuras sometidas a uso intenso.

El problema ambiental no está solo en la pudrición. Cada sustitución significa más extracción, transporte, tratamiento químico y residuos. Cuando una aplicación exige resistencia prolongada, conviene comparar alternativas según todo el ciclo de vida.

El plástico reciclado ofrece una respuesta para muchos de estos usos: no se pudre, no se oxida y valoriza residuos ya existentes. Elegir materiales duraderos es también una forma de proteger árboles.`,
    },
  },
  'julho-bate-recordes-como-o-mes-mais-quente-ja-registado': {
    title: {
      pt: 'Julho bate recordes como o mês mais quente já registado',
      en: 'July breaks records as the hottest month ever recorded',
      es: 'Julio bate récords como el mes más caluroso registrado',
    },
    category: {
      pt: 'Clima',
      en: 'Climate',
      es: 'Clima',
    },
    excerpt: {
      pt: 'Recordes de calor tornam evidente a necessidade de reduzir emissões e preparar cidades para temperaturas extremas.',
      en: 'Heat records make clear the need to reduce emissions and prepare cities for extreme temperatures.',
      es: 'Los récords de calor hacen evidente la necesidad de reducir emisiones y preparar las ciudades para temperaturas extremas.',
    },
    body: {
      pt: `Quando um mês bate recordes de calor, não se trata apenas de uma curiosidade meteorológica. Temperaturas extremas afetam saúde, produtividade, agricultura, incêndios, água disponível e conforto nas cidades.

Estes recordes encaixam numa tendência de aquecimento global causada pela acumulação de gases com efeito de estufa. A adaptação passa por sombras, árvores, materiais menos absorventes, edifícios preparados, proteção de populações vulneráveis e planos de emergência.

Mas adaptação sem mitigação é insuficiente. Reduzir emissões, desperdício e dependência de materiais descartáveis continua a ser essencial para limitar o agravamento futuro.`,
      en: `When a month breaks heat records, it is not just a meteorological curiosity. Extreme temperatures affect health, productivity, agriculture, fires, available water, and comfort in cities.

These records fit into a global-warming trend caused by the accumulation of greenhouse gases. Adaptation requires shade, trees, less heat-absorbing materials, prepared buildings, protection for vulnerable populations, and emergency plans.

But adaptation without mitigation is not enough. Reducing emissions, waste, and dependence on disposable materials remains essential to limit future worsening.`,
      es: `Cuando un mes bate récords de calor, no es solo una curiosidad meteorológica. Las temperaturas extremas afectan a la salud, la productividad, la agricultura, los incendios, el agua disponible y el confort en las ciudades.

Estos récords encajan en una tendencia de calentamiento global causada por la acumulación de gases de efecto invernadero. La adaptación pasa por sombra, árboles, materiales que absorban menos calor, edificios preparados, protección de poblaciones vulnerables y planes de emergencia.

Pero la adaptación sin mitigación no basta. Reducir emisiones, desperdicio y dependencia de materiales desechables sigue siendo esencial para limitar el agravamiento futuro.`,
    },
  },
  'a-problematica-dos-residuos-de-vestuario': {
    title: {
      pt: 'A problemática dos resíduos de vestuário',
      en: 'The problem of clothing waste',
      es: 'La problemática de los residuos textiles',
    },
    category: {
      pt: 'Resíduos',
      en: 'Waste',
      es: 'Residuos',
    },
    excerpt: {
      pt: 'A moda rápida aumenta consumo, descarte e pressão sobre água, energia, químicos e sistemas de recolha.',
      en: 'Fast fashion increases consumption, disposal, and pressure on water, energy, chemicals, and collection systems.',
      es: 'La moda rápida aumenta consumo, descarte y presión sobre agua, energía, químicos y sistemas de recogida.',
    },
    body: {
      pt: `Os resíduos de vestuário cresceram com modelos de moda rápida, compras frequentes e peças de baixa durabilidade. Roupa descartada representa fibras, corantes, água, energia e trabalho que perdem valor quando terminam em lixo indiferenciado.

A solução passa por comprar menos e melhor, reparar, reutilizar, doar, vender em segunda mão e encaminhar têxteis para recolha adequada. Também exige desenho de produtos mais duráveis e sistemas de reciclagem capazes de lidar com misturas de fibras.

O consumo consciente é a primeira etapa. Antes de comprar, vale perguntar se a peça é necessária, se vai durar e qual será o seu destino quando deixar de servir.`,
      en: `Clothing waste has grown with fast-fashion models, frequent purchases, and low-durability garments. Discarded clothes represent fibres, dyes, water, energy, and labour that lose value when they end up in mixed rubbish.

The solution involves buying less and better, repairing, reusing, donating, selling second-hand, and sending textiles to proper collection. It also requires more durable product design and recycling systems able to handle mixed fibres.

Conscious consumption is the first step. Before buying, it is worth asking whether the garment is necessary, whether it will last, and where it will go when it is no longer useful.`,
      es: `Los residuos textiles han crecido con los modelos de moda rápida, compras frecuentes y prendas de baja durabilidad. La ropa descartada representa fibras, tintes, agua, energía y trabajo que pierden valor cuando termina en la basura mezclada.

La solución pasa por comprar menos y mejor, reparar, reutilizar, donar, vender de segunda mano y llevar textiles a una recogida adecuada. También exige diseño de productos más duraderos y sistemas de reciclaje capaces de tratar mezclas de fibras.

El consumo consciente es el primer paso. Antes de comprar, conviene preguntarse si la prenda es necesaria, si durará y cuál será su destino cuando deje de servir.`,
    },
  },
  'causas-do-aquecimento-global-e-solucoes': {
    title: {
      pt: 'Causas do aquecimento global e soluções',
      en: 'Causes of global warming and solutions',
      es: 'Causas del calentamiento global y soluciones',
    },
    category: {
      pt: 'Clima',
      en: 'Climate',
      es: 'Clima',
    },
    excerpt: {
      pt: 'O aquecimento global resulta de escolhas de energia, transporte, indústria, agricultura e consumo; as soluções também passam por todos estes setores.',
      en: 'Global warming results from choices in energy, transport, industry, agriculture, and consumption; solutions also pass through all these sectors.',
      es: 'El calentamiento global resulta de decisiones en energía, transporte, industria, agricultura y consumo; las soluciones también pasan por todos esos sectores.',
    },
    body: {
      pt: `As principais causas do aquecimento global estão na emissão de gases com efeito de estufa. A queima de carvão, petróleo e gás, a desflorestação, alguns processos industriais, a agricultura intensiva e padrões de consumo descartáveis aumentam a concentração destes gases na atmosfera.

As soluções combinam transição energética, eficiência, mobilidade mais limpa, proteção de florestas, economia circular e redução do desperdício. Não há uma resposta única; há muitas decisões coerentes que, juntas, reduzem pressão sobre o clima.

Empresas, governos e cidadãos têm papéis diferentes mas ligados. Escolher materiais reciclados, prolongar a vida útil dos produtos e reduzir resíduos são contributos concretos para uma economia com menor pegada.`,
      en: `The main causes of global warming lie in greenhouse-gas emissions. Burning coal, oil, and gas, deforestation, some industrial processes, intensive agriculture, and disposable consumption patterns increase the concentration of these gases in the atmosphere.

Solutions combine energy transition, efficiency, cleaner mobility, forest protection, circular economy, and waste reduction. There is no single answer; there are many coherent decisions that together reduce pressure on the climate.

Companies, governments, and citizens have different but connected roles. Choosing recycled materials, extending product life, and reducing waste are concrete contributions to a lower-footprint economy.`,
      es: `Las principales causas del calentamiento global están en las emisiones de gases de efecto invernadero. La quema de carbón, petróleo y gas, la deforestación, algunos procesos industriales, la agricultura intensiva y patrones de consumo desechables aumentan la concentración de estos gases en la atmósfera.

Las soluciones combinan transición energética, eficiencia, movilidad más limpia, protección de bosques, economía circular y reducción del desperdicio. No hay una única respuesta; hay muchas decisiones coherentes que, juntas, reducen la presión sobre el clima.

Empresas, gobiernos y ciudadanos tienen papeles distintos pero conectados. Elegir materiales reciclados, alargar la vida útil de los productos y reducir residuos son contribuciones concretas a una economía con menor huella.`,
    },
  },
  'compreender-o-aumento-da-temperatura-global-e-o-seu-impacto-nos-incendios-florestais': {
    title: {
      pt: 'Aumento da temperatura global e incêndios florestais',
      en: 'Rising global temperatures and wildfires',
      es: 'Aumento de temperatura global e incendios forestales',
    },
    category: {
      pt: 'Clima',
      en: 'Climate',
      es: 'Clima',
    },
    excerpt: {
      pt: 'Calor, seca e vegetação vulnerável aumentam o risco de incêndios mais intensos e difíceis de controlar.',
      en: 'Heat, drought, and vulnerable vegetation increase the risk of more intense, harder-to-control wildfires.',
      es: 'Calor, sequía y vegetación vulnerable aumentan el riesgo de incendios más intensos y difíciles de controlar.',
    },
    body: {
      pt: `O aumento da temperatura global influencia os incêndios florestais ao criar períodos mais quentes e secos. A vegetação perde humidade, os solos secam e qualquer ignição pode evoluir mais depressa quando há vento, calor e combustível acumulado.

Prevenir incêndios exige gestão de território, mosaicos agrícolas e florestais, limpeza responsável, espécies mais adaptadas e vigilância. Também exige reduzir emissões, porque um clima mais quente amplia a janela de risco.

As comunidades precisam de estar preparadas, mas a prevenção começa muito antes do verão. Planeamento, materiais adequados, manutenção e educação ambiental reduzem vulnerabilidade.`,
      en: `Rising global temperatures influence wildfires by creating hotter, drier periods. Vegetation loses moisture, soils dry out, and any ignition can evolve faster when wind, heat, and accumulated fuel are present.

Fire prevention requires land management, agricultural and forest mosaics, responsible clearing, better-adapted species, and monitoring. It also requires emission reduction, because a warmer climate expands the risk window.

Communities need to be prepared, but prevention starts long before summer. Planning, suitable materials, maintenance, and environmental education reduce vulnerability.`,
      es: `El aumento de la temperatura global influye en los incendios forestales al crear periodos más calientes y secos. La vegetación pierde humedad, los suelos se secan y cualquier ignición puede avanzar más rápido cuando hay viento, calor y combustible acumulado.

Prevenir incendios exige gestión del territorio, mosaicos agrícolas y forestales, limpieza responsable, especies más adaptadas y vigilancia. También exige reducir emisiones, porque un clima más cálido amplía la ventana de riesgo.

Las comunidades deben estar preparadas, pero la prevención empieza mucho antes del verano. Planificación, materiales adecuados, mantenimiento y educación ambiental reducen vulnerabilidad.`,
    },
  },
  'como-a-compostagem-pode-reduzir-o-impacto-dos-aterros-sanitarios': {
    title: {
      pt: 'Como a compostagem pode reduzir o impacto dos aterros sanitários',
      en: 'How composting can reduce the impact of landfills',
      es: 'Cómo el compostaje puede reducir el impacto de los vertederos',
    },
    category: {
      pt: 'Compostagem',
      en: 'Composting',
      es: 'Compostaje',
    },
    excerpt: {
      pt: 'Desviar matéria orgânica dos aterros reduz volume, odores, lixiviados e emissões de metano.',
      en: 'Diverting organic matter from landfills reduces volume, odours, leachate, and methane emissions.',
      es: 'Desviar materia orgánica de los vertederos reduce volumen, olores, lixiviados y emisiones de metano.',
    },
    body: {
      pt: `Quando resíduos orgânicos são depositados em aterro, decompõem-se em condições pobres em oxigénio e podem gerar metano, um gás com forte efeito climático. Também contribuem para odores, lixiviados e ocupação de espaço.

A compostagem muda esse destino. Ao tratar biorresíduos de forma controlada, produz composto útil, reduz a massa enviada para aterro e devolve matéria orgânica ao solo. É uma solução ambiental e operacional.

Para funcionar, a separação na origem é decisiva. Resíduos contaminados com plásticos, metais ou vidro prejudicam o composto e aumentam custos. A qualidade começa no balde de cada casa, escola, restaurante ou empresa.`,
      en: `When organic waste is deposited in landfill, it decomposes in low-oxygen conditions and can generate methane, a gas with strong climate impact. It also contributes to odours, leachate, and space occupation.

Composting changes that destination. By treating bio-waste in a controlled way, it produces useful compost, reduces the mass sent to landfill, and returns organic matter to soil. It is both an environmental and operational solution.

For it to work, sorting at source is decisive. Waste contaminated with plastics, metals, or glass damages compost quality and increases costs. Quality starts in the bin of each home, school, restaurant, or company.`,
      es: `Cuando los residuos orgánicos se depositan en vertedero, se descomponen en condiciones pobres en oxígeno y pueden generar metano, un gas con fuerte impacto climático. También contribuyen a olores, lixiviados y ocupación de espacio.

El compostaje cambia ese destino. Al tratar biorresiduos de forma controlada, produce compost útil, reduce la masa enviada al vertedero y devuelve materia orgánica al suelo. Es una solución ambiental y operativa.

Para que funcione, la separación en origen es decisiva. Los residuos contaminados con plásticos, metales o vidrio perjudican el compost y aumentan costes. La calidad empieza en el cubo de cada casa, escuela, restaurante o empresa.`,
    },
  },
  'a-importancia-da-separacao-do-lixo': {
    title: {
      pt: 'A importância da separação do lixo',
      en: 'The importance of sorting waste',
      es: 'La importancia de separar la basura',
    },
    category: {
      pt: 'Reciclagem',
      en: 'Recycling',
      es: 'Reciclaje',
    },
    excerpt: {
      pt: 'Separar resíduos corretamente é o primeiro passo para reciclar, compostar e reduzir a pressão sobre aterros.',
      en: 'Sorting waste correctly is the first step toward recycling, composting, and reducing pressure on landfills.',
      es: 'Separar residuos correctamente es el primer paso para reciclar, compostar y reducir la presión sobre vertederos.',
    },
    body: {
      pt: `A separação do lixo parece uma ação pequena, mas determina o que acontece a seguir. Papel, vidro, embalagens, biorresíduos e indiferenciados têm destinos diferentes; quando se misturam, perdem valor e tornam a reciclagem mais difícil.

Separar bem reduz contaminação, melhora a eficiência das centrais de triagem e aumenta a quantidade de material que pode voltar a ser usado. Também ajuda a perceber quanto lixo produzimos e onde podemos reduzir.

O hábito depende de informação simples, contentores acessíveis e confiança no sistema. Quando as pessoas veem resultado, participam mais. A reciclagem começa em casa, mas precisa de uma cadeia inteira a funcionar.`,
      en: `Sorting waste may seem like a small action, but it determines what happens next. Paper, glass, packaging, bio-waste, and mixed waste have different destinations; when they are mixed, they lose value and make recycling harder.

Good sorting reduces contamination, improves sorting-plant efficiency, and increases the amount of material that can be used again. It also helps us understand how much waste we produce and where we can reduce it.

The habit depends on simple information, accessible bins, and trust in the system. When people see results, they participate more. Recycling starts at home, but it needs a whole chain working behind it.`,
      es: `Separar la basura parece una acción pequeña, pero determina lo que ocurre después. Papel, vidrio, envases, biorresiduos e indiferenciados tienen destinos distintos; cuando se mezclan, pierden valor y dificultan el reciclaje.

Separar bien reduce la contaminación, mejora la eficiencia de las plantas de clasificación y aumenta la cantidad de material que puede volver a usarse. También ayuda a entender cuánta basura producimos y dónde podemos reducirla.

El hábito depende de información sencilla, contenedores accesibles y confianza en el sistema. Cuando las personas ven resultados, participan más. El reciclaje empieza en casa, pero necesita toda una cadena funcionando.`,
    },
  },
  'plastico-nos-oceanos': {
    title: {
      pt: 'Plástico nos oceanos',
      en: 'Plastic in the oceans',
      es: 'Plástico en los océanos',
    },
    category: {
      pt: 'Oceanos',
      en: 'Oceans',
      es: 'Océanos',
    },
    excerpt: {
      pt: 'O plástico no mar é a consequência visível de consumo descartável, separação insuficiente e gestão de resíduos incompleta.',
      en: 'Plastic in the sea is the visible consequence of disposable consumption, insufficient sorting, and incomplete waste management.',
      es: 'El plástico en el mar es la consecuencia visible del consumo desechable, separación insuficiente y gestión incompleta de residuos.',
    },
    body: {
      pt: `O plástico nos oceanos não aparece por acaso. Chega por rios, vento, abandono, redes perdidas, drenagem urbana e falhas na recolha. Uma vez no mar, pode viajar longas distâncias e fragmentar-se em microplásticos.

O combate começa em terra: consumir menos descartáveis, separar embalagens, melhorar sistemas de recolha e valorizar plástico reciclado em produtos duráveis. Limpar praias é importante, mas prevenir a entrada é muito mais eficaz.`,
      en: `Plastic in the oceans does not appear by chance. It arrives through rivers, wind, littering, lost nets, urban drainage, and failures in collection. Once at sea, it can travel long distances and fragment into microplastics.

The fight starts on land: consume fewer disposables, sort packaging, improve collection systems, and value recycled plastic in durable products. Cleaning beaches is important, but preventing entry is far more effective.`,
      es: `El plástico en los océanos no aparece por casualidad. Llega por ríos, viento, abandono, redes perdidas, drenaje urbano y fallos de recogida. Una vez en el mar, puede recorrer largas distancias y fragmentarse en microplásticos.

La lucha empieza en tierra: consumir menos desechables, separar envases, mejorar sistemas de recogida y valorizar plástico reciclado en productos duraderos. Limpiar playas es importante, pero impedir la entrada es mucho más eficaz.`,
    },
  },
  'gases-efeito-de-estufa': {
    title: {
      pt: 'Gases com efeito de estufa',
      en: 'Greenhouse gases',
      es: 'Gases de efecto invernadero',
    },
    category: {
      pt: 'Clima',
      en: 'Climate',
      es: 'Clima',
    },
    excerpt: {
      pt: 'Os gases com efeito de estufa retêm calor na atmosfera; em excesso, aceleram alterações climáticas e eventos extremos.',
      en: 'Greenhouse gases trap heat in the atmosphere; in excess, they accelerate climate change and extreme events.',
      es: 'Los gases de efecto invernadero retienen calor en la atmósfera; en exceso, aceleran el cambio climático y eventos extremos.',
    },
    body: {
      pt: `O efeito de estufa natural permite que a Terra tenha temperaturas compatíveis com a vida. O problema surge quando atividades humanas aumentam demasiado a concentração de gases como dióxido de carbono, metano e óxido nitroso.

Energia fóssil, transportes, indústria, agropecuária, aterros e desflorestação estão entre as fontes relevantes. O resultado é mais calor retido, alterações nos padrões de chuva, subida do nível do mar e maior frequência de fenómenos extremos.

Reduzir emissões passa por energia limpa, eficiência, economia circular, proteção de solos e florestas, redução de resíduos e valorização de materiais reciclados. Cada escolha com menor desperdício ajuda a diminuir pressão climática.`,
      en: `The natural greenhouse effect allows Earth to have temperatures compatible with life. The problem arises when human activities increase the concentration of gases such as carbon dioxide, methane, and nitrous oxide too much.

Fossil energy, transport, industry, livestock farming, landfills, and deforestation are among the relevant sources. The result is more trapped heat, changes in rainfall patterns, sea-level rise, and more frequent extreme events.

Reducing emissions involves clean energy, efficiency, circular economy, protection of soils and forests, waste reduction, and valuing recycled materials. Every lower-waste choice helps reduce climate pressure.`,
      es: `El efecto invernadero natural permite que la Tierra tenga temperaturas compatibles con la vida. El problema surge cuando las actividades humanas aumentan demasiado la concentración de gases como dióxido de carbono, metano y óxido nitroso.

Energía fósil, transporte, industria, ganadería, vertederos y deforestación están entre las fuentes relevantes. El resultado es más calor retenido, cambios en los patrones de lluvia, subida del nivel del mar y mayor frecuencia de fenómenos extremos.

Reducir emisiones pasa por energía limpia, eficiencia, economía circular, protección de suelos y bosques, reducción de residuos y valorización de materiales reciclados. Cada elección con menor desperdicio ayuda a disminuir la presión climática.`,
    },
  },
  'abate-de-arvores': {
    title: {
      pt: 'Abate de árvores: consequências para o ambiente',
      en: 'Tree felling: consequences for the environment',
      es: 'Tala de árboles: consecuencias para el medio ambiente',
    },
    category: {
      pt: 'Ambiente',
      en: 'Environment',
      es: 'Medio ambiente',
    },
    excerpt: {
      pt: 'As árvores protegem solo, água, biodiversidade e clima; perdê-las fragiliza ecossistemas e comunidades.',
      en: 'Trees protect soil, water, biodiversity, and climate; losing them weakens ecosystems and communities.',
      es: 'Los árboles protegen suelo, agua, biodiversidad y clima; perderlos debilita ecosistemas y comunidades.',
    },
    body: {
      pt: `O abate de árvores tem consequências que vão além da perda visual. Árvores armazenam carbono, dão sombra, retêm água, protegem solos, reduzem erosão e criam habitat para muitas espécies.

Quando são removidas sem planeamento ou reposição adequada, aumenta o risco de aquecimento local, escorrência de água, perda de biodiversidade e degradação da paisagem. Em zonas urbanas, a falta de árvores agrava ilhas de calor e reduz conforto.

Usar materiais alternativos à madeira em aplicações onde a durabilidade é crítica pode aliviar pressão sobre recursos florestais. Proteger árvores é uma decisão ambiental, mas também social e económica.`,
      en: `Tree felling has consequences beyond visual loss. Trees store carbon, provide shade, retain water, protect soils, reduce erosion, and create habitat for many species.

When they are removed without planning or adequate replacement, the risk of local heating, water runoff, biodiversity loss, and landscape degradation increases. In urban areas, the lack of trees worsens heat islands and reduces comfort.

Using alternatives to wood in applications where durability is critical can ease pressure on forest resources. Protecting trees is an environmental decision, but also a social and economic one.`,
      es: `La tala de árboles tiene consecuencias que van más allá de la pérdida visual. Los árboles almacenan carbono, dan sombra, retienen agua, protegen suelos, reducen erosión y crean hábitat para muchas especies.

Cuando se eliminan sin planificación o reposición adecuada, aumenta el riesgo de calentamiento local, escorrentía, pérdida de biodiversidad y degradación del paisaje. En zonas urbanas, la falta de árboles agrava islas de calor y reduce confort.

Usar alternativas a la madera en aplicaciones donde la durabilidad es crítica puede aliviar presión sobre recursos forestales. Proteger árboles es una decisión ambiental, pero también social y económica.`,
    },
  },
  'o-drama-dos-microplasticos-nos-oceanos': {
    title: {
      pt: 'O drama dos microplásticos nos oceanos',
      en: 'The problem of microplastics in the oceans',
      es: 'El drama de los microplásticos en los océanos',
    },
    category: {
      pt: 'Oceanos',
      en: 'Oceans',
      es: 'Océanos',
    },
    excerpt: {
      pt: 'Microplásticos são difíceis de remover, entram em ecossistemas e revelam a urgência de evitar a fragmentação de resíduos.',
      en: 'Microplastics are hard to remove, enter ecosystems, and show the urgency of preventing waste fragmentation.',
      es: 'Los microplásticos son difíciles de retirar, entran en ecosistemas y muestran la urgencia de evitar la fragmentación de residuos.',
    },
    body: {
      pt: `Microplásticos são partículas pequenas que resultam da fragmentação de objetos maiores ou de materiais já produzidos em escala microscópica. No oceano, espalham-se facilmente e podem ser ingeridos por organismos de diferentes tamanhos.

O problema é persistente: quanto menor a partícula, mais difícil é recolher, monitorizar e impedir que circule na cadeia alimentar. Por isso, a prevenção é muito mais eficaz do que a limpeza depois da dispersão.

Reduzir descartáveis, melhorar reciclagem, controlar perdas industriais e criar produtos duráveis com plástico reciclado são formas de manter o material em uso e fora dos ecossistemas marinhos.`,
      en: `Microplastics are small particles that result from the fragmentation of larger objects or from materials already produced at microscopic scale. In the ocean, they spread easily and can be ingested by organisms of different sizes.

The problem is persistent: the smaller the particle, the harder it is to collect, monitor, and prevent from circulating in the food chain. Prevention is therefore far more effective than clean-up after dispersion.

Reducing disposables, improving recycling, controlling industrial losses, and creating durable products with recycled plastic are ways to keep material in use and out of marine ecosystems.`,
      es: `Los microplásticos son pequeñas partículas que resultan de la fragmentación de objetos mayores o de materiales ya producidos a escala microscópica. En el océano se dispersan fácilmente y pueden ser ingeridos por organismos de distintos tamaños.

El problema es persistente: cuanto menor la partícula, más difícil es recogerla, monitorizarla e impedir que circule en la cadena alimentaria. Por eso la prevención es mucho más eficaz que la limpieza después de la dispersión.

Reducir desechables, mejorar el reciclaje, controlar pérdidas industriales y crear productos duraderos con plástico reciclado son formas de mantener el material en uso y fuera de los ecosistemas marinos.`,
    },
  },
  'reflita-antes-de-comprar-um-produto-embalado-em-garrafas-de-plastico': {
    title: {
      pt: 'Reflita antes de comprar um produto embalado em garrafas de plástico',
      en: 'Think before buying a product packaged in plastic bottles',
      es: 'Piense antes de comprar un producto envasado en botellas de plástico',
    },
    category: {
      pt: 'Consumo',
      en: 'Consumption',
      es: 'Consumo',
    },
    excerpt: {
      pt: 'Cada embalagem comprada cria uma consequência: reutilização, reciclagem, aterro ou poluição.',
      en: 'Every package purchased creates a consequence: reuse, recycling, landfill, or pollution.',
      es: 'Cada envase comprado crea una consecuencia: reutilización, reciclaje, vertedero o contaminación.',
    },
    body: {
      pt: `Antes de comprar um produto embalado em plástico, vale pensar no destino dessa embalagem. Vai ser reutilizada? Vai ser separada corretamente? Existe alternativa com menos material ou com embalagem retornável?

Garrafas e embalagens leves parecem pequenas, mas multiplicam-se por milhões de decisões diárias. Quando não entram num circuito de reciclagem, podem acabar em aterro, rios, praias ou fragmentar-se em microplásticos.

O consumo responsável não exige perfeição; exige atenção. Escolher melhor, reduzir o descartável e separar o que não conseguimos evitar são gestos simples com impacto acumulado.`,
      en: `Before buying a product packaged in plastic, it is worth thinking about where that package will go. Will it be reused? Will it be sorted correctly? Is there an alternative with less material or returnable packaging?

Light bottles and packages seem small, but they multiply through millions of daily decisions. When they do not enter a recycling circuit, they can end up in landfill, rivers, beaches, or fragment into microplastics.

Responsible consumption does not require perfection; it requires attention. Choosing better, reducing disposables, and sorting what we cannot avoid are simple gestures with cumulative impact.`,
      es: `Antes de comprar un producto envasado en plástico, conviene pensar en el destino de ese envase. ¿Será reutilizado? ¿Se separará correctamente? ¿Existe una alternativa con menos material o con envase retornable?

Las botellas y envases ligeros parecen pequeños, pero se multiplican por millones de decisiones diarias. Cuando no entran en un circuito de reciclaje, pueden acabar en vertederos, ríos, playas o fragmentarse en microplásticos.

El consumo responsable no exige perfección; exige atención. Elegir mejor, reducir lo desechable y separar lo que no podemos evitar son gestos sencillos con impacto acumulado.`,
    },
  },
  'subida-da-temperatura-em-portugal': {
    title: {
      pt: 'Subida da temperatura em Portugal',
      en: 'Rising temperatures in Portugal',
      es: 'Subida de la temperatura en Portugal',
    },
    category: {
      pt: 'Clima',
      en: 'Climate',
      es: 'Clima',
    },
    excerpt: {
      pt: 'A subida da temperatura em Portugal agrava secas, ondas de calor, incêndios e pressão sobre água e saúde.',
      en: 'Rising temperatures in Portugal worsen droughts, heat waves, fires, and pressure on water and health.',
      es: 'La subida de la temperatura en Portugal agrava sequías, olas de calor, incendios y presión sobre agua y salud.',
    },
    body: {
      pt: `A subida da temperatura em Portugal já se sente em ondas de calor mais intensas, noites tropicais, secas prolongadas e maior risco de incêndio. O impacto aparece na saúde, na agricultura, nas florestas e no uso da água.

Adaptar o território é tão importante como reduzir emissões. Cidades mais sombreadas, materiais adequados, gestão eficiente de água, proteção de solos e redução de desperdício ajudam a tornar comunidades mais resilientes.`,
      en: `Rising temperatures in Portugal are already felt in more intense heat waves, tropical nights, prolonged droughts, and higher fire risk. The impact appears in health, agriculture, forests, and water use.

Adapting the territory is as important as reducing emissions. Shadier cities, suitable materials, efficient water management, soil protection, and waste reduction help make communities more resilient.`,
      es: `La subida de la temperatura en Portugal ya se siente en olas de calor más intensas, noches tropicales, sequías prolongadas y mayor riesgo de incendio. El impacto aparece en la salud, la agricultura, los bosques y el uso del agua.

Adaptar el territorio es tan importante como reducir emisiones. Ciudades con más sombra, materiales adecuados, gestión eficiente del agua, protección de suelos y reducción del desperdicio ayudan a hacer las comunidades más resilientes.`,
    },
  },
  'plasticos-nos-oceanos': {
    title: {
      pt: 'Plásticos nos oceanos',
      en: 'Plastics in the oceans',
      es: 'Plásticos en los océanos',
    },
    category: {
      pt: 'Oceanos',
      en: 'Oceans',
      es: 'Océanos',
    },
    excerpt: {
      pt: 'A poluição plástica marinha exige menos descartáveis, melhor reciclagem e mais valorização de materiais já existentes.',
      en: 'Marine plastic pollution demands fewer disposables, better recycling, and more value for materials that already exist.',
      es: 'La contaminación plástica marina exige menos desechables, mejor reciclaje y más valorización de materiales ya existentes.',
    },
    body: {
      pt: `Os plásticos nos oceanos revelam uma falha coletiva: produzimos materiais duráveis para usos muitas vezes descartáveis. Depois de abandonados, esses materiais persistem, viajam, fragmentam-se e afetam animais e ecossistemas.

Reduzir o problema exige medidas em vários pontos: conceção de embalagens, recolha seletiva, reciclagem, educação, fiscalização e alternativas reutilizáveis. Também exige criar mercados para plástico reciclado, para que o material tenha valor antes de virar poluição.

Produtos duráveis feitos com plástico reciclado mostram uma saída possível: manter o plástico em uso útil, fora do mar e dentro de uma economia circular.`,
      en: `Plastics in the oceans reveal a collective failure: we produce durable materials for uses that are often disposable. Once abandoned, these materials persist, travel, fragment, and affect animals and ecosystems.

Reducing the problem requires measures at several points: packaging design, selective collection, recycling, education, enforcement, and reusable alternatives. It also requires markets for recycled plastic, so the material has value before it becomes pollution.

Durable products made with recycled plastic show one possible path: keep plastic in useful use, out of the sea, and inside a circular economy.`,
      es: `Los plásticos en los océanos revelan un fallo colectivo: producimos materiales duraderos para usos que muchas veces son desechables. Una vez abandonados, estos materiales persisten, viajan, se fragmentan y afectan a animales y ecosistemas.

Reducir el problema exige medidas en varios puntos: diseño de envases, recogida selectiva, reciclaje, educación, fiscalización y alternativas reutilizables. También exige crear mercados para plástico reciclado, para que el material tenga valor antes de convertirse en contaminación.

Los productos duraderos hechos con plástico reciclado muestran una salida posible: mantener el plástico en uso útil, fuera del mar y dentro de una economía circular.`,
    },
  },
  'o-mundo-caminha-para-a-catastrofe': {
    title: {
      pt: 'O mundo caminha para a catástrofe',
      en: 'The world is heading towards catastrophe',
      es: 'El mundo camina hacia la catástrofe',
    },
    category: {
      pt: 'Clima',
      en: 'Climate',
      es: 'Clima',
    },
    excerpt: {
      pt: 'Os sinais climáticos exigem ação real, não apenas declarações de intenção.',
      en: 'Climate signals demand real action, not only statements of intent.',
      es: 'Las señales climáticas exigen acción real, no solo declaraciones de intención.',
    },
    body: {
      pt: `A expressão é dura, mas traduz a urgência sentida perante alterações climáticas, perda de biodiversidade, poluição e consumo excessivo. O mundo não caminha inevitavelmente para a catástrofe; caminha para lá se continuar a adiar mudanças.

Reduzir emissões, proteger recursos, valorizar resíduos e consumir de forma mais consciente são decisões concretas. A responsabilidade é coletiva, mas começa em escolhas diárias e em políticas que deixem de tratar o ambiente como assunto secundário.`,
      en: `The expression is harsh, but it reflects the urgency felt in the face of climate change, biodiversity loss, pollution, and excessive consumption. The world is not inevitably heading towards catastrophe; it is heading there if change keeps being delayed.

Reducing emissions, protecting resources, valuing waste, and consuming more consciously are concrete decisions. Responsibility is collective, but it begins with daily choices and policies that stop treating the environment as a secondary issue.`,
      es: `La expresión es dura, pero traduce la urgencia ante el cambio climático, la pérdida de biodiversidad, la contaminación y el consumo excesivo. El mundo no camina inevitablemente hacia la catástrofe; camina hacia ella si sigue aplazando cambios.

Reducir emisiones, proteger recursos, valorizar residuos y consumir de forma más consciente son decisiones concretas. La responsabilidad es colectiva, pero empieza en elecciones diarias y en políticas que dejen de tratar el medio ambiente como asunto secundario.`,
    },
  },
  'como-contribuir-para-drama-dos-plasticos': {
    title: {
      pt: 'Como contribuir para resolver o drama dos plásticos',
      en: 'How to help solve the plastics problem',
      es: 'Cómo contribuir a resolver el drama de los plásticos',
    },
    category: {
      pt: 'Plásticos',
      en: 'Plastics',
      es: 'Plásticos',
    },
    excerpt: {
      pt: 'Pequenas decisões repetidas por muitas pessoas reduzem a pressão dos plásticos descartáveis.',
      en: 'Small decisions repeated by many people reduce the pressure of disposable plastics.',
      es: 'Pequeñas decisiones repetidas por muchas personas reducen la presión de los plásticos desechables.',
    },
    body: {
      pt: `Contribuir para resolver o problema dos plásticos começa por reduzir o que é descartável. Levar saco reutilizável, evitar embalagens desnecessárias, escolher produtos duráveis e preferir recargas são gestos simples.

Depois vem a separação correta. O ecoponto amarelo só funciona bem quando recebe os materiais certos e com o mínimo de contaminação possível. Cada embalagem bem encaminhada aumenta a probabilidade de voltar a ser matéria-prima.

Também importa apoiar soluções que usam plástico reciclado em produtos de longa duração. Quanto mais valor houver para o material reciclado, menor será a tentação de tratar plástico como lixo sem destino.`,
      en: `Helping solve the plastics problem begins by reducing what is disposable. Carrying a reusable bag, avoiding unnecessary packaging, choosing durable products, and preferring refills are simple gestures.

Then comes correct sorting. The yellow bin only works well when it receives the right materials with as little contamination as possible. Every correctly sorted package increases the chance of becoming raw material again.

It also matters to support solutions that use recycled plastic in long-lasting products. The more value recycled material has, the less temptation there is to treat plastic as waste with no destination.`,
      es: `Contribuir a resolver el problema de los plásticos empieza por reducir lo desechable. Llevar bolsa reutilizable, evitar envases innecesarios, elegir productos duraderos y preferir recargas son gestos simples.

Después viene la separación correcta. El contenedor amarillo solo funciona bien cuando recibe los materiales adecuados con la mínima contaminación posible. Cada envase bien separado aumenta la probabilidad de volver a ser materia prima.

También importa apoyar soluciones que usan plástico reciclado en productos de larga duración. Cuanto más valor tenga el material reciclado, menor será la tentación de tratar el plástico como basura sin destino.`,
    },
  },
  'nao-existe-planeta-b': {
    title: {
      pt: 'Não existe Planeta B',
      en: 'There is no Planet B',
      es: 'No existe Planeta B',
    },
    category: {
      pt: 'Ambiente',
      en: 'Environment',
      es: 'Medio ambiente',
    },
    excerpt: {
      pt: 'A frase é simples porque a responsabilidade também é: cuidar melhor do único planeta habitável que temos.',
      en: 'The phrase is simple because the responsibility is too: take better care of the only habitable planet we have.',
      es: 'La frase es simple porque la responsabilidad también lo es: cuidar mejor el único planeta habitable que tenemos.',
    },
    body: {
      pt: `Não existe Planeta B resume uma verdade básica: os recursos naturais são limitados e os impactos acumulados não desaparecem. Poluição, desperdício, desflorestação e emissões regressam sob a forma de crises ambientais, sociais e económicas.

Separar resíduos, reduzir descartáveis, escolher materiais reciclados, poupar água e energia e exigir políticas responsáveis são formas práticas de agir. O futuro não depende apenas de grandes conferências; depende também de hábitos consistentes.`,
      en: `There is no Planet B sums up a basic truth: natural resources are limited and accumulated impacts do not disappear. Pollution, waste, deforestation, and emissions return as environmental, social, and economic crises.

Sorting waste, reducing disposables, choosing recycled materials, saving water and energy, and demanding responsible policies are practical ways to act. The future does not depend only on major conferences; it also depends on consistent habits.`,
      es: `No existe Planeta B resume una verdad básica: los recursos naturales son limitados y los impactos acumulados no desaparecen. Contaminación, desperdicio, deforestación y emisiones regresan en forma de crisis ambientales, sociales y económicas.

Separar residuos, reducir desechables, elegir materiales reciclados, ahorrar agua y energía y exigir políticas responsables son formas prácticas de actuar. El futuro no depende solo de grandes conferencias; depende también de hábitos constantes.`,
    },
  },
  'a-organizacao-meteorologica-mundial-omm-informa-que-catastrofes-e-enchentes-aumentaram-134-desde-2000-se-comparado-com-decadas-anteriores':
    {
      title: {
        pt: 'Catástrofes e enchentes aumentaram nas últimas décadas',
        en: 'Disasters and floods have increased in recent decades',
        es: 'Las catástrofes e inundaciones han aumentado en las últimas décadas',
      },
      category: {
        pt: 'Clima',
        en: 'Climate',
        es: 'Clima',
      },
      excerpt: {
        pt: 'O aumento de eventos extremos reforça a necessidade de adaptação climática e redução de emissões.',
        en: 'The increase in extreme events reinforces the need for climate adaptation and emission reduction.',
        es: 'El aumento de eventos extremos refuerza la necesidad de adaptación climática y reducción de emisiones.',
      },
      body: {
        pt: `O aumento de catástrofes, cheias e eventos extremos mostra que as alterações climáticas já afetam comunidades e infraestruturas. Quando a chuva intensa se combina com solos impermeabilizados, linhas de água mal protegidas e ocupação desordenada, os danos crescem.

Adaptar cidades e territórios passa por drenagem, zonas verdes, solos permeáveis, proteção de margens e planeamento responsável. Ao mesmo tempo, reduzir emissões continua a ser essencial para limitar a frequência e severidade destes fenómenos.`,
        en: `The increase in disasters, floods, and extreme events shows that climate change already affects communities and infrastructure. When intense rain combines with sealed soils, poorly protected waterways, and disorderly land use, damage grows.

Adapting cities and territories involves drainage, green areas, permeable soils, protected riverbanks, and responsible planning. At the same time, reducing emissions remains essential to limit the frequency and severity of these events.`,
        es: `El aumento de catástrofes, inundaciones y eventos extremos muestra que el cambio climático ya afecta a comunidades e infraestructuras. Cuando la lluvia intensa se combina con suelos impermeabilizados, cauces mal protegidos y ocupación desordenada, los daños crecen.

Adaptar ciudades y territorios pasa por drenaje, zonas verdes, suelos permeables, protección de márgenes y planificación responsable. Al mismo tiempo, reducir emisiones sigue siendo esencial para limitar la frecuencia y severidad de estos fenómenos.`,
      },
    },
  'nova-parceria-promove-sustentabilidade-usando-comercio-eletronico': {
    title: {
      pt: 'Parceria promove sustentabilidade usando comércio eletrónico',
      en: 'Partnership promotes sustainability through e-commerce',
      es: 'Una alianza promueve sostenibilidad mediante comercio electrónico',
    },
    category: {
      pt: 'Parcerias',
      en: 'Partnerships',
      es: 'Alianzas',
    },
    excerpt: {
      pt: 'O comércio eletrónico também pode divulgar soluções sustentáveis quando aproxima projetos, produtos e consumidores conscientes.',
      en: 'E-commerce can also promote sustainable solutions when it connects projects, products, and conscious consumers.',
      es: 'El comercio electrónico también puede divulgar soluciones sostenibles cuando conecta proyectos, productos y consumidores conscientes.',
    },
    body: {
      pt: `As parcerias podem acelerar a sustentabilidade quando juntam produção responsável, comunicação e canais de venda. O comércio eletrónico permite apresentar soluções recicladas a públicos mais amplos e explicar a origem dos materiais.

Para que seja coerente, a venda online deve valorizar transparência, durabilidade, logística responsável e informação clara. Sustentabilidade não é apenas colocar um produto na internet; é mostrar por que existe, de que é feito e que problema ajuda a resolver.`,
      en: `Partnerships can accelerate sustainability when they bring together responsible production, communication, and sales channels. E-commerce makes it possible to present recycled solutions to wider audiences and explain the origin of materials.

To be coherent, online sales should value transparency, durability, responsible logistics, and clear information. Sustainability is not just putting a product online; it is showing why it exists, what it is made of, and what problem it helps solve.`,
      es: `Las alianzas pueden acelerar la sostenibilidad cuando unen producción responsable, comunicación y canales de venta. El comercio electrónico permite presentar soluciones recicladas a públicos más amplios y explicar el origen de los materiales.

Para ser coherente, la venta online debe valorar transparencia, durabilidad, logística responsable e información clara. La sostenibilidad no es solo poner un producto en internet; es mostrar por qué existe, de qué está hecho y qué problema ayuda a resolver.`,
    },
  },
  'novo-recorde-no-artico-faz-soar-o-alarme-sobre-mudanca-climatica': {
    title: {
      pt: 'Novo recorde no Ártico faz soar o alarme climático',
      en: 'New Arctic record sounds the climate alarm',
      es: 'Nuevo récord en el Ártico hace sonar la alarma climática',
    },
    category: {
      pt: 'Clima',
      en: 'Climate',
      es: 'Clima',
    },
    excerpt: {
      pt: 'O aquecimento do Ártico é um sinal sensível das mudanças climáticas globais e das suas consequências em cadeia.',
      en: 'Arctic warming is a sensitive signal of global climate change and its chain reactions.',
      es: 'El calentamiento del Ártico es una señal sensible del cambio climático global y sus consecuencias en cadena.',
    },
    body: {
      pt: `Recordes no Ártico preocupam porque a região aquece rapidamente e influencia sistemas climáticos globais. Menos gelo reduz a reflexão da luz solar, altera habitats e contribui para mudanças no oceano e na atmosfera.

O Ártico parece distante, mas as suas alterações têm efeitos em correntes, nível do mar, biodiversidade e estabilidade climática. Cada recorde deve ser lido como aviso para acelerar redução de emissões e adaptação.`,
      en: `Arctic records are worrying because the region is warming rapidly and influences global climate systems. Less ice reduces sunlight reflection, changes habitats, and contributes to shifts in the ocean and atmosphere.

The Arctic may seem distant, but its changes affect currents, sea level, biodiversity, and climate stability. Each record should be read as a warning to accelerate emission reduction and adaptation.`,
      es: `Los récords en el Ártico preocupan porque la región se calienta rápidamente e influye en sistemas climáticos globales. Menos hielo reduce la reflexión de la luz solar, altera hábitats y contribuye a cambios en el océano y la atmósfera.

El Ártico puede parecer distante, pero sus cambios afectan corrientes, nivel del mar, biodiversidad y estabilidad climática. Cada récord debe leerse como advertencia para acelerar la reducción de emisiones y la adaptación.`,
    },
  },
  'aproveitamento-de-residuos': {
    title: {
      pt: 'Aproveitamento de resíduos',
      en: 'Making use of waste',
      es: 'Aprovechamiento de residuos',
    },
    category: {
      pt: 'Economia circular',
      en: 'Circular economy',
      es: 'Economía circular',
    },
    excerpt: {
      pt: 'Aproveitar resíduos é mudar a pergunta: em vez de “onde deitar fora?”, perguntar “em que pode voltar a ser útil?”.',
      en: 'Making use of waste changes the question: instead of “where do we throw it away?”, ask “how can it become useful again?”.',
      es: 'Aprovechar residuos cambia la pregunta: en vez de “¿dónde tirarlo?”, preguntar “¿en qué puede volver a ser útil?”.',
    },
    body: {
      pt: `O aproveitamento de resíduos está no centro da economia circular. Materiais que já foram extraídos, produzidos e transportados não devem perder valor depois de uma utilização curta.

Quando resíduos de plástico são separados e transformados em novos produtos, reduz-se pressão sobre matérias-primas virgens e evita-se que o material termine em aterro ou no ambiente. O desafio é desenhar processos e produtos que mantenham valor durante mais tempo.`,
      en: `Making use of waste sits at the heart of the circular economy. Materials that have already been extracted, produced, and transported should not lose value after a short use.

When plastic waste is sorted and transformed into new products, pressure on virgin raw materials is reduced and the material is prevented from ending up in landfill or the environment. The challenge is to design processes and products that keep value for longer.`,
      es: `El aprovechamiento de residuos está en el centro de la economía circular. Materiales que ya fueron extraídos, producidos y transportados no deberían perder valor después de un uso corto.

Cuando los residuos plásticos se separan y transforman en nuevos productos, se reduce la presión sobre materias primas vírgenes y se evita que el material termine en vertederos o en el ambiente. El reto es diseñar procesos y productos que mantengan valor durante más tiempo.`,
    },
  },
  'ultima-central-a-carvao-em-portugal-parou-a-producao': {
    title: {
      pt: 'A última central a carvão em Portugal parou a produção',
      en: 'Portugal’s last coal plant stopped production',
      es: 'La última central de carbón en Portugal detuvo la producción',
    },
    category: {
      pt: 'Energia',
      en: 'Energy',
      es: 'Energía',
    },
    excerpt: {
      pt: 'O fim da produção a carvão é um marco, mas a transição energética exige continuidade, eficiência e justiça social.',
      en: 'The end of coal production is a milestone, but the energy transition requires continuity, efficiency, and social fairness.',
      es: 'El fin de la producción con carbón es un hito, pero la transición energética exige continuidad, eficiencia y justicia social.',
    },
    body: {
      pt: `A paragem da última central a carvão em Portugal representa um passo importante na redução de emissões do setor elétrico. O carvão é uma das fontes de energia com maior pegada climática e poluição associada.

Ainda assim, a transição não termina com o encerramento de uma central. É preciso investir em energias renováveis, armazenamento, eficiência, redes, consumo responsável e apoio às comunidades e trabalhadores afetados pela mudança.`,
      en: `The shutdown of Portugal’s last coal plant represents an important step in reducing emissions from the electricity sector. Coal is one of the energy sources with the highest climate footprint and associated pollution.

Even so, the transition does not end with the closure of one plant. Investment is needed in renewable energy, storage, efficiency, grids, responsible consumption, and support for communities and workers affected by the change.`,
      es: `La parada de la última central de carbón en Portugal representa un paso importante en la reducción de emisiones del sector eléctrico. El carbón es una de las fuentes de energía con mayor huella climática y contaminación asociada.

Aun así, la transición no termina con el cierre de una central. Hay que invertir en energías renovables, almacenamiento, eficiencia, redes, consumo responsable y apoyo a comunidades y trabajadores afectados por el cambio.`,
    },
  },
  'cop-26': {
    title: {
      pt: 'COP 26',
      en: 'COP26',
      es: 'COP26',
    },
    category: {
      pt: 'Clima',
      en: 'Climate',
      es: 'Clima',
    },
    excerpt: {
      pt: 'As conferências climáticas só fazem sentido quando os compromissos se traduzem em medidas concretas.',
      en: 'Climate conferences only matter when commitments turn into concrete measures.',
      es: 'Las conferencias climáticas solo tienen sentido cuando los compromisos se traducen en medidas concretas.',
    },
    body: {
      pt: `A COP 26 trouxe de novo para o centro do debate a necessidade de reduzir emissões e acelerar a resposta à crise climática. Estes encontros são importantes porque alinham países, metas e financiamento.

Mas a credibilidade depende da execução. O clima não muda com comunicados; muda com energia limpa, menos desperdício, proteção de ecossistemas, economia circular e decisões consistentes depois das conferências.`,
      en: `COP26 again placed the need to reduce emissions and accelerate the response to the climate crisis at the centre of debate. These meetings matter because they align countries, targets, and financing.

But credibility depends on execution. The climate does not change through statements; it changes through clean energy, less waste, ecosystem protection, circular economy, and consistent decisions after the conferences.`,
      es: `La COP26 volvió a poner en el centro del debate la necesidad de reducir emisiones y acelerar la respuesta a la crisis climática. Estos encuentros son importantes porque alinean países, metas y financiación.

Pero la credibilidad depende de la ejecución. El clima no cambia con comunicados; cambia con energía limpia, menos desperdicio, protección de ecosistemas, economía circular y decisiones consistentes después de las conferencias.`,
    },
  },
  'infiltracoes-salitre': {
    title: {
      pt: 'Infiltrações? Salitre?',
      en: 'Leaks? Saltpetre?',
      es: '¿Infiltraciones? ¿Salitre?',
    },
    category: {
      pt: 'Materiais',
      en: 'Materials',
      es: 'Materiales',
    },
    excerpt: {
      pt: 'Humidade e salitre mostram como os materiais devem ser escolhidos de acordo com o ambiente onde vão trabalhar.',
      en: 'Moisture and saltpetre show why materials must be chosen according to the environment where they will perform.',
      es: 'La humedad y el salitre muestran por qué los materiales deben elegirse según el entorno donde van a trabajar.',
    },
    body: {
      pt: `Infiltrações e salitre são sinais de humidade persistente e podem degradar paredes, revestimentos e materiais pouco preparados para ambientes agressivos. Em zonas exteriores ou costeiras, a escolha do material torna-se ainda mais importante.

Materiais que absorvem água, enferrujam ou apodrecem tendem a exigir manutenção e substituição. Soluções em plástico reciclado podem ser adequadas em muitas aplicações exteriores porque resistem à humidade e mantêm estabilidade durante mais tempo.`,
      en: `Leaks and saltpetre are signs of persistent moisture and can degrade walls, coatings, and materials that are not prepared for aggressive environments. Outdoors or in coastal areas, material choice becomes even more important.

Materials that absorb water, rust, or rot tend to require maintenance and replacement. Recycled-plastic solutions can be suitable in many outdoor applications because they resist moisture and remain stable for longer.`,
      es: `Las infiltraciones y el salitre son señales de humedad persistente y pueden degradar paredes, revestimientos y materiales poco preparados para ambientes agresivos. En exteriores o zonas costeras, la elección del material se vuelve aún más importante.

Los materiales que absorben agua, se oxidan o se pudren tienden a exigir mantenimiento y sustitución. Las soluciones en plástico reciclado pueden ser adecuadas en muchas aplicaciones exteriores porque resisten la humedad y mantienen estabilidad durante más tiempo.`,
    },
  },
  'os-jovens-a-darem-o-exemplo-na-cop26': {
    title: {
      pt: 'Os jovens a darem o exemplo na COP26',
      en: 'Young people setting the example at COP26',
      es: 'Los jóvenes dando ejemplo en la COP26',
    },
    category: {
      pt: 'Educação ambiental',
      en: 'Environmental education',
      es: 'Educación ambiental',
    },
    excerpt: {
      pt: 'A participação dos jovens lembra que o clima é também uma questão de justiça entre gerações.',
      en: 'Youth participation reminds us that climate is also an issue of justice between generations.',
      es: 'La participación juvenil recuerda que el clima es también una cuestión de justicia entre generaciones.',
    },
    body: {
      pt: `A presença e mobilização dos jovens em torno da COP26 mostrou que a crise climática não é apenas técnica ou política; é também uma questão de futuro. Quem vai viver mais tempo com as consequências pede coerência e rapidez.

Esse exemplo deve entrar nas escolas, famílias, empresas e autarquias. Ouvir os jovens, criar projetos ambientais e transformar preocupação em ação ajuda a formar cidadãos mais atentos e exigentes.`,
      en: `The presence and mobilisation of young people around COP26 showed that the climate crisis is not only technical or political; it is also about the future. Those who will live longer with the consequences are asking for coherence and speed.

That example should enter schools, families, companies, and municipalities. Listening to young people, creating environmental projects, and turning concern into action helps form more attentive and demanding citizens.`,
      es: `La presencia y movilización de jóvenes en torno a la COP26 mostró que la crisis climática no es solo técnica o política; también es una cuestión de futuro. Quienes vivirán más tiempo con las consecuencias piden coherencia y rapidez.

Ese ejemplo debe entrar en escuelas, familias, empresas y municipios. Escuchar a los jóvenes, crear proyectos ambientales y transformar preocupación en acción ayuda a formar ciudadanos más atentos y exigentes.`,
    },
  },
  'nossos-lideres-abandonam-cop-26-sem-resultados-de-facto': {
    title: {
      pt: 'Líderes abandonam a COP26 sem resultados de facto',
      en: 'Leaders leave COP26 without real results',
      es: 'Los líderes abandonan la COP26 sin resultados reales',
    },
    category: {
      pt: 'Clima',
      en: 'Climate',
      es: 'Clima',
    },
    excerpt: {
      pt: 'A frustração com negociações climáticas nasce quando promessas não chegam à escala da emergência.',
      en: 'Frustration with climate negotiations arises when promises do not match the scale of the emergency.',
      es: 'La frustración con las negociaciones climáticas nace cuando las promesas no alcanzan la escala de la emergencia.',
    },
    body: {
      pt: `A crítica aos resultados da COP26 refletia uma sensação comum: há diagnósticos suficientes, mas falta velocidade na execução. Conferências climáticas produzem declarações, metas e compromissos, mas as emissões continuam a exigir cortes concretos.

O valor destes encontros deve medir-se pelo que acontece depois: investimento em transição energética, proteção de florestas, financiamento para adaptação, menos desperdício e políticas que mudem sistemas de produção e consumo.

Sem ação verificável, a distância entre discurso e realidade aumenta. A confiança pública depende de resultados, não apenas de fotografia diplomática.`,
      en: `Criticism of COP26 outcomes reflected a common feeling: there are enough diagnoses, but not enough speed in execution. Climate conferences produce statements, targets, and commitments, but emissions still require concrete cuts.

The value of these meetings should be measured by what happens afterwards: investment in energy transition, forest protection, adaptation finance, less waste, and policies that change production and consumption systems.

Without verifiable action, the distance between speech and reality grows. Public trust depends on results, not only diplomatic photographs.`,
      es: `La crítica a los resultados de la COP26 reflejaba una sensación común: hay diagnósticos suficientes, pero falta velocidad en la ejecución. Las conferencias climáticas producen declaraciones, metas y compromisos, pero las emisiones siguen exigiendo recortes concretos.

El valor de estos encuentros debe medirse por lo que ocurre después: inversión en transición energética, protección de bosques, financiación para adaptación, menos desperdicio y políticas que cambien sistemas de producción y consumo.

Sin acción verificable, aumenta la distancia entre discurso y realidad. La confianza pública depende de resultados, no solo de fotografías diplomáticas.`,
    },
  },
  'cop-26-reuniao-climatica-de-glasgow': {
    title: {
      pt: 'COP26: reunião climática de Glasgow',
      en: 'COP26: the Glasgow climate meeting',
      es: 'COP26: reunión climática de Glasgow',
    },
    category: {
      pt: 'Clima',
      en: 'Climate',
      es: 'Clima',
    },
    excerpt: {
      pt: 'A reunião de Glasgow concentrou expectativas sobre emissões, financiamento climático e compromissos nacionais.',
      en: 'The Glasgow meeting concentrated expectations around emissions, climate finance, and national commitments.',
      es: 'La reunión de Glasgow concentró expectativas sobre emisiones, financiación climática y compromisos nacionales.',
    },
    body: {
      pt: `A COP26, em Glasgow, reuniu países para discutir metas climáticas, financiamento, transição energética e formas de manter o aquecimento global dentro de limites menos perigosos. O encontro mostrou a dimensão política da crise climática.

Mesmo quando os avanços parecem lentos, estes processos importam porque criam pressão, comparações e compromissos públicos. Mas o essencial acontece depois: transformar acordos em legislação, investimento e mudanças reais nos setores que mais emitem.`,
      en: `COP26 in Glasgow brought countries together to discuss climate targets, finance, energy transition, and ways to keep global warming within less dangerous limits. The meeting showed the political dimension of the climate crisis.

Even when progress seems slow, these processes matter because they create pressure, comparisons, and public commitments. But the essential work happens afterwards: turning agreements into legislation, investment, and real change in the highest-emitting sectors.`,
      es: `La COP26, en Glasgow, reunió a países para discutir metas climáticas, financiación, transición energética y formas de mantener el calentamiento global dentro de límites menos peligrosos. El encuentro mostró la dimensión política de la crisis climática.

Aunque los avances parezcan lentos, estos procesos importan porque crean presión, comparaciones y compromisos públicos. Pero lo esencial ocurre después: convertir acuerdos en legislación, inversión y cambios reales en los sectores que más emiten.`,
    },
  },
  'residuos-de-plastico-e-reciclagem-na-ue-factos-e-numeros': {
    title: {
      pt: 'Resíduos de plástico e reciclagem na UE: factos e números',
      en: 'Plastic waste and recycling in the EU: facts and figures',
      es: 'Residuos plásticos y reciclaje en la UE: datos y cifras',
    },
    category: {
      pt: 'Reciclagem',
      en: 'Recycling',
      es: 'Reciclaje',
    },
    excerpt: {
      pt: 'Os números europeus mostram que reciclar plástico continua a depender de prevenção, separação e mercados para material reciclado.',
      en: 'European figures show that plastic recycling still depends on prevention, sorting, and markets for recycled material.',
      es: 'Las cifras europeas muestran que reciclar plástico sigue dependiendo de prevención, separación y mercados para material reciclado.',
    },
    body: {
      pt: `Os resíduos de plástico na União Europeia mostram um desafio duplo: reduzir a produção de descartáveis e aumentar a reciclagem efetiva. Nem todo o plástico recolhido é reciclado, e a contaminação continua a limitar resultados.

Melhorar números exige ecodesign, separação correta, sistemas de recolha eficientes, indústria recicladora forte e procura por produtos feitos com material reciclado. A economia circular só funciona quando o material volta realmente ao ciclo produtivo.`,
      en: `Plastic waste in the European Union shows a double challenge: reduce disposable production and increase effective recycling. Not all collected plastic is recycled, and contamination continues to limit results.

Improving the figures requires ecodesign, correct sorting, efficient collection systems, a strong recycling industry, and demand for products made with recycled material. The circular economy only works when material truly returns to the production cycle.`,
      es: `Los residuos plásticos en la Unión Europea muestran un doble reto: reducir la producción de desechables y aumentar el reciclaje efectivo. No todo el plástico recogido se recicla, y la contaminación sigue limitando resultados.

Mejorar las cifras exige ecodiseño, separación correcta, sistemas de recogida eficientes, una industria recicladora fuerte y demanda de productos hechos con material reciclado. La economía circular solo funciona cuando el material vuelve realmente al ciclo productivo.`,
    },
  },
  'poluicao-por-plasticos-deve-duplicar-ate-2030': {
    title: {
      pt: 'Poluição por plásticos pode duplicar até 2030',
      en: 'Plastic pollution could double by 2030',
      es: 'La contaminación por plásticos podría duplicarse para 2030',
    },
    category: {
      pt: 'Plásticos',
      en: 'Plastics',
      es: 'Plásticos',
    },
    excerpt: {
      pt: 'Sem mudanças no consumo, recolha e reciclagem, a poluição plástica tende a crescer com rapidez.',
      en: 'Without changes in consumption, collection, and recycling, plastic pollution tends to grow quickly.',
      es: 'Sin cambios en consumo, recogida y reciclaje, la contaminación plástica tiende a crecer rápidamente.',
    },
    body: {
      pt: `A possibilidade de a poluição por plásticos duplicar mostra que pequenas melhorias não chegam. A produção e o consumo continuam elevados, e muitos sistemas de recolha não conseguem acompanhar o volume descartado.

Evitar este cenário exige reduzir descartáveis, melhorar reciclagem, responsabilizar cadeias de produção e criar produtos duráveis com material reciclado. O plástico precisa de circular como recurso, não escapar como poluição.`,
      en: `The possibility of plastic pollution doubling shows that small improvements are not enough. Production and consumption remain high, and many collection systems cannot keep up with the discarded volume.

Avoiding this scenario requires reducing disposables, improving recycling, holding production chains accountable, and creating durable products with recycled material. Plastic must circulate as a resource, not escape as pollution.`,
      es: `La posibilidad de que la contaminación por plásticos se duplique muestra que las pequeñas mejoras no bastan. La producción y el consumo siguen altos, y muchos sistemas de recogida no consiguen acompañar el volumen descartado.

Evitar este escenario exige reducir desechables, mejorar reciclaje, responsabilizar cadenas de producción y crear productos duraderos con material reciclado. El plástico debe circular como recurso, no escapar como contaminación.`,
    },
  },
  'porque-garrafas-de-plastico-sao-uma-drama': {
    title: {
      pt: 'Porque as garrafas de plástico são um drama',
      en: 'Why plastic bottles are a problem',
      es: 'Por qué las botellas de plástico son un problema',
    },
    category: {
      pt: 'Plásticos',
      en: 'Plastics',
      es: 'Plásticos',
    },
    excerpt: {
      pt: 'Garrafas de uso curto acumulam impactos de extração, produção, transporte, descarte e poluição.',
      en: 'Short-use bottles accumulate impacts from extraction, production, transport, disposal, and pollution.',
      es: 'Las botellas de uso corto acumulan impactos de extracción, producción, transporte, descarte y contaminación.',
    },
    body: {
      pt: `As garrafas de plástico são práticas, leves e baratas, mas o seu uso massivo cria um problema ambiental enorme. Muitas são usadas durante minutos e permanecem no ambiente durante décadas ou séculos quando não são recolhidas corretamente.

Mesmo quando recicláveis, exigem separação, transporte, triagem e mercado para o material. A melhor resposta combina redução, reutilização, sistemas de depósito quando aplicável e reciclagem efetiva.

Sempre que uma garrafa é evitada, reutilizada ou bem encaminhada, reduz-se pressão sobre recursos e ecossistemas. O drama não está no material isolado, mas no modelo descartável.`,
      en: `Plastic bottles are practical, light, and cheap, but their massive use creates a huge environmental problem. Many are used for minutes and remain in the environment for decades or centuries when not collected correctly.

Even when recyclable, they require sorting, transport, processing, and a market for the material. The best response combines reduction, reuse, deposit systems where applicable, and effective recycling.

Whenever a bottle is avoided, reused, or correctly collected, pressure on resources and ecosystems is reduced. The problem is not the material alone, but the disposable model.`,
      es: `Las botellas de plástico son prácticas, ligeras y baratas, pero su uso masivo crea un enorme problema ambiental. Muchas se usan durante minutos y permanecen en el ambiente durante décadas o siglos cuando no se recogen correctamente.

Incluso cuando son reciclables, exigen separación, transporte, clasificación y mercado para el material. La mejor respuesta combina reducción, reutilización, sistemas de depósito cuando corresponda y reciclaje efectivo.

Cada vez que una botella se evita, reutiliza o recoge correctamente, se reduce la presión sobre recursos y ecosistemas. El problema no está solo en el material, sino en el modelo desechable.`,
    },
  },
  'porque-plastico-e-um-drama': {
    title: {
      pt: 'Porque o plástico é um drama',
      en: 'Why plastic is a problem',
      es: 'Por qué el plástico es un problema',
    },
    category: {
      pt: 'Plásticos',
      en: 'Plastics',
      es: 'Plásticos',
    },
    excerpt: {
      pt: 'O problema do plástico nasce do uso descartável de um material persistente e da falta de sistemas circulares eficazes.',
      en: 'The plastic problem comes from disposable use of a persistent material and the lack of effective circular systems.',
      es: 'El problema del plástico nace del uso desechable de un material persistente y de la falta de sistemas circulares eficaces.',
    },
    body: {
      pt: `O plástico não é apenas um vilão; é um material versátil, leve e resistente. O drama surge quando essa resistência é aplicada a produtos descartáveis, embalagens excessivas e objetos sem recolha ou reciclagem adequada.

Quando escapa ao sistema, o plástico acumula-se em aterros, rios, oceanos e solos. Fragmenta-se em microplásticos, afeta espécies e torna-se difícil de recuperar. A solução passa por reduzir usos evitáveis e manter o material em ciclos fechados.

Produtos duráveis feitos com plástico reciclado demonstram uma alternativa: usar a resistência do material a favor da circularidade, e não contra o ambiente.`,
      en: `Plastic is not only a villain; it is a versatile, light, and resistant material. The problem appears when that resistance is applied to disposable products, excessive packaging, and objects without proper collection or recycling.

When it escapes the system, plastic accumulates in landfills, rivers, oceans, and soils. It fragments into microplastics, affects species, and becomes difficult to recover. The solution involves reducing avoidable uses and keeping the material in closed loops.

Durable products made with recycled plastic demonstrate an alternative: use the material’s resistance in favour of circularity, not against the environment.`,
      es: `El plástico no es solo un villano; es un material versátil, ligero y resistente. El drama aparece cuando esa resistencia se aplica a productos desechables, envases excesivos y objetos sin recogida o reciclaje adecuado.

Cuando escapa del sistema, el plástico se acumula en vertederos, ríos, océanos y suelos. Se fragmenta en microplásticos, afecta a especies y se vuelve difícil de recuperar. La solución pasa por reducir usos evitables y mantener el material en ciclos cerrados.

Los productos duraderos hechos con plástico reciclado demuestran una alternativa: usar la resistencia del material a favor de la circularidad, no contra el ambiente.`,
    },
  },
  'consumo-de-plastico': {
    title: {
      pt: 'Consumo de plástico',
      en: 'Plastic consumption',
      es: 'Consumo de plástico',
    },
    category: {
      pt: 'Consumo',
      en: 'Consumption',
      es: 'Consumo',
    },
    excerpt: {
      pt: 'Consumir plástico sem pensar no destino cria resíduos que os sistemas de reciclagem nem sempre conseguem absorver.',
      en: 'Consuming plastic without considering its destination creates waste that recycling systems cannot always absorb.',
      es: 'Consumir plástico sin pensar en su destino crea residuos que los sistemas de reciclaje no siempre pueden absorber.',
    },
    body: {
      pt: `O consumo de plástico cresceu porque o material é barato, leve e adaptável. Mas quando a utilização é curta e o descarte é frequente, o benefício imediato transforma-se em custo ambiental.

Reduzir consumo não significa eliminar todo o plástico. Significa escolher melhor: evitar embalagens desnecessárias, reutilizar, separar corretamente e preferir produtos feitos para durar. A circularidade começa no desenho, mas depende também da decisão de compra.`,
      en: `Plastic consumption has grown because the material is cheap, light, and adaptable. But when use is short and disposal is frequent, the immediate benefit becomes an environmental cost.

Reducing consumption does not mean eliminating all plastic. It means choosing better: avoid unnecessary packaging, reuse, sort correctly, and prefer products made to last. Circularity starts in design, but it also depends on purchasing decisions.`,
      es: `El consumo de plástico creció porque el material es barato, ligero y adaptable. Pero cuando el uso es corto y el descarte frecuente, el beneficio inmediato se convierte en coste ambiental.

Reducir consumo no significa eliminar todo el plástico. Significa elegir mejor: evitar envases innecesarios, reutilizar, separar correctamente y preferir productos hechos para durar. La circularidad empieza en el diseño, pero depende también de la decisión de compra.`,
    },
  },
  'extincoes-em-massa': {
    title: {
      pt: 'Extinções em massa',
      en: 'Mass extinctions',
      es: 'Extinciones masivas',
    },
    category: {
      pt: 'Biodiversidade',
      en: 'Biodiversity',
      es: 'Biodiversidad',
    },
    excerpt: {
      pt: 'Perda de habitat, alterações climáticas e poluição aceleram a pressão sobre espécies e ecossistemas.',
      en: 'Habitat loss, climate change, and pollution accelerate pressure on species and ecosystems.',
      es: 'La pérdida de hábitat, el cambio climático y la contaminación aceleran la presión sobre especies y ecosistemas.',
    },
    body: {
      pt: `As extinções em massa lembram que a biodiversidade é frágil quando habitats são destruídos, clima muda depressa e poluição se acumula. Cada espécie perdida altera relações ecológicas que muitas vezes só percebemos tarde.

Proteger biodiversidade passa por conservar habitats, reduzir emissões, travar poluição, usar recursos com cuidado e recuperar áreas degradadas. Economia circular e materiais duráveis também fazem parte desta resposta, porque reduzem extração e resíduos.`,
      en: `Mass extinctions remind us that biodiversity is fragile when habitats are destroyed, climate changes quickly, and pollution accumulates. Each lost species changes ecological relationships that we often understand too late.

Protecting biodiversity involves conserving habitats, reducing emissions, stopping pollution, using resources carefully, and restoring degraded areas. Circular economy and durable materials are also part of this response because they reduce extraction and waste.`,
      es: `Las extinciones masivas recuerdan que la biodiversidad es frágil cuando se destruyen hábitats, el clima cambia rápido y la contaminación se acumula. Cada especie perdida altera relaciones ecológicas que muchas veces entendemos demasiado tarde.

Proteger la biodiversidad pasa por conservar hábitats, reducir emisiones, frenar contaminación, usar recursos con cuidado y recuperar áreas degradadas. La economía circular y los materiales duraderos también forman parte de esta respuesta porque reducen extracción y residuos.`,
    },
  },
  'este-e-um-artigo-com-imagens': {
    title: {
      pt: 'O que aconteceria se todas as árvores do mundo desaparecessem?',
      en: 'What would happen if all the world’s trees disappeared?',
      es: '¿Qué pasaría si desaparecieran todos los árboles del mundo?',
    },
    category: {
      pt: 'Ambiente',
      en: 'Environment',
      es: 'Medio ambiente',
    },
    excerpt: {
      pt: 'Sem árvores, perderíamos sombra, carbono armazenado, solo protegido, água regulada e grande parte da biodiversidade.',
      en: 'Without trees, we would lose shade, stored carbon, protected soil, regulated water, and much of biodiversity.',
      es: 'Sin árboles, perderíamos sombra, carbono almacenado, suelo protegido, agua regulada y gran parte de la biodiversidad.',
    },
    body: {
      pt: `Se todas as árvores desaparecessem, o planeta perderia um dos seus sistemas de equilíbrio mais importantes. Árvores capturam carbono, produzem oxigénio, protegem solos, regulam água, criam sombra e sustentam inúmeras espécies.

A sua ausência agravaria erosão, calor urbano, perda de habitats, escassez de água e instabilidade climática. O cenário extremo serve para reforçar uma ideia simples: proteger árvores e reduzir pressão sobre madeira não é opcional.

Escolher materiais duráveis, reutilizados ou reciclados em aplicações adequadas ajuda a diminuir a necessidade de extração e a valorizar recursos que já existem.`,
      en: `If all trees disappeared, the planet would lose one of its most important balancing systems. Trees capture carbon, produce oxygen, protect soils, regulate water, create shade, and support countless species.

Their absence would worsen erosion, urban heat, habitat loss, water scarcity, and climate instability. The extreme scenario reinforces a simple idea: protecting trees and reducing pressure on wood is not optional.

Choosing durable, reused, or recycled materials in suitable applications helps reduce the need for extraction and gives value to resources that already exist.`,
      es: `Si desaparecieran todos los árboles, el planeta perdería uno de sus sistemas de equilibrio más importantes. Los árboles capturan carbono, producen oxígeno, protegen suelos, regulan agua, crean sombra y sostienen innumerables especies.

Su ausencia agravaría erosión, calor urbano, pérdida de hábitats, escasez de agua e inestabilidad climática. El escenario extremo refuerza una idea simple: proteger árboles y reducir presión sobre la madera no es opcional.

Elegir materiales duraderos, reutilizados o reciclados en aplicaciones adecuadas ayuda a disminuir la necesidad de extracción y a valorizar recursos que ya existen.`,
    },
  },
}

export const oldBlogPosts: OldBlogPost[] = oldBlogSources.map((source) => ({
  ...source,
  ...oldBlogContent[source.slug],
}))

import type {StructureResolver} from 'sanity/structure'

export const managedTypes = [
  'siteLanding',
  'productCategory',
  'storeCategory',
  'storeProduct',
  'caseStudy',
  'blogPost',
  'sitePage',
  'builderPage',
  'builderSiteSettings',
]
const storeOrdering = [
  {field: 'orderRank', direction: 'asc' as const},
  {field: 'title.pt', direction: 'asc' as const},
]

export const websiteStructure: StructureResolver = (S) => {
  const storeProductsList = (
    title: string,
    filter = '_type == "storeProduct"',
    params: Record<string, unknown> = {},
  ) =>
    S.documentTypeList('storeProduct')
      .title(title)
      .filter(filter)
      .params(params)
      .defaultOrdering(storeOrdering)

  const storeListItem = (
    title: string,
    filter = '_type == "storeProduct"',
    params: Record<string, unknown> = {},
  ) =>
    S.listItem()
      .title(title)
      .schemaType('storeProduct')
      .child(storeProductsList(title, filter, params))

  const storeStructure = S.list()
    .title('Loja')
    .items([
      S.listItem()
        .title('Textos da página Loja')
        .schemaType('siteLanding')
        .child(
          S.document()
            .schemaType('siteLanding')
            .documentId('siteContent')
            .title('Conteúdo do site'),
        ),
      S.divider(),
      S.documentTypeListItem('storeCategory').title('Categorias'),
      storeListItem('Todos os produtos'),
      storeListItem('Produtos visíveis', '_type == "storeProduct" && coalesce(active, true)'),
      S.divider(),
      storeListItem('Sem imagem principal', '_type == "storeProduct" && !defined(image.asset)'),
      storeListItem(
        'Sem peso definido',
        '_type == "storeProduct" && count(variants[!defined(weightKg) || weightKg <= 0]) > 0',
      ),
      storeListItem('Produtos ocultos', '_type == "storeProduct" && active == false'),
    ])

  return S.list()
    .title('DaFábrica4You CMS')
    .items([
      S.listItem()
        .title('Conteúdo do site')
        .schemaType('siteLanding')
        .child(
          S.document()
            .schemaType('siteLanding')
            .documentId('siteContent')
            .title('Conteúdo do site'),
        ),
      S.divider(),
      S.documentTypeListItem('productCategory').title('Produtos'),
      S.listItem().title('Loja').schemaType('storeProduct').child(storeStructure),
      S.documentTypeListItem('caseStudy').title('Casos de estudo'),
      S.documentTypeListItem('blogPost').title('Artigos do blog'),
      S.documentTypeListItem('sitePage').title('Páginas livres'),
      S.divider(),
      ...S.documentTypeListItems().filter((item) => !managedTypes.includes(item.getId() ?? '')),
    ])
}

export const studioStructure = websiteStructure

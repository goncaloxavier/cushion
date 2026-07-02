import type {StructureResolver} from 'sanity/structure'

const managedTypes = ['siteLanding', 'productCategory', 'storeProduct', 'caseStudy', 'blogPost']
const crmManagedTypes = ['formSubmission', 'clientProfile', 'staffUser', 'staffSession']

const storeCategories = [
  {title: 'Bancos', value: 'bancos'},
  {title: 'Mesas e conjuntos', value: 'mesas'},
  {title: 'Cadeiras', value: 'cadeiras'},
  {title: 'Resíduos', value: 'residuos'},
  {title: 'Cultivo', value: 'cultivo'},
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
      storeListItem('Todos os produtos'),
      storeListItem('Produtos visíveis', '_type == "storeProduct" && coalesce(active, true)'),
      ...storeCategories.map((category) =>
        storeListItem(`${category.title}`, '_type == "storeProduct" && category == $category', {
          category: category.value,
        }),
      ),
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
        .child(S.document().schemaType('siteLanding').documentId('siteContent').title('Conteúdo do site')),
      S.divider(),
      S.documentTypeListItem('productCategory').title('Produtos'),
      S.listItem().title('Loja').schemaType('storeProduct').child(storeStructure),
      S.documentTypeListItem('caseStudy').title('Casos de estudo'),
      S.documentTypeListItem('blogPost').title('Artigos do blog'),
      S.divider(),
      ...S.documentTypeListItems().filter((item) => !managedTypes.includes(item.getId() ?? '')),
    ])
}

export const crmStructure: StructureResolver = (S) =>
  S.list()
    .title('Pedidos e clientes')
    .items([
      S.listItem()
        .title('Novos pedidos')
        .schemaType('formSubmission')
        .child(
          S.documentTypeList('formSubmission')
            .title('Novos pedidos')
            .filter('_type == "formSubmission" && status == $status')
            .params({status: 'new'})
            .defaultOrdering([{field: 'submittedAt', direction: 'desc'}]),
        ),
      S.listItem()
        .title('Pedidos em acompanhamento')
        .schemaType('formSubmission')
        .child(
          S.documentTypeList('formSubmission')
            .title('Pedidos em acompanhamento')
            .filter('_type == "formSubmission" && status in $statuses')
            .params({statuses: ['read', 'inProgress']})
            .defaultOrdering([{field: 'submittedAt', direction: 'desc'}]),
        ),
      S.documentTypeListItem('formSubmission')
        .title('Todos os pedidos')
        .child(
          S.documentTypeList('formSubmission')
            .title('Todos os pedidos')
            .defaultOrdering([{field: 'submittedAt', direction: 'desc'}]),
        ),
      S.divider(),
      S.documentTypeListItem('clientProfile').title('Perfis de clientes'),
      S.divider(),
      S.documentTypeListItem('staffUser').title('Contas de equipa'),
      ...S.documentTypeListItems().filter((item) => !crmManagedTypes.includes(item.getId() ?? '')),
    ])

export const studioStructure = websiteStructure

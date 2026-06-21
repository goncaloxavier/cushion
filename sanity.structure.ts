import type {StructureResolver} from 'sanity/structure'

const managedTypes = ['siteLanding', 'productCategory', 'caseStudy', 'blogPost']
const crmManagedTypes = ['formSubmission', 'clientProfile', 'staffUser', 'staffSession']

export const websiteStructure: StructureResolver = (S) =>
  S.list()
    .title('DaFábrica4You CMS')
    .items([
      S.listItem()
        .title('Conteúdo do site')
        .schemaType('siteLanding')
        .child(S.document().schemaType('siteLanding').documentId('siteContent').title('Conteúdo do site')),
      S.divider(),
      S.documentTypeListItem('productCategory').title('Produtos'),
      S.documentTypeListItem('caseStudy').title('Casos de estudo'),
      S.documentTypeListItem('blogPost').title('Artigos do blog'),
      S.divider(),
      ...S.documentTypeListItems().filter((item) => !managedTypes.includes(item.getId() ?? '')),
    ])

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

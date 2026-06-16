import type {StructureResolver} from 'sanity/structure'

const managedTypes = ['siteLanding', 'productCategory', 'caseStudy', 'blogPost']

export const studioStructure: StructureResolver = (S) =>
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

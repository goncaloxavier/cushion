import type {StructureResolver} from 'sanity/structure'

const managedTypes = ['productCategory', 'caseStudy', 'blogPost']

export const studioStructure: StructureResolver = (S) =>
  S.list()
    .title('DaFabrica4You CMS')
    .items([
      S.documentTypeListItem('productCategory').title('Products'),
      S.documentTypeListItem('caseStudy').title('Case studies'),
      S.documentTypeListItem('blogPost').title('Blog posts'),
      S.divider(),
      ...S.documentTypeListItems().filter((item) => !managedTypes.includes(item.getId() ?? '')),
    ])

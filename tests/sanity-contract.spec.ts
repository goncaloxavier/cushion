import {readFileSync} from 'node:fs'
import {expect, test} from '@playwright/test'

const read = (path: string) => readFileSync(path, 'utf8')

test.describe('Sanity Studio content contract', () => {
  test.beforeEach(({browserName}, testInfo) => {
    test.skip(
      Boolean(browserName) && testInfo.project.name !== 'desktop-chrome',
      'File contract checks are viewport independent',
    )
  })

  test('collection documents are registered in Studio', () => {
    const schemaIndex = read('schemaTypes/index.ts')

    expect(schemaIndex).toContain('siteLanding')
    expect(schemaIndex).toContain('productCategory')
    expect(schemaIndex).toContain('caseStudy')
    expect(schemaIndex).toContain('blogPost')
  })

  test('page copy is managed through a Portuguese Site content singleton', () => {
    const studioStructure = read('sanity.structure.ts')
    const siteSchema = read('schemaTypes/siteLanding.ts')

    expect(studioStructure).toContain("documentId('siteContent')")
    expect(studioStructure).toContain("schemaType('siteLanding')")
    expect(studioStructure).toContain("'Conteúdo do site'")
    expect(studioStructure).toContain("'Produtos'")
    expect(studioStructure).toContain("'Casos de estudo'")
    expect(studioStructure).toContain("'Artigos do blog'")
    expect(siteSchema).toContain("title: 'Conteúdo do site'")
    expect(siteSchema).toContain("'Página inicial'")
    expect(siteSchema).toContain("'Página Produtos'")
    expect(siteSchema).toContain("'Página Catálogo'")
    expect(siteSchema).toContain("'Página Contacto'")
    expect(siteSchema).toContain("'Link do WhatsApp'")
    expect(siteSchema).toContain("'Link Livro de Reclamações'")
    expect(siteSchema).toContain("'Texto legal junto ao Livro de Reclamações'")
    expect(siteSchema).toContain("'Consentimento de dados/marketing'")
    expect(siteSchema).not.toContain("'Navigation labels'")
    expect(siteSchema).not.toContain("'Shared labels and contact'")
  })

  test('frontend query reads the same collections editors manage', () => {
    const sanityClient = read('src/lib/sanity.ts')

    expect(sanityClient).toContain('_id == "siteContent"')
    expect(sanityClient).toContain('_type == "siteLanding"')
    expect(sanityClient).toContain('_type == "productCategory"')
    expect(sanityClient).toContain('_type == "caseStudy"')
    expect(sanityClient).toContain('_type == "blogPost"')
    expect(sanityClient).toContain('whatsappUrl')
    expect(sanityClient).toContain('instagramUrl')
    expect(sanityClient).toContain('complaintsUrl')
    expect(sanityClient).toContain('complaintsNote')
    expect(sanityClient).toContain('marketingConsent')
    expect(sanityClient).toContain('asset ->')
    expect(sanityClient).toContain('alt')
  })

  test('editable collection documents support uploaded images', () => {
    const productSchema = read('schemaTypes/productCategory.ts')
    const caseSchema = read('schemaTypes/caseStudy.ts')
    const blogSchema = read('schemaTypes/blogPost.ts')

    for (const schema of [productSchema, caseSchema, blogSchema]) {
      expect(schema).toContain("title: 'Conteúdo'")
      expect(schema).toContain("name: 'image'")
      expect(schema).toContain("type: 'image'")
      expect(schema).toContain('hotspot: true')
      expect(schema).toContain("name: 'alt'")
      expect(schema).toContain("'Descrição da imagem'")
    }
  })

  test('fallback content remains available when Studio is empty', () => {
    const contentModel = read('src/lib/site-content.ts')

    expect(contentModel).toContain('siteContent?: SanitySiteContent')
    expect(contentModel).toContain('applySiteContentFromSanity')
    expect(contentModel).toContain('whatsapp: ')
    expect(contentModel).toContain('marketingConsent')
    expect(contentModel).toContain('complaintsNote')
    expect(contentModel).toContain('https://www.livroreclamacoes.pt/Pedido/Reclamacao')
    expect(contentModel).toContain('products: productCategories.pt')
    expect(contentModel).toContain('caseStudies: caseStudies.pt')
    expect(contentModel).toContain('blogPosts: blogPosts.pt')
    expect(contentModel).toContain('contentFromSanity')
  })
})

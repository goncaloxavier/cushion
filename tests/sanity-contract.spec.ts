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
    expect(schemaIndex).toContain('partnerItem')
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
    expect(siteSchema).toContain("'Vídeo do topo (YouTube)'")
    expect(siteSchema).toContain("'Parceiros e projetos'")
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
    expect(sanityClient).toContain('heroVideoUrl')
    expect(sanityClient).toContain('partners')
    expect(sanityClient).toContain('youtubeUrl')
    expect(sanityClient).toContain('logoTone')
    expect(sanityClient).toContain('logo')
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
    expect(contentModel).toContain('https://www.youtube.com/watch?v=h1wVIZRj0Hc')
    expect(contentModel).toContain('/images/partners/abaae.png')
    expect(contentModel).toContain('partnersFromSanity')
    expect(contentModel).toContain('localizedArticle')
    expect(contentModel).toContain('article: localizedArticle')
    expect(contentModel).toContain('products: productCategories.pt')
    expect(contentModel).toContain('caseStudies: caseStudies.pt')
    expect(contentModel).toContain('blogPosts: blogPosts.pt')
    expect(contentModel).toContain('contentFromSanity')
  })

  test('blog posts support structured article authoring', () => {
    const schemaIndex = read('schemaTypes/index.ts')
    const blogSchema = read('schemaTypes/blogPost.ts')
    const localizedArticle = read('schemaTypes/objects/localizedArticle.ts')
    const sanityClient = read('src/lib/sanity.ts')
    const renderer = read('src/lib/components/StructuredArticleBody.svelte')
    const route = read('src/routes/blog/[slug]/+page.svelte')

    expect(schemaIndex).toContain('localizedArticle')
    expect(blogSchema).toContain("name: 'article'")
    expect(blogSchema).toContain("type: 'localizedArticle'")
    expect(blogSchema).toContain("name: 'gallery'")
    expect(localizedArticle).toContain("value: 'h2'")
    expect(localizedArticle).toContain("value: 'bullet'")
    expect(localizedArticle).toContain("name: 'youtubeEmbed'")
    expect(localizedArticle).toContain("name: 'articleTable'")
    expect(sanityClient).toContain('article {')
    expect(sanityClient).toContain('gallery[]')
    expect(sanityClient).toContain('metadata {')
    expect(renderer).toContain('youtubeEmbed')
    expect(route).toContain('article={data.post.article}')
  })

  test('case studies support migrated old-site case pages', () => {
    const caseSchema = read('schemaTypes/caseStudy.ts')
    const sanityClient = read('src/lib/sanity.ts')
    const contentModel = read('src/lib/site-content.ts')
    const route = read('src/routes/casos-de-estudo/[slug]/+page.svelte')
    const importScript = read('scripts/write-case-study-import.ts')

    expect(caseSchema).toContain("name: 'description'")
    expect(caseSchema).toContain("'Descrição do caso'")
    expect(sanityClient).toContain('description')
    expect(contentModel).toContain('description?: string')
    expect(contentModel).toContain('description: localized(item.description')
    expect(route).toContain('case-detail-description')
    expect(importScript).toContain('caseStudy-')
    expect(importScript).toContain('case-study-import.ndjson')
  })

  test('shared image galleries lock background scroll', () => {
    const gallery = read('src/lib/components/ImageGallery.svelte')
    const styles = read('src/app.css')

    expect(gallery).toContain("classList.add('lightbox-open')")
    expect(gallery).toContain("event.key === 'ArrowLeft'")
    expect(gallery).toContain("event.key === 'ArrowRight'")
    expect(styles).toContain('html.lightbox-open')
    expect(styles).toContain('body.lightbox-open')
    expect(styles).toContain('object-fit: contain')
  })
})

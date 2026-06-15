import {readFileSync} from 'node:fs'
import {expect, test} from '@playwright/test'

const read = (path: string) => readFileSync(path, 'utf8')

test.describe('Sanity Studio content contract', () => {
  test('collection documents are registered in Studio', () => {
    const schemaIndex = read('schemaTypes/index.ts')

    expect(schemaIndex).toContain('productCategory')
    expect(schemaIndex).toContain('caseStudy')
    expect(schemaIndex).toContain('blogPost')
  })

  test('frontend query reads the same collections editors manage', () => {
    const sanityClient = read('src/lib/sanity.ts')

    expect(sanityClient).toContain('_type == "productCategory"')
    expect(sanityClient).toContain('_type == "caseStudy"')
    expect(sanityClient).toContain('_type == "blogPost"')
    expect(sanityClient).toContain('asset ->')
    expect(sanityClient).toContain('alt')
  })

  test('editable collection documents support uploaded images', () => {
    const productSchema = read('schemaTypes/productCategory.ts')
    const caseSchema = read('schemaTypes/caseStudy.ts')
    const blogSchema = read('schemaTypes/blogPost.ts')

    for (const schema of [productSchema, caseSchema, blogSchema]) {
      expect(schema).toContain("name: 'image'")
      expect(schema).toContain("type: 'image'")
      expect(schema).toContain('hotspot: true')
      expect(schema).toContain("name: 'alt'")
    }
  })

  test('fallback content remains available when Studio is empty', () => {
    const contentModel = read('src/lib/site-content.ts')

    expect(contentModel).toContain('products: productCategories.pt')
    expect(contentModel).toContain('caseStudies: caseStudies.pt')
    expect(contentModel).toContain('blogPosts: blogPosts.pt')
    expect(contentModel).toContain('contentFromSanity')
  })
})

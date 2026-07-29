import {readFileSync} from 'node:fs'
import {expect, test} from '@playwright/test'
import {contentFromSanity} from '../src/lib/site-content'
import {assertUploadAllowed} from '../src/lib/server/upload-guard'

const doc = (over: Record<string, unknown> = {}) => ({
  title: {pt: 'Ficha técnica do decking'},
  fileUrl: 'https://cdn.sanity.io/files/x/production/abc.pdf',
  fileSize: 1_572_864,
  ...over,
})

test('documents reach every surface the client named', () => {
  const built = contentFromSanity({
    siteContent: {
      productsPage: {documents: [doc()]},
      storePage: {documents: [doc({title: {pt: 'Tabela de preços'}})]},
    },
    products: [
      {
        _id: 'p1',
        title: {pt: 'Decking'},
        slug: {current: 'decking'},
        documents: [doc()],
      },
    ],
  } as never)

  expect(built.pt.productsPage.documents).toHaveLength(1)
  expect(built.pt.storePage.documents[0].title).toBe('Tabela de preços')
  expect(built.pt.products[0].documents).toHaveLength(1)
  expect(built.pt.products[0].documents?.[0]).toMatchObject({
    title: 'Ficha técnica do decking',
    url: 'https://cdn.sanity.io/files/x/production/abc.pdf',
    size: 1_572_864,
  })
})

test('an entry without an uploaded file is not offered as a download', () => {
  // An editor can name a document before choosing the PDF. A link that
  // downloads nothing is worse than one that is not shown yet.
  const built = contentFromSanity({
    siteContent: {productsPage: {documents: [doc({fileUrl: undefined}), doc()]}},
  } as never)
  expect(built.pt.productsPage.documents).toHaveLength(1)
})

test('absent documents yield an empty list, never undefined', () => {
  // DownloadList guards on .length, so undefined here would throw at render.
  const built = contentFromSanity({siteContent: {productsPage: {}}} as never)
  expect(built.pt.productsPage.documents).toEqual([])
  expect(built.pt.storePage.documents).toEqual([])
})

test('the upload guard accepts PDFs and nothing else', () => {
  // 'document' is a distinct kind rather than a loosened 'file'. Widening
  // 'file' would have let a subtitle field take a 20 MB upload and a document
  // field take a .vtt, so both directions are asserted.
  const as = (name: string, type: string, size = 1024) => ({name, type, size})

  expect(() => assertUploadAllowed(as('ficha.pdf', 'application/pdf'), 'document')).not.toThrow()

  expect(() =>
    assertUploadAllowed(as('ficha.pdf', 'application/pdf', 21 * 1024 * 1024), 'document'),
  ).toThrow(/maior do que 20 MB/)
  expect(() => assertUploadAllowed(as('x.exe', 'application/x-msdownload'), 'document')).toThrow(
    /ficheiros PDF/,
  )
  // Extension and MIME type must agree — neither alone gets a file through.
  expect(() => assertUploadAllowed(as('x.pdf', 'text/html'), 'document')).toThrow(/PDF/)
  expect(() => assertUploadAllowed(as('x.html', 'application/pdf'), 'document')).toThrow(/PDF/)
  // The subtitle kind still refuses a PDF, and keeps its own 2 MB cap.
  expect(() => assertUploadAllowed(as('x.pdf', 'application/pdf'), 'file')).toThrow(/WebVTT/)
  expect(() =>
    assertUploadAllowed(as('legendas.vtt', 'text/vtt', 3 * 1024 * 1024), 'file'),
  ).toThrow(/2 MB/)
  // And SVG stays out of images, which is why these are allowlists.
  expect(() => assertUploadAllowed(as('logo.svg', 'image/svg+xml'), 'image')).toThrow(/imagem/)
})

test('the heading is the client’s own, with the shared label as fallback', () => {
  const withOwn = contentFromSanity({
    siteContent: {productsPage: {documents: [doc()], documentsTitle: {pt: 'Fichas técnicas'}}},
  } as never)
  expect(withOwn.pt.productsPage.documentsTitle).toBe('Fichas técnicas')

  // Left empty, the component falls back to common.downloadsTitle rather than
  // forcing every page to repeat the same word.
  const withoutOwn = contentFromSanity({
    siteContent: {productsPage: {documents: [doc()]}},
  } as never)
  expect(withoutOwn.pt.productsPage.documentsTitle).toBe('')
  expect(withoutOwn.pt.common.downloadsTitle).toBe('Documentos para download')
})

test('downloads live in each page’s opening copy block, on all four surfaces', () => {
  // One rule everywhere: the block that opens the page, never a functional
  // panel. Specs can be empty and the buy panel is prices, so hanging the
  // downloads off either made placement depend on unrelated content.
  const sources: Array<[string, string, string]> = [
    ['src/routes/produtos/+page.svelte', 'product-index-copy', 'listing hero copy'],
    ['src/routes/loja/+page.svelte', 'PageHero', 'listing hero copy'],
    ['src/routes/produtos/[slug]/+page.svelte', 'product-editorial-copy', 'intro copy'],
    ['src/routes/loja/[slug]/+page.svelte', 'store-detail-copy', 'detail copy'],
  ]

  for (const [file, container, label] of sources) {
    const source = readFileSync(file, 'utf8')
    const download = source.indexOf('<DownloadList')
    expect(download, `${file}: no DownloadList`).toBeGreaterThan(-1)

    const opener = source.indexOf(container)
    expect(opener, `${file}: no ${container}`).toBeGreaterThan(-1)
    // It must come after the container opens — i.e. be nested inside it, not
    // dangling after the page's blocks where it would have no gutters at all.
    expect(download, `${file}: DownloadList is not inside the ${label}`).toBeGreaterThan(opener)
  }
})

test('snippets are declared where every call site can see them', () => {
  // A {#snippet} declared inside a component's children is not in scope after
  // that component closes. quoteButton was declared inside the composition
  // while one of its two render sites sat after it, so /produtos/[slug] threw
  // ReferenceError — but only for products with sections, which is the branch
  // that renders it. Nothing in the suite caught that, because the e2e dataset
  // has no product with sections.
  const raw = readFileSync('src/routes/produtos/[slug]/+page.svelte', 'utf8')
  // Comments mention the tag by name, so measure against the markup only.
  const source = raw.replace(/<!--[\s\S]*?-->/g, (block) => ' '.repeat(block.length))

  const declared = source.indexOf('{#snippet quoteButton()}')
  const compositionOpens = source.indexOf('<ManagedPageComposition')
  expect(declared).toBeGreaterThan(-1)
  expect(compositionOpens).toBeGreaterThan(-1)

  expect(
    declared,
    'quoteButton must be declared before <ManagedPageComposition> opens, or the render site after it cannot see it',
  ).toBeLessThan(compositionOpens)

  for (const match of source.matchAll(/\{@render quoteButton\(\)\}/g)) {
    expect(match.index!, 'a quoteButton call site precedes its declaration').toBeGreaterThan(
      declared,
    )
  }
})

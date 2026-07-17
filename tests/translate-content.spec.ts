import {expect, test} from '@playwright/test'
import {
  collectArticleLeaves,
  detectLocalizedKind,
  findLocalizedFields,
  hashLeaves,
  reinsertArticleLeaves,
  type PortableTextBlock,
} from '../src/lib/server/translate-content'
import {
  buildTranslationContext,
  prepareTranslationText,
  preserveTranslationPresentation,
  restoreTranslationText,
  splitTranslationText,
} from '../src/lib/server/translation-fidelity'

const articleFixture: PortableTextBlock[] = [
  {
    _type: 'block',
    _key: 'block1',
    style: 'h2',
    level: 2,
    children: [{_type: 'span', _key: 'span1', text: 'Título de secção', marks: []}],
  },
  {
    _type: 'block',
    _key: 'block2',
    style: 'normal',
    listItem: 'bullet',
    level: 1,
    markDefs: [{_key: 'link1', _type: 'link', href: 'https://dafabrica4you.pt'}],
    children: [
      {_type: 'span', _key: 'span2', text: 'Fale ', marks: []},
      {_type: 'span', _key: 'span3', text: 'connosco', marks: ['link1', 'strong']},
      {_type: 'span', _key: 'span4', text: ' hoje.', marks: []},
    ],
  },
  {
    _type: 'image',
    _key: 'image1',
    asset: {_type: 'reference', _ref: 'image-abc123-800x600-jpg'},
    alt: 'Cadeira em plástico reciclado',
    caption: 'Vista da fábrica',
  },
  {
    _type: 'youtubeEmbed',
    _key: 'yt1',
    url: 'https://youtube.com/watch?v=abc123',
    title: 'Vídeo institucional',
    caption: 'Processo produtivo',
  },
  {
    _type: 'articleTable',
    _key: 'table1',
    columns: ['Material', 'Peso'],
    rows: [
      {_type: 'articleTableRow', _key: 'row1', cells: ['Plástico reciclado', '12kg']},
      {_type: 'articleTableRow', _key: 'row2', cells: ['Madeira', '8kg']},
    ],
  },
]

test.describe('translate-content tree-walker', () => {
  test.beforeEach(({browserName}, testInfo) => {
    test.skip(
      Boolean(browserName) && testInfo.project.name !== 'desktop-chrome',
      'Pure logic checks are viewport independent',
    )
  })

  test('detectLocalizedKind identifies string vs. article vs. unrelated shapes', () => {
    expect(detectLocalizedKind({pt: 'Olá', en: 'Hello', es: 'Hola'})).toBe('string')
    expect(detectLocalizedKind({pt: [{_type: 'block'}], en: [], es: []})).toBe('article')
    expect(detectLocalizedKind({pt: 'Olá'})).toBe('string')
    expect(detectLocalizedKind({})).toBeNull()
    expect(detectLocalizedKind(null)).toBeNull()
    expect(detectLocalizedKind('Olá')).toBeNull()
    expect(detectLocalizedKind([{pt: 'x'}])).toBeNull()
    // An unrelated object that happens to have a `pt` key plus other,
    // non-localized keys must NOT be misdetected.
    expect(detectLocalizedKind({pt: 'x', slug: 'produto', price: 10})).toBeNull()
  })

  test('collectArticleLeaves extracts every translatable leaf in document order', () => {
    const leaves = collectArticleLeaves(articleFixture)
    expect(leaves).toEqual([
      'Título de secção',
      'Fale ',
      'connosco',
      ' hoje.',
      'Cadeira em plástico reciclado',
      'Vista da fábrica',
      'Vídeo institucional',
      'Processo produtivo',
      'Material',
      'Peso',
      'Plástico reciclado',
      '12kg',
      'Madeira',
      '8kg',
    ])
  })

  test('reinsertArticleLeaves preserves every non-text field and only changes text', () => {
    const leaves = collectArticleLeaves(articleFixture)
    const translated = leaves.map((leaf) => `[EN] ${leaf}`)
    const result = reinsertArticleLeaves(articleFixture, translated)

    // Structural fields survive byte-identical.
    expect(result[0]._key).toBe('block1')
    expect(result[0].style).toBe('h2')
    expect(result[0].level).toBe(2)
    expect((result[1] as PortableTextBlock).listItem).toBe('bullet')
    expect((result[1] as PortableTextBlock).level).toBe(1)
    expect((result[1].markDefs as PortableTextBlock[])[0].href).toBe('https://dafabrica4you.pt')
    expect((result[1].children as PortableTextBlock[])[1].marks).toEqual(['link1', 'strong'])
    expect((result[2].asset as PortableTextBlock)._ref).toBe('image-abc123-800x600-jpg')
    expect(result[3].url).toBe('https://youtube.com/watch?v=abc123')
    expect(result[4]._key).toBe('table1')

    // Only leaf text changed.
    expect((result[0].children as PortableTextBlock[])[0].text).toBe('[EN] Título de secção')
    expect(result[2].alt).toBe('[EN] Cadeira em plástico reciclado')
    expect(result[3].title).toBe('[EN] Vídeo institucional')
    expect((result[4].columns as string[])[0]).toBe('[EN] Material')
    expect(((result[4].rows as PortableTextBlock[])[0].cells as string[])[1]).toBe('[EN] 12kg')

    // The input array itself must never be mutated.
    expect((articleFixture[0].children as PortableTextBlock[])[0].text).toBe('Título de secção')
  })

  test('reinsertArticleLeaves throws on a leaf-count mismatch', () => {
    const leaves = collectArticleLeaves(articleFixture)
    expect(() => reinsertArticleLeaves(articleFixture, leaves.slice(0, -1))).toThrow()
    expect(() => reinsertArticleLeaves(articleFixture, [...leaves, 'extra'])).toThrow()
  })

  test('hashLeaves is stable for identical content and changes only when leaf text changes', () => {
    const leaves = collectArticleLeaves(articleFixture)
    const hashA = hashLeaves(leaves)
    const hashB = hashLeaves(collectArticleLeaves(structuredClone(articleFixture)))
    expect(hashA).toBe(hashB)

    const changedText = structuredClone(articleFixture)
    ;(changedText[0].children as PortableTextBlock[])[0].text = 'Outro título'
    expect(hashLeaves(collectArticleLeaves(changedText))).not.toBe(hashA)

    // Non-text changes (a different _key, a different href) must NOT affect
    // the hash — the hash tracks translatable content, not structure.
    const changedKeyAndHref = structuredClone(articleFixture)
    changedKeyAndHref[0]._key = 'a-totally-different-key'
    ;(changedKeyAndHref[1].markDefs as PortableTextBlock[])[0].href = 'https://example.com'
    expect(hashLeaves(collectArticleLeaves(changedKeyAndHref))).toBe(hashA)
  })

  test('findLocalizedFields walks a nested document and uses _key-based paths, not numeric indices', () => {
    const doc = {
      _id: 'siteLanding',
      _type: 'siteLanding',
      home: {
        hero: {pt: 'Bem-vindo', en: '', es: ''},
        partners: {
          items: [
            {
              _key: 'partner-a',
              name: 'Parceiro A',
              text: {pt: 'Descrição A', en: 'Description A', es: '', translationHash: 'stale-hash'},
            },
            {
              _key: 'partner-b',
              name: 'Parceiro B',
              text: {pt: 'Descrição B', en: '', es: ''},
            },
          ],
        },
      },
      article: {pt: articleFixture, en: [], es: []},
    }

    const tasks = findLocalizedFields(doc)
    const byPath = Object.fromEntries(tasks.map((task) => [task.patchPath, task]))

    expect(byPath['home.hero'].kind).toBe('string')
    expect(byPath['home.hero'].leaves).toEqual(['Bem-vindo'])

    expect(byPath['home.partners.items[_key=="partner-a"].text'].currentHash).toBe('stale-hash')
    expect(byPath['home.partners.items[_key=="partner-b"].text'].leaves).toEqual(['Descrição B'])

    expect(byPath.article.kind).toBe('article')
    expect(byPath.article.leaves.length).toBe(14)

    // No numeric-index path should ever be produced for array items.
    for (const path of Object.keys(byPath)) {
      expect(path).not.toMatch(/\[\d+\]/)
    }
  })

  test('findLocalizedFields skips fields with an empty Portuguese value', () => {
    const doc = {empty: {pt: '', en: '', es: ''}, blank: {pt: '   ', en: '', es: ''}}
    expect(findLocalizedFields(doc)).toEqual([])
  })

  test('translation presentation follows the Portuguese capitalization and punctuation', () => {
    expect(preserveTranslationPresentation('ola tudo bem?', 'Hi, how are you?', 'en')).toBe(
      'hi how are you?',
    )
    expect(
      preserveTranslationPresentation(
        'isto é uma frase sem ponto',
        'This is a sentence without a period.',
        'en',
      ),
    ).toBe('this is a sentence without a period')
    expect(preserveTranslationPresentation('VOU TESTAR', 'I will test.', 'en')).toBe('I WILL TEST')
    expect(
      preserveTranslationPresentation(
        'vou testar com DaFábrica4You',
        'I will test with DaFábrica4You.',
        'en',
      ),
    ).toBe('i will test with DaFábrica4You')
    expect(
      preserveTranslationPresentation('  texto sem ponto\n', 'Text without a period.', 'en'),
    ).toBe('  text without a period\n')
  })

  test('protected translation markup restores exact commercial values', () => {
    const prepared = prepareTranslationText(
      'DaFábrica4You entrega 3 unidades de 12 kg por 185,00 €',
    )
    expect(prepared.tokens).toEqual(['DaFábrica4You', '3', '12 kg', '185,00 €'])

    const translated =
      '<r><keep id="p0">wrong brand</keep> delivers <keep id="p1">three</keep> units of <keep id="p2">twelve kilograms</keep> for <keep id="p3">EUR 185</keep>.</r>'
    expect(restoreTranslationText(prepared, translated, 'en')).toBe(
      'DaFábrica4You delivers 3 units of 12 kg for 185,00 €',
    )

    const url = prepareTranslationText('consulte https://dafabrica4you.pt/loja.')
    expect(url.tokens).toEqual(['https://dafabrica4you.pt/loja'])
    expect(
      restoreTranslationText(url, '<r>see <keep id="p0">https://wrong.example</keep></r>', 'en'),
    ).toBe('see https://dafabrica4you.pt/loja.')
  })

  test('translation segmentation preserves authored line breaks and tabs exactly', () => {
    expect(splitTranslationText('linha um\n\n\tlinha dois')).toEqual([
      {kind: 'text', value: 'linha um'},
      {kind: 'literal', value: '\n'},
      {kind: 'literal', value: '\n'},
      {kind: 'literal', value: '\t'},
      {kind: 'text', value: 'linha dois'},
    ])
  })

  test('translation context includes website terminology and document copy without growing forever', () => {
    const context = buildTranslationContext([
      'Banco Gavião',
      'Banco para sentar em espaços exteriores.',
      'x'.repeat(20_000),
    ])
    expect(context).toContain('DaFábrica4You fabrica mobiliário urbano')
    expect(context).toContain('Banco Gavião')
    expect(context).toContain('Banco para sentar em espaços exteriores.')
    expect(context.length).toBeLessThanOrEqual(12_000)
  })
})

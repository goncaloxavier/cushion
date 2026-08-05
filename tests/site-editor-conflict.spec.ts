import {readFileSync} from 'node:fs'
import {expect, test} from '@playwright/test'
import {
  carryMachineOwned,
  editorContentSignature,
  editorSignatureMismatch,
  sameStoredContent,
} from '../src/lib/server/site-editor-conflict'

const blogFields = ['title', 'excerpt', 'gallery'] as const

const post = (overrides: Record<string, unknown> = {}) => ({
  _id: 'drafts.post-1',
  _type: 'blogPost',
  title: {_type: 'localizedString', pt: 'Decking em plástico reciclado'},
  excerpt: {_type: 'localizedText', pt: 'Resiste ao sol e à chuva.'},
  ...overrides,
})

const translated = (overrides: Record<string, unknown> = {}) =>
  post({
    title: {
      _type: 'localizedString',
      pt: 'Decking em plástico reciclado',
      en: 'Recycled plastic decking',
      es: 'Tarima de plástico reciclado',
      translationHash: 'hash-title',
    },
    excerpt: {
      _type: 'localizedText',
      pt: 'Resiste ao sol e à chuva.',
      en: 'Withstands sun and rain.',
      es: 'Resiste al sol y a la lluvia.',
      translationHash: 'hash-excerpt',
    },
    ...overrides,
  })

test.describe('editorContentSignature', () => {
  // The regression this whole module exists for: publishing fires the Sanity
  // webhook, the translator patches en/es seconds later, and the still-open
  // editor used to fail its very next autosave.
  test('a landing translation does not move the signature', () => {
    expect(editorContentSignature(translated(), blogFields)).toBe(
      editorContentSignature(post(), blogFields),
    )
  })

  test('a Portuguese edit does move the signature', () => {
    const edited = post({title: {_type: 'localizedString', pt: 'Outro título'}})
    expect(editorContentSignature(edited, blogFields)).not.toBe(
      editorContentSignature(post(), blogFields),
    )
  })

  test('key order does not affect the signature', () => {
    const reordered = {
      _type: 'blogPost',
      excerpt: {pt: 'Resiste ao sol e à chuva.', _type: 'localizedText'},
      title: {pt: 'Decking em plástico reciclado', _type: 'localizedString'},
    }
    expect(editorContentSignature(reordered, blogFields)).toBe(
      editorContentSignature(post(), blogFields),
    )
  })

  test('fields outside the editable set are ignored', () => {
    expect(editorContentSignature(post({internalNote: 'x'}), blogFields)).toBe(
      editorContentSignature(post(), blogFields),
    )
  })

  test('en/es are only stripped next to a pt sibling', () => {
    const withRealEsField = post({gallery: [{_key: 'a', es: 'not-a-translation'}]})
    const withoutIt = post({gallery: [{_key: 'a'}]})
    expect(editorContentSignature(withRealEsField, blogFields)).not.toBe(
      editorContentSignature(withoutIt, blogFields),
    )
  })

  test('an unknown document type yields no signature, so it can never match', () => {
    expect(editorContentSignature(post(), undefined)).toBe('')
  })
})

test.describe('carryMachineOwned', () => {
  test('keeps the server translation when the editor round-trips a stale copy', () => {
    const editorPayload = post({
      title: {
        _type: 'localizedString',
        pt: 'Decking em plástico reciclado',
        en: 'STALE',
        es: 'STALE',
        translationHash: 'stale-hash',
      },
    })
    const merged = carryMachineOwned(editorPayload, translated()) as ReturnType<typeof post>
    expect(merged.title).toEqual({
      _type: 'localizedString',
      pt: 'Decking em plástico reciclado',
      en: 'Recycled plastic decking',
      es: 'Tarima de plástico reciclado',
      translationHash: 'hash-title',
    })
  })

  test('keeps the editor Portuguese edit while carrying the old hash forward', () => {
    const edited = post({title: {_type: 'localizedString', pt: 'Título novo'}})
    const merged = carryMachineOwned(edited, translated()) as ReturnType<typeof post>
    const title = merged.title as Record<string, unknown>
    expect(title.pt).toBe('Título novo')
    // The hash now describes text that no longer exists, which is exactly the
    // signal translate-document.ts uses to re-translate the field.
    expect(title.translationHash).toBe('hash-title')
  })

  test('does not resurrect a translation the server no longer has', () => {
    const editorPayload = post({
      title: {_type: 'localizedString', pt: 'Decking em plástico reciclado', en: 'STALE'},
    })
    const merged = carryMachineOwned(editorPayload, post()) as ReturnType<typeof post>
    expect(merged.title).toEqual({
      _type: 'localizedString',
      pt: 'Decking em plástico reciclado',
    })
  })

  test('matches array entries by _key, not position', () => {
    const previous = post({
      gallery: [
        {_key: 'a', caption: {pt: 'Um', en: 'One'}},
        {_key: 'b', caption: {pt: 'Dois', en: 'Two'}},
      ],
    })
    const reordered = post({
      gallery: [{_key: 'b', caption: {pt: 'Dois'}}, {_key: 'a', caption: {pt: 'Um'}}],
    })
    const merged = carryMachineOwned(reordered, previous) as {
      gallery: Array<{_key: string; caption: Record<string, unknown>}>
    }
    expect(merged.gallery[0].caption.en).toBe('Two')
    expect(merged.gallery[1].caption.en).toBe('One')
  })

  test('leaves the payload alone when there is no previous document', () => {
    const created = post()
    expect(carryMachineOwned(created, undefined)).toEqual(created)
  })
})

test('the baseline describes the stored document, not a defaulted copy of it', () => {
  // A landing document with no navigation gets defaults filled in on load so the
  // editor has something to show. The signature is the baseline the next save is
  // compared against, so it has to describe what the server actually holds — sign
  // the defaulted copy instead and the first save fails a comparison against a
  // document that never existed, and the client is told to reload the page over a
  // default this code invented for them.
  const landingFields = ['navigation', 'home'] as const
  const stored = {
    _id: 'drafts.siteLanding',
    _type: 'siteLanding',
    home: {hero: {title: {_type: 'localizedString', pt: 'Início'}}},
  }
  const defaulted = {
    ...stored,
    navigation: [{_key: 'n1', label: {_type: 'localizedString', pt: 'Sobre'}, href: '/sobre-nos'}],
  }

  const storedSignature = editorContentSignature(stored, landingFields)

  // The two must differ — otherwise this test proves nothing about the ordering.
  expect(editorContentSignature(defaulted, landingFields)).not.toBe(storedSignature)

  // What the save path recomputes from the stored draft has to equal the baseline
  // the load handed the client.
  expect(editorContentSignature({...stored}, landingFields)).toBe(storedSignature)
})

test('a rejected save can name the field it disagreed about', () => {
  // The reason this exists: a rejection used to be a single bit — the hashes
  // matched or they did not — so telling a genuine concurrent edit from a fault
  // in our own baseline meant reproducing it by hand. Naming the field turns the
  // next occurrence into a log line.
  const stored = post({gallery: [{_key: 'g1', alt: {_type: 'localizedString', pt: 'Imagem'}}]})
  const sent = post({
    title: {_type: 'localizedString', pt: 'Outro título'},
    gallery: [{_key: 'g1', alt: {_type: 'localizedString', pt: 'Imagem'}}],
  })

  expect(editorSignatureMismatch(sent, stored, blogFields)).toEqual(['title'])

  // A translation landing must not read as a disagreement — that was the whole
  // point of hashing editor-owned content only.
  expect(editorSignatureMismatch(translated(), post(), blogFields)).toEqual([])

  // Identical documents disagree about nothing, so a rejection reporting "none"
  // is itself the finding: the check fired when it should not have.
  expect(editorSignatureMismatch(post(), post(), blogFields)).toEqual([])
})

test.describe('sameStoredContent', () => {
  // Autosave fires on more than real edits — opening a panel is enough — so a
  // save that changes nothing used to manufacture a draft identical to the
  // published document. Only publishing clears a draft, and there is nothing to
  // publish, so it stayed forever: a "por publicar" dot on all ten pages of the
  // site, and a stale draft shadowing published content in Presentation preview.
  const fields = ['title', 'excerpt', 'gallery'] as const

  test('a save that changes nothing is recognised as nothing to save', () => {
    expect(sameStoredContent(post(), post(), fields)).toBe(true)
  })

  test('key order is not a change', () => {
    // Sanity may hand back the same object with its keys in a different order.
    // Read as a difference, that alone would keep every draft alive forever.
    const ordered = {title: {pt: 'Um título', _type: 'localizedString'}, excerpt: {pt: 'Texto'}}
    const shuffled = {excerpt: {pt: 'Texto'}, title: {_type: 'localizedString', pt: 'Um título'}}
    expect(sameStoredContent(ordered, shuffled, fields)).toBe(true)
  })

  test('a real edit is never mistaken for a no-op', () => {
    expect(sameStoredContent(post(), post({title: {pt: 'Outro título'}}), fields)).toBe(false)
  })

  test('a field the save removed counts as a change', () => {
    const {excerpt: _removed, ...withoutExcerpt} = post()
    expect(sameStoredContent(post(), withoutExcerpt, fields)).toBe(false)
  })

  test('a translation the published document lacks is not thrown away', () => {
    // The looser editorContentSignature ignores en/es/translationHash by design,
    // which is right for conflict detection and wrong here: this decides whether
    // a draft gets deleted, and a draft holding a translation still holds
    // something worth keeping.
    const draft = post({title: {pt: 'Um título', en: 'A title'}})
    const published = post({title: {pt: 'Um título'}})
    expect(
      editorContentSignature(draft, fields),
      'the signature helper is expected to ignore the translation',
    ).toBe(editorContentSignature(published, fields))
    expect(
      sameStoredContent(draft, published, fields),
      'a draft carrying a translation was treated as safe to discard',
    ).toBe(false)
  })

  test('the schema annotation a save adds is not a change', () => {
    // Saving normalises _type onto every value it writes, and most published
    // content predates that. Counting it as a difference meant the first save on
    // almost any existing document left a draft behind for an annotation nobody
    // authored — which is exactly what this check exists to prevent.
    const draft = post({summary: {_type: 'localizedText', pt: 'Texto'}})
    const published = post({summary: {pt: 'Texto'}})
    expect(sameStoredContent(draft, published, [...fields, 'summary'])).toBe(true)
  })

  test('_key is still compared, so array identity is not weakened', () => {
    // Ignoring _type must not spill into ignoring the keys that tell array
    // entries apart — reordering or replacing one is a real edit.
    const a = post({gallery: [{_key: 'one', alt: 'A'}]})
    const b = post({gallery: [{_key: 'two', alt: 'A'}]})
    expect(sameStoredContent(a, b, fields)).toBe(false)
  })

  test('fields outside the editable set never decide it', () => {
    // _rev and _updatedAt always differ between a draft and its published twin.
    // Comparing whole documents would mean no draft is ever collectable.
    expect(
      sameStoredContent(
        {...post(), _rev: 'aaa', _updatedAt: '2026-07-30T23:24:16Z'},
        {...post(), _rev: 'bbb', _updatedAt: '2026-07-30T23:13:04Z'},
        fields,
      ),
    ).toBe(true)
  })

  test('a document with nothing to compare against is never collectable', () => {
    // A draft that has never been published has no published twin, so there is
    // no version to fall back to and it must survive.
    expect(sameStoredContent(post(), null, fields)).toBe(false)
    expect(sameStoredContent(post(), undefined, fields)).toBe(false)
  })
})

test('both save paths refuse to leave a draft that matches the published document', () => {
  // The helper above is only worth having if the save path consults it on both
  // routes: patching an existing draft, and creating one that did not exist.
  // The second is how the stale drafts were born.
  const save = readFileSync('src/lib/server/site-editor.ts', 'utf8')
  const body = save.slice(save.indexOf('export const saveSiteEditorDocument'))

  const patchPath = body.slice(body.indexOf('if (draft) {'), body.indexOf('const source = published'))
  expect(patchPath, 'an existing draft is patched without checking it still differs').toContain(
    'sameStoredContent',
  )
  // Deleting a draft has to carry the same revision guard the patch does, or a
  // concurrent edit is discarded instead of losing the race.
  expect(patchPath, 'the draft is deleted without a revision guard').toContain('ifRevisionId')
  expect(patchPath).toContain('.delete(draftId)')

  const createPath = body.slice(body.indexOf('const source = published'))
  expect(createPath, 'a no-op save still creates a draft').toContain('sameStoredContent')
  expect(
    createPath.indexOf('sameStoredContent'),
    'the check runs after the draft content is assembled, or it compares the wrong thing',
  ).toBeLessThan(createPath.indexOf('client.create'))
})

test('publishing a document with nothing pending is not an error', () => {
  // Once no-op saves stopped manufacturing drafts, pressing Publicar on an
  // unchanged document had no draft to promote, and Sanity's raw "document with
  // the ID drafts.siteContent was not found (traceId: …)" reached the client.
  // The save already reports this by handing back the published document rather
  // than a draft.
  const source = readFileSync('src/lib/server/site-editor.ts', 'utf8')
  const publish = source.slice(source.indexOf('export const publishSiteEditorDocument'))
  const body = publish.slice(0, publish.indexOf('\n}\n'))

  const guard = body.indexOf('isDraft(saved._id)')
  expect(guard, 'publish never checks whether the save left anything to publish').toBeGreaterThan(-1)
  expect(
    guard,
    'the check runs after the publish action, which is where the error came from',
  ).toBeLessThan(body.indexOf('sanity.action.document.publish'))
})

test.describe('editor sidebar', () => {
  // Reimplements the filter so the rule can be tested without mounting React.
  // Kept honest by the source assertions at the end.
  const searchable = (value: string) =>
    value
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLocaleLowerCase('pt')

  type Node = {id: string; title: string; parentId?: string}
  const nodes: Node[] = [
    {id: 'collection-blog', title: 'Artigos do Blog'},
    {id: 'a', title: 'O que aconteceria se todas as árvores do mundo desaparecessem?', parentId: 'collection-blog'},
    {id: 'b', title: 'Compostagem caseira', parentId: 'collection-blog'},
    {id: 'c', title: 'Consumo de plástico', parentId: 'collection-blog'},
  ]

  const filter = (query: string) => {
    const q = searchable(query.trim())
    if (!q) return nodes
    const matched = new Set(nodes.filter((n) => searchable(n.title).includes(q)).map((n) => n.id))
    const parents = new Set(
      nodes.filter((n) => n.parentId && matched.has(n.id)).map((n) => n.parentId as string),
    )
    return nodes.filter((n) => matched.has(n.id) || parents.has(n.id))
  }

  test('searching for one article does not return the whole collection', () => {
    // The collection header used to be folded in with the matches, which made
    // every sibling match too — so searching returned all 56 posts and the
    // filter looked broken. It was: you could not reach a post by name.
    const found = filter('desaparecessem')
    expect(found.map((node) => node.id)).toEqual(['collection-blog', 'a'])
  })

  test('accents are not required to find an accented title', () => {
    // Nobody types the accent when searching for something they know is there.
    expect(filter('arvores').map((node) => node.id)).toEqual(['collection-blog', 'a'])
    expect(filter('plastico').map((node) => node.id)).toEqual(['collection-blog', 'c'])
  })

  test('the sidebar and the manifest implement those two rules', () => {
    const sidebar = readFileSync('src/lib/site-editor/editor/SiteEditorSidebar.tsx', 'utf8')
    expect(sidebar, 'accents are still compared literally').toContain('normalize(\'NFD\')')
    expect(
      sidebar,
      'the collection header is folded back in with the matches, which matches every sibling',
    ).toContain('parentsOfMatches')

    const manifest = readFileSync('src/lib/server/site-editor.ts', 'utf8')
    expect(
      manifest,
      'articles are still listed alphabetically rather than newest first',
    ).toContain("definition.type === 'blogPost'")
  })
})

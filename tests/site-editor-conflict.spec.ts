import {expect, test} from '@playwright/test'
import {carryMachineOwned, editorContentSignature} from '../src/lib/server/site-editor-conflict'

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

import {expect, test} from '@playwright/test'
import {contentFromSanity} from '../src/lib/site-content'

test('home sections survive the Sanity content pipeline', async () => {
  const section = {
    _type: 'builderCtaSection',
    _key: 'k1',
    title: {pt: 'Secção livre da página inicial'},
    enabled: true,
  }
  const built = contentFromSanity({
    siteContent: {home: {sections: [section]}},
  } as never)
  expect(built.pt.home.sections).toHaveLength(1)
  expect(built.pt.home.sections[0]).toMatchObject({_type: 'builderCtaSection', _key: 'k1'})
  // Absent in Sanity must mean an empty array, never undefined — the page
  // guards on .length.
  const empty = contentFromSanity({siteContent: {home: {}}} as never)
  expect(empty.pt.home.sections).toEqual([])
})

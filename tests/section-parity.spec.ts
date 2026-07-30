import {expect, test, type Page} from '@playwright/test'
import {readFileSync} from 'node:fs'
import {legacyProductContentSectionsToBuilder} from '../src/lib/builder/product-sections'

// The rule this file exists to hold: converting a designed block into a section
// must not change what the visitor gets. If these drift, the section system has
// become a downgrade and nobody will use it.
const cardShape = (page: Page, scope: string) =>
  page.evaluate((selector) => {
    const card = document.querySelector(`${selector} .collection-card`)
    const image = card?.querySelector('img')
    if (!card || !image) return null
    return {
      hasReveal: Boolean(card.closest('.reveal')),
      // srcset is only emitted for Sanity-hosted images; the local dataset
      // serves static fallbacks, so presence here would assert the environment
      // rather than the component. `sizes` is unconditional and covers the
      // same wiring.
      hasSizes: Boolean(image.getAttribute('sizes')),
      lazy: image.getAttribute('loading'),
      decoding: image.getAttribute('decoding'),
      hasViewTransition: Boolean(
        (image as HTMLElement).style.getPropertyValue('view-transition-name'),
      ),
      aspectRatio: getComputedStyle(card.querySelector('.collection-card-media')!).aspectRatio,
    }
  }, scope)

test('the home grid card carries the full designed treatment', async ({page}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chrome', 'Parity check runs once')
  await page.goto('/?lang=pt')
  await page.waitForTimeout(1200)

  const shape = await cardShape(page, '.home-solutions-grid')
  expect(shape, 'no collection card rendered on the home grid').not.toBeNull()
  // Each of these was silently missing from the builder's own card before the
  // two were merged into one component.
  expect(shape!.hasReveal).toBe(true)
  expect(shape!.hasSizes).toBe(true)
  expect(shape!.lazy).toBe('lazy')
  expect(shape!.decoding).toBe('async')
  expect(shape!.hasViewTransition).toBe(true)
  expect(shape!.aspectRatio).toBe('4 / 5')
})

test('the builder list section and the home grid render the same card', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chrome', 'Parity check runs once')
  await page.goto('/?lang=pt')
  await page.waitForTimeout(1200)

  // Both call sites must resolve to one component. Comparing the rendered shape
  // is what catches a future edit to one path that forgets the other — the exact
  // drift that made converting a block into a section a visible downgrade.
  const usesSharedCard = await page.evaluate(() => {
    const home = document.querySelector('.home-solutions-grid .collection-card')
    return {
      homeUsesShared: Boolean(home),
      // The old private markup is gone for good; if it comes back, the two
      // renderings have forked again.
      legacyHomeCard: document.querySelectorAll('.home-solution-card').length,
      legacyBuilderAnchor: document.querySelectorAll('.builder-collection > a').length,
    }
  })

  expect(usesSharedCard.homeUsesShared).toBe(true)
  expect(usesSharedCard.legacyHomeCard).toBe(0)
  expect(usesSharedCard.legacyBuilderAnchor).toBe(0)
})

test('legacy landing content is normalized into the same designed section renderer', () => {
  const home = readFileSync('src/routes/+page.svelte', 'utf8')
  const renderer = readFileSync('src/lib/components/builder/BuilderPageRenderer.svelte', 'utf8')
  expect(home).toContain('buildLocalizedHomeSections')
  expect(home).toContain('content.home.sections.length')
  expect(home).toContain('ManagedPageComposition')

  for (const component of [
    'LandingCollectionSection',
    'LandingImpactSection',
    'LandingPartnersSection',
  ]) {
    expect(renderer, `section renderer no longer uses ${component}`).toContain(component)
  }
})

test('every section the picker offers has a renderer that draws it', () => {
  const picker = readFileSync('src/lib/site-editor/editor/SitePageSectionsEditor.tsx', 'utf8')
  const renderer = readFileSync('src/lib/components/builder/BuilderPageRenderer.svelte', 'utf8')

  const offered = [...picker.matchAll(/value: '(builder[A-Za-z]+)'/g)].map((match) => match[1])
  const rendered = new Set(
    [...renderer.matchAll(/section\._type === '(builder[A-Za-z]+)'/g)].map((match) => match[1]),
  )

  expect(offered.length, 'no section types found in the picker').toBeGreaterThan(0)
  // A type offered without a branch falls through to the heading-only fallback
  // and lands on the page as a blank band — the client added one and it simply
  // did not appear. The editor and the page must offer the same set.
  for (const type of offered) {
    expect(rendered.has(type), `${type} is offered in the editor but never rendered`).toBe(true)
  }
})

test('every legacy product block survives the trip into the section editor', () => {
  // Exactly what a client-created, not-yet-filled-in block looks like in the
  // live dataset: no image, no video, every text field blank. It used to be
  // discarded on the way into the editor, so the editor listed fewer sections
  // than the document held and the next save would have deleted it.
  const emptyBlock = {
    _key: 'empty-block',
    _type: 'productContentSection',
    buttonLabel: {_type: 'localizedString', pt: ''},
    buttonUrl: '',
    image: null,
    label: {_type: 'localizedString', pt: ''},
    labelStyle: 'caption',
    mediaKind: 'image',
    mediaSide: 'left',
    poster: null,
    surface: 'white',
    text: {_type: 'localizedText', pt: ''},
    title: {_type: 'localizedString', pt: ''},
    video: {kind: 'youtube', youtubeUrl: ''},
    videoTitle: {_type: 'localizedString', pt: ''},
  }

  const converted = legacyProductContentSectionsToBuilder([emptyBlock])
  expect(converted, 'a block the client created was dropped').toHaveLength(1)
  expect(converted[0]._key).toBe('empty-block')
  // It also needs a name in the list, or it is an unlabelled row nobody can act on.
  expect(converted[0].internalLabel?.trim()).toBeTruthy()
  // The full-bleed product layout is built around media it does not have.
  expect((converted[0] as {variant?: string}).variant).toBeUndefined()
})

test('a page core is edited in one place, not two', async ({page}, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chrome', 'Editor contract runs once')
  await page.setExtraHTTPHeaders({
    'x-df4y-site-editor-e2e': 'df4y-playwright-site-editor',
    'x-df4y-site-editor-scope': `core-once-${Date.now()}`,
  })
  await page.goto('/painel/site')
  await expect(page.locator('.site-editor-shell')).toBeVisible({timeout: 15_000})

  await page.getByRole('button', {name: 'Abrir definições'}).click()
  const settings = page.locator('.site-editor-drawer.is-settings')
  const panelIndex = settings.locator('.site-editor-panel-index > button')
  const panelLabels = (await panelIndex.locator('strong').allInnerTexts()).map((t) => t.trim())

  // No panel may share a name with another in the same index.
  expect(new Set(panelLabels).size, `duplicate panel names: ${panelLabels}`).toBe(panelLabels.length)

  // The page's designed block is edited in its own panel and is not listed
  // among the sections. Listing it too put one block under two names in two
  // places, which is what this asserts can no longer happen.
  await panelIndex.filter({hasText: 'Conteúdo da página'}).click()
  const listed = (
    await settings.locator('.site-editor-section-list > article strong').allInnerTexts()
  ).map((t) => t.trim())
  for (const label of panelLabels) {
    expect(listed, `"${label}" is both a panel and a section entry`).not.toContain(label)
  }
})

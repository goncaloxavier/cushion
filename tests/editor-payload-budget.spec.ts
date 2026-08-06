import {readFileSync, readdirSync, statSync, existsSync} from 'node:fs'
import {join} from 'node:path'
import {expect, test} from '@playwright/test'

/**
 * What the editor makes a person download before it will open.
 *
 * Measured rather than assumed: on the production build the shell appears in a
 * median 174ms locally and the initial payload is roughly 850KB of JavaScript,
 * which brotli serves in about a quarter of that. The rich-text editor -- slate
 * and the Portable Text stack, about a megabyte across two chunks -- is *not*
 * part of it, because ArticleWorkspace is loaded through React.lazy and only
 * fetched when the client opens an article.
 *
 * That is one careless `import` away from regressing, and nothing would fail:
 * the editor would still work, still pass every test, and simply take a
 * megabyte longer to appear for a client already telling us it feels slow. So
 * the shape of the build is asserted here rather than its timing, which is what
 * makes it stable enough to keep.
 *
 * Reads the build output, so it needs `npm run build` to have run. It skips
 * rather than fails when there is none, because a developer running a single
 * spec should not be told their editor is broken.
 */
const clientDir = '.svelte-kit/output/client'
const manifestPath = join(clientDir, '.vite/manifest.json')
const chunkDir = join(clientDir, '_app/immutable/chunks')

const built = existsSync(manifestPath) && existsSync(chunkDir)

// The editor's own chunk, found by content rather than by name: the hashed
// filenames change on every build, so anything hardcoded would rot immediately.
const chunkContaining = (marker: string) =>
  readdirSync(chunkDir)
    .filter((name) => name.endsWith('.js'))
    .map((name) => ({name, path: join(chunkDir, name)}))
    .filter((file) => readFileSync(file.path, 'utf8').includes(marker))

test.describe('editor payload budget', () => {
  test.skip(!built, 'Needs a production build (npm run build)')

  test('the rich text editor stays out of the initial editor load', () => {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as Record<
      string,
      {file: string; isDynamicEntry?: boolean}
    >
    const workspace = manifest['src/lib/site-editor/editor/ArticleWorkspace.tsx']
    expect(workspace, 'ArticleWorkspace is no longer its own entry in the build').toBeTruthy()
    expect(
      workspace!.isDynamicEntry,
      'ArticleWorkspace is no longer a dynamic entry, so slate and the Portable Text stack now load with the editor shell instead of when an article is opened',
    ).toBe(true)
  })

  test('slate is not bundled into the chunk that boots the editor', () => {
    const editorChunks = chunkContaining('site-editor-shell')
    expect(editorChunks.length, 'no chunk carries the editor shell').toBeGreaterThan(0)

    for (const chunk of editorChunks) {
      const source = readFileSync(chunk.path, 'utf8')
      const slateHits = (source.match(/slate/g) ?? []).length
      // A handful of incidental matches are fine; the bundled library is not.
      expect(
        slateHits,
        `${chunk.name} boots the editor and contains slate ${slateHits} times, which means the rich text editor is being downloaded before it is needed`,
      ).toBeLessThan(10)
    }
  })

  test('the editor chunk stays within its size budget', () => {
    const editorChunks = chunkContaining('site-editor-shell')
    const largest = editorChunks
      .map((chunk) => ({name: chunk.name, kb: statSync(chunk.path).size / 1024}))
      .sort((a, b) => b.kb - a.kb)[0]!

    // Measured at ~176KB. The ceiling leaves room to work in and still fails
    // long before a megabyte of editor library lands in it by accident.
    expect(
      Math.round(largest.kb),
      `${largest.name} is ${Math.round(largest.kb)}KB, over the 400KB budget for the chunk that boots the editor`,
    ).toBeLessThan(400)
  })
})

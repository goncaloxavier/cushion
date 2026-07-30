import {expect, test, type TestInfo} from '@playwright/test'

const e2eKey = 'df4y-playwright-site-editor'
// 400x100 — a 4:1 strip, so any forced ratio shows up plainly in the numbers.
const widePng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZAAAABkCAIAAAAnqfEgAAABZklEQVR4nO3UQQ0AIBDAsNOEHJQgHwv8yJImFbDXZp0NkDDfCwAeGRaQYVhAhmEBGYYFZBgWkGFYQIZhARmGBWQYFpBhWECGYQEZhgVkGBaQYVhAhmEBGYYFZBgWkGFYQIZhARmGBWQYFpBhWECGYQEZhgVkGBaQYVhAhmEBGYYFZBgWkGFYQIZhARmGBWQYFpBhWECGYQEZhgVkGBaQYVhAhmEBGYYFZBgWkGFYQIZhARmGBWQYFpBhWECGYQEZhgVkGBaQYVhAhmEBGYYFZBgWkGFYQIZhARmGBWQYFpBhWECGYQEZhgVkGBaQYVhAhmEBGYYFZBgWkGFYQIZhARmGBWQYFpBhWECGYQEZhgVkGBaQYVhAhmEBGYYFZBgWkGFYQIZhARmGBWQYFpBhWECGYQEZhgVkGBaQYVhAhmEBGYYFZBgWkGFYQIZhARmGBWQYFpBhWECGYQEZhgVkGBaQYVhAxgX3+7pDysVguQAAAABJRU5ErkJggg=='

test('builder media renders an image at its own proportions', async ({page}, testInfo: TestInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chrome', 'Stylesheet check runs once')
  await page.setExtraHTTPHeaders({
    'x-df4y-site-editor-e2e': e2eKey,
    'x-df4y-site-editor-scope': `builder-media-${Date.now()}`,
  })
  // Any page that mounts BuilderPageRenderer pulls in builder-renderer.css, so a
  // synthetic figure is styled by the real rule. The fixture page has no media
  // section of its own to measure.
  await page.goto('/painel/site/e2e-preview?fixture=product&lang=pt')
  await page.evaluate(async (src) => {
    const figure = document.createElement('figure')
    figure.className = 'builder-media'
    figure.style.width = '600px'
    const image = document.createElement('img')
    image.src = src
    figure.appendChild(image)
    document.body.appendChild(figure)
    await image.decode()
  }, widePng)

  const box = await page.locator('.builder-media > img').boundingBox()
  // Previously this rule pinned every image to 4/3 at width:100% with no
  // object-fit, so the browser's default `fill` stretched this strip from
  // 600x150 to 600x450. The ratio is the whole point of the assertion.
  expect(box!.width / box!.height).toBeCloseTo(4, 1)
})

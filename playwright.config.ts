import {defineConfig} from '@playwright/test'

const port = Number(process.env.PLAYWRIGHT_PORT ?? 4173)
const baseURL = `http://127.0.0.1:${port}`
const browserChannel = process.env.PLAYWRIGHT_CHANNEL ?? (process.env.CI ? undefined : 'chrome')
const siteEditorE2eKey = 'df4y-playwright-site-editor'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  timeout: 20_000,
  workers: process.env.CI ? 2 : 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  preserveOutput: 'failures-only',
  reporter: [['list']],
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${port}`,
    env: {
      ...process.env,
      SANITY_DISABLE_REMOTE: 'true',
      SITE_EDITOR_E2E: 'true',
      SITE_EDITOR_E2E_KEY: siteEditorE2eKey,
      BUILDER_PREVIEW_SECRET: 'df4y-playwright-preview-only',
      PREVIEW_ADMIN_ENABLED: 'false',
    },
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  expect: {
    timeout: 5_000,
    toHaveScreenshot: {
      animations: 'disabled',
      maxDiffPixelRatio: 0.025,
    },
  },
  use: {
    baseURL,
    ...(browserChannel ? {channel: browserChannel} : {}),
    colorScheme: 'light',
    reducedMotion: 'reduce',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    extraHTTPHeaders: {
      'x-df4y-site-editor-e2e': siteEditorE2eKey,
    },
  },
  projects: [
    {
      name: 'desktop-chrome',
      use: {
        viewport: {width: 1280, height: 720},
      },
    },
    {
      name: 'mobile-chrome',
      use: {
        isMobile: true,
        viewport: {width: 390, height: 844},
      },
    },
  ],
})

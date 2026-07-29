import {defineConfig} from '@playwright/test'

const port = Number(process.env.PLAYWRIGHT_PORT ?? 4173)
const baseURL = `http://127.0.0.1:${port}`
const browserChannel = process.env.PLAYWRIGHT_CHANNEL ?? (process.env.CI ? undefined : 'chrome')
const siteEditorE2eKey = 'df4y-playwright-site-editor'

// The whole suite runs against in-code fixtures, which is what keeps it fast and
// offline — but it also means no test had ever seen the content the client
// actually publishes. Two live bugs walked straight through a green suite that
// way. This second server reads the real dataset (published documents only, over
// the public CDN, no token) so `live-content.spec.ts` can sweep every page a
// visitor can reach. It is deliberately the only suite pointed at it.
const livePort = Number(process.env.PLAYWRIGHT_LIVE_PORT ?? 4174)
const liveBaseURL = `http://127.0.0.1:${livePort}`
const liveContentFile = /live-content\.spec\.ts/

const serverEnv = {
  ...process.env,
  // Browser tests must never contact the live transactional-email provider.
  // Server routes still exercise their explicit "email unavailable" branch.
  RESEND_API_KEY: '',
  EMAIL_FROM: '',
  ORDERS_TO_EMAIL: '',
  CONTACTS_TO_EMAIL: '',
}

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  timeout: 20_000,
  workers: process.env.CI ? 2 : 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  preserveOutput: 'failures-only',
  reporter: [['list']],
  webServer: [
    {
      command: `npm run dev -- --host 127.0.0.1 --port ${port}`,
      env: {
        ...serverEnv,
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
    {
      // Reads the live dataset. Nothing here writes: the suite only issues GETs,
      // and no write token is provided, so it cannot touch the client's content.
      command: `npm run dev -- --host 127.0.0.1 --port ${livePort}`,
      env: {
        ...serverEnv,
        SANITY_DISABLE_REMOTE: 'false',
        // The viewer token is left in place on purpose. Draft content is what the
        // client sees in the editor, and it is where both of the bugs that reached
        // them actually lived — a published-only sweep would have missed each one.
        SITE_EDITOR_E2E: 'false',
        PREVIEW_ADMIN_ENABLED: 'false',
      },
      url: liveBaseURL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
  expect: {
    timeout: process.env.CI ? 10_000 : 5_000,
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
      testIgnore: liveContentFile,
      use: {
        viewport: {width: 1280, height: 720},
      },
    },
    {
      name: 'mobile-chrome',
      testIgnore: liveContentFile,
      use: {
        isMobile: true,
        viewport: {width: 390, height: 844},
      },
    },
    {
      name: 'live-content',
      testMatch: liveContentFile,
      // Sweeping every published page takes longer than a single-page test.
      timeout: 120_000,
      use: {
        baseURL: liveBaseURL,
        viewport: {width: 1280, height: 720},
        // The editor fixture header does not apply to the live server and would
        // only be misleading here.
        extraHTTPHeaders: {},
      },
    },
  ],
})

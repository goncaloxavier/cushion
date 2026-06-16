import {defineConfig} from '@playwright/test'

const port = Number(process.env.PLAYWRIGHT_PORT ?? 4173)
const baseURL = `http://127.0.0.1:${port}`

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  timeout: 20_000,
  workers: process.env.CI ? 2 : 4,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  preserveOutput: 'failures-only',
  reporter: [['list']],
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${port}`,
    env: {
      ...process.env,
      SANITY_DISABLE_REMOTE: 'true',
    },
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  expect: {
    timeout: 5_000,
    toHaveScreenshot: {
      animations: 'disabled',
      maxDiffPixelRatio: 0.01,
    },
  },
  use: {
    baseURL,
    channel: process.env.PLAYWRIGHT_CHANNEL ?? 'chrome',
    colorScheme: 'light',
    reducedMotion: 'reduce',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
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

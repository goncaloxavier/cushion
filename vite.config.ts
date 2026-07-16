import {sveltekit} from '@sveltejs/kit/vite'
import {defineConfig, loadEnv} from 'vite'

export default defineConfig(({mode}) => {
  // db.ts/email.ts/payment.ts read plain process.env (not $env/dynamic/private)
  // so they stay importable from Node-side tests outside a SvelteKit request.
  // Vite's dev server never copies .env into process.env on its own, so
  // without this, DATABASE_URL/RESEND_API_KEY etc. are only visible to
  // SvelteKit-aware code and checkout/account silently report "not
  // configured" locally. Real environment variables (CI, Railway) still win.
  const fileEnv = loadEnv(mode, process.cwd(), '')
  for (const [key, value] of Object.entries(fileEnv)) {
    if (process.env[key] === undefined) process.env[key] = value
  }

  return {
    plugins: [sveltekit()],
  }
})

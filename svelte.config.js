import adapter from '@sveltejs/adapter-node'

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter(),
    csp: {
      mode: 'auto',
      directives: {
        'default-src': ['self'],
        'script-src': ['self'],
        // Svelte's dynamic style: bindings (lqip backgrounds, view-transition
        // names) render as inline style="" attributes with no way to hash
        // them per-instance, so style-src needs 'unsafe-inline'.
        'style-src': ['self', 'unsafe-inline'],
        // Sanity-hosted images, plus data: for inline lqip background blurs.
        'img-src': ['self', 'https://cdn.sanity.io', 'data:'],
        // Sanity-hosted gallery videos (Loja + Produtos). Without this,
        // media-src falls back to default-src 'self' and browsers block the
        // cross-origin <video src> with a CSP "URL safety check" error.
        'media-src': ['self', 'https://cdn.sanity.io'],
        'font-src': ['self'],
        // Presentation/Visual Editing only uses these in the embedded Studio
        // workflow, but keeping the allowlist explicit means CSP does not
        // break editors while public visitors still have a narrow policy.
        'connect-src': ['self', 'https://*.api.sanity.io', 'https://*.sanity.io'],
        'frame-src': ['self', 'https://www.youtube-nocookie.com'],
        'frame-ancestors': ['self', 'http://localhost:3333', 'https://dafabrica4you.sanity.studio'],
        'object-src': ['none'],
        'base-uri': ['self'],
        'form-action': ['self'],
      },
    },
  },
}

export default config

import studio from '@sanity/eslint-config-studio'

export default [
  {
    ignores: [
      '.svelte-kit/**',
      '.sanity/**',
      'build/**',
      'dist/**',
      'node_modules/**',
      'playwright-report/**',
      'test-results/**',
    ],
  },
  ...studio,
]

import studio from '@sanity/eslint-config-studio'

export default [
  {
    ignores: ['.svelte-kit/**', 'build/**', 'dist/**', 'node_modules/**'],
  },
  ...studio,
]

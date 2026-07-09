if (process.env.SANITY_ALLOW_WRITE !== 'true') {
  console.error(
    [
      'Refusing to write to Sanity without SANITY_ALLOW_WRITE=true.',
      'These commands can replace published Content Lake documents, so run them deliberately.',
    ].join('\n'),
  )
  process.exit(1)
}

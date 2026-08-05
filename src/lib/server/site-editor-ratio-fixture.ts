/**
 * The shapes a client can actually upload, laid out as product-feature sections
 * so a snapshot can show what each one does to the frame beside it.
 *
 * This exists because the same section broke three times on image proportions:
 * a hardcoded 16:9 frame, a copy card stretched to the image, and a frame that
 * read the ratio only when `kind` said 'image'. Each was found by a client
 * looking at his own page, not by the suite — every one of them is invisible to
 * an assertion about content and obvious in a picture.
 *
 * The asset references are synthetic. Only their dimensions are ever read: the
 * frame takes its ratio from the reference string, and the test serves an image
 * of exactly those dimensions in place of the CDN.
 */
export const ratioFixtureAssets = [
  {ref: 'image-ra7e01a0a1b2c3d4e5f60718293a4b5c6d7e8f901-1080x1920-png', label: 'Vertical 9:16'},
  {ref: 'image-ra7e01a0a1b2c3d4e5f60718293a4b5c6d7e8f902-1200x1600-png', label: 'Vertical 3:4'},
  {ref: 'image-ra7e01a0a1b2c3d4e5f60718293a4b5c6d7e8f903-1200x1200-png', label: 'Quadrada 1:1'},
  {ref: 'image-ra7e01a0a1b2c3d4e5f60718293a4b5c6d7e8f904-1920x1080-png', label: 'Horizontal 16:9'},
  {ref: 'image-ra7e01a0a1b2c3d4e5f60718293a4b5c6d7e8f905-2400x800-png', label: 'Panorama 3:1'},
] as const

const localizedString = (value: string) => ({_type: 'localizedString', pt: value, en: value, es: value})
const localizedText = (value: string) => ({_type: 'localizedText', pt: value, en: value, es: value})

const shortBody =
  'Quatro linhas de texto, o comprimento habitual de uma secção escrita pelo cliente.'
const longBody =
  'Um parágrafo bem mais longo do que a imagem ao lado consegue acompanhar, para que o caso ' +
  'inverso fique visível: quando o texto é o lado mais alto, é a imagem que passa a centrar-se ' +
  'contra ele. Sem isto, só se via metade do comportamento e a outra metade partia sem aviso. ' +
  'O cartão cresce com o texto e a imagem mantém as suas proporções.'

type MediaOverrides = {kind?: string; videoFile?: unknown; youtubeUrl?: string}

const section = (
  key: string,
  title: string,
  ref: string | undefined,
  mediaSide: 'left' | 'right',
  body: string,
  overrides: MediaOverrides = {kind: 'image'},
) => ({
  _key: key,
  _type: 'builderMediaSection',
  variant: 'product-feature',
  enabled: true,
  internalLabel: title,
  mediaSide,
  labelStyle: 'caption',
  eyebrow: localizedString(title),
  title: localizedString(title),
  body: localizedText(body),
  layout: {_type: 'builderLayout', surface: 'white'},
  media: {
    _type: 'builderMedia',
    ...overrides,
    ...(ref ? {image: {_type: 'image', asset: {_type: 'reference', _ref: ref}}} : {}),
    alt: localizedString(title),
    fit: 'contain',
    position: 'center',
  },
})

/**
 * A gallery holding two portrait images, which is what the client built. It
 * renders through StoreMediaGallery when the section presents as a gallery and
 * has media, and falls back to a plain column grid otherwise -- and those two
 * look nothing alike, so which one appears is worth a picture on both surfaces.
 */
const gallerySection = (key: string, title: string, refs: readonly string[]) => ({
  _key: key,
  _type: 'builderGallerySection',
  enabled: true,
  internalLabel: title,
  title: localizedString(title),
  presentation: 'gallery',
  layout: {_type: 'builderLayout', surface: 'white', columns: 3},
  items: refs.map((ref, index) => ({
    _key: `${key}-item-${index + 1}`,
    _type: 'builderMedia',
    kind: 'image',
    fit: 'contain',
    position: 'center',
    alt: localizedString(`${title} ${index + 1}`),
    image: {_type: 'image', asset: {_type: 'reference', _ref: ref}},
  })),
})

export const ratioFixturePage = () => ({
  _id: 'sitePage.ratio-fixture',
  _type: 'sitePage',
  _createdAt: '2026-07-14T12:00:00.000Z',
  _updatedAt: '2026-07-14T12:00:00.000Z',
  _rev: 'fixture-ratios-1',
  editorVersion: 1,
  title: 'Proporções de imagem',
  route: '/proporcoes',
  active: true,
  sections: [
    ...ratioFixtureAssets.map((asset, index) =>
      section(
        `ratio-${index + 1}`,
        asset.label,
        asset.ref,
        index % 2 === 0 ? 'left' : 'right',
        shortBody,
      ),
    ),
    // The copy is the taller side here, so the image centres against it.
    section('ratio-long-copy', 'Texto mais alto que a imagem', ratioFixtureAssets[4].ref, 'left', longBody),
    // The two shapes that regressed. Both render an image; neither says so in
    // the way the frame used to demand, and both used to land in a 16:9 crop.
    section('ratio-no-kind', 'Sem tipo definido', ratioFixtureAssets[0].ref, 'right', shortBody, {}),
    section('ratio-stale-video-kind', 'Tipo vídeo sem ficheiro', ratioFixtureAssets[1].ref, 'left', shortBody, {
      kind: 'video',
    }),
    // Two portrait images, exactly the shape the client built.
    gallerySection('gallery-two-portraits', 'Galeria', [
      ratioFixtureAssets[0].ref,
      ratioFixtureAssets[1].ref,
    ]),
    // The gallery he left empty, which showed nothing at all on the page.
    gallerySection('gallery-empty', 'Galeria vazia', []),
  ],
})

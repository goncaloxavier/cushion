import {expect, test} from '@playwright/test'
import {builderImageAspectRatio, builderMediaImageRef} from '../src/lib/builder/media'

/**
 * The product-feature frame takes its shape from the image it holds. It reads
 * that image through builderMediaImageRef, and BuilderMedia renders through the
 * same rule, so the two can only ever agree if this function is the single
 * answer to "what is actually showing here".
 *
 * The client hit this twice. First the frame was pinned at 16:9; then it read
 * the ratio only when kind === 'image', which is stricter than BuilderMedia and
 * stricter than the section editor, both of which treat an image as an image
 * whether or not the kind says so.
 */
const portrait = 'image-12276bc6898b9a19e83cf23dcf8bd937ecbfece3-1080x1920-png'
const landscape = 'image-1d8e5b38b2213aef5d0e244c56d60c0bbc70c9e1-4000x3000-jpg'

test('an image with no kind is still an image', () => {
  // Exactly the shape that cropped the client's composter: a real image asset
  // on a media object that never got a kind.
  expect(builderMediaImageRef({image: {asset: {_ref: portrait}}})).toBe(portrait)
  expect(builderImageAspectRatio(builderMediaImageRef({image: {asset: {_ref: portrait}}}))).toBeCloseTo(
    0.5625,
    4,
  )
})

test('an explicit image kind reads the same asset', () => {
  expect(builderMediaImageRef({kind: 'image', image: {asset: {_ref: landscape}}})).toBe(landscape)
})

test('a video or embed with something to play wins over the image', () => {
  expect(
    builderMediaImageRef({
      kind: 'video',
      videoFile: {asset: {_ref: 'file-abc-mp4'}},
      image: {asset: {_ref: portrait}},
    }),
  ).toBeUndefined()
  expect(
    builderMediaImageRef({
      kind: 'youtube',
      youtubeUrl: 'https://youtu.be/abc',
      image: {asset: {_ref: portrait}},
    }),
  ).toBeUndefined()
})

test('a video kind with nothing to play falls back to the image, as the renderer does', () => {
  // BuilderMedia's video branch needs a playable file, so an abandoned video
  // kind still renders the image. The frame has to follow it there too, or the
  // section goes back to cropping inside a 16:9 box.
  expect(builderMediaImageRef({kind: 'video', image: {asset: {_ref: portrait}}})).toBe(portrait)
  expect(
    builderMediaImageRef({kind: 'youtube', youtubeUrl: '   ', image: {asset: {_ref: portrait}}}),
  ).toBe(portrait)
})

test('no media, and no image, resolve to nothing', () => {
  expect(builderMediaImageRef(undefined)).toBeUndefined()
  expect(builderMediaImageRef({kind: 'image'})).toBeUndefined()
})

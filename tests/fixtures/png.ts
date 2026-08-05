import {deflateSync} from 'node:zlib'

/**
 * A PNG of exactly the requested size, built here because the project has no
 * image library and the snapshots need real pixels: a frame that crops is only
 * visibly wrong if something in the picture gets cut off.
 *
 * So each image is a solid fill inside a thick contrasting border. Cropping eats
 * the border on two sides; letterboxing leaves bands of page colour around it.
 * Both read instantly in a diff, which a flat colour would not.
 */
const crcTable = Array.from({length: 256}, (_, index) => {
  let value = index
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1
  }
  return value >>> 0
})

const crc32 = (buffer: Buffer) => {
  let value = 0xffffffff
  for (const byte of buffer) value = crcTable[(value ^ byte) & 0xff] ^ (value >>> 8)
  return (value ^ 0xffffffff) >>> 0
}

const chunk = (type: string, data: Buffer) => {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([length, body, crc])
}

export const solidPng = (
  width: number,
  height: number,
  fill: [number, number, number] = [17, 74, 84],
  border: [number, number, number] = [232, 168, 61],
) => {
  const thickness = Math.max(6, Math.round(Math.min(width, height) * 0.06))
  const raw = Buffer.alloc((width * 3 + 1) * height)
  let offset = 0
  for (let y = 0; y < height; y += 1) {
    raw[offset] = 0
    offset += 1
    for (let x = 0; x < width; x += 1) {
      const onBorder =
        x < thickness || y < thickness || x >= width - thickness || y >= height - thickness
      const colour = onBorder ? border : fill
      raw[offset] = colour[0]
      raw[offset + 1] = colour[1]
      raw[offset + 2] = colour[2]
      offset += 3
    }
  }

  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(height, 4)
  header[8] = 8 // bit depth
  header[9] = 2 // truecolour
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, {level: 6})),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

/**
 * The dimensions Sanity encodes in an asset URL. The frame reads the same
 * numbers out of the reference, so serving an image built from the URL keeps
 * the picture and the frame describing the same thing.
 */
export const dimensionsFromSanityUrl = (url: string) => {
  const match = url.match(/-(\d+)x(\d+)\.[a-z0-9]+/i)
  if (!match) return undefined
  return {width: Number(match[1]), height: Number(match[2])}
}

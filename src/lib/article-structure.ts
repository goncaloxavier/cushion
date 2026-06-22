export type PlainArticleTextBlock = {
  type: 'paragraph' | 'heading' | 'subheading'
  text: string
}

export type PlainArticleListItem = {label?: string; text: string}
export type PlainArticleListBlock = {type: 'list'; items: PlainArticleListItem[]}
export type PlainArticleTableBlock = {type: 'table'; headers: string[]; rows: string[][]}
export type PlainArticleBlock =
  | PlainArticleTextBlock
  | PlainArticleListBlock
  | PlainArticleTableBlock

export type PortableTextSpan = {
  _key?: string
  _type: 'span'
  text?: string
  marks?: string[]
}

export type PortableTextMarkDef = {
  _key: string
  _type: 'link'
  href?: string
}

export type PortableTextBlock = {
  _key?: string
  _type: 'block'
  style?: 'normal' | 'h2' | 'h3' | 'blockquote'
  listItem?: 'bullet' | 'number'
  level?: number
  markDefs?: PortableTextMarkDef[]
  children?: PortableTextSpan[]
}

export type ArticleImageBlock = {
  _key?: string
  _type: 'image' | 'articleImage'
  asset?: {
    url?: string
    metadata?: {
      lqip?: string
      dimensions?: {
        aspectRatio?: number
      }
    }
  }
  alt?: string
  caption?: string
}

export type ArticleYoutubeBlock = {
  _key?: string
  _type: 'youtubeEmbed'
  url?: string
  title?: string
  caption?: string
}

export type ArticleTableBlock = {
  _key?: string
  _type: 'articleTable'
  columns?: string[]
  rows?: {cells?: string[]}[]
}

export type RichArticleBlock =
  | PortableTextBlock
  | ArticleImageBlock
  | ArticleYoutubeBlock
  | ArticleTableBlock

const trimMarker = (value: string) => value.replace(/^[-•]\s*/, '').trim()

const normalise = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()

const splitLabel = (value: string): PlainArticleListItem => {
  const separator = value.indexOf(':')
  if (separator > 0 && separator <= 42) {
    return {
      label: value.slice(0, separator).trim(),
      text: value.slice(separator + 1).trim(),
    }
  }

  return {text: value}
}

const isBullet = (value: string) => /^[-•]\s+/.test(value)
const isNumberedHeading = (value: string) => /^\d+[.)]?\s+\S+/.test(value)
const isShort = (value: string, max = 82) => value.length <= max && value.split(/\s+/).length <= 10
const isSentenceLike = (value: string) => /[.!。]$/.test(value)

const isHeading = (value: string) => {
  if (value.includes('\n')) return false
  if (isNumberedHeading(value)) return true
  if (value.endsWith('?') || value.endsWith(':')) return isShort(value, 92)
  return isShort(value) && !isSentenceLike(value)
}

const isTableStart = (chunks: string[], index: number) => {
  const first = normalise(chunks[index] ?? '')
  const second = chunks[index + 1] ?? ''
  const third = chunks[index + 2] ?? ''

  return (
    (first === 'planta' || first === 'plant') &&
    Boolean(second) &&
    Boolean(third) &&
    isShort(second, 44) &&
    isShort(third, 44)
  )
}

const parseTable = (chunks: string[], index: number) => {
  const headers = chunks.slice(index, index + 3)
  const rows: string[][] = []
  let cursor = index + 3

  while (cursor + 2 < chunks.length) {
    const next = chunks[cursor]
    if (
      isNumberedHeading(next) ||
      /^(\p{Emoji_Presentation}|\p{Extended_Pictographic})/u.test(next)
    ) {
      break
    }

    rows.push(chunks.slice(cursor, cursor + 3))
    cursor += 3
  }

  if (!rows.length) return undefined
  return {
    block: {type: 'table', headers, rows} satisfies PlainArticleTableBlock,
    nextIndex: cursor,
  }
}

export const parsePlainArticleBody = (value: string): PlainArticleBlock[] => {
  const chunks = value
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)

  const blocks: PlainArticleBlock[] = []
  let index = 0

  while (index < chunks.length) {
    const current = chunks[index]

    if (isTableStart(chunks, index)) {
      const parsed = parseTable(chunks, index)
      if (parsed) {
        blocks.push(parsed.block)
        index = parsed.nextIndex
        continue
      }
    }

    if (isBullet(current)) {
      const items: PlainArticleListItem[] = []

      while (index < chunks.length && isBullet(chunks[index])) {
        items.push(splitLabel(trimMarker(chunks[index])))
        index += 1
      }

      blocks.push({type: 'list', items})
      continue
    }

    if (isHeading(current)) {
      blocks.push({
        type: isNumberedHeading(current) ? 'subheading' : 'heading',
        text: current,
      })
      index += 1
      continue
    }

    blocks.push({type: 'paragraph', text: current})
    index += 1
  }

  return blocks
}

const hashString = (value: string) => {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return (hash >>> 0).toString(36)
}

const stableKey = (prefix: string, index: number, value: string) =>
  `${prefix}-${index.toString(36)}-${hashString(value).slice(0, 7)}`

const textBlock = (
  text: string,
  style: PortableTextBlock['style'],
  index: number,
  spans?: PortableTextSpan[],
): PortableTextBlock => ({
  _key: stableKey(style ?? 'normal', index, text),
  _type: 'block',
  style,
  markDefs: [],
  children: spans ?? [
    {
      _key: stableKey('span', index, text),
      _type: 'span',
      text,
    },
  ],
})

export const plainArticleToPortableText = (body: string): RichArticleBlock[] => {
  const blocks = parsePlainArticleBody(body)
  const article: RichArticleBlock[] = []

  blocks.forEach((block, index) => {
    if (block.type === 'heading') {
      article.push(textBlock(block.text, 'h2', index))
      return
    }

    if (block.type === 'subheading') {
      article.push(textBlock(block.text, 'h3', index))
      return
    }

    if (block.type === 'paragraph') {
      article.push(textBlock(block.text, 'normal', index))
      return
    }

    if (block.type === 'list') {
      block.items.forEach((item, itemIndex) => {
        const text = item.label ? `${item.label}: ${item.text}` : item.text
        const spans: PortableTextSpan[] = item.label
          ? [
              {
                _key: stableKey('span-label', itemIndex, item.label),
                _type: 'span',
                marks: ['strong'],
                text: item.label,
              },
              {
                _key: stableKey('span-separator', itemIndex, text),
                _type: 'span',
                text: item.text ? `: ${item.text}` : '',
              },
            ]
          : [
              {
                _key: stableKey('span', itemIndex, text),
                _type: 'span',
                text,
              },
            ]

        article.push({
          ...textBlock(text, 'normal', index + itemIndex, spans),
          _key: stableKey('bullet', index + itemIndex, text),
          listItem: 'bullet',
          level: 1,
        })
      })
      return
    }

    if (block.type === 'table') {
      article.push({
        _key: stableKey('table', index, block.headers.join('|')),
        _type: 'articleTable',
        columns: block.headers,
        rows: block.rows.map((cells, rowIndex) => ({
          _key: stableKey('row', rowIndex, cells.join('|')),
          cells,
        })),
      } satisfies ArticleTableBlock)
    }
  })

  return article
}

const maxContextCharacters = 12_000

const domainContext =
  'A DaFábrica4You fabrica mobiliário urbano e soluções para espaços exteriores em plástico reciclado. A gama inclui bancos para sentar, mesas, cadeiras, papeleiras, ecopontos, floreiras, placas click, decks e pavimentos exteriores. Neste catálogo, «banco» designa mobiliário para sentar, «deck» designa pavimento exterior e «placas click» são placas de deck encaixáveis.'

const xmlEscape = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

const xmlUnescape = (value: string) =>
  value
    .replace(/&#x([0-9a-f]+);/gi, (_match, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_match, decimal: string) =>
      String.fromCodePoint(Number.parseInt(decimal, 10)),
    )
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')

// Values whose exact spelling materially affects prices, product identity or
// contactability. The surrounding language is still translated normally.
const protectedTokenPattern =
  /https?:\/\/[^\s<>"']+|[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.[\p{L}]{2,}|DaFábrica4You|\b(?=[\p{L}\p{N}_-]*\p{L})(?=[\p{L}\p{N}_-]*\d)[\p{L}\p{N}_-]{3,}\b|(?:\+?\d[\d ()/.-]{5,}\d)|\d+(?:[.,]\d+)?(?:\s?(?:%|€|kg|g|mm|cm|m²|m³|m))?/giu

export type PreparedTranslationText = {
  source: string
  text: string
  tokens: string[]
}

export type TranslationTextPart = {kind: 'literal'; value: string} | {kind: 'text'; value: string}

export const splitTranslationText = (source: string): TranslationTextPart[] =>
  source
    .split(/(\r\n|\n|\r|\t+)/)
    .filter((value) => value !== '')
    .map((value) =>
      /^(?:\r\n|\n|\r|\t+)$/.test(value) || !value.trim()
        ? {kind: 'literal', value}
        : {kind: 'text', value},
    )

export const buildTranslationContext = (texts: string[]): string => {
  const snippets = [domainContext]
  const seen = new Set<string>()
  let length = domainContext.length

  for (const text of texts) {
    const normalized = text.replace(/\s+/g, ' ').trim()
    if (!normalized || seen.has(normalized)) continue
    seen.add(normalized)
    const remaining = maxContextCharacters - length - 2
    if (remaining <= 0) break
    snippets.push(normalized.slice(0, remaining))
    length += Math.min(normalized.length, remaining) + 2
    if (normalized.length > remaining) break
  }

  return snippets.join('\n\n')
}

export const prepareTranslationText = (source: string): PreparedTranslationText => {
  const tokens: string[] = []
  let cursor = 0
  let body = ''

  for (const match of source.matchAll(protectedTokenPattern)) {
    const index = match.index ?? 0
    const rawValue = match[0]
    // URL matching is intentionally broad, but sentence punctuation belongs
    // to the author rather than the protected URL token. Leaving it inside
    // would produce a duplicate full stop after presentation restoration.
    const value = /^https?:\/\//iu.test(rawValue) ? rawValue.replace(/[.,!?;:…]+$/u, '') : rawValue
    if (!value) continue
    body += xmlEscape(source.slice(cursor, index))
    body += `<keep id="p${tokens.length}">${xmlEscape(value)}</keep>`
    tokens.push(value)
    cursor = index + value.length
  }

  body += xmlEscape(source.slice(cursor))
  return {source, text: `<r>${body}</r>`, tokens}
}

const terminalPunctuation = (value: string) => value.match(/[.!?;:…]+$/u)?.[0] ?? ''

const preserveBoundaryPunctuation = (source: string, translated: string) => {
  const sourceTerminal = terminalPunctuation(source)
  let result = translated.replace(/[.!?;:…]+$/u, '')

  const sourceLeading = source.match(/^[¿¡]+/u)?.[0] ?? ''
  result = result.replace(/^[¿¡]+/u, '')

  const sourceBody = source
    .slice(sourceLeading.length, source.length - sourceTerminal.length)
    .trim()
  if (!/[.,;:!?¿¡…]/u.test(sourceBody)) {
    result = result.replace(/[¿¡]/gu, '').replace(/[,;:](?=\s)/gu, '')
  }

  return `${sourceLeading}${result}${sourceTerminal}`
}

const preserveLetterCase = (source: string, translated: string, locale: string) => {
  const letters = source.match(/\p{L}/gu) ?? []
  if (!letters.length) return translated

  const allLower = letters.every((letter) => letter === letter.toLocaleLowerCase('pt'))
  if (allLower) return translated.toLocaleLowerCase(locale)

  const allUpper = letters.every((letter) => letter === letter.toLocaleUpperCase('pt'))
  if (allUpper) return translated.toLocaleUpperCase(locale)

  return translated
}

const preserveInitialLetterCase = (source: string, translated: string, locale: string) => {
  const sourceMatch = source.match(/\p{L}/u)
  const translatedMatch = translated.match(/\p{L}/u)
  if (
    !sourceMatch ||
    sourceMatch.index === undefined ||
    !translatedMatch ||
    translatedMatch.index === undefined
  ) {
    return translated
  }

  const sourceLetter = sourceMatch[0]
  const translatedLetter = translatedMatch[0]
  const sourceIsLower = sourceLetter === sourceLetter.toLocaleLowerCase('pt')
  const sourceIsUpper = sourceLetter === sourceLetter.toLocaleUpperCase('pt')
  const replacement = sourceIsLower
    ? translatedLetter.toLocaleLowerCase(locale)
    : sourceIsUpper
      ? translatedLetter.toLocaleUpperCase(locale)
      : translatedLetter

  if (replacement === translatedLetter) return translated
  return `${translated.slice(0, translatedMatch.index)}${replacement}${translated.slice(
    translatedMatch.index + translatedLetter.length,
  )}`
}

export const preserveTranslationPresentation = (
  source: string,
  translated: string,
  locale = 'en',
  options: {preserveInitialCase?: boolean} = {},
) => {
  const leading = source.match(/^\s*/u)?.[0] ?? ''
  const trailing = source.match(/\s*$/u)?.[0] ?? ''
  const sourceCore = source.slice(leading.length, source.length - trailing.length)
  const translatedCore = translated.trim()
  if (!sourceCore || !translatedCore) return source

  const punctuation = preserveBoundaryPunctuation(sourceCore, translatedCore)
  const letterCase = preserveLetterCase(sourceCore, punctuation, locale)
  const initialCase =
    options.preserveInitialCase === false
      ? letterCase
      : preserveInitialLetterCase(sourceCore, letterCase, locale)
  return `${leading}${initialCase}${trailing}`
}

const markerFor = (index: number) => `\uE000${index}\uE001`

export const restoreTranslationText = (
  prepared: PreparedTranslationText,
  translatedXml: string,
  locale: string,
) => {
  const root = translatedXml.trim().match(/^<r>([\s\S]*)<\/r>$/u)
  if (!root) throw new Error('DeepL returned malformed protected translation markup')

  const seen = new Set<number>()
  const withMarkers = root[1].replace(
    /<keep\b([^>]*)>[\s\S]*?<\/keep>/giu,
    (_match, attributes: string) => {
      const id = attributes.match(/\bid=(?:"p(\d+)"|'p(\d+)')/iu)
      const index = Number(id?.[1] ?? id?.[2])
      if (!Number.isInteger(index) || !prepared.tokens[index] || seen.has(index)) {
        throw new Error('DeepL changed protected translation markers')
      }
      seen.add(index)
      return markerFor(index)
    },
  )

  if (seen.size !== prepared.tokens.length) {
    throw new Error('DeepL omitted protected translation markers')
  }

  const sourceStart = prepared.source.trimStart()
  const startsWithProtectedToken = prepared.tokens.some((token) => sourceStart.startsWith(token))
  let restored = preserveTranslationPresentation(
    prepared.source,
    xmlUnescape(withMarkers),
    locale,
    {
      preserveInitialCase: !startsWithProtectedToken,
    },
  )
  prepared.tokens.forEach((token, index) => {
    restored = restored.replace(markerFor(index), token)
  })
  return restored
}

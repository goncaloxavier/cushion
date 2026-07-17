import * as deepl from 'deepl-node'
import {env} from '$env/dynamic/private'
import {
  buildTranslationContext,
  prepareTranslationText,
  preserveTranslationPresentation,
  restoreTranslationText,
  splitTranslationText,
} from './translation-fidelity'

// DeepL's /v2/translate endpoint accepts at most 50 `text` entries per
// request; a large blog article can easily exceed that once every span,
// image alt/caption, and table cell is collected, so batches are chunked.
const chunkSize = 50
const maxBatchCharacters = 60_000

let client: deepl.DeepLClient | null = null

const getClient = () => {
  if (!env.DEEPL_API_KEY) return null
  client ??= new deepl.DeepLClient(env.DEEPL_API_KEY, {maxRetries: 3})
  return client
}

export const deeplConfigured = () => Boolean(env.DEEPL_API_KEY)

export type TranslationLanguage = 'en' | 'es'

const targetLangFor = (language: TranslationLanguage): deepl.TargetLanguageCode =>
  language === 'en' ? (env.DEEPL_TARGET_EN as deepl.TargetLanguageCode) || 'en-US' : 'es'

export type TranslateBatchResult = {ok: true; texts: string[]} | {ok: false; error: string}

type TranslationUnit = {
  source: string
  prepared: ReturnType<typeof prepareTranslationText>
  result?: string
}

export const logTranslationFailure = (context: string, error: string) => {
  console.warn(`[translate] ${context} failed: ${error}`)
}

const chunkByRequestSize = (items: TranslationUnit[]): TranslationUnit[][] => {
  const batches: TranslationUnit[][] = []
  let current: TranslationUnit[] = []
  let characters = 0

  for (const item of items) {
    const size = item.prepared.text.length
    if (current.length && (current.length >= chunkSize || characters + size > maxBatchCharacters)) {
      batches.push(current)
      current = []
      characters = 0
    }
    current.push(item)
    characters += size
  }
  if (current.length) batches.push(current)
  return batches
}

const glossaryFor = (language: TranslationLanguage) =>
  (language === 'en' ? env.DEEPL_GLOSSARY_EN : env.DEEPL_GLOSSARY_ES)?.trim() || undefined

export const translateBatch = async (
  texts: string[],
  language: TranslationLanguage,
  options: {context?: string} = {},
): Promise<TranslateBatchResult> => {
  if (!texts.length) return {ok: true, texts: []}

  const cli = getClient()
  if (!cli) return {ok: false, error: 'DeepL not configured (missing DEEPL_API_KEY).'}

  const target = targetLangFor(language)
  const context = options.context || buildTranslationContext(texts)
  const jobs = texts.map((source) => ({
    parts: splitTranslationText(source),
    units: [] as TranslationUnit[],
  }))
  const units: TranslationUnit[] = []

  for (const job of jobs) {
    for (const part of job.parts) {
      if (part.kind !== 'text') continue
      const unit = {source: part.value, prepared: prepareTranslationText(part.value)}
      units.push(unit)
      job.units.push(unit)
    }
  }

  try {
    const protectedUnits = units.filter((unit) => unit.prepared.tokens.length)
    const plainUnits = units.filter((unit) => !unit.prepared.tokens.length)
    const baseOptions: deepl.TranslateTextOptions = {
      preserveFormatting: true,
      splitSentences: 'nonewlines',
      modelType: 'prefer_quality_optimized',
      context,
      ...(glossaryFor(language) ? {glossary: glossaryFor(language)} : {}),
    }

    for (const batch of chunkByRequestSize(plainUnits)) {
      const results = await cli.translateText(
        batch.map((unit) => unit.source),
        'pt',
        target,
        baseOptions,
      )
      results.forEach((result, index) => {
        batch[index].result = preserveTranslationPresentation(
          batch[index].source,
          result.text,
          language,
        )
      })
    }

    for (const batch of chunkByRequestSize(protectedUnits)) {
      const results = await cli.translateText(
        batch.map((unit) => unit.prepared.text),
        'pt',
        target,
        {
          ...baseOptions,
          tagHandling: 'xml',
          outlineDetection: false,
          ignoreTags: ['keep'],
          nonSplittingTags: ['keep'],
        },
      )
      results.forEach((result, index) => {
        batch[index].result = restoreTranslationText(batch[index].prepared, result.text, language)
      })
    }

    const translated = jobs.map((job) => {
      let cursor = 0
      return job.parts
        .map((part) => {
          if (part.kind === 'literal') return part.value
          const result = job.units[cursor]?.result
          cursor += 1
          if (!result) throw new Error('DeepL returned an incomplete translation batch')
          return result
        })
        .join('')
    })
    return {ok: true, texts: translated}
  } catch (error) {
    return {ok: false, error: error instanceof Error ? error.message : String(error)}
  }
}

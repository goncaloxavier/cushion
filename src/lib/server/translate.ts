import * as deepl from 'deepl-node'
import {env} from '$env/dynamic/private'

// DeepL's /v2/translate endpoint accepts at most 50 `text` entries per
// request; a large blog article can easily exceed that once every span,
// image alt/caption, and table cell is collected, so batches are chunked.
const chunkSize = 50

let client: deepl.DeepLClient | null = null

const getClient = () => {
  if (!env.DEEPL_API_KEY) return null
  client ??= new deepl.DeepLClient(env.DEEPL_API_KEY, {maxRetries: 3})
  return client
}

export const deeplConfigured = () => Boolean(env.DEEPL_API_KEY)

export type TranslationLanguage = 'en' | 'es'

const targetLangFor = (language: TranslationLanguage): deepl.TargetLanguageCode =>
  language === 'en' ? ((env.DEEPL_TARGET_EN as deepl.TargetLanguageCode) || 'en-US') : 'es'

export type TranslateBatchResult = {ok: true; texts: string[]} | {ok: false; error: string}

export const logTranslationFailure = (context: string, error: string) => {
  console.warn(`[translate] ${context} failed: ${error}`)
}

const chunk = <T>(items: T[], size: number): T[][] => {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size))
  return chunks
}

export const translateBatch = async (
  texts: string[],
  language: TranslationLanguage,
): Promise<TranslateBatchResult> => {
  if (!texts.length) return {ok: true, texts: []}

  const cli = getClient()
  if (!cli) return {ok: false, error: 'DeepL not configured (missing DEEPL_API_KEY).'}

  const target = targetLangFor(language)
  const out: string[] = []

  try {
    for (const batch of chunk(texts, chunkSize)) {
      const results = await cli.translateText(batch, 'pt', target, {preserveFormatting: true})
      out.push(...results.map((result) => result.text))
    }
    return {ok: true, texts: out}
  } catch (error) {
    return {ok: false, error: error instanceof Error ? error.message : String(error)}
  }
}

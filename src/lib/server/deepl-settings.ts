import * as deepl from 'deepl-node'
import {env} from '$env/dynamic/private'
import {deleteSetting, getSetting, getSettingMeta, setSetting} from './app-settings'

// Lets an admin swap the DeepL API key from /painel/definicoes when the free
// tier's 1M-lifetime-character allowance runs out, without a redeploy. The
// override lives in Postgres (app_settings); DEEPL_API_KEY in the
// environment is the fallback when no override is set.

const settingKey = 'deepl_api_key'

export const getDeeplApiKeyOverride = () => getSetting(settingKey)

export const getEffectiveDeeplApiKey = async (): Promise<string | null> => {
  const override = await getDeeplApiKeyOverride()
  return override || env.DEEPL_API_KEY || null
}

export const maskDeeplKey = (key: string) =>
  key.length <= 6 ? '••••' : `${key.slice(0, 2)}••••${key.slice(-4)}`

export type DeeplKeyStatus = {
  source: 'override' | 'env' | 'none'
  maskedKey: string | null
  updatedAt: string | null
  updatedBy: string | null
}

export const getDeeplKeyStatus = async (): Promise<DeeplKeyStatus> => {
  const override = await getDeeplApiKeyOverride()
  if (override) {
    const meta = await getSettingMeta(settingKey)
    return {
      source: 'override',
      maskedKey: maskDeeplKey(override),
      updatedAt: meta?.updatedAt ?? null,
      updatedBy: meta?.updatedBy ?? null,
    }
  }
  if (env.DEEPL_API_KEY) {
    return {source: 'env', maskedKey: maskDeeplKey(env.DEEPL_API_KEY), updatedAt: null, updatedBy: null}
  }
  return {source: 'none', maskedKey: null, updatedAt: null, updatedBy: null}
}

export type DeeplUsage = {count: number; limit: number}

const usageFor = async (key: string): Promise<DeeplUsage> => {
  const usage = await new deepl.DeepLClient(key, {maxRetries: 1}).getUsage()
  if (!usage.character) throw new Error('DeepL did not report character usage for this key.')
  return {count: usage.character.count, limit: usage.character.limit}
}

export const getDeeplUsage = async (): Promise<DeeplUsage | null> => {
  const key = await getEffectiveDeeplApiKey()
  if (!key) return null
  try {
    return await usageFor(key)
  } catch {
    return null
  }
}

export const checkDeeplKey = async (
  key: string,
): Promise<{ok: true; usage: DeeplUsage} | {ok: false; error: string}> => {
  try {
    return {ok: true, usage: await usageFor(key)}
  } catch (error) {
    return {ok: false, error: error instanceof Error ? error.message : String(error)}
  }
}

export const setDeeplApiKeyOverride = (key: string, updatedBy: string) =>
  setSetting(settingKey, key, updatedBy)

export const clearDeeplApiKeyOverride = () => deleteSetting(settingKey)

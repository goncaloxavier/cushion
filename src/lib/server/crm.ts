import {createHmac, randomUUID} from 'node:crypto'
import {createClient} from '@sanity/client'
import {env} from '$env/dynamic/private'
import type {LanguageCode} from '$lib/site-content'

const projectId = 'u4uyfix8'
const dataset = env.SANITY_CRM_DATASET || 'crm'
const apiVersion = '2026-06-10'

const rateBuckets = new Map<string, {count: number; resetAt: number}>()

export type SubmissionSource =
  | 'contact'
  | 'catalogue'
  | 'product'
  | 'store'
  | 'case'
  | 'blog'
  | 'unknown'

export type ContactSubmission = {
  firstName: string
  lastName: string
  name: string
  email: string
  phone: string
  address: string
  postalCode: string
  locality: string
  message: string
  marketingConsent: boolean
  consentText: string
  language: LanguageCode
  source: SubmissionSource
  sourcePath: string
  ipAddress: string
  userAgent: string
}

export type StoreSubmissionResult =
  | {ok: true; requestId: string}
  | {ok: false; status: number; message: string}

const normalizeWhitespace = (value: string) => value.replace(/[ \t\r\f\v]+/g, ' ').trim()

export const cleanSingleLine = (value: FormDataEntryValue | null, maxLength: number) =>
  normalizeWhitespace(
    String(value ?? '')
      .normalize('NFC')
      .replace(/[\u0000-\u001f\u007f]/g, ''),
  ).slice(0, maxLength)

export const cleanMessage = (value: FormDataEntryValue | null, maxLength: number) =>
  String(value ?? '')
    .normalize('NFC')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000b\f\u000e-\u001f\u007f]/g, '')
    .trim()
    .slice(0, maxLength)

export const normalizeEmail = (value: string) => value.trim().toLowerCase()

export const normalizePhone = (value: string) => value.replace(/[^\d+]/g, '').slice(0, 32)

const hmac = (secret: string, value: string) =>
  createHmac('sha256', secret).update(value).digest('hex')

const hitRateLimit = (key: string, limit: number, windowMs: number) => {
  const now = Date.now()
  const current = rateBuckets.get(key)

  if (!current || current.resetAt <= now) {
    rateBuckets.set(key, {count: 1, resetAt: now + windowMs})
    return false
  }

  current.count += 1
  return current.count > limit
}

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254

export const validateSubmission = (input: ContactSubmission): string[] => {
  const errors: string[] = []

  if (input.firstName.length < 1) errors.push('firstName')
  if (input.lastName.length < 1) errors.push('lastName')
  if (!isEmail(input.email)) errors.push('email')
  if (input.phone.length < 6) errors.push('phone')
  if (input.address.length < 4) errors.push('address')
  if (input.postalCode.length < 3) errors.push('postalCode')
  if (input.locality.length < 2) errors.push('locality')
  if (input.message.length < 8) errors.push('message')
  if (!input.marketingConsent) errors.push('marketingConsent')

  return errors
}

export const storeContactSubmission = async (
  input: ContactSubmission,
): Promise<StoreSubmissionResult> => {
  const token = env.SANITY_CRM_WRITE_TOKEN
  const hashSecret = env.CRM_HASH_SECRET

  if (!token || !hashSecret) {
    return {
      ok: false,
      status: 503,
      message: 'O formulário ainda não está configurado para receber pedidos.',
    }
  }

  const emailHash = hmac(hashSecret, normalizeEmail(input.email))
  const phoneHash = input.phone ? hmac(hashSecret, normalizePhone(input.phone)) : undefined
  const ipHash = input.ipAddress ? hmac(hashSecret, input.ipAddress) : undefined

  if (ipHash && hitRateLimit(`ip:${ipHash}`, 5, 10 * 60 * 1000)) {
    return {
      ok: false,
      status: 429,
      message: 'Foram enviados demasiados pedidos. Tente novamente dentro de alguns minutos.',
    }
  }

  if (hitRateLimit(`email:${emailHash}`, 3, 30 * 60 * 1000)) {
    return {
      ok: false,
      status: 429,
      message: 'Foram enviados demasiados pedidos com este email. Tente novamente mais tarde.',
    }
  }

  const client = createClient({
    projectId,
    dataset,
    apiVersion,
    useCdn: false,
    token,
  })

  const now = new Date().toISOString()
  const requestId = randomUUID()
  const profileId = `clientProfile.${emailHash.slice(0, 48)}`

  await client
    .transaction()
    .createIfNotExists({
      _id: profileId,
      _type: 'clientProfile',
      firstName: input.firstName,
      lastName: input.lastName,
      name: input.name,
      email: input.email,
      status: 'new',
      submissionCount: 0,
      firstSubmittedAt: now,
      firstSource: input.source,
      emailHash,
      ...(phoneHash ? {phoneHash} : {}),
    })
    .patch(profileId, (patch) =>
      patch
        .setIfMissing({
          status: 'new',
          tags: [],
          submissionCount: 0,
          firstSubmittedAt: now,
          firstSource: input.source,
        })
        .set({
          firstName: input.firstName,
          lastName: input.lastName,
          name: input.name,
          email: input.email,
          phone: input.phone,
          ...(input.address ? {address: input.address} : {}),
          postalCode: input.postalCode,
          locality: input.locality,
          preferredLanguage: input.language,
          marketingConsent: input.marketingConsent,
          lastSubmittedAt: now,
          lastSource: input.source,
          latestMessage: input.message,
          emailHash,
          ...(phoneHash ? {phoneHash} : {}),
        })
        .inc({submissionCount: 1}),
    )
    .create({
      _id: `formSubmission.${requestId}`,
      _type: 'formSubmission',
      submittedAt: now,
      requestId,
      source: input.source,
      sourcePath: input.sourcePath,
      language: input.language,
      message: input.message,
      profile: {_type: 'reference', _ref: profileId},
      firstName: input.firstName,
      lastName: input.lastName,
      name: input.name,
      email: input.email,
      phone: input.phone,
      address: input.address,
      postalCode: input.postalCode,
      locality: input.locality,
      marketingConsent: input.marketingConsent,
      consentText: input.consentText,
      status: 'new',
      emailHash,
      ...(phoneHash ? {phoneHash} : {}),
      ...(ipHash ? {ipHash} : {}),
      userAgent: input.userAgent.slice(0, 240),
    })
    .commit()

  return {ok: true, requestId}
}

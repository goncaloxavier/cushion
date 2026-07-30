import type {LanguageCode} from '$lib/site-content'
import {databaseConfigured, withTransaction} from './db'
import {
  contactsRecipient,
  logEmailFailure,
  sendTransactionalEmail,
} from './email'
import {tokenHashOf} from './password-auth'
import {distributedRateLimit, rateLimitKey} from './rate-limit'

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
  privacyConsent: boolean
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
  if (!input.privacyConsent) errors.push('privacyConsent')

  return errors
}

export const storeContactSubmission = async (
  input: ContactSubmission,
): Promise<StoreSubmissionResult> => {
  if (!databaseConfigured()) {
    return {
      ok: false,
      status: 503,
      message: 'O formulário ainda não está configurado para receber pedidos.',
    }
  }

  const emailNormalized = normalizeEmail(input.email)

  if (
    input.ipAddress &&
    (await distributedRateLimit(rateLimitKey('crm-ip', input.ipAddress), 5, 10 * 60 * 1000))
  ) {
    return {
      ok: false,
      status: 429,
      message: 'Foram enviados demasiados pedidos. Tente novamente dentro de alguns minutos.',
    }
  }

  if (
    await distributedRateLimit(rateLimitKey('crm-email', emailNormalized), 3, 30 * 60 * 1000)
  ) {
    return {
      ok: false,
      status: 429,
      message: 'Foram enviados demasiados pedidos com este email. Tente novamente mais tarde.',
    }
  }

  const ipHash = input.ipAddress ? tokenHashOf(input.ipAddress) : ''

  const submissionId = await withTransaction(async (client) => {
    const profile = await client.query<{id: string}>(
      `insert into crm_client_profiles (
         first_name, last_name, name, email, email_normalized, phone, address, postal_code, locality,
         preferred_language, status, submission_count, first_submitted_at, last_submitted_at,
         first_source, last_source, latest_message, marketing_consent, privacy_consent,
         marketing_consent_at, marketing_withdrawn_at
       )
       values (
         $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'new', 1, now(), now(),
         $11, $11, $12, $13, $14,
         case when $13 then now() end,
         case when $13 then null else now() end
       )
       on conflict (email_normalized) do update
       set first_name = excluded.first_name,
           last_name = excluded.last_name,
           name = excluded.name,
           email = excluded.email,
           phone = excluded.phone,
           address = coalesce(nullif(excluded.address, ''), crm_client_profiles.address),
           postal_code = excluded.postal_code,
           locality = excluded.locality,
           preferred_language = excluded.preferred_language,
           marketing_consent = excluded.marketing_consent,
           marketing_consent_at = case
             when excluded.marketing_consent
               then coalesce(crm_client_profiles.marketing_consent_at, now())
             else null
           end,
           marketing_withdrawn_at = case
             when excluded.marketing_consent then null
             else coalesce(crm_client_profiles.marketing_withdrawn_at, now())
           end,
           privacy_consent = excluded.privacy_consent,
           last_submitted_at = now(),
           last_source = excluded.last_source,
           latest_message = excluded.latest_message,
           submission_count = crm_client_profiles.submission_count + 1,
           updated_at = now()
       returning id`,
      [
        input.firstName,
        input.lastName,
        input.name,
        input.email,
        emailNormalized,
        input.phone,
        input.address,
        input.postalCode,
        input.locality,
        input.language,
        input.source,
        input.message,
        input.marketingConsent,
        input.privacyConsent,
      ],
    )

    const profileId = profile.rows[0].id

    const submission = await client.query<{id: string}>(
      `insert into crm_form_submissions (
         profile_id, source, source_path, language, message, first_name, last_name, name, email, phone,
         address, postal_code, locality, marketing_consent, consent_text, privacy_consent, ip_hash, user_agent
       )
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
       returning id`,
      [
        profileId,
        input.source,
        input.sourcePath,
        input.language,
        input.message,
        input.firstName,
        input.lastName,
        input.name,
        input.email,
        input.phone,
        input.address,
        input.postalCode,
        input.locality,
        input.marketingConsent,
        input.consentText,
        input.privacyConsent,
        ipHash,
        input.userAgent.slice(0, 240),
      ],
    )

    return submission.rows[0].id
  })

  const recipient = contactsRecipient()
  if (recipient) {
    const sourceLabels: Record<SubmissionSource, string> = {
      contact: 'Contacto',
      catalogue: 'Catálogo',
      product: 'Produto',
      store: 'Loja',
      case: 'Caso',
      blog: 'Blog',
      unknown: 'Website',
    }
    const result = await sendTransactionalEmail({
      to: recipient,
      subject: `Novo pedido pelo website · ${input.name}`,
      text: [
        `Origem: ${sourceLabels[input.source]}`,
        `Nome: ${input.name}`,
        `Email: ${input.email}`,
        `Telefone: ${input.phone}`,
        `Local: ${[input.postalCode, input.locality].filter(Boolean).join(' ')}`,
        `Marketing: ${input.marketingConsent ? 'sim' : 'não'}`,
        '',
        input.message,
        '',
        `Pedido: ${submissionId}`,
      ].join('\n'),
    }).catch((error) => ({
      ok: false as const,
      status: 500,
      error: error instanceof Error ? error.message : 'Unknown email delivery error.',
    }))
    logEmailFailure(`contact submission ${submissionId}`, result)
  }

  return {ok: true, requestId: submissionId}
}

export type EmailSendResult =
  | {ok: true; id: string}
  | {ok: false; status: number; error: string}

const runtimeEnv = process.env
const developmentRuntime = runtimeEnv.NODE_ENV !== 'production'

export const emailConfigured = () => Boolean(runtimeEnv.RESEND_API_KEY && runtimeEnv.EMAIL_FROM)

export const ordersRecipient = () => runtimeEnv.ORDERS_TO_EMAIL || ''

export const appOrigin = () => runtimeEnv.APP_ORIGIN || ''

export const logEmailFailure = (context: string, result: EmailSendResult) => {
  if (result.ok) return
  console.warn(`[email] ${context} failed (${result.status}): ${result.error}`)
}

export const sendTransactionalEmail = async (input: {
  to: string
  subject: string
  text: string
  html?: string
}): Promise<EmailSendResult> => {
  if (!emailConfigured()) {
    return {ok: false, status: 503, error: 'Transactional email is not configured.'}
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${runtimeEnv.RESEND_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      from: runtimeEnv.EMAIL_FROM,
      to: input.to,
      subject: input.subject,
      text: input.text,
      ...(input.html ? {html: input.html} : {}),
    }),
  }).catch((error) => ({
    ok: false,
    status: 503,
    json: async () => ({
      message: error instanceof Error ? error.message : 'Email provider request failed.',
    }),
  }))

  const body = (await response.json().catch(() => null)) as {id?: string; message?: string} | null

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: body?.message || `Resend returned ${response.status}`,
    }
  }

  return {ok: true, id: body?.id || ''}
}

// Sends the account email-verification link. When transactional email is not
// configured (e.g. local dev without Resend), the link is logged to the server
// console so the flow stays testable end-to-end.
export const deliverVerificationEmail = async (
  to: string,
  verifyUrl: string,
): Promise<EmailSendResult> => {
  if (!emailConfigured()) {
    if (developmentRuntime) console.info(`[dev] Verificação de email para ${to}: ${verifyUrl}`)
    return {ok: false, status: 503, error: 'Transactional email is not configured.'}
  }

  return sendTransactionalEmail({
    to,
    subject: 'Confirme o seu email DaFábrica4You',
    text: `Bem-vindo à DaFábrica4You.\n\nConfirme o seu email abrindo este link:\n${verifyUrl}\n\nSe não criou esta conta, ignore este email.`,
  })
}

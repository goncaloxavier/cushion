import {redirect} from '@sveltejs/kit'
import {
  createCustomerSession,
  setCustomerSessionCookie,
  tokenHashOf,
  verifyCustomerEmailToken,
} from '$lib/server/customer-auth'
import {databaseConfigured} from '$lib/server/db'
import type {RequestHandler} from './$types'

export const GET: RequestHandler = async ({cookies, getClientAddress, request, url}) => {
  const token = url.searchParams.get('token') ?? ''
  const language = url.searchParams.get('lang') || 'pt'
  if (databaseConfigured() && token) {
    const verification = await verifyCustomerEmailToken(token).catch(() => ({ok: false as const, customerId: ''}))
    if (verification.ok) {
      const session = await createCustomerSession(verification.customerId, {
        ipHash: tokenHashOf(`ip:${getClientAddress()}`),
        userAgent: request.headers.get('user-agent') ?? '',
      })
      setCustomerSessionCookie(cookies, session.token, session.expiresAt, url.protocol === 'https:')
      redirect(303, `/conta?lang=${language}&email=verified`)
    }
  }

  redirect(303, `/conta/entrar?lang=${language}&email=invalid`)
}

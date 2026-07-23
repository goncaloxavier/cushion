import {redirect} from '@sveltejs/kit'
import {
  createCustomerSession,
  customerRateLimit,
  setCustomerSessionCookie,
  tokenHashOf,
  verifyCustomerEmailToken,
} from '$lib/server/customer-auth'
import {databaseConfigured} from '$lib/server/db'
import type {RequestHandler} from './$types'

export const GET: RequestHandler = async ({cookies, getClientAddress, request, url}) => {
  const token = url.searchParams.get('token') ?? ''
  const language = url.searchParams.get('lang') || 'pt'
  const ipHash = tokenHashOf(`ip:${getClientAddress()}`)
  const limited = customerRateLimit(`verify-ip:${ipHash}`, 10, 15 * 60 * 1000)

  if (databaseConfigured() && token && !limited) {
    const verification = await verifyCustomerEmailToken(token).catch((error) => {
      // A real DB/transaction failure here looks identical to "expired or
      // garbage token" to the user — log it so a spike in verification
      // failures during a DB hiccup doesn't get mistaken for bad links.
      console.error(
        `[customer email verification] token check failed: ${error instanceof Error ? error.message : String(error)}`,
      )
      return {ok: false as const, customerId: ''}
    })
    if (verification.ok) {
      const session = await createCustomerSession(verification.customerId, {
        ipHash: tokenHashOf(`ip:${getClientAddress()}`),
        userAgent: request.headers.get('user-agent') ?? '',
      })
      setCustomerSessionCookie(cookies, session.token, session.expiresAt, url.protocol === 'https:')
      redirect(303, `/conta/dados?lang=${language}&email=verified`)
    }
  }

  redirect(303, `/conta/entrar?lang=${language}&email=invalid`)
}

import {redirect} from '@sveltejs/kit'
import {verifyCustomerEmailToken} from '$lib/server/customer-auth'
import {databaseConfigured} from '$lib/server/db'
import type {RequestHandler} from './$types'

export const GET: RequestHandler = async ({locals, url}) => {
  const token = url.searchParams.get('token') ?? ''
  if (databaseConfigured() && token) {
    await verifyCustomerEmailToken(token).catch(() => undefined)
  }

  // Signed-in users (the common case with our "let them in" flow) go straight
  // to the dashboard; otherwise send them to sign in.
  redirect(303, locals.customer ? '/conta?email=verified' : '/conta/entrar?email=verified')
}

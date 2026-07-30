import {error} from '@sveltejs/kit'
import {exportCustomerData} from '$lib/server/privacy'
import type {RequestHandler} from './$types'

export const GET: RequestHandler = async ({locals}) => {
  if (!locals.customer) error(401, 'Inicie sessão para continuar.')

  const payload = await exportCustomerData(locals.customer.id)
  const date = new Date().toISOString().slice(0, 10)
  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'cache-control': 'no-store, max-age=0',
      'content-disposition': `attachment; filename="dafabrica4you-dados-${date}.json"`,
      'content-type': 'application/json; charset=utf-8',
    },
  })
}

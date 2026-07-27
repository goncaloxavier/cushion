import {error} from '@sveltejs/kit'
import {exportCustomerData, getPrivacyRequest} from '$lib/server/privacy'
import type {RequestHandler} from './$types'

export const GET: RequestHandler = async ({locals, params}) => {
  if (!locals.staff) error(401, 'Inicie sessão para continuar.')

  const request = await getPrivacyRequest(params.id)
  if (!request?.customerId) error(404, 'O cliente já não tem uma conta ativa.')

  const payload = await exportCustomerData(request.customerId)
  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'cache-control': 'no-store, max-age=0',
      'content-disposition': `attachment; filename="dados-cliente-${params.id}.json"`,
      'content-type': 'application/json; charset=utf-8',
    },
  })
}

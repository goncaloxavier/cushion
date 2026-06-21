import {error} from '@sveltejs/kit'
import {getSubmission} from '$lib/server/crm-admin'
import {submissionManageActions} from '$lib/server/painel-actions'
import type {Actions, PageServerLoad} from './$types'

export const load: PageServerLoad = async ({params}) => {
  const submission = await getSubmission(params.id)
  if (!submission) error(404, 'Pedido não encontrado')
  return {submission}
}

export const actions = submissionManageActions satisfies Actions

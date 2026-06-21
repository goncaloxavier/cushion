import {listSubmissions} from '$lib/server/crm-admin'
import {submissionManageActions} from '$lib/server/painel-actions'
import type {Actions, PageServerLoad} from './$types'

export const load: PageServerLoad = async () => ({rows: await listSubmissions('catalogue')})

export const actions = submissionManageActions satisfies Actions

import {listSubmissions} from '$lib/server/crm-admin'
import type {PageServerLoad} from './$types'

export const load: PageServerLoad = async () => ({rows: await listSubmissions('contact')})

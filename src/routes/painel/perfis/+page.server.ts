import {listProfiles} from '$lib/server/crm-admin'
import type {PageServerLoad} from './$types'

export const load: PageServerLoad = async ({url}) => {
  const search = url.searchParams.get('q') ?? ''
  return {rows: await listProfiles(search), search}
}

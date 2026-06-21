import {error} from '@sveltejs/kit'
import {getProfile} from '$lib/server/crm-admin'
import {profileManageActions} from '$lib/server/painel-actions'
import type {Actions, PageServerLoad} from './$types'

export const load: PageServerLoad = async ({params}) => {
  const profile = await getProfile(params.id)
  if (!profile) error(404, 'Perfil não encontrado')
  return {profile}
}

export const actions = profileManageActions satisfies Actions

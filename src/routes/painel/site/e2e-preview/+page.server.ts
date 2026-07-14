import {error} from '@sveltejs/kit'
import {siteEditorE2eEnabled} from '$lib/server/site-editor-e2e'
import type {PageServerLoad} from './$types'

export const load: PageServerLoad = ({url}) => {
  if (!siteEditorE2eEnabled()) error(404, 'Página não encontrada.')
  return {fixture: url.searchParams.get('fixture') === 'product' ? 'product' : 'home'}
}

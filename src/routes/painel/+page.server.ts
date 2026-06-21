import {redirect} from '@sveltejs/kit'
import {destroySession, sessionCookieName} from '$lib/server/auth'
import {getStats, listSubmissions} from '$lib/server/crm-admin'
import type {Actions, PageServerLoad} from './$types'

export const load: PageServerLoad = async () => {
  const [stats, recent] = await Promise.all([getStats(), listSubmissions('all', 8)])
  return {stats, recent}
}

export const actions: Actions = {
  logout: async ({cookies}) => {
    await destroySession(cookies.get(sessionCookieName))
    cookies.delete(sessionCookieName, {path: '/painel'})
    redirect(303, '/painel/login')
  },
}

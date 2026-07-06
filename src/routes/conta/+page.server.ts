import {redirect} from '@sveltejs/kit'
import type {PageServerLoad} from './$types'

export const load: PageServerLoad = async ({locals, url}) => {
  const language = url.searchParams.get('lang') || 'pt'
  if (!locals.customer) {
    redirect(303, `/conta/entrar?lang=${language}`)
  }

  const email = url.searchParams.get('email')
  const emailQuery = email ? `&email=${encodeURIComponent(email)}` : ''
  redirect(303, `/conta/dados?lang=${language}${emailQuery}`)
}

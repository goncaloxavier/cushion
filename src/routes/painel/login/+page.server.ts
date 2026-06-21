import {createHmac} from 'node:crypto'
import {fail, redirect} from '@sveltejs/kit'
import {authenticate, createSession, normalizeUsername, rateLimit, sessionCookieName} from '$lib/server/auth'
import {crmHashSecret} from '$lib/server/crm-client'
import {sameOriginOk} from '$lib/server/form-guard'
import type {Actions, PageServerLoad} from './$types'

const safeNext = (value: string) => (value.startsWith('/painel') ? value : '/painel')

export const load: PageServerLoad = async ({url}) => {
  return {next: safeNext(url.searchParams.get('next') ?? '/painel')}
}

export const actions: Actions = {
  default: async ({request, cookies, getClientAddress, url}) => {
    const data = await request.formData()
    const username = normalizeUsername(String(data.get('username') ?? '').slice(0, 120))
    const password = String(data.get('password') ?? '').slice(0, 200)
    const next = safeNext(String(data.get('next') ?? '/painel'))

    if (!sameOriginOk(request.headers.get('origin'), request.headers.get('referer'), url.origin)) {
      return fail(403, {message: 'Não foi possível validar a origem do pedido.'})
    }

    const ipHash = createHmac('sha256', crmHashSecret() || 'df4y-login')
      .update(getClientAddress())
      .digest('hex')

    if (
      rateLimit(`login:ip:${ipHash}`, 10, 15 * 60 * 1000) ||
      rateLimit(`login:user:${username}`, 5, 15 * 60 * 1000)
    ) {
      return fail(429, {message: 'Demasiadas tentativas. Tente novamente dentro de alguns minutos.', username})
    }

    const user = await authenticate(username, password)
    if (!user) {
      return fail(400, {message: 'Utilizador ou palavra-passe incorretos.', username})
    }

    const session = await createSession(user._id, ipHash, request.headers.get('user-agent') ?? '')
    if (!session) {
      return fail(503, {message: 'O backoffice ainda não está configurado.', username})
    }

    cookies.set(sessionCookieName, session.token, {
      path: '/painel',
      httpOnly: true,
      sameSite: 'lax',
      secure: url.protocol === 'https:',
      expires: new Date(session.expiresAt),
    })

    redirect(303, next)
  },
}

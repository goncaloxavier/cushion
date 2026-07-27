import {fail, redirect} from '@sveltejs/kit'
import {authenticate, createSession, normalizeUsername, setStaffSessionCookie} from '$lib/server/staff-auth'
import {csrfOk, issueCsrfToken, sameOriginOk} from '$lib/server/form-guard'
import {distributedRateLimit, rateLimitKey} from '$lib/server/rate-limit'
import type {Actions, PageServerLoad} from './$types'

const csrfCookieName = 'df4y_painel_login_csrf'

const safeNext = (value: string) => (value.startsWith('/painel') ? value : '/painel')

export const load: PageServerLoad = async ({cookies, url}) => {
  return {
    next: safeNext(url.searchParams.get('next') ?? '/painel'),
    csrfToken: issueCsrfToken(cookies, csrfCookieName, '/painel/login', url.protocol === 'https:'),
  }
}

export const actions: Actions = {
  default: async ({request, cookies, getClientAddress, url}) => {
    const data = await request.formData()
    const username = normalizeUsername(String(data.get('username') ?? '').slice(0, 120))
    const password = String(data.get('password') ?? '').slice(0, 200)
    const next = safeNext(String(data.get('next') ?? '/painel'))
    const csrfToken = String(data.get('csrfToken') ?? '')

    if (!sameOriginOk(request.headers.get('origin'), request.headers.get('referer'), url.origin)) {
      return fail(403, {message: 'Não foi possível validar a origem do pedido.'})
    }
    if (!csrfOk(cookies.get(csrfCookieName), csrfToken)) {
      return fail(403, {message: 'Atualize a página e tente novamente.', username})
    }

    const ipHash = rateLimitKey('login-ip', getClientAddress())
    if (
      (await distributedRateLimit(ipHash, 10, 15 * 60 * 1000)) ||
      (await distributedRateLimit(rateLimitKey('login-user', username), 5, 15 * 60 * 1000))
    ) {
      return fail(429, {message: 'Demasiadas tentativas. Tente novamente dentro de alguns minutos.', username})
    }

    const user = await authenticate(username, password)
    if (!user) {
      return fail(400, {message: 'Utilizador ou palavra-passe incorretos.', username})
    }

    const session = await createSession(user.id, {ipHash, userAgent: request.headers.get('user-agent') ?? ''})
    setStaffSessionCookie(cookies, session.token, session.expiresAt, url.protocol === 'https:')

    redirect(303, next)
  },
}

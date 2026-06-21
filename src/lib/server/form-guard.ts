import {randomBytes, timingSafeEqual} from 'node:crypto'
import type {Cookies} from '@sveltejs/kit'

// Shared CSRF + same-origin helpers for the public forms (contact, catalogue).

export const issueCsrfToken = (cookies: Cookies, cookieName: string, path: string, secure: boolean) => {
  let token = cookies.get(cookieName)
  if (!token || token.length < 32) {
    token = randomBytes(32).toString('base64url')
    cookies.set(cookieName, token, {path, httpOnly: true, sameSite: 'lax', secure, maxAge: 60 * 60})
  }
  return token
}

export const csrfOk = (cookieToken: string | undefined, formToken: string) => {
  if (!cookieToken || !formToken) return false
  const left = Buffer.from(cookieToken)
  const right = Buffer.from(formToken)
  return left.length === right.length && timingSafeEqual(left, right)
}

export const sameOriginOk = (origin: string | null, referer: string | null, expectedOrigin: string) => {
  if (origin) return origin === expectedOrigin
  if (referer) return referer.startsWith(`${expectedOrigin}/`)
  return true
}

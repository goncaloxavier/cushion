import {env} from '$env/dynamic/private'
import {json} from '@sveltejs/kit'

export const prerender = false

export const GET = () => {
  return json(
    {
      app: 'cushion',
      commit: env.RAILWAY_GIT_COMMIT_SHA ?? env.GIT_COMMIT_SHA ?? null,
    },
    {
      headers: {
        'cache-control': 'no-store, max-age=0',
        'x-robots-tag': 'noindex, nofollow'
      }
    }
  )
}

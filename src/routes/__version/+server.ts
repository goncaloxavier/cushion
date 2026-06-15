import {env} from '$env/dynamic/private'
import {json} from '@sveltejs/kit'

export const prerender = false

export const GET = () => {
  return json(
    {
      app: 'cushion',
      commit: env.RAILWAY_GIT_COMMIT_SHA ?? env.GIT_COMMIT_SHA ?? null,
      branch: env.RAILWAY_GIT_BRANCH ?? env.GIT_BRANCH ?? null,
      service: env.RAILWAY_SERVICE_NAME ?? env.RAILWAY_SERVICE_ID ?? null,
      environment: env.RAILWAY_ENVIRONMENT_NAME ?? env.RAILWAY_ENVIRONMENT_ID ?? null,
      nodeEnv: env.NODE_ENV ?? null
    },
    {
      headers: {
        'cache-control': 'no-store, max-age=0'
      }
    }
  )
}

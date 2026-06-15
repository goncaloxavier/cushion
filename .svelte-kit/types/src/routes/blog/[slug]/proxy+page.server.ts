// @ts-nocheck
import {error} from '@sveltejs/kit'
import type {PageServerLoad} from './$types'

export const load = async ({params, parent}: Parameters<PageServerLoad>[0]) => {
  const {site, language} = await parent()
  const content = site[language]
  const post = content.blogPosts.find((item) => item.slug === params.slug)

  if (!post) {
    error(404, 'Post not found')
  }

  return {
    post,
    language,
  }
}

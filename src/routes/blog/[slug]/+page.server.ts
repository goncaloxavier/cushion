import {error} from '@sveltejs/kit'
import {pageFromSearchParams} from '$lib/collection-page'
import {getBlogPostDetail} from '$lib/sanity'
import {blogDetailContent} from '$lib/site-content'
import type {PageServerLoad} from './$types'

export const load: PageServerLoad = async ({params, parent, url}) => {
  const {site, language} = await parent()
  const content = site[language]
  const post = content.blogPosts.find((item) => item.slug === params.slug)
  const returnPage = pageFromSearchParams(url.searchParams, 'fromPage')

  if (!post) {
    error(404, 'Post not found')
  }

  // Body + article are loaded per-slug (they are large and detail-only). In
  // fallback/test mode getBlogPostDetail returns null and the post already
  // carries its fallback body/article.
  const detail = await getBlogPostDetail(params.slug)
  if (detail) {
    const {body, article} = blogDetailContent(detail, language)
    return {post: {...post, body, article}, language, returnPage}
  }

  return {post, language, returnPage}
}

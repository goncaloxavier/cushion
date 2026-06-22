import {pageFromSearchParams} from '$lib/collection-page'
import type {PageServerLoad} from './$types'

export const load: PageServerLoad = ({url}) => ({
  initialPage: pageFromSearchParams(url.searchParams),
})

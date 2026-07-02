const parseYoutubeStart = (value: string | null) => {
  if (!value) return 0
  if (/^\d+$/.test(value)) return Number(value)

  const match = value.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/)
  if (!match) return 0

  const [, hours = '0', minutes = '0', seconds = '0'] = match
  return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds)
}

export const youtubeDetails = (url: string | undefined) => {
  if (!url) return undefined

  try {
    const parsed = new URL(url)
    const hostname = parsed.hostname.replace(/^www\./, '')
    let id = ''

    if (hostname === 'youtu.be') {
      id = parsed.pathname.split('/').filter(Boolean)[0] ?? ''
    } else if (hostname.endsWith('youtube.com')) {
      if (parsed.pathname.startsWith('/embed/')) {
        id = parsed.pathname.split('/').filter(Boolean)[1] ?? ''
      } else if (parsed.pathname.startsWith('/shorts/')) {
        id = parsed.pathname.split('/').filter(Boolean)[1] ?? ''
      } else {
        id = parsed.searchParams.get('v') ?? ''
      }
    }

    if (!/^[a-zA-Z0-9_-]{6,}$/.test(id)) return undefined

    const start = parseYoutubeStart(
      parsed.searchParams.get('t') ?? parsed.searchParams.get('start'),
    )
    return {id, start}
  } catch {
    return undefined
  }
}

type YoutubeEmbedOptions = {
  autoplay?: boolean
  controls?: boolean
  loop?: boolean
  muted?: boolean
  playsInline?: boolean
  quality?: 'large' | 'hd720' | 'hd1080' | 'highres'
}

export const youtubeEmbedUrl = (url: string | undefined, options?: YoutubeEmbedOptions) => {
  const details = youtubeDetails(url)
  if (!details) return undefined

  const params = new URLSearchParams({rel: '0'})
  if (details.start > 0) params.set('start', String(details.start))
  params.set('vq', options?.quality ?? 'highres')
  params.set('hd', '1')
  if (options?.autoplay) params.set('autoplay', '1')
  if (options?.controls === false) {
    params.set('controls', '0')
    params.set('disablekb', '1')
    params.set('fs', '0')
    params.set('iv_load_policy', '3')
    params.set('modestbranding', '1')
  }
  if (options?.loop) {
    params.set('loop', '1')
    params.set('playlist', details.id)
  }
  if (options?.muted) params.set('mute', '1')
  if (options?.playsInline) params.set('playsinline', '1')

  return `https://www.youtube-nocookie.com/embed/${details.id}?${params.toString()}`
}

export const youtubeThumbnailUrl = (url: string | undefined) => {
  const details = youtubeDetails(url)
  return details ? `https://i.ytimg.com/vi/${details.id}/hqdefault.jpg` : undefined
}

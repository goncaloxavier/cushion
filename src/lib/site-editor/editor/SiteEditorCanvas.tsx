import React, {useEffect, useMemo, useRef, useState} from 'react'
import type {BuilderViewport} from '$lib/builder/types'

type Props = {
  route: string
  viewport: BuilderViewport
  refreshToken: number
  previewReady: boolean
  onFrame: (frame: HTMLIFrameElement | null) => void
  onRouteChange: (route: string) => void
}

const previewRouteKey = (value: string | URL) => {
  const url = value instanceof URL ? new URL(value) : new URL(value, window.location.origin)
  url.searchParams.delete('__builder')
  url.searchParams.delete('__editorRefresh')
  url.searchParams.sort()
  return `${url.pathname}${url.search}`
}

export function SiteEditorCanvas({
  route,
  viewport,
  refreshToken,
  previewReady,
  onFrame,
  onRouteChange,
}: Props) {
  const frameRef = useRef<HTMLIFrameElement>(null)
  const previousRefreshToken = useRef(refreshToken)
  const [loading, setLoading] = useState(true)
  const requestedSource = useMemo(() => {
    const url = new URL(route || '/', window.location.origin)
    url.searchParams.set('lang', 'pt')
    url.searchParams.set('__builder', '1')
    url.searchParams.set('__editorRefresh', String(refreshToken))
    return `${url.pathname}${url.search}`
  }, [refreshToken, route])
  const [source, setSource] = useState(requestedSource)

  useEffect(() => {
    onFrame(frameRef.current)
    return () => onFrame(null)
  }, [onFrame])

  useEffect(() => {
    const forceRefresh = previousRefreshToken.current !== refreshToken
    previousRefreshToken.current = refreshToken

    if (!forceRefresh) {
      try {
        const current = frameRef.current?.contentWindow?.location.href
        if (current && previewRouteKey(current) === previewRouteKey(requestedSource)) return
      } catch {
        // The preview is same-origin in normal operation; reload safely if it is not.
      }
    }

    setLoading(true)
    setSource(requestedSource)
  }, [refreshToken, requestedSource])

  // `loading` is cleared by the iframe's onLoad, which never fires if the
  // preview request hangs or the frame is never actually renavigated. Without a
  // stop the overlay covers the canvas indefinitely and the editor reads as
  // frozen. Uncovering a frame that is still painting is the better failure.
  useEffect(() => {
    if (!loading) return
    const timer = window.setTimeout(() => setLoading(false), 20_000)
    return () => window.clearTimeout(timer)
  }, [loading, source])

  return (
    <main className="site-editor-canvas">
      <div className={`site-editor-frame-stage is-${viewport}`}>
        {!previewReady ? (
          <div className="site-editor-preview-warning">
            Configure o token de leitura para ativar a edição direta sobre a página.
          </div>
        ) : null}
        <div className={`site-editor-frame-wrap${loading ? ' is-loading' : ''}`}>
          <iframe
            ref={frameRef}
            title={`Pré-visualização de ${route || '/'}`}
            src={source}
            onLoad={() => {
              setLoading(false)
              try {
                const current = frameRef.current?.contentWindow?.location
                if (current) onRouteChange(`${current.pathname}${current.search}`)
              } catch {
                // The editor preview is same-origin; route messages cover any exceptional load.
              }
            }}
          />
          {loading ? (
            <div className="site-editor-frame-loading" role="status">
              <span />A atualizar a página…
            </div>
          ) : null}
        </div>
      </div>
    </main>
  )
}

import {RefreshIcon} from '@sanity/icons/Refresh'
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
  const retryAttempt = useRef(0)
  const [loading, setLoading] = useState(true)
  const [loadTimedOut, setLoadTimedOut] = useState(false)
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

    setLoadTimedOut(false)
    setLoading(true)
    setSource(requestedSource)
  }, [refreshToken, requestedSource])

  // Keep a stalled navigation covered: the iframe can still contain the
  // previously selected page while the editor has already opened another
  // document. Exposing that stale page would make the two sides look connected
  // when they are not.
  useEffect(() => {
    if (!loading) return
    const timer = window.setTimeout(() => setLoadTimedOut(true), 20_000)
    return () => window.clearTimeout(timer)
  }, [loading, source])

  const retryPreview = () => {
    const url = new URL(source, window.location.origin)
    retryAttempt.current += 1
    url.searchParams.set('__editorRefresh', `${refreshToken}-${retryAttempt.current}`)
    setLoadTimedOut(false)
    setLoading(true)
    setSource(`${url.pathname}${url.search}`)
  }

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
              setLoadTimedOut(false)
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
            <div
              className={`site-editor-frame-loading${loadTimedOut ? ' is-timeout' : ''}`}
              role={loadTimedOut ? 'alert' : 'status'}
            >
              {loadTimedOut ? (
                <>
                  <strong>A pré-visualização não respondeu</strong>
                  <p>A página anterior continua protegida. Tente carregá-la novamente.</p>
                  <button type="button" onClick={retryPreview}>
                    <RefreshIcon /> Tentar novamente
                  </button>
                </>
              ) : (
                <>
                  <span aria-hidden="true" />A atualizar a página…
                </>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  )
}

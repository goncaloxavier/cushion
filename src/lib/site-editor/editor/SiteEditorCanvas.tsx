import React, {useEffect, useMemo, useRef, useState} from 'react'
import type {BuilderViewport} from '$lib/builder/types'

type Props = {
  route: string
  viewport: BuilderViewport
  refreshToken: number
  previewReady: boolean
  onFrame: (frame: HTMLIFrameElement | null) => void
}

export function SiteEditorCanvas({
  route,
  viewport,
  refreshToken,
  previewReady,
  onFrame,
}: Props) {
  const frameRef = useRef<HTMLIFrameElement>(null)
  const [loading, setLoading] = useState(true)
  const source = useMemo(() => {
    const url = new URL(route || '/', window.location.origin)
    url.searchParams.set('lang', 'pt')
    url.searchParams.set('__builder', '1')
    url.searchParams.set('__editorRefresh', String(refreshToken))
    return `${url.pathname}${url.search}`
  }, [refreshToken, route])

  useEffect(() => {
    onFrame(frameRef.current)
    return () => onFrame(null)
  }, [onFrame])

  useEffect(() => setLoading(true), [source])

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
            onLoad={() => setLoading(false)}
          />
          {loading ? (
            <div className="site-editor-frame-loading" role="status">
              <span />
              A atualizar a página…
            </div>
          ) : null}
        </div>
      </div>
    </main>
  )
}

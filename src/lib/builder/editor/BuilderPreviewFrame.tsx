import React, {useEffect, useRef} from 'react'
import type {
  BuilderPage,
  BuilderSiteSettings,
  BuilderViewport,
} from '../types'

type BuilderPreviewFrameProps = {
  page: BuilderPage
  settings?: BuilderSiteSettings
  viewport: BuilderViewport
  mode: 'legacy' | 'builder'
  selectedSectionKey?: string
  previewReady: boolean
  onSelectSection: (key: string) => void
}

const previewUrl = (page: BuilderPage, mode: 'legacy' | 'builder') => {
  const route = page.route.startsWith('/') ? page.route : '/'
  const separator = route.includes('?') ? '&' : '?'
  return `${route}${separator}lang=pt&__builder=1&__view=${mode}`
}

export function BuilderPreviewFrame({
  page,
  settings,
  viewport,
  mode,
  selectedSectionKey,
  previewReady,
  onSelectSection,
}: BuilderPreviewFrameProps) {
  const frame = useRef<HTMLIFrameElement>(null)
  const src = previewUrl(page, mode)

  const sendState = () => {
    if (mode !== 'builder') return
    frame.current?.contentWindow?.postMessage(
      {type: 'df4y:builder-state', page, settings, selectedSectionKey},
      window.location.origin,
    )
  }

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) {
        return
      }
      if (event.data?.type === 'df4y:builder-ready') sendState()
      if (event.data?.type === 'df4y:builder-select' && typeof event.data.sectionKey === 'string') {
        onSelectSection(event.data.sectionKey)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  })

  useEffect(sendState, [mode, page, selectedSectionKey, settings])

  useEffect(() => {
    if (mode !== 'builder') return
    frame.current?.contentWindow?.postMessage(
      {type: 'df4y:builder-focus', sectionKey: selectedSectionKey},
      window.location.origin,
    )
  }, [mode, selectedSectionKey])

  if (!previewReady) {
    return (
      <div className="df4y-builder-preview-error">
        <strong>Pré-visualização indisponível</strong>
        <p>Configure o token do Sanity e atualize esta página.</p>
      </div>
    )
  }

  return (
    <div className={`df4y-builder-device is-${viewport} has-real-site`}>
      <iframe
        ref={frame}
        key={src}
        className="df4y-builder-real-frame"
        src={src}
        title={`${mode === 'legacy' ? 'Site atual' : 'Construtor'}: ${page.title}`}
        onLoad={sendState}
      />
    </div>
  )
}

import React from 'react'

export type MediaUploadStatus = {
  key: string
  phase: 'preparing' | 'uploading' | 'processing' | 'done' | 'error'
  fileName: string
  percent: number
  message?: string
}

export function MediaUploadProgress({status}: {status?: MediaUploadStatus}) {
  if (!status) return null

  const label =
    status.phase === 'preparing'
      ? 'A preparar o envio'
      : status.phase === 'uploading'
        ? `A enviar o ficheiro · ${status.percent}%`
        : status.phase === 'processing'
          ? 'Envio concluído. A processar o ficheiro…'
          : status.phase === 'done'
            ? 'Ficheiro pronto'
            : status.message || 'Não foi possível carregar o ficheiro'
  const progress =
    status.phase === 'preparing'
      ? 2
      : status.phase === 'uploading'
        ? status.percent
        : status.phase === 'processing' || status.phase === 'done'
          ? 100
          : 0

  return (
    <div
      className={`site-page-upload-progress is-${status.phase}`}
      role="status"
      aria-live="polite"
      aria-label={`${label}. ${status.fileName}`}
    >
      <span>
        <strong>{label}</strong>
        <small>{status.fileName}</small>
      </span>
      {status.phase !== 'error' ? (
        <div
          role="progressbar"
          aria-label="Progresso do carregamento"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <i style={{width: `${progress}%`}} />
        </div>
      ) : null}
    </div>
  )
}

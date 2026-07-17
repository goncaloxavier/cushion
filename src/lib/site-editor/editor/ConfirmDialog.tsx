import React, {useEffect, useRef} from 'react'
import {createPortal} from 'react-dom'
import {TrashIcon} from '@sanity/icons/Trash'

type Props = {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  busy = false,
  onConfirm,
  onCancel,
}: Props) {
  const cancelButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onCancel()
    }
    document.addEventListener('keydown', handleKeydown)
    window.setTimeout(() => cancelButton.current?.focus())
    return () => {
      document.removeEventListener('keydown', handleKeydown)
      previous?.focus()
    }
  }, [busy, onCancel, open])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="site-editor-confirm-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel()
      }}
    >
      <section
        className="site-editor-confirm"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="site-editor-confirm-title"
        aria-describedby="site-editor-confirm-description"
      >
        <i className="site-editor-confirm-icon" aria-hidden="true">
          <TrashIcon />
        </i>
        <div className="site-editor-confirm-copy">
          <small>Ação permanente</small>
          <strong id="site-editor-confirm-title">{title}</strong>
          <p id="site-editor-confirm-description">{description}</p>
        </div>
        <div className="site-editor-confirm-actions">
          <button ref={cancelButton} type="button" disabled={busy} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className="is-danger" type="button" disabled={busy} onClick={onConfirm}>
            {busy ? 'A eliminar…' : confirmLabel}
          </button>
        </div>
      </section>
    </div>,
    document.body,
  )
}

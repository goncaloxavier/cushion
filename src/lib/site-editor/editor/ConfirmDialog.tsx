import React, {useEffect, useRef} from 'react'
import {createPortal} from 'react-dom'
import {RefreshIcon} from '@sanity/icons/Refresh'
import {TrashIcon} from '@sanity/icons/Trash'

type Props = {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  busy?: boolean
  busyLabel?: string
  eyebrow?: string
  tone?: 'danger' | 'warning'
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
  busyLabel = 'A eliminar…',
  eyebrow = 'Ação permanente',
  tone = 'danger',
  onConfirm,
  onCancel,
}: Props) {
  const cancelButton = useRef<HTMLButtonElement>(null)
  const dialog = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) {
        onCancel()
        return
      }
      if (event.key !== 'Tab') return
      const controls = Array.from(
        dialog.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      )
      if (!controls.length) return
      const first = controls[0]
      const last = controls.at(-1)
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
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
        ref={dialog}
        className={`site-editor-confirm is-${tone}`}
        role="alertdialog"
        aria-modal="true"
        aria-busy={busy}
        aria-labelledby="site-editor-confirm-title"
        aria-describedby="site-editor-confirm-description"
      >
        <i className="site-editor-confirm-icon" aria-hidden="true">
          {tone === 'warning' ? <RefreshIcon /> : <TrashIcon />}
        </i>
        <div className="site-editor-confirm-copy">
          <small>{eyebrow}</small>
          <strong id="site-editor-confirm-title">{title}</strong>
          <p id="site-editor-confirm-description">{description}</p>
        </div>
        <div className="site-editor-confirm-actions">
          <button ref={cancelButton} type="button" disabled={busy} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className={`is-${tone}`} type="button" disabled={busy} onClick={onConfirm}>
            {busy ? busyLabel : confirmLabel}
          </button>
        </div>
      </section>
    </div>,
    document.body,
  )
}

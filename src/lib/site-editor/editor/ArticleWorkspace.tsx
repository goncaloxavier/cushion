import React, {useEffect, useId, useRef} from 'react'
import {createPortal} from 'react-dom'
import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {DocumentTextIcon} from '@sanity/icons/DocumentText'
import {getEditorValue} from '../path'
import type {SiteEditorDocument, SiteEditorSaveState} from '../types'
import {ArticleEditor} from './ArticleEditor'

type Asset = {id: string; url: string}

type Props = {
  document: SiteEditorDocument
  documentTitle: string
  fieldLabel: string
  path: string
  projectId: string
  dataset: string
  saveState: SiteEditorSaveState
  returnFocus?: HTMLElement
  onChange: (path: string, value: unknown) => void
  onUpload: (file: File, kind: 'image' | 'video') => Promise<Asset>
  onClose: () => void
}

const saveLabels: Record<SiteEditorSaveState, string> = {
  idle: 'Sem alterações',
  dirty: 'Alterações por guardar',
  saving: 'A guardar…',
  saved: 'Guardado',
  error: 'Erro ao guardar',
  conflict: 'Conflito de edição',
}

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function ArticleWorkspace({
  document: source,
  documentTitle,
  fieldLabel,
  path,
  projectId,
  dataset,
  saveState,
  returnFocus,
  onChange,
  onUpload,
  onClose,
}: Props) {
  const titleId = useId()
  const workspace = useRef<HTMLDivElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButton.current?.focus({preventScroll: true})

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        onClose()
        return
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
        // The mounted rich-text canvas only reads the document's article value once,
        // at mount — it never picks up a later whole-document undo/redo. Keep native
        // undo working inside the canvas (and in any plain input here) but swallow
        // the keystroke everywhere else in the workspace so it can't reach the
        // document-level history and desync from what the canvas is still showing.
        const target = event.target as HTMLElement | null
        const tag = target?.tagName
        if (tag !== 'INPUT' && tag !== 'TEXTAREA' && !target?.isContentEditable) {
          event.preventDefault()
          event.stopPropagation()
        }
        return
      }
      if (event.key !== 'Tab' || !workspace.current) return

      const focusable = Array.from(
        workspace.current.querySelectorAll<HTMLElement>(focusableSelector),
      ).filter((element) => element.offsetParent !== null)
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeydown, true)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeydown, true)
      returnFocus?.focus({preventScroll: true})
    }
  }, [onClose, returnFocus])

  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      ref={workspace}
      className="site-editor-article-workspace"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <header className="site-editor-article-workspace-head">
        <div className="site-editor-article-workspace-title">
          <DocumentTextIcon />
          <span>
            <small>{fieldLabel}</small>
            <strong id={titleId}>{documentTitle}</strong>
          </span>
        </div>
        <div className="site-editor-article-workspace-actions">
          <span className={`site-editor-save-state is-${saveState}`} aria-live="polite">
            <i /> {saveLabels[saveState]}
          </span>
          <button ref={closeButton} type="button" onClick={onClose}>
            <CheckmarkIcon /> Concluir
          </button>
        </div>
      </header>
      <main className="site-editor-article-workspace-body">
        <div className="site-editor-article-workspace-page">
          <ArticleEditor
            value={getEditorValue(source, path)}
            documentKey={String(source._id || `${source._type}:${path}`)}
            projectId={projectId}
            dataset={dataset}
            onChange={(next) => onChange(path, next)}
            onUpload={onUpload}
          />
        </div>
      </main>
    </div>,
    document.body,
  )
}

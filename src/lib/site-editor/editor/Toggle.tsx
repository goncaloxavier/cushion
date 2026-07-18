import React from 'react'
import {CheckmarkIcon} from '@sanity/icons/Checkmark'

export function Toggle({
  checked,
  label = 'Ativar opção',
  onChange,
}: {
  checked: boolean
  label?: string
  onChange: (checked: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`site-editor-toggle${checked ? ' is-on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <i>{checked ? <CheckmarkIcon /> : null}</i>
      <span>{checked ? 'Sim' : 'Não'}</span>
    </button>
  )
}

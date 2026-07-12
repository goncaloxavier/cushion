import {useState} from 'react'
import {useToast} from '@sanity/ui'
import {TranslateIcon} from '@sanity/icons/Translate'
import type {DocumentActionComponent, DocumentActionProps} from 'sanity'

export const RetranslateAction: DocumentActionComponent = (props: DocumentActionProps) => {
  const [running, setRunning] = useState(false)
  const toast = useToast()

  return {
    label: running ? 'A traduzir…' : 'Retraduzir (PT → EN/ES)',
    icon: TranslateIcon,
    disabled: running || !props.published,
    onHandle: async () => {
      setRunning(true)
      try {
        const origin = process.env.SANITY_STUDIO_PREVIEW_ORIGIN
        const secret = process.env.SANITY_STUDIO_TRANSLATE_SECRET
        const response = await fetch(`${origin}/api/sanity/translate`, {
          method: 'POST',
          headers: {'content-type': 'application/json', 'x-sanity-translate-secret': secret ?? ''},
          body: JSON.stringify({_id: props.id}),
        })
        const data = (await response.json()) as {ok?: boolean; changed?: number}
        toast.push({
          status: response.ok && data.ok ? 'success' : 'error',
          title:
            response.ok && data.ok
              ? `Traduzido (${data.changed ?? 0} campo${data.changed === 1 ? '' : 's'})`
              : 'Falha na tradução',
        })
      } catch {
        toast.push({status: 'error', title: 'Falha na tradução'})
      } finally {
        setRunning(false)
        props.onComplete()
      }
    },
  }
}

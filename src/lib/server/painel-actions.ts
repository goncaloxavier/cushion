import {fail, type Action, type RequestEvent} from '@sveltejs/kit'
import type {ProfileStatus, SubmissionStatus} from '$lib/painel'
import {appendProfileNote, appendSubmissionNote, setProfileStatus, setSubmissionStatus} from './crm-admin'
import {csrfOk, sameOriginOk} from './form-guard'

// Shared SvelteKit form actions for the /painel management pages. Every action
// re-checks locals.staff (defense in depth on top of the hooks guard).

const csrfCookieName = 'df4y_painel_csrf'

const painelFormData = async (event: RequestEvent) => {
  if (!event.locals.staff) {
    return {error: fail(401, {message: 'Sessão expirada.'})}
  }

  const data = await event.request.formData()
  const csrfToken = String(data.get('csrfToken') ?? '')

  if (!sameOriginOk(event.request.headers.get('origin'), event.request.headers.get('referer'), event.url.origin)) {
    return {error: fail(403, {message: 'Não foi possível validar a origem do pedido.'})}
  }
  if (!csrfOk(event.cookies.get(csrfCookieName), csrfToken)) {
    return {error: fail(403, {message: 'Atualize a página e tente novamente.'})}
  }

  return {data}
}

const setSubmissionStatusAction: Action = async (event) => {
  const guarded = await painelFormData(event)
  if (guarded.error) return guarded.error
  const {data} = guarded
  const id = String(data.get('id') ?? '')
  const status = String(data.get('status') ?? '') as SubmissionStatus
  if (id) await setSubmissionStatus(id, status)
  return {ok: true}
}

const addSubmissionNoteAction: Action = async (event) => {
  const guarded = await painelFormData(event)
  if (guarded.error) return guarded.error
  const {data} = guarded
  const id = String(data.get('id') ?? '')
  const note = String(data.get('note') ?? '').slice(0, 2000)
  if (id && note.trim()) await appendSubmissionNote(id, note, event.locals.staff!.name)
  return {ok: true}
}

export const submissionManageActions = {
  setStatus: setSubmissionStatusAction,
  addNote: addSubmissionNoteAction,
}

const setProfileStatusAction: Action = async (event) => {
  const guarded = await painelFormData(event)
  if (guarded.error) return guarded.error
  const {data} = guarded
  const id = String(data.get('id') ?? '')
  const status = String(data.get('status') ?? '') as ProfileStatus
  if (id) await setProfileStatus(id, status)
  return {ok: true}
}

const addProfileNoteAction: Action = async (event) => {
  const guarded = await painelFormData(event)
  if (guarded.error) return guarded.error
  const {data} = guarded
  const id = String(data.get('id') ?? '')
  const note = String(data.get('note') ?? '').slice(0, 2000)
  if (id && note.trim()) await appendProfileNote(id, note, event.locals.staff!.name)
  return {ok: true}
}

export const profileManageActions = {
  setProfileStatus: setProfileStatusAction,
  addProfileNote: addProfileNoteAction,
  setStatus: setSubmissionStatusAction,
  addNote: addSubmissionNoteAction,
}

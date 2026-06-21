import {fail, type Action} from '@sveltejs/kit'
import type {ProfileStatus, SubmissionStatus} from '$lib/painel'
import {appendProfileNote, appendSubmissionNote, setProfileStatus, setSubmissionStatus} from './crm-admin'

// Shared SvelteKit form actions for the /painel management pages. Every action
// re-checks locals.staff (defense in depth on top of the hooks guard).

const setSubmissionStatusAction: Action = async ({request, locals}) => {
  if (!locals.staff) return fail(401, {message: 'Sessão expirada.'})
  const data = await request.formData()
  const id = String(data.get('id') ?? '')
  const status = String(data.get('status') ?? '') as SubmissionStatus
  if (id) await setSubmissionStatus(id, status)
  return {ok: true}
}

const addSubmissionNoteAction: Action = async ({request, locals}) => {
  if (!locals.staff) return fail(401, {message: 'Sessão expirada.'})
  const data = await request.formData()
  const id = String(data.get('id') ?? '')
  const note = String(data.get('note') ?? '').slice(0, 2000)
  if (id && note.trim()) await appendSubmissionNote(id, note, locals.staff.name)
  return {ok: true}
}

export const submissionManageActions = {
  setStatus: setSubmissionStatusAction,
  addNote: addSubmissionNoteAction,
}

const setProfileStatusAction: Action = async ({request, locals}) => {
  if (!locals.staff) return fail(401, {message: 'Sessão expirada.'})
  const data = await request.formData()
  const id = String(data.get('id') ?? '')
  const status = String(data.get('status') ?? '') as ProfileStatus
  if (id) await setProfileStatus(id, status)
  return {ok: true}
}

const addProfileNoteAction: Action = async ({request, locals}) => {
  if (!locals.staff) return fail(401, {message: 'Sessão expirada.'})
  const data = await request.formData()
  const id = String(data.get('id') ?? '')
  const note = String(data.get('note') ?? '').slice(0, 2000)
  if (id && note.trim()) await appendProfileNote(id, note, locals.staff.name)
  return {ok: true}
}

export const profileManageActions = {
  setProfileStatus: setProfileStatusAction,
  addProfileNote: addProfileNoteAction,
  setStatus: setSubmissionStatusAction,
  addNote: addSubmissionNoteAction,
}

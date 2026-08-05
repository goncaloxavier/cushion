import {fail, type Action, type RequestEvent} from '@sveltejs/kit'
import {canManageStaff} from '$lib/server/staff-auth'
import {profileStatusLabels, submissionStatusLabels, type ProfileStatus, type SubmissionStatus} from '$lib/painel'
import {
  appendProfileNote,
  appendSubmissionNote,
  getProfile,
  getSubmission,
  setProfileStatus,
  setSubmissionStatus,
} from './crm-postgres'
import {csrfOk, sameOriginOk} from './form-guard'
import {logStaffActivity} from './staff-activity'

// Shared SvelteKit form actions for the /painel management pages. Every action
// re-checks locals.staff (defense in depth on top of the hooks guard).

const csrfCookieName = 'df4y_painel_csrf'

/**
 * A person, not an identifier. Every one of these rows used to fall back to a
 * raw UUID in the Entidade column when no label was supplied, which is unusable
 * for the person reading the activity log and is the reason it was full of
 * identifiers nobody could match to anything.
 */
const personLabel = (name: string | undefined, email: string | undefined, id: string) =>
  name?.trim() || email?.trim() || id

const submissionLabel = (
  submission: {name?: string; email?: string} | null,
  id: string,
) => personLabel(submission?.name, submission?.email, id)

const painelFormData = async (event: RequestEvent) => {
  if (!event.locals.staff) {
    return {error: fail(401, {message: 'Sessão expirada.'})}
  }
  if (!canManageStaff(event.locals.staff)) {
    return {error: fail(403, {message: 'A sua conta só tem acesso de consulta.'})}
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
  if (id) {
    await setSubmissionStatus(id, status)
    // Entidade names the person the lead came from; Detalhe says what changed.
    // The status was being written into Entidade with Detalhe left empty, so a
    // row read "Alterou o estado do pedido / Em curso / -" and never said whose
    // enquiry it was.
    const submission = await getSubmission(id)
    await logStaffActivity({
      staff: event.locals.staff!,
      action: 'lead.status',
      entityType: 'submission',
      entityId: id,
      entityLabel: submissionLabel(submission, id),
      detail: submissionStatusLabels[status] ?? status,
    })
  }
  return {ok: true}
}

const addSubmissionNoteAction: Action = async (event) => {
  const guarded = await painelFormData(event)
  if (guarded.error) return guarded.error
  const {data} = guarded
  const id = String(data.get('id') ?? '')
  const note = String(data.get('note') ?? '').slice(0, 2000)
  if (id && note.trim()) {
    await appendSubmissionNote(id, note, event.locals.staff!.name)
    const submission = await getSubmission(id)
    await logStaffActivity({
      staff: event.locals.staff!,
      action: 'lead.note',
      entityType: 'submission',
      entityId: id,
      entityLabel: submissionLabel(submission, id),
      detail: note.slice(0, 200),
    })
  }
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
  if (id) {
    await setProfileStatus(id, status)
    const profile = await getProfile(id)
    await logStaffActivity({
      staff: event.locals.staff!,
      action: 'profile.status',
      entityType: 'profile',
      entityId: id,
      entityLabel: personLabel(profile?.name, profile?.email, id),
      detail: profileStatusLabels[status] ?? status,
    })
  }
  return {ok: true}
}

const addProfileNoteAction: Action = async (event) => {
  const guarded = await painelFormData(event)
  if (guarded.error) return guarded.error
  const {data} = guarded
  const id = String(data.get('id') ?? '')
  const note = String(data.get('note') ?? '').slice(0, 2000)
  if (id && note.trim()) {
    await appendProfileNote(id, note, event.locals.staff!.name)
    const profile = await getProfile(id)
    await logStaffActivity({
      staff: event.locals.staff!,
      action: 'profile.note',
      entityType: 'profile',
      entityId: id,
      entityLabel: personLabel(profile?.name, profile?.email, id),
      detail: note.slice(0, 200),
    })
  }
  return {ok: true}
}

export const profileManageActions = {
  setProfileStatus: setProfileStatusAction,
  addProfileNote: addProfileNoteAction,
  setStatus: setSubmissionStatusAction,
  addNote: addSubmissionNoteAction,
}

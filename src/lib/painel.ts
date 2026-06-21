// Shared (client-safe) constants for the /painel backend. No server imports here
// so components can use these without pulling the CRM client into the bundle.

export const submissionStatuses = ['new', 'read', 'inProgress', 'resolved', 'spam', 'archived'] as const
export type SubmissionStatus = (typeof submissionStatuses)[number]

export const profileStatuses = ['new', 'contacted', 'qualified', 'customer', 'archived'] as const
export type ProfileStatus = (typeof profileStatuses)[number]

export const submissionStatusLabels: Record<string, string> = {
  new: 'Novo',
  read: 'Lido',
  inProgress: 'Em acompanhamento',
  resolved: 'Resolvido',
  spam: 'Spam',
  archived: 'Arquivado',
}

export const profileStatusLabels: Record<string, string> = {
  new: 'Novo',
  contacted: 'Contactado',
  qualified: 'Qualificado',
  customer: 'Cliente',
  archived: 'Arquivado',
}

export const sourceLabel = (source: string) => (source === 'catalogue' ? 'Catálogo' : 'Contacto')

export const fmtDateTime = (iso?: string) => (iso ? new Date(iso).toLocaleString('pt-PT') : '')
export const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('pt-PT') : '')

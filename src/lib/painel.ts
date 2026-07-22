// Shared (client-safe) constants for the /painel backend. No server imports here
// so components can use these without pulling the CRM client into the bundle.

export const submissionStatuses = ['new', 'read', 'inProgress', 'resolved', 'spam', 'archived'] as const
export type SubmissionStatus = (typeof submissionStatuses)[number]

export const profileStatuses = ['new', 'contacted', 'qualified', 'customer', 'archived'] as const
export type ProfileStatus = (typeof profileStatuses)[number]

export const orderStatuses = [
  'pending_payment_link',
  'payment_link_sent',
  'paid',
  'in_preparation',
  'shipped',
  'completed',
  'cancelled',
] as const
export type OrderStatus = (typeof orderStatuses)[number]

export const submissionStatusLabels: Record<string, string> = {
  new: 'Novo',
  read: 'Lido',
  inProgress: 'Em acompanhamento',
  resolved: 'Resolvido',
  spam: 'Spam',
  archived: 'Arquivado',
}

export const orderStatusLabels: Record<string, string> = {
  pending_payment_link: 'Pendente de link de pagamento',
  payment_link_sent: 'Link de pagamento enviado',
  paid: 'Pago',
  in_preparation: 'Em preparação',
  shipped: 'Enviado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
}

export const paymentStatusLabels: Record<string, string> = {
  pending: 'Pendente',
  payment_link_created: 'Link de pagamento criado',
  paid: 'Pago',
  failed: 'Falhado',
  cancelled: 'Cancelado',
}

export const paymentMethodLabels: Record<string, string> = {
  mbway: 'MB WAY',
  multibanco: 'Multibanco',
  card: 'Cartão',
}

export const profileStatusLabels: Record<string, string> = {
  new: 'Novo',
  contacted: 'Contactado',
  qualified: 'Qualificado',
  customer: 'Cliente',
  archived: 'Arquivado',
}

export type StatusTone = 'new' | 'progress' | 'done' | 'danger' | 'accent' | undefined

const submissionTones: Record<string, StatusTone> = {
  new: 'new',
  inProgress: 'progress',
  resolved: 'done',
  spam: 'danger',
}

const profileTones: Record<string, StatusTone> = {
  new: 'new',
  qualified: 'progress',
  customer: 'done',
}

const orderTones: Record<string, StatusTone> = {
  pending_payment_link: 'new',
  payment_link_sent: 'progress',
  paid: 'progress',
  in_preparation: 'progress',
  shipped: 'progress',
  completed: 'done',
  cancelled: 'danger',
}

export const submissionStatusTone = (status: string): StatusTone => submissionTones[status]
export const profileStatusTone = (status: string): StatusTone => profileTones[status]
export const orderStatusTone = (status: string): StatusTone => orderTones[status]

export const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  staff: 'Equipa',
}

export const roleDescriptions: Record<string, string> = {
  admin: 'Acesso total — pode editar, publicar, apagar e gerir a equipa.',
  staff: 'Apenas consulta — sem permissão para guardar alterações.',
}

// Deliberately asymmetric: admin gets a visible identity tag, staff (the
// default/plain tier) gets no tone — matching how every other "no special
// state" case already renders in this tag system.
export const roleTone = (role: string): StatusTone => (role === 'admin' ? 'accent' : undefined)

export const sourceLabel = (source: string) => {
  if (source === 'catalogue') return 'Catálogo'
  if (source === 'store') return 'Loja'
  if (source === 'product') return 'Produto'
  if (source === 'case') return 'Caso'
  if (source === 'blog') return 'Blog'
  return 'Contacto'
}

export const fmtDateTime = (iso?: string) => (iso ? new Date(iso).toLocaleString('pt-PT') : '')
export const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('pt-PT') : '')

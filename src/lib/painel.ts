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

export const activeTone = (active: boolean): StatusTone => (active ? 'done' : 'danger')

export const activityActionLabels: Record<string, string> = {
  'order.status': 'Alterou o estado da encomenda',
  'order.note': 'Adicionou uma nota à encomenda',
  'lead.status': 'Alterou o estado do pedido de contacto',
  'lead.note': 'Adicionou uma nota ao pedido de contacto',
  'profile.status': 'Alterou o estado do perfil',
  'profile.note': 'Adicionou uma nota ao perfil',
  'site.publish': 'Publicou conteúdo do site',
  'site.delete': 'Eliminou conteúdo do site',
  'staff.create': 'Criou uma conta de equipa',
  'staff.role': 'Alterou a função de uma conta',
  'staff.active': 'Alterou o estado de uma conta',
  'staff.password': 'Repôs a palavra-passe de uma conta',
  'settings.deepl_key': 'Definiu a chave da DeepL',
  'settings.deepl_key_clear': 'Removeu a chave da DeepL',
}

/**
 * Sanity type names, in the words the backoffice uses everywhere else. The
 * activity log printed the raw type -- "productCategory", "sitePage" -- into the
 * Entidade column, which is the one place in the backoffice a person was shown
 * the code's vocabulary instead of their own.
 */
export const siteDocumentTypeLabels: Record<string, string> = {
  sitePage: 'Página',
  productCategory: 'Produto',
  storeProduct: 'Artigo da Loja',
  storeCategory: 'Categoria da Loja',
  caseStudy: 'Caso de estudo',
  blogPost: 'Artigo do blog',
  siteLanding: 'Conteúdo do site',
  siteContent: 'Conteúdo do site',
}

export const siteDocumentTypeLabel = (type: string | undefined) =>
  (type && siteDocumentTypeLabels[type]) || 'Conteúdo'

/**
 * What kind of thing a row is about, for when the row cannot name the thing
 * itself.
 */
const activityEntityTypeLabels: Record<string, string> = {
  order: 'Encomenda',
  submission: 'Pedido de contacto',
  profile: 'Perfil de cliente',
  staff: 'Conta de equipa',
  siteDocument: 'Conteúdo do site',
  settings: 'Definições',
}

const looksLikeIdentifier = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value) ||
  /^(drafts\.)?[a-z]+[-.][A-Za-z0-9-]{8,}$/.test(value)

/**
 * The Entidade column, resolved at display time rather than trusted from the
 * row. Fixing the call sites only fixes rows written afterwards; every row
 * already in the table was recorded under the old scheme and still holds a bare
 * UUID or a Sanity type name. The person reading this page cannot be asked to
 * know what "productCategory" is, so nothing here is ever printed raw: an
 * unusable value falls back to naming the kind of thing the row is about.
 */
export const activityEntityLabel = (entry: {
  entityType: string
  entityId: string | null
  entityLabel: string
}) => {
  const label = entry.entityLabel?.trim() ?? ''
  if (label) {
    if (siteDocumentTypeLabels[label]) return siteDocumentTypeLabels[label]
    if (!looksLikeIdentifier(label)) return label
  }
  return activityEntityTypeLabels[entry.entityType] ?? 'Registo'
}

/**
 * Unknown actions are recorded as dotted keys like `order.status`. Showing that
 * to the client is showing them the code, so an unmapped action says only that
 * something was recorded; the raw key stays available as a tooltip for whoever
 * is debugging it.
 */
export const activityActionLabel = (action: string) =>
  activityActionLabels[action] ?? 'Registou uma alteração'

const statusLabelsForAction: Record<string, Record<string, string>> = {
  'order.status': orderStatusLabels,
  'lead.status': submissionStatusLabels,
  'profile.status': profileStatusLabels,
}

/**
 * Both columns for a row, repaired together.
 *
 * The old scheme wrote the new status into Entidade and left Detalhe empty, so
 * historical rows read "Alterou o estado do pedido / Em curso / —": nothing is
 * in code, but the status is in the column that should name whose enquiry it
 * was, and the column that should carry it is blank. Those rows are recognisable
 * — a status action, an empty Detalhe, and an Entidade that is exactly one of
 * that action's status labels — so the two values are put back in the right
 * order for display. Nothing is rewritten in the database; the log is an audit
 * trail and stays as recorded.
 */
export const activityColumns = (entry: {
  action: string
  entityType: string
  entityId: string | null
  entityLabel: string
  detail: string
}) => {
  const detail = entry.detail?.trim() ?? ''
  const label = entry.entityLabel?.trim() ?? ''
  const statusLabels = statusLabelsForAction[entry.action]

  if (!detail && label && statusLabels && Object.values(statusLabels).includes(label)) {
    return {
      entity: activityEntityLabel({...entry, entityLabel: ''}),
      detail: label,
    }
  }

  return {entity: activityEntityLabel(entry), detail: detail || '—'}
}

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

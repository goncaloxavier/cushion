<script lang="ts">
  import type {SubmissionRow} from '$lib/server/crm-admin'

  let {row, statuses}: {row: SubmissionRow; statuses: readonly string[]} = $props()

  const statusLabels: Record<string, string> = {
    new: 'Novo',
    read: 'Lido',
    inProgress: 'Em acompanhamento',
    resolved: 'Resolvido',
    spam: 'Spam',
    archived: 'Arquivado',
  }

  const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleString('pt-PT') : '')
</script>

<article class="req-card" data-status={row.status}>
  <header class="req-card-head">
    <div>
      <h3>{row.name}</h3>
      <p class="req-meta">{fmtDate(row.submittedAt)}</p>
    </div>
    <span class="req-status-badge">{statusLabels[row.status] ?? row.status}</span>
  </header>

  <dl class="req-fields">
    <div><dt>Email</dt><dd><a href={`mailto:${row.email}`}>{row.email}</a></dd></div>
    {#if row.phone}
      <div><dt>Telefone</dt><dd><a href={`tel:${row.phone}`}>{row.phone}</a></dd></div>
    {/if}
    {#if row.address}
      <div><dt>Morada</dt><dd>{row.address}</dd></div>
    {/if}
    {#if row.postalCode || row.locality}
      <div><dt>Local</dt><dd>{[row.postalCode, row.locality].filter(Boolean).join(' ')}</dd></div>
    {/if}
  </dl>

  {#if row.message}
    <p class="req-message">{row.message}</p>
  {/if}

  {#if row.internalNotes}
    <pre class="req-notes">{row.internalNotes}</pre>
  {/if}

  <div class="req-actions">
    <form method="POST" action="?/setStatus" class="req-status-form">
      <input type="hidden" name="id" value={row._id} />
      <select name="status" aria-label="Estado do pedido">
        {#each statuses as status}
          <option value={status} selected={status === row.status}>{statusLabels[status] ?? status}</option>
        {/each}
      </select>
      <button type="submit">Atualizar</button>
    </form>
    <form method="POST" action="?/addNote" class="req-note-form">
      <input type="hidden" name="id" value={row._id} />
      <input name="note" placeholder="Adicionar nota interna…" maxlength="2000" aria-label="Nota interna" />
      <button type="submit">Nota</button>
    </form>
  </div>
</article>

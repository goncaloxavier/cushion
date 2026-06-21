<script lang="ts">
  import {fmtDateTime, sourceLabel, submissionStatuses, submissionStatusLabels} from '$lib/painel'

  let {data} = $props()
  const s = $derived(data.submission)
  const backHref = $derived(s.source === 'catalogue' ? '/painel/catalogo' : '/painel/contactos')
  const langLabel: Record<string, string> = {pt: 'Português', en: 'Inglês', es: 'Espanhol'}
</script>

<svelte:head>
  <title>Pedido · {s.name} | Backoffice</title>
</svelte:head>

<header class="painel-page-head">
  <a class="painel-back" href={backHref}>← Voltar à lista</a>
  <h1>Pedido de {sourceLabel(s.source).toLowerCase()}</h1>
</header>

<div class="painel-record">
  <form method="POST" action="?/setStatus" class="painel-record-section painel-record-status">
    <label class="painel-field-label" for="rec-status">Estado do pedido</label>
    <div class="painel-record-status-row">
      <select id="rec-status" name="status">
        {#each submissionStatuses as status}
          <option value={status} selected={status === s.status}>{submissionStatusLabels[status]}</option>
        {/each}
      </select>
      <input type="hidden" name="id" value={s._id} />
      <button type="submit">Guardar estado</button>
    </div>
  </form>

  <div class="painel-record-section">
    <h2 class="painel-record-title">Dados do pedido</h2>
    <div class="painel-field-grid">
      <div class="painel-field">
        <span class="painel-field-label">Nome</span>
        <span class="painel-field-value">{s.name}</span>
      </div>
      <div class="painel-field">
        <span class="painel-field-label">Email</span>
        <span class="painel-field-value"><a href={`mailto:${s.email}`}>{s.email}</a></span>
      </div>
      {#if s.phone}
        <div class="painel-field">
          <span class="painel-field-label">Telefone</span>
          <span class="painel-field-value"><a href={`tel:${s.phone}`}>{s.phone}</a></span>
        </div>
      {/if}
      {#if s.address}
        <div class="painel-field">
          <span class="painel-field-label">Morada</span>
          <span class="painel-field-value">{s.address}</span>
        </div>
      {/if}
      {#if s.postalCode}
        <div class="painel-field">
          <span class="painel-field-label">Código postal</span>
          <span class="painel-field-value">{s.postalCode}</span>
        </div>
      {/if}
      {#if s.locality}
        <div class="painel-field">
          <span class="painel-field-label">Localidade</span>
          <span class="painel-field-value">{s.locality}</span>
        </div>
      {/if}
      <div class="painel-field">
        <span class="painel-field-label">Origem</span>
        <span class="painel-field-value">{sourceLabel(s.source)}</span>
      </div>
      <div class="painel-field">
        <span class="painel-field-label">Recebido em</span>
        <span class="painel-field-value">{fmtDateTime(s.submittedAt)}</span>
      </div>
      {#if s.language}
        <div class="painel-field">
          <span class="painel-field-label">Idioma</span>
          <span class="painel-field-value">{langLabel[s.language] ?? s.language}</span>
        </div>
      {/if}
    </div>

    {#if s.message}
      <div class="painel-field painel-field-block">
        <span class="painel-field-label">Mensagem</span>
        <p class="painel-field-text">{s.message}</p>
      </div>
    {/if}
  </div>

  <div class="painel-record-section">
    <h2 class="painel-record-title">Notas internas</h2>
    {#if s.internalNotes}
      <pre class="painel-notes-log">{s.internalNotes}</pre>
    {/if}
    <form method="POST" action="?/addNote" class="painel-note-add">
      <input type="hidden" name="id" value={s._id} />
      <textarea name="note" rows="3" placeholder="Escreva uma nota interna…" maxlength="2000"></textarea>
      <button type="submit" class="painel-btn-ghost">Adicionar nota</button>
    </form>
  </div>

  {#if s.profileId}
    <p class="painel-detail-link"><a href={`/painel/perfis/${s.profileId}`}>Ver perfil do cliente →</a></p>
  {/if}
</div>

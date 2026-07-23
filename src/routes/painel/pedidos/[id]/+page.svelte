<script lang="ts">
  import {fmtDateTime, sourceLabel, submissionStatuses, submissionStatusLabels, submissionStatusTone} from '$lib/painel'

  let {data, form} = $props()
  const s = $derived(data.submission)
  const readOnly = $derived(data.staff?.role !== 'admin')
  const langLabel: Record<string, string> = {pt: 'Português', en: 'Inglês', es: 'Espanhol'}
</script>

<svelte:head>
  <title>Pedido · {s.name} | Backoffice</title>
</svelte:head>

<header class="painel-page-head">
  <div>
    <a class="painel-back" href="/painel/pedidos">← Voltar aos pedidos de contacto</a>
    <p class="painel-eyebrow">{sourceLabel(s.source)}</p>
    <h1>Pedido de {sourceLabel(s.source).toLowerCase()}</h1>
    <p class="painel-page-sub">Recebido de {s.name} em {fmtDateTime(s.submittedAt)}</p>
  </div>
  <span class="painel-tag" data-tone={submissionStatusTone(s.status)}>
    {submissionStatusLabels[s.status] ?? s.status}
  </span>
</header>

{#if readOnly}
  <p class="painel-alert" data-tone="warn">Modo de consulta — apenas administradores podem guardar alterações.</p>
{/if}
{#if form?.message}
  <p class="painel-alert" data-tone="error" role="alert">{form.message}</p>
{/if}

<div class="painel-detail-layout">
  <div class="painel-detail-main">
    <section class="painel-panel">
      <header class="painel-panel-head">
        <div>
          <p class="painel-eyebrow">Contacto</p>
          <h2>Dados do pedido</h2>
        </div>
        {#if s.profileId}<a href={`/painel/perfis/${s.profileId}`}>Ver perfil</a>{/if}
      </header>
      <div class="painel-field-grid">
        <div class="painel-field">
          <span class="painel-field-label">Nome</span>
          <p class="painel-field-value">{s.name}</p>
        </div>
        <div class="painel-field">
          <span class="painel-field-label">Email</span>
          <p class="painel-field-value"><a href={`mailto:${s.email}`}>{s.email}</a></p>
        </div>
        {#if s.phone}
          <div class="painel-field">
            <span class="painel-field-label">Telefone</span>
            <p class="painel-field-value"><a href={`tel:${s.phone}`}>{s.phone}</a></p>
          </div>
        {/if}
        {#if s.address}
          <div class="painel-field painel-field-wide">
            <span class="painel-field-label">Morada</span>
            <p class="painel-field-value">{s.address}</p>
          </div>
        {/if}
        {#if s.postalCode || s.locality}
          <div class="painel-field">
            <span class="painel-field-label">Local</span>
            <p class="painel-field-value">{[s.postalCode, s.locality].filter(Boolean).join(' ')}</p>
          </div>
        {/if}
        <div class="painel-field">
          <span class="painel-field-label">Origem</span>
          <p class="painel-field-value">{sourceLabel(s.source)}</p>
        </div>
        {#if s.language}
          <div class="painel-field">
            <span class="painel-field-label">Idioma</span>
            <p class="painel-field-value">{langLabel[s.language] ?? s.language}</p>
          </div>
        {/if}
      </div>

      {#if s.message}
        <div class="painel-message">
          <span class="painel-field-label">Mensagem</span>
          <p class="painel-field-text">{s.message}</p>
        </div>
      {/if}
    </section>
  </div>

  <aside class="painel-detail-rail">
    <form method="POST" action="?/setStatus" class="painel-panel painel-action-panel">
      <input type="hidden" name="csrfToken" value={data.painelCsrfToken} />
      <input type="hidden" name="id" value={s.id} />
      <h2 class="painel-panel-title">Estado do pedido</h2>
      <label class="painel-control" for="rec-status">
        <span>Estado atual</span>
        <select id="rec-status" name="status" class="painel-select" disabled={readOnly}>
          {#each submissionStatuses as status}
            <option value={status} selected={status === s.status}>{submissionStatusLabels[status]}</option>
          {/each}
        </select>
      </label>
      <button type="submit" class="painel-btn painel-btn-primary" disabled={readOnly}>Guardar estado</button>
    </form>

    <section class="painel-panel">
      <h2 class="painel-panel-title">Notas internas</h2>
      {#if s.internalNotes}
        <pre class="painel-notes-log">{s.internalNotes}</pre>
      {/if}
      <form method="POST" action="?/addNote" class="painel-form-stack">
        <input type="hidden" name="csrfToken" value={data.painelCsrfToken} />
        <input type="hidden" name="id" value={s.id} />
        <label class="painel-control">
          <span>Nova nota</span>
          <textarea name="note" rows="4" class="painel-textarea" maxlength="2000" disabled={readOnly}></textarea>
        </label>
        <button type="submit" class="painel-btn" disabled={readOnly}>Adicionar nota</button>
      </form>
    </section>
  </aside>
</div>

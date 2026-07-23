<script lang="ts">
  import PainelRequestTable from '$lib/components/PainelRequestTable.svelte'
  import {fmtDateTime, profileStatuses, profileStatusLabels, profileStatusTone} from '$lib/painel'

  let {data, form} = $props()
  const p = $derived(data.profile)
  const readOnly = $derived(data.staff?.role !== 'admin')
</script>

<svelte:head>
  <title>{p.name} | Backoffice</title>
</svelte:head>

<header class="painel-page-head">
  <div>
    <a class="painel-back" href="/painel/perfis">← Perfis</a>
    <p class="painel-eyebrow">Cliente</p>
    <h1>{p.name}</h1>
    <p class="painel-page-sub">{p.submissionCount ?? 0} {p.submissionCount === 1 ? 'pedido associado' : 'pedidos associados'}</p>
  </div>
  <span class="painel-tag" data-tone={profileStatusTone(p.status)}>
    {profileStatusLabels[p.status] ?? p.status}
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
          <h2>Dados do cliente</h2>
        </div>
      </header>
      <div class="painel-field-grid">
        <div class="painel-field">
          <span class="painel-field-label">Email</span>
          <p class="painel-field-value"><a href={`mailto:${p.email}`}>{p.email}</a></p>
        </div>
        {#if p.phone}
          <div class="painel-field">
            <span class="painel-field-label">Telefone</span>
            <p class="painel-field-value"><a href={`tel:${p.phone}`}>{p.phone}</a></p>
          </div>
        {/if}
        {#if p.address}
          <div class="painel-field painel-field-wide">
            <span class="painel-field-label">Morada</span>
            <p class="painel-field-value">{p.address}</p>
          </div>
        {/if}
        {#if p.postalCode || p.locality}
          <div class="painel-field">
            <span class="painel-field-label">Local</span>
            <p class="painel-field-value">{[p.postalCode, p.locality].filter(Boolean).join(' ')}</p>
          </div>
        {/if}
        <div class="painel-field">
          <span class="painel-field-label">Primeiro contacto</span>
          <p class="painel-field-value painel-mono">{fmtDateTime(p.firstSubmittedAt ?? undefined)}</p>
        </div>
        <div class="painel-field">
          <span class="painel-field-label">Último contacto</span>
          <p class="painel-field-value painel-mono">{fmtDateTime(p.lastSubmittedAt ?? undefined)}</p>
        </div>
        <div class="painel-field">
          <span class="painel-field-label">Marketing</span>
          <p class="painel-field-value">{p.marketingConsent ? 'Consentimento dado' : 'Sem consentimento'}</p>
        </div>
      </div>
    </section>

    <section class="painel-panel">
      <header class="painel-panel-head">
        <div>
          <p class="painel-eyebrow">Histórico</p>
          <h2>Pedidos deste cliente</h2>
        </div>
        <span class="painel-panel-count">{p.submissionCount ?? 0}</span>
      </header>
      <PainelRequestTable rows={p.submissions ?? []} showSource />
    </section>
  </div>

  <aside class="painel-detail-rail">
    <section class="painel-panel painel-action-panel">
      <h2 class="painel-panel-title">Estado do cliente</h2>
      <form method="POST" action="?/setProfileStatus" class="painel-form-stack">
        <input type="hidden" name="csrfToken" value={data.painelCsrfToken} />
        <input type="hidden" name="id" value={p.id} />
        <label class="painel-control">
          <span>Estado atual</span>
          <select name="status" class="painel-select" disabled={readOnly}>
            {#each profileStatuses as status}
              <option value={status} selected={status === p.status}>{profileStatusLabels[status]}</option>
            {/each}
          </select>
        </label>
        <button type="submit" class="painel-btn painel-btn-primary" disabled={readOnly}>Guardar estado</button>
      </form>
    </section>

    <section class="painel-panel">
      <h2 class="painel-panel-title">Notas internas</h2>
      {#if p.notes}<pre class="painel-notes-log">{p.notes}</pre>{/if}
      <form method="POST" action="?/addProfileNote" class="painel-form-stack">
        <input type="hidden" name="csrfToken" value={data.painelCsrfToken} />
        <input type="hidden" name="id" value={p.id} />
        <label class="painel-control">
          <span>Nova nota</span>
          <textarea name="note" class="painel-textarea" rows="4" maxlength="2000" disabled={readOnly}></textarea>
        </label>
        <button type="submit" class="painel-btn" disabled={readOnly}>Adicionar nota</button>
      </form>
    </section>
  </aside>
</div>

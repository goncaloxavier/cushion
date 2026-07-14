<script lang="ts">
  import PainelRequestTable from '$lib/components/PainelRequestTable.svelte'
  import {fmtDateTime, profileStatuses, profileStatusLabels, profileStatusTone} from '$lib/painel'

  let {data} = $props()
  const p = $derived(data.profile)
</script>

<svelte:head>
  <title>{p.name} | Backoffice</title>
</svelte:head>

<header class="painel-page-head">
  <div>
    <a class="painel-back" href="/painel/perfis">← Perfis</a>
    <h1>{p.name}</h1>
  </div>
  <span class="painel-tag" data-tone={profileStatusTone(p.status)}>
    {profileStatusLabels[p.status] ?? p.status}
  </span>
</header>

<div class="painel-grid-two">
  <div class="painel-panel">
    <h2 class="painel-panel-title">Cliente</h2>
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
        <div class="painel-field">
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
        <span class="painel-field-label">Pedidos</span>
        <p class="painel-field-value painel-mono">{p.submissionCount ?? 0}</p>
      </div>
      <div class="painel-field">
        <span class="painel-field-label">Primeiro</span>
        <p class="painel-field-value painel-mono">{fmtDateTime(p.firstSubmittedAt ?? undefined)}</p>
      </div>
      <div class="painel-field">
        <span class="painel-field-label">Último</span>
        <p class="painel-field-value painel-mono">{fmtDateTime(p.lastSubmittedAt ?? undefined)}</p>
      </div>
      <div class="painel-field">
        <span class="painel-field-label">Consentimento</span>
        <p class="painel-field-value">{p.marketingConsent ? 'Sim' : 'Não'}</p>
      </div>
    </div>
  </div>

  <div class="painel-panel">
    <h2 class="painel-panel-title">Gestão</h2>
    <form method="POST" action="?/setProfileStatus" class="painel-form-row">
      <input type="hidden" name="csrfToken" value={data.painelCsrfToken} />
      <input type="hidden" name="id" value={p.id} />
      <select name="status" class="painel-select" aria-label="Estado do perfil">
        {#each profileStatuses as status}
          <option value={status} selected={status === p.status}>{profileStatusLabels[status]}</option>
        {/each}
      </select>
      <button type="submit" class="painel-btn painel-btn-primary">Atualizar estado</button>
    </form>
    <form method="POST" action="?/addProfileNote" class="painel-form-row">
      <input type="hidden" name="csrfToken" value={data.painelCsrfToken} />
      <input type="hidden" name="id" value={p.id} />
      <input name="note" class="painel-input" placeholder="Nota sobre o cliente…" maxlength="2000" aria-label="Nota do perfil" />
      <button type="submit" class="painel-btn">Adicionar nota</button>
    </form>
    {#if p.notes}<pre class="painel-notes-log">{p.notes}</pre>{/if}
  </div>
</div>

<section class="painel-section">
  <h2>Pedidos deste cliente</h2>
  <PainelRequestTable rows={p.submissions ?? []} showSource />
</section>

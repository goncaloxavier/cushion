<script lang="ts">
  import PainelRequestCard from '$lib/components/PainelRequestCard.svelte'
  import {fmtDateTime, profileStatuses, profileStatusLabels, submissionStatuses} from '$lib/painel'

  let {data} = $props()
  const p = $derived(data.profile)
</script>

<svelte:head>
  <title>{p.name} | Backoffice</title>
</svelte:head>

<header class="painel-page-head">
  <a class="painel-back" href="/painel/perfis">← Perfis</a>
  <h1>{p.name}</h1>
</header>

<div class="painel-profile">
  <dl class="painel-profile-fields">
    <div><dt>Email</dt><dd><a href={`mailto:${p.email}`}>{p.email}</a></dd></div>
    {#if p.phone}<div><dt>Telefone</dt><dd><a href={`tel:${p.phone}`}>{p.phone}</a></dd></div>{/if}
    {#if p.address}<div><dt>Morada</dt><dd>{p.address}</dd></div>{/if}
    {#if p.postalCode || p.locality}
      <div><dt>Local</dt><dd>{[p.postalCode, p.locality].filter(Boolean).join(' ')}</dd></div>
    {/if}
    <div><dt>Pedidos</dt><dd>{p.submissionCount ?? 0}</dd></div>
    <div><dt>Primeiro</dt><dd>{fmtDateTime(p.firstSubmittedAt)}</dd></div>
    <div><dt>Último</dt><dd>{fmtDateTime(p.lastSubmittedAt)}</dd></div>
    <div><dt>Consentimento</dt><dd>{p.marketingConsent ? 'Sim' : 'Não'}</dd></div>
  </dl>

  <div class="painel-profile-manage">
    <form method="POST" action="?/setProfileStatus" class="req-status-form">
      <input type="hidden" name="id" value={p._id} />
      <select name="status" aria-label="Estado do perfil">
        {#each profileStatuses as status}
          <option value={status} selected={status === p.status}>{profileStatusLabels[status]}</option>
        {/each}
      </select>
      <button type="submit">Atualizar estado</button>
    </form>
    <form method="POST" action="?/addProfileNote" class="req-note-form">
      <input type="hidden" name="id" value={p._id} />
      <input name="note" placeholder="Nota sobre o cliente…" maxlength="2000" aria-label="Nota do perfil" />
      <button type="submit">Adicionar nota</button>
    </form>
    {#if p.notes}<pre class="req-notes">{p.notes}</pre>{/if}
  </div>
</div>

<section class="painel-section">
  <h2>Pedidos deste cliente</h2>
  {#if !p.submissions || p.submissions.length === 0}
    <p class="painel-empty">Sem pedidos.</p>
  {:else}
    <div class="req-list">
      {#each p.submissions as row (row._id)}
        <PainelRequestCard {row} statuses={submissionStatuses} />
      {/each}
    </div>
  {/if}
</section>

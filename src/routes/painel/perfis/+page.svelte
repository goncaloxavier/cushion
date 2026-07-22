<script lang="ts">
  import {fmtDate, profileStatusLabels, profileStatusTone} from '$lib/painel'

  let {data} = $props()
</script>

<svelte:head>
  <title>Perfis de clientes | Backoffice</title>
</svelte:head>

<header class="painel-page-head">
  <div>
    <p class="painel-eyebrow">Vendas</p>
    <h1>Perfis de clientes</h1>
    <p class="painel-page-sub">{data.rows.length} {data.rows.length === 1 ? 'perfil' : 'perfis'}</p>
  </div>
</header>

<section class="painel-data-view">
  <form method="GET" class="painel-toolbar painel-search-toolbar">
    <label class="painel-search-field">
      <span class="painel-toolbar-label">Procurar clientes</span>
      <input
        type="search"
        name="q"
        value={data.search}
        placeholder="Nome, email ou localidade"
        aria-label="Procurar perfis"
      />
    </label>
    <button type="submit">Procurar</button>
  </form>

  {#if data.rows.length === 0}
    <p class="painel-empty">Sem perfis para mostrar.</p>
  {:else}
    <div class="painel-table-wrap">
      <table class="painel-table">
      <thead>
        <tr>
          <th>Nome</th>
          <th>Email</th>
          <th>Local</th>
          <th data-num>Pedidos</th>
          <th>Último</th>
          <th>Estado</th>
        </tr>
      </thead>
      <tbody>
        {#each data.rows as profile (profile.id)}
          <tr>
            <td data-label="Nome"><a href={`/painel/perfis/${profile.id}`}>{profile.name}</a></td>
            <td data-label="Email"><a href={`mailto:${profile.email}`}>{profile.email}</a></td>
            <td data-label="Local">{[profile.postalCode, profile.locality].filter(Boolean).join(' ')}</td>
            <td data-label="Pedidos" data-num>{profile.submissionCount ?? 0}</td>
            <td data-label="Último" class="painel-mono">{fmtDate(profile.lastSubmittedAt ?? undefined)}</td>
            <td data-label="Estado">
              <span class="painel-tag" data-tone={profileStatusTone(profile.status)}>
                {profileStatusLabels[profile.status] ?? profile.status}
              </span>
            </td>
          </tr>
        {/each}
      </tbody>
      </table>
    </div>
  {/if}
</section>

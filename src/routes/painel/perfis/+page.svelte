<script lang="ts">
  import {fmtDate, profileStatusLabels, profileStatusTone} from '$lib/painel'

  let {data} = $props()
</script>

<svelte:head>
  <title>Perfis de clientes | Backoffice</title>
</svelte:head>

<header class="painel-page-head">
  <h1>Perfis de clientes</h1>
  <p class="painel-page-sub">{data.rows.length} perfil(is)</p>
</header>

<form method="GET" class="painel-toolbar">
  <input
    type="search"
    name="q"
    value={data.search}
    placeholder="Procurar por nome, email ou localidade…"
    aria-label="Procurar perfis"
  />
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
            <td><a href={`/painel/perfis/${profile.id}`}>{profile.name}</a></td>
            <td><a href={`mailto:${profile.email}`}>{profile.email}</a></td>
            <td>{[profile.postalCode, profile.locality].filter(Boolean).join(' ')}</td>
            <td data-num>{profile.submissionCount ?? 0}</td>
            <td class="painel-mono">{fmtDate(profile.lastSubmittedAt ?? undefined)}</td>
            <td>
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

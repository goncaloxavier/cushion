<script lang="ts">
  import {fmtDate, profileStatusLabels} from '$lib/painel'

  let {data} = $props()
</script>

<svelte:head>
  <title>Perfis de clientes | Backoffice</title>
</svelte:head>

<header class="painel-page-head">
  <h1>Perfis de clientes</h1>
  <p>{data.rows.length} perfil(is)</p>
</header>

<form method="GET" class="painel-search">
  <input
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
  <table class="painel-table">
    <thead>
      <tr><th>Nome</th><th>Email</th><th>Local</th><th>Pedidos</th><th>Último</th><th>Estado</th></tr>
    </thead>
    <tbody>
      {#each data.rows as profile (profile._id)}
        <tr>
          <td><a href={`/painel/perfis/${profile._id}`}>{profile.name}</a></td>
          <td><a href={`mailto:${profile.email}`}>{profile.email}</a></td>
          <td>{[profile.postalCode, profile.locality].filter(Boolean).join(' ')}</td>
          <td>{profile.submissionCount ?? 0}</td>
          <td>{fmtDate(profile.lastSubmittedAt)}</td>
          <td>{profileStatusLabels[profile.status] ?? profile.status}</td>
        </tr>
      {/each}
    </tbody>
  </table>
{/if}

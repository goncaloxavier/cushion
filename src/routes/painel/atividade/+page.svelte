<script lang="ts">
  import {
    activityActionLabel,
    activityColumns,
    fmtDateTime,
    roleLabels,
    roleTone,
  } from '$lib/painel'

  let {data} = $props()

  const entityHref = (entityType: string, entityId: string | null) => {
    if (!entityId) return undefined
    if (entityType === 'order') return `/painel/encomendas/${entityId}`
    if (entityType === 'submission' || entityType === 'profile') {
      return entityType === 'submission' ? `/painel/pedidos/${entityId}` : `/painel/perfis/${entityId}`
    }
    if (entityType === 'staff') return `/painel/equipa/${entityId}`
    return undefined
  }
</script>

<svelte:head>
  <title>Atividade | Backoffice</title>
</svelte:head>

<header class="painel-page-head">
  <div>
    <p class="painel-eyebrow">Administração</p>
    <h1>Atividade</h1>
    <p class="painel-page-sub">{data.activity.length} {data.activity.length === 1 ? 'registo' : 'registos'}</p>
  </div>
</header>

{#if data.activity.length}
  <div class="painel-table-wrap">
    <table class="painel-table">
      <thead>
        <tr>
          <th scope="col">Data/Hora</th>
          <th scope="col">Autor</th>
          <th scope="col">Ação</th>
          <th scope="col">Entidade</th>
          <th scope="col">Detalhe</th>
        </tr>
      </thead>
      <tbody>
        {#each data.activity as entry (entry.id)}
          {@const href = entityHref(entry.entityType, entry.entityId)}
          {@const columns = activityColumns(entry)}
          <tr>
            <td data-label="Data/Hora" class="painel-mono">{fmtDateTime(entry.createdAt)}</td>
            <td data-label="Autor">
              {entry.staffName}
              <span class="painel-tag" data-tone={roleTone(entry.staffRole)}>
                {roleLabels[entry.staffRole] ?? entry.staffRole}
              </span>
            </td>
            <td data-label="Ação" title={entry.action}>{activityActionLabel(entry.action)}</td>
            <td data-label="Entidade">
              {#if href}
                <a {href}>{columns.entity}</a>
              {:else}
                {columns.entity}
              {/if}
            </td>
            <td data-label="Detalhe">{columns.detail}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{:else}
  <p class="painel-empty">Ainda não existem registos de atividade.</p>
{/if}

<script lang="ts">
  import {fmtDateTime, roleLabels, roleTone} from '$lib/painel'

  let {data} = $props()

  const actionLabels: Record<string, string> = {
    'order.status': 'Alterou o estado da encomenda',
    'order.note': 'Adicionou uma nota à encomenda',
    'lead.status': 'Alterou o estado do lead',
    'lead.note': 'Adicionou uma nota ao lead',
    'profile.status': 'Alterou o estado do perfil',
    'profile.note': 'Adicionou uma nota ao perfil',
    'site.publish': 'Publicou conteúdo do site',
    'site.delete': 'Eliminou conteúdo do site',
    'staff.create': 'Criou uma conta de equipa',
    'staff.role': 'Alterou a função de uma conta',
    'staff.active': 'Alterou o estado de uma conta',
    'staff.password': 'Repôs a palavra-passe de uma conta',
  }

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
  <h1>Atividade</h1>
  <p class="painel-page-sub">{data.activity.length} registo(s)</p>
</header>

{#if data.activity.length}
  <div class="painel-table-wrap">
    <table class="painel-table">
      <thead>
        <tr>
          <th>Data/Hora</th>
          <th>Autor</th>
          <th>Ação</th>
          <th>Entidade</th>
          <th>Detalhe</th>
        </tr>
      </thead>
      <tbody>
        {#each data.activity as entry (entry.id)}
          {@const href = entityHref(entry.entityType, entry.entityId)}
          <tr>
            <td class="painel-mono">{fmtDateTime(entry.createdAt)}</td>
            <td>
              {entry.staffName}
              <span class="painel-tag" data-tone={roleTone(entry.staffRole)}>
                {roleLabels[entry.staffRole] ?? entry.staffRole}
              </span>
            </td>
            <td>{actionLabels[entry.action] ?? entry.action}</td>
            <td>
              {#if href}
                <a {href}>{entry.entityLabel || entry.entityId}</a>
              {:else}
                {entry.entityLabel || entry.entityId || '-'}
              {/if}
            </td>
            <td>{entry.detail || '-'}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{:else}
  <p class="painel-empty">Ainda não existem registos de atividade.</p>
{/if}

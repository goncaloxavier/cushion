<script lang="ts">
  import {fmtDateTime, roleLabels, roleTone} from '$lib/painel'

  let {data} = $props()

  const actionLabels: Record<string, string> = {
    'order.status': 'Alterou o estado da encomenda',
    'order.note': 'Adicionou uma nota à encomenda',
    'lead.status': 'Alterou o estado do pedido de contacto',
    'lead.note': 'Adicionou uma nota ao pedido de contacto',
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
            <td data-label="Data/Hora" class="painel-mono">{fmtDateTime(entry.createdAt)}</td>
            <td data-label="Autor">
              {entry.staffName}
              <span class="painel-tag" data-tone={roleTone(entry.staffRole)}>
                {roleLabels[entry.staffRole] ?? entry.staffRole}
              </span>
            </td>
            <td data-label="Ação">{actionLabels[entry.action] ?? entry.action}</td>
            <td data-label="Entidade">
              {#if href}
                <a {href}>{entry.entityLabel || entry.entityId}</a>
              {:else}
                {entry.entityLabel || entry.entityId || '-'}
              {/if}
            </td>
            <td data-label="Detalhe">{entry.detail || '-'}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{:else}
  <p class="painel-empty">Ainda não existem registos de atividade.</p>
{/if}

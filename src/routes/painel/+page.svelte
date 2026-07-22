<script lang="ts">
  import {
    fmtDateTime,
    orderStatusLabels,
    orderStatusTone,
    roleLabels,
    roleTone,
    sourceLabel,
    submissionStatusLabels,
    submissionStatusTone,
  } from '$lib/painel'

  let {data} = $props()

  const actionLabels: Record<string, string> = {
    'order.status': 'alterou o estado de uma encomenda',
    'order.note': 'adicionou uma nota a uma encomenda',
    'lead.status': 'alterou o estado de um lead',
    'lead.note': 'adicionou uma nota a um lead',
    'profile.status': 'alterou o estado de um perfil',
    'profile.note': 'adicionou uma nota a um perfil',
    'site.publish': 'publicou conteúdo do site',
    'site.delete': 'eliminou conteúdo do site',
    'staff.create': 'criou uma conta de equipa',
    'staff.role': 'alterou a função de uma conta',
    'staff.active': 'alterou o estado de uma conta',
    'staff.password': 'repôs a palavra-passe de uma conta',
  }
</script>

<svelte:head>
  <title>Início | Backoffice</title>
</svelte:head>

<header class="painel-page-head">
  <h1>Início</h1>
</header>

<div class="painel-stats">
  <div class="painel-stat" data-tone="accent">
    <strong>{data.openLeadsCount}</strong>
    <span>Leads por tratar</span>
  </div>
  <div class="painel-stat">
    <strong>{data.activeOrdersCount}</strong>
    <span>Encomendas em curso</span>
  </div>
</div>

<div class="painel-panel">
  <h2 class="painel-panel-title">Leads por tratar</h2>
  {#if data.openLeads.length}
    <div class="painel-table-wrap">
      <table class="painel-table">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Origem</th>
            <th>Estado</th>
            <th>Recebido</th>
          </tr>
        </thead>
        <tbody>
          {#each data.openLeads as lead (lead.id)}
            <tr>
              <td><a href={`/painel/pedidos/${lead.id}`}>{lead.name}</a></td>
              <td>{sourceLabel(lead.source)}</td>
              <td>
                <span class="painel-tag" data-tone={submissionStatusTone(lead.status)}>
                  {submissionStatusLabels[lead.status] ?? lead.status}
                </span>
              </td>
              <td class="painel-mono">{fmtDateTime(lead.submittedAt)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    {#if data.openLeadsCount > data.openLeads.length}
      <p class="painel-page-sub"><a href="/painel/pedidos">Ver todos os {data.openLeadsCount} →</a></p>
    {/if}
  {:else}
    <p class="painel-empty">Sem leads por tratar.</p>
  {/if}
</div>

<div class="painel-panel">
  <h2 class="painel-panel-title">Encomendas em curso</h2>
  {#if data.activeOrders.length}
    <div class="painel-table-wrap">
      <table class="painel-table">
        <thead>
          <tr>
            <th>Número</th>
            <th>Cliente</th>
            <th>Estado</th>
            <th>Recebida</th>
          </tr>
        </thead>
        <tbody>
          {#each data.activeOrders as order (order.id)}
            <tr>
              <td class="painel-mono">
                <a href={`/painel/encomendas/${order.id}`}>{order.orderNumber}</a>
              </td>
              <td>{order.customerName}</td>
              <td>
                <span class="painel-tag" data-tone={orderStatusTone(order.status)}>
                  {orderStatusLabels[order.status] ?? order.status}
                </span>
              </td>
              <td class="painel-mono">{fmtDateTime(order.createdAt)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    {#if data.activeOrdersCount > data.activeOrders.length}
      <p class="painel-page-sub"><a href="/painel/encomendas">Ver todas as {data.activeOrdersCount} →</a></p>
    {/if}
  {:else}
    <p class="painel-empty">Sem encomendas em curso.</p>
  {/if}
</div>

{#if data.activity.length}
  <div class="painel-panel">
    <h2 class="painel-panel-title">Atividade recente</h2>
    <div class="painel-table-wrap">
      <table class="painel-table">
        <thead>
          <tr>
            <th>Data/Hora</th>
            <th>Autor</th>
            <th>Ação</th>
          </tr>
        </thead>
        <tbody>
          {#each data.activity as entry (entry.id)}
            <tr>
              <td class="painel-mono">{fmtDateTime(entry.createdAt)}</td>
              <td>
                {entry.staffName}
                <span class="painel-tag" data-tone={roleTone(entry.staffRole)}>
                  {roleLabels[entry.staffRole] ?? entry.staffRole}
                </span>
              </td>
              <td>{actionLabels[entry.action] ?? entry.action}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <p class="painel-page-sub"><a href="/painel/atividade">Ver toda a atividade →</a></p>
  </div>
{/if}

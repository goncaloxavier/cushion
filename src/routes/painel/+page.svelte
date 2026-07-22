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
    'lead.status': 'alterou o estado de um pedido de contacto',
    'lead.note': 'adicionou uma nota a um pedido de contacto',
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
  <div>
    <p class="painel-eyebrow">Visão geral</p>
    <h1>Painel de controlo</h1>
    <p class="painel-page-sub">Prioridades e atividade recente da equipa.</p>
  </div>
</header>

<div class="painel-stats">
  <a class="painel-stat" data-tone="accent" href="/painel/pedidos">
    <span>Pedidos de contacto por tratar</span>
    <strong>{data.openLeadsCount}</strong>
    <small>Ver pedidos de contacto</small>
  </a>
  <a class="painel-stat" href="/painel/encomendas">
    <span>Encomendas em curso</span>
    <strong>{data.activeOrdersCount}</strong>
    <small>Ver encomendas</small>
  </a>
</div>

<div class="painel-dashboard-grid">
  <section class="painel-panel painel-dashboard-panel">
    <header class="painel-panel-head">
      <div>
        <p class="painel-eyebrow">Contactos recebidos</p>
        <h2>Pedidos por tratar</h2>
      </div>
      <a href="/painel/pedidos">Ver todos</a>
    </header>
    {#if data.openLeads.length}
      <div class="painel-table-wrap painel-table-embedded">
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
                <td data-label="Nome"><a href={`/painel/pedidos/${lead.id}`}>{lead.name}</a></td>
                <td data-label="Origem">{sourceLabel(lead.source)}</td>
                <td data-label="Estado">
                  <span class="painel-tag" data-tone={submissionStatusTone(lead.status)}>
                    {submissionStatusLabels[lead.status] ?? lead.status}
                  </span>
                </td>
                <td data-label="Recebido" class="painel-mono">{fmtDateTime(lead.submittedAt)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else}
      <p class="painel-empty">Sem pedidos de contacto por tratar.</p>
    {/if}
  </section>

  <section class="painel-panel painel-dashboard-panel">
    <header class="painel-panel-head">
      <div>
        <p class="painel-eyebrow">Loja</p>
        <h2>Encomendas em curso</h2>
      </div>
      <a href="/painel/encomendas">Ver todas</a>
    </header>
    {#if data.activeOrders.length}
      <div class="painel-table-wrap painel-table-embedded">
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
                <td data-label="Número" class="painel-mono">
                  <a href={`/painel/encomendas/${order.id}`}>{order.orderNumber}</a>
                </td>
                <td data-label="Cliente">{order.customerName}</td>
                <td data-label="Estado">
                  <span class="painel-tag" data-tone={orderStatusTone(order.status)}>
                    {orderStatusLabels[order.status] ?? order.status}
                  </span>
                </td>
                <td data-label="Recebida" class="painel-mono">{fmtDateTime(order.createdAt)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else}
      <p class="painel-empty">Sem encomendas em curso.</p>
    {/if}
  </section>
</div>

{#if data.activity.length}
  <section class="painel-panel painel-activity-panel">
    <header class="painel-panel-head">
      <div>
        <p class="painel-eyebrow">Equipa</p>
        <h2>Atividade recente</h2>
      </div>
      <a href="/painel/atividade">Ver atividade</a>
    </header>
    <div class="painel-table-wrap painel-table-embedded">
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
              <td data-label="Data/Hora" class="painel-mono">{fmtDateTime(entry.createdAt)}</td>
              <td data-label="Autor">
                {entry.staffName}
                <span class="painel-tag" data-tone={roleTone(entry.staffRole)}>
                  {roleLabels[entry.staffRole] ?? entry.staffRole}
                </span>
              </td>
              <td data-label="Ação">{actionLabels[entry.action] ?? entry.action}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </section>
{/if}

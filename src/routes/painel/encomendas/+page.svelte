<script lang="ts">
  import {fmtDateTime, orderStatusLabels, orderStatusTone} from '$lib/painel'

  let {data} = $props()
  const money = new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  })
</script>

<svelte:head>
  <title>Encomendas | Backoffice</title>
</svelte:head>

<header class="painel-page-head">
  <h1>Encomendas</h1>
  <p class="painel-page-sub">{data.orders.length} encomenda(s)</p>
</header>

{#if data.orders.length}
  <div class="painel-table-wrap">
    <table class="painel-table">
      <thead>
        <tr>
          <th>Número</th>
          <th>Cliente</th>
          <th>Zona</th>
          <th data-num>Total</th>
          <th>Estado</th>
          <th>Recebida</th>
        </tr>
      </thead>
      <tbody>
        {#each data.orders as order (order.id)}
          <tr>
            <td class="painel-mono"><a href={`/painel/encomendas/${order.id}`}>{order.orderNumber}</a></td>
            <td>
              <a href={`/painel/encomendas/${order.id}`}>{order.customerName}</a><br />
              <a href={`mailto:${order.email}`}>{order.email}</a>
            </td>
            <td>{order.deliveryZone}</td>
            <td data-num>{money.format(order.totalGross)}</td>
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
{:else}
  <p class="painel-empty">Ainda não existem encomendas em Postgres neste ambiente.</p>
{/if}

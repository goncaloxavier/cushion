<script lang="ts">
  import {fmtDateTime, orderStatusLabels} from '$lib/painel'

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
  <p>{data.orders.length} encomenda(s)</p>
</header>

{#if data.orders.length}
  <table class="painel-table">
    <thead>
      <tr>
        <th>Número</th>
        <th>Cliente</th>
        <th>Zona</th>
        <th>Total</th>
        <th>Estado</th>
        <th>Recebida</th>
      </tr>
    </thead>
    <tbody>
      {#each data.orders as order}
        <tr>
          <td><a href={`/painel/encomendas/${order.id}`}>{order.orderNumber}</a></td>
          <td>
            <strong>{order.customerName}</strong><br />
            <a href={`mailto:${order.email}`}>{order.email}</a>
          </td>
          <td>{order.deliveryZone}</td>
          <td>{money.format(order.totalGross)}</td>
          <td>{orderStatusLabels[order.status] ?? order.status}</td>
          <td>{fmtDateTime(order.createdAt)}</td>
        </tr>
      {/each}
    </tbody>
  </table>
{:else}
  <p class="painel-empty">Ainda não existem encomendas em Postgres neste ambiente.</p>
{/if}

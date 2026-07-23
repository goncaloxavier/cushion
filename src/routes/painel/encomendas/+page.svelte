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
  <div>
    <p class="painel-eyebrow">Loja</p>
    <h1>Encomendas</h1>
    <p class="painel-page-sub">{data.orders.length} {data.orders.length === 1 ? 'encomenda' : 'encomendas'}</p>
  </div>
</header>

{#if data.orders.length}
  <div class="painel-table-wrap">
    <table class="painel-table">
      <thead>
        <tr>
          <th scope="col">Número</th>
          <th scope="col">Cliente</th>
          <th scope="col">Zona</th>
          <th scope="col" data-num>Total</th>
          <th scope="col">Estado</th>
          <th scope="col">Recebida</th>
        </tr>
      </thead>
      <tbody>
        {#each data.orders as order (order.id)}
          <tr>
            <td data-label="Número" class="painel-mono"><a href={`/painel/encomendas/${order.id}`}>{order.orderNumber}</a></td>
            <td data-label="Cliente">
              <a href={`/painel/encomendas/${order.id}`}>{order.customerName}</a><br />
              <a href={`mailto:${order.email}`}>{order.email}</a>
            </td>
            <td data-label="Zona">{order.deliveryZone}</td>
            <td data-label="Total" data-num>{money.format(order.totalGross)}</td>
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
  <p class="painel-empty">Ainda não existem encomendas em Postgres neste ambiente.</p>
{/if}

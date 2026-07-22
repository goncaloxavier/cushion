<script lang="ts">
  import {
    fmtDateTime,
    orderStatusLabels,
    orderStatuses,
    orderStatusTone,
    paymentMethodLabels,
    paymentStatusLabels,
  } from '$lib/painel'
  let {data, form} = $props()
  const order = $derived(data.order)
  const readOnly = $derived(data.staff?.role !== 'admin')
  const money = new Intl.NumberFormat('pt-PT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  })
</script>

<svelte:head>
  <title>{order.orderNumber} | Backoffice</title>
</svelte:head>

<header class="painel-page-head">
  <div>
    <a class="painel-back" href="/painel/encomendas">← Voltar às encomendas</a>
    <h1>{order.orderNumber}</h1>
  </div>
  <span class="painel-tag" data-tone={orderStatusTone(order.status)}>
    {orderStatusLabels[order.status] ?? order.status}
  </span>
</header>

{#if readOnly}
  <p class="painel-alert" data-tone="warn">Modo de consulta — apenas administradores podem guardar alterações.</p>
{/if}
{#if form?.message}
  <p class="painel-alert" data-tone="error" role="alert">{form.message}</p>
{/if}

<form method="POST" action="?/setStatus" class="painel-panel">
  <input type="hidden" name="csrfToken" value={data.painelCsrfToken} />
  <label class="painel-field-label" for="order-status">Estado da encomenda</label>
  <div class="painel-form-row">
    <select id="order-status" name="status" class="painel-select">
      {#each orderStatuses as status}
        <option value={status} selected={status === order.status}>{orderStatusLabels[status]}</option>
      {/each}
    </select>
    <button type="submit" class="painel-btn painel-btn-primary">Guardar estado</button>
  </div>
</form>

<div class="painel-panel">
  <h2 class="painel-panel-title">Cliente</h2>
  <div class="painel-field-grid">
    <div class="painel-field">
      <span class="painel-field-label">Nome</span>
      <p class="painel-field-value">{order.customerName}</p>
    </div>
    <div class="painel-field">
      <span class="painel-field-label">Email</span>
      <p class="painel-field-value"><a href={`mailto:${order.email}`}>{order.email}</a></p>
    </div>
    <div class="painel-field">
      <span class="painel-field-label">Telefone</span>
      <p class="painel-field-value">{order.phone || '-'}</p>
    </div>
    <div class="painel-field">
      <span class="painel-field-label">Tipo</span>
      <p class="painel-field-value">{order.purchaseType}</p>
    </div>
    <div class="painel-field">
      <span class="painel-field-label">Recebida em</span>
      <p class="painel-field-value painel-mono">{fmtDateTime(order.createdAt)}</p>
    </div>
  </div>
</div>

<div class="painel-panel">
  <h2 class="painel-panel-title">Moradas</h2>
  <div class="painel-field-grid">
    <div class="painel-field painel-field-block">
      <span class="painel-field-label">Faturação</span>
      <p class="painel-field-text">
        {order.billingName || '-'}{#if order.nif}&nbsp;· NIF {order.nif}{/if}
        <br />{order.billingAddress}<br />{order.billingPostalCode} {order.billingLocality}
      </p>
    </div>
    <div class="painel-field painel-field-block">
      <span class="painel-field-label">Entrega</span>
      <p class="painel-field-text">
        {order.deliveryName || '-'}
        <br />{order.deliveryAddress}<br />{order.deliveryPostalCode} {order.deliveryLocality}<br
        />{order.deliveryZone}
      </p>
    </div>
  </div>
</div>

<div class="painel-panel">
  <h2 class="painel-panel-title">Itens</h2>
  <div class="painel-table-wrap">
    <table class="painel-table">
      <thead>
        <tr>
          <th>Produto</th>
          <th>Variante</th>
          <th>Acabamento</th>
          <th data-num>Qtd.</th>
          <th data-num>Preço un.</th>
          <th data-num>Total</th>
        </tr>
      </thead>
      <tbody>
        {#each order.items as item}
          <tr>
            <td>{item.productTitle}</td>
            <td>
              {item.variantLabel}
              {#if item.variantDimensions.length}
                <br /><small>{item.variantDimensions.join(' · ')}</small>
              {/if}
            </td>
            <td>{item.finishLabel || 'Sem opção'}</td>
            <td data-num>{item.quantity}</td>
            <td data-num>{money.format(item.unitPriceNet)}</td>
            <td data-num>{money.format(item.lineTotalNet)}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<div class="painel-panel">
  <h2 class="painel-panel-title">Totais e pagamento</h2>
  <div class="painel-field-grid">
    <div class="painel-field">
      <span class="painel-field-label">Produtos s/ IVA</span>
      <p class="painel-field-value painel-mono">{money.format(order.productNet)}</p>
    </div>
    <div class="painel-field">
      <span class="painel-field-label">Transporte s/ IVA</span>
      <p class="painel-field-value painel-mono">{money.format(order.transportNet)}</p>
    </div>
    <div class="painel-field">
      <span class="painel-field-label">IVA</span>
      <p class="painel-field-value painel-mono">{money.format(order.vat)}</p>
    </div>
    <div class="painel-field">
      <span class="painel-field-label">Total</span>
      <p class="painel-field-value painel-mono">{money.format(order.totalGross)}</p>
    </div>
    <div class="painel-field">
      <span class="painel-field-label">Multiplicador transporte</span>
      <p class="painel-field-value painel-mono">{order.transportMultiplier}</p>
    </div>
    <div class="painel-field">
      <span class="painel-field-label">Pagamento</span>
      <p class="painel-field-value">{paymentStatusLabels[order.paymentStatus] ?? order.paymentStatus}</p>
    </div>
    <div class="painel-field">
      <span class="painel-field-label">Método escolhido</span>
      <p class="painel-field-value">{paymentMethodLabels[order.paymentMethod] ?? (order.paymentMethod || '-')}</p>
    </div>
    {#if order.paymentUrl}
      <div class="painel-field painel-field-block">
        <span class="painel-field-label">Link de pagamento</span>
        <p class="painel-field-value"><a href={order.paymentUrl}>{order.paymentUrl}</a></p>
      </div>
    {/if}
  </div>
</div>

{#if order.customerNotes}
  <div class="painel-panel">
    <h2 class="painel-panel-title">Notas do cliente</h2>
    <p class="painel-field-text">{order.customerNotes}</p>
  </div>
{/if}

<div class="painel-panel">
  <h2 class="painel-panel-title">Notas internas</h2>
  {#if order.internalNotes}
    <pre class="painel-notes-log">{order.internalNotes}</pre>
  {/if}
  <form method="POST" action="?/addNote">
    <input type="hidden" name="csrfToken" value={data.painelCsrfToken} />
    <textarea name="note" rows="3" class="painel-textarea" placeholder="Escreva uma nota interna…" maxlength="2000"
    ></textarea>
    <div class="painel-form-row">
      <button type="submit" class="painel-btn">Adicionar nota</button>
    </div>
  </form>
</div>

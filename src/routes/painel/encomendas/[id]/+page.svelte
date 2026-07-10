<script lang="ts">
  import {
    fmtDateTime,
    orderStatusLabels,
    orderStatuses,
    paymentMethodLabels,
    paymentStatusLabels,
  } from '$lib/painel'

  let {data} = $props()
  const order = $derived(data.order)
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
  <a class="painel-back" href="/painel/encomendas">← Voltar às encomendas</a>
  <h1>{order.orderNumber}</h1>
  <p>{orderStatusLabels[order.status] ?? order.status}</p>
</header>

<div class="painel-record">
  <form method="POST" action="?/setStatus" class="painel-record-section painel-record-status">
    <input type="hidden" name="csrfToken" value={data.painelCsrfToken} />
    <label class="painel-field-label" for="order-status">Estado da encomenda</label>
    <div class="painel-record-status-row">
      <select id="order-status" name="status">
        {#each orderStatuses as status}
          <option value={status} selected={status === order.status}>{orderStatusLabels[status]}</option>
        {/each}
      </select>
      <button type="submit">Guardar estado</button>
    </div>
  </form>

  <section class="painel-record-section">
    <h2 class="painel-record-title">Cliente</h2>
    <div class="painel-field-grid">
      <div class="painel-field">
        <span class="painel-field-label">Nome</span>
        <span class="painel-field-value">{order.customerName}</span>
      </div>
      <div class="painel-field">
        <span class="painel-field-label">Email</span>
        <span class="painel-field-value"><a href={`mailto:${order.email}`}>{order.email}</a></span>
      </div>
      <div class="painel-field">
        <span class="painel-field-label">Telefone</span>
        <span class="painel-field-value">{order.phone || '-'}</span>
      </div>
      <div class="painel-field">
        <span class="painel-field-label">NIF</span>
        <span class="painel-field-value">{order.nif || '-'}</span>
      </div>
      <div class="painel-field">
        <span class="painel-field-label">Tipo</span>
        <span class="painel-field-value">{order.purchaseType}</span>
      </div>
      <div class="painel-field">
        <span class="painel-field-label">Recebida em</span>
        <span class="painel-field-value">{fmtDateTime(order.createdAt)}</span>
      </div>
    </div>
  </section>

  <section class="painel-record-section">
    <h2 class="painel-record-title">Moradas</h2>
    <div class="painel-field-grid">
      <div class="painel-field painel-field-block">
        <span class="painel-field-label">Faturação</span>
        <p class="painel-field-text">{order.billingAddress}<br />{order.billingPostalCode} {order.billingLocality}</p>
      </div>
      <div class="painel-field painel-field-block">
        <span class="painel-field-label">Entrega</span>
        <p class="painel-field-text">{order.deliveryAddress}<br />{order.deliveryPostalCode} {order.deliveryLocality}<br />{order.deliveryZone}</p>
      </div>
    </div>
  </section>

  <section class="painel-record-section">
    <h2 class="painel-record-title">Itens</h2>
    <table class="painel-table">
      <thead>
        <tr>
          <th>Produto</th>
          <th>Variante</th>
          <th>Acabamento</th>
          <th>Qtd.</th>
          <th>Preço un.</th>
          <th>Total</th>
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
            <td>{item.quantity}</td>
            <td>{money.format(item.unitPriceNet)}</td>
            <td>{money.format(item.lineTotalNet)}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </section>

  <section class="painel-record-section">
    <h2 class="painel-record-title">Totais e pagamento</h2>
    <div class="painel-field-grid">
      <div class="painel-field">
        <span class="painel-field-label">Produtos s/ IVA</span>
        <span class="painel-field-value">{money.format(order.productNet)}</span>
      </div>
      <div class="painel-field">
        <span class="painel-field-label">Transporte s/ IVA</span>
        <span class="painel-field-value">{money.format(order.transportNet)}</span>
      </div>
      <div class="painel-field">
        <span class="painel-field-label">IVA</span>
        <span class="painel-field-value">{money.format(order.vat)}</span>
      </div>
      <div class="painel-field">
        <span class="painel-field-label">Total</span>
        <span class="painel-field-value">{money.format(order.totalGross)}</span>
      </div>
      <div class="painel-field">
        <span class="painel-field-label">Multiplicador transporte</span>
        <span class="painel-field-value">{order.transportMultiplier}</span>
      </div>
      <div class="painel-field">
        <span class="painel-field-label">Pagamento</span>
        <span class="painel-field-value">{paymentStatusLabels[order.paymentStatus] ?? order.paymentStatus}</span>
      </div>
      <div class="painel-field">
        <span class="painel-field-label">Método escolhido</span>
        <span class="painel-field-value">{paymentMethodLabels[order.paymentMethod] ?? (order.paymentMethod || '-')}</span>
      </div>
      {#if order.paymentUrl}
        <div class="painel-field painel-field-block">
          <span class="painel-field-label">Link de pagamento</span>
          <span class="painel-field-value"><a href={order.paymentUrl}>{order.paymentUrl}</a></span>
        </div>
      {/if}
    </div>
  </section>

  {#if order.customerNotes}
    <section class="painel-record-section">
      <h2 class="painel-record-title">Notas do cliente</h2>
      <p class="painel-field-text">{order.customerNotes}</p>
    </section>
  {/if}

  <section class="painel-record-section">
    <h2 class="painel-record-title">Notas internas</h2>
    {#if order.internalNotes}
      <pre class="painel-notes-log">{order.internalNotes}</pre>
    {/if}
    <form method="POST" action="?/addNote" class="painel-note-add">
      <input type="hidden" name="csrfToken" value={data.painelCsrfToken} />
      <textarea name="note" rows="3" placeholder="Escreva uma nota interna…" maxlength="2000"></textarea>
      <button type="submit" class="painel-btn-ghost">Adicionar nota</button>
    </form>
  </section>
</div>

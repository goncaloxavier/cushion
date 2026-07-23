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
  const purchaseTypeLabels: Record<string, string> = {
    individual: 'Particular',
    company: 'Empresa',
    business: 'Empresa',
  }
</script>

<svelte:head>
  <title>{order.orderNumber} | Backoffice</title>
</svelte:head>

<header class="painel-page-head">
  <div>
    <a class="painel-back" href="/painel/encomendas">← Voltar às encomendas</a>
    <p class="painel-eyebrow">Encomenda</p>
    <h1>{order.orderNumber}</h1>
    <p class="painel-page-sub">Recebida em {fmtDateTime(order.createdAt)}</p>
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

<div class="painel-detail-layout">
  <div class="painel-detail-main">
    <section class="painel-panel">
      <header class="painel-panel-head">
        <div>
          <p class="painel-eyebrow">Cliente</p>
          <h2>{order.customerName}</h2>
        </div>
        <span class="painel-tag">{purchaseTypeLabels[order.purchaseType] ?? order.purchaseType}</span>
      </header>
      <div class="painel-field-grid">
        <div class="painel-field">
          <span class="painel-field-label">Email</span>
          <p class="painel-field-value"><a href={`mailto:${order.email}`}>{order.email}</a></p>
        </div>
        <div class="painel-field">
          <span class="painel-field-label">Telefone</span>
          <p class="painel-field-value">{order.phone || '-'}</p>
        </div>
        {#if order.nif}
          <div class="painel-field">
            <span class="painel-field-label">NIF</span>
            <p class="painel-field-value painel-mono">{order.nif}</p>
          </div>
        {/if}
      </div>
    </section>

    <section class="painel-panel">
      <header class="painel-panel-head">
        <div>
          <p class="painel-eyebrow">Logística</p>
          <h2>Moradas</h2>
        </div>
      </header>
      <div class="painel-address-grid">
        <article class="painel-address">
          <span class="painel-field-label">Faturação</span>
          <strong>{order.billingName || '-'}</strong>
          <p>{order.billingAddress}<br />{order.billingPostalCode} {order.billingLocality}</p>
        </article>
        <article class="painel-address">
          <span class="painel-field-label">Entrega</span>
          <strong>{order.deliveryName || '-'}</strong>
          <p>{order.deliveryAddress}<br />{order.deliveryPostalCode} {order.deliveryLocality}</p>
          <small>{order.deliveryZone}</small>
        </article>
      </div>
    </section>

    <section class="painel-panel">
      <header class="painel-panel-head">
        <div>
          <p class="painel-eyebrow">Conteúdo</p>
          <h2>Itens da encomenda</h2>
        </div>
        <span class="painel-panel-count">{order.items.length}</span>
      </header>
      <div class="painel-table-wrap painel-table-embedded">
        <table class="painel-table">
          <thead>
            <tr>
              <th scope="col">Produto</th>
              <th scope="col">Variante</th>
              <th scope="col">Acabamento</th>
              <th scope="col" data-num>Qtd.</th>
              <th scope="col" data-num>Preço un.</th>
              <th scope="col" data-num>Total</th>
            </tr>
          </thead>
          <tbody>
            {#each order.items as item}
              <tr>
                <td data-label="Produto">{item.productTitle}</td>
                <td data-label="Variante">
                  {item.variantLabel}
                  {#if item.variantDimensions.length}<br /><small>{item.variantDimensions.join(' · ')}</small>{/if}
                </td>
                <td data-label="Acabamento">{item.finishLabel || 'Sem opção'}</td>
                <td data-label="Qtd." data-num>{item.quantity}</td>
                <td data-label="Preço un." data-num>{money.format(item.unitPriceNet)}</td>
                <td data-label="Total" data-num>{money.format(item.lineTotalNet)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </section>

    {#if order.customerNotes}
      <section class="painel-panel">
        <h2 class="painel-panel-title">Notas do cliente</h2>
        <p class="painel-field-text">{order.customerNotes}</p>
      </section>
    {/if}
  </div>

  <aside class="painel-detail-rail">
    <form method="POST" action="?/setStatus" class="painel-panel painel-action-panel">
      <input type="hidden" name="csrfToken" value={data.painelCsrfToken} />
      <h2 class="painel-panel-title">Estado da encomenda</h2>
      <label class="painel-control" for="order-status">
        <span>Estado atual</span>
        <select id="order-status" name="status" class="painel-select" disabled={readOnly}>
          {#each orderStatuses as status}
            <option value={status} selected={status === order.status}>{orderStatusLabels[status]}</option>
          {/each}
        </select>
      </label>
      <button type="submit" class="painel-btn painel-btn-primary" disabled={readOnly}>Guardar estado</button>
    </form>

    <section class="painel-panel">
      <h2 class="painel-panel-title">Resumo</h2>
      <dl class="painel-totals">
        <div><dt>Produtos s/ IVA</dt><dd>{money.format(order.productNet)}</dd></div>
        <div><dt>Transporte s/ IVA</dt><dd>{money.format(order.transportNet)}</dd></div>
        <div><dt>IVA</dt><dd>{money.format(order.vat)}</dd></div>
        <div data-total><dt>Total</dt><dd>{money.format(order.totalGross)}</dd></div>
      </dl>
      <div class="painel-payment-meta">
        <div>
          <span class="painel-field-label">Pagamento</span>
          <p>{paymentStatusLabels[order.paymentStatus] ?? order.paymentStatus}</p>
        </div>
        <div>
          <span class="painel-field-label">Método</span>
          <p>{paymentMethodLabels[order.paymentMethod] ?? (order.paymentMethod || '-')}</p>
        </div>
      </div>
      {#if order.paymentUrl}
        <a class="painel-btn painel-btn-block" href={order.paymentUrl}>Abrir link de pagamento</a>
      {/if}
      <details class="painel-technical-details">
        <summary>Dados de cálculo</summary>
        <p>Multiplicador de transporte: <strong>{order.transportMultiplier}</strong></p>
      </details>
    </section>

    <section class="painel-panel">
      <h2 class="painel-panel-title">Notas internas</h2>
      {#if order.internalNotes}<pre class="painel-notes-log">{order.internalNotes}</pre>{/if}
      <form method="POST" action="?/addNote" class="painel-form-stack">
        <input type="hidden" name="csrfToken" value={data.painelCsrfToken} />
        <label class="painel-control">
          <span>Nova nota</span>
          <textarea name="note" rows="4" class="painel-textarea" maxlength="2000" disabled={readOnly}></textarea>
        </label>
        <button type="submit" class="painel-btn" disabled={readOnly}>Adicionar nota</button>
      </form>
    </section>
  </aside>
</div>

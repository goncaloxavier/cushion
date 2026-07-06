<script lang="ts">
  import Reveal from '$lib/components/Reveal.svelte'

  let {data} = $props()

  type Copy = {
    title: string
    empty: string
    order: string
    total: string
    status: string
    payment: string
  }

  type LabelMap = Record<string, string>

  const copyByLanguage: Record<string, Copy> = {
    pt: {
      title: 'Encomendas',
      empty: 'Ainda não existem encomendas nesta conta.',
      order: 'Encomenda',
      total: 'Total',
      status: 'Estado',
      payment: 'Pagamento',
    },
    en: {
      title: 'Orders',
      empty: 'There are no orders in this account yet.',
      order: 'Order',
      total: 'Total',
      status: 'Status',
      payment: 'Payment',
    },
    es: {
      title: 'Pedidos',
      empty: 'Todavía no hay pedidos en esta cuenta.',
      order: 'Pedido',
      total: 'Total',
      status: 'Estado',
      payment: 'Pago',
    },
  }

  const orderStatusByLanguage: Record<string, LabelMap> = {
    pt: {
      pending_payment_link: 'Pendente de link de pagamento',
      payment_link_sent: 'Link de pagamento enviado',
      paid: 'Pago',
      in_preparation: 'Em preparação',
      shipped: 'Enviado',
      completed: 'Concluído',
      cancelled: 'Cancelado',
    },
    en: {
      pending_payment_link: 'Awaiting payment link',
      payment_link_sent: 'Payment link sent',
      paid: 'Paid',
      in_preparation: 'In preparation',
      shipped: 'Shipped',
      completed: 'Completed',
      cancelled: 'Cancelled',
    },
    es: {
      pending_payment_link: 'Pendiente de enlace de pago',
      payment_link_sent: 'Enlace de pago enviado',
      paid: 'Pagado',
      in_preparation: 'En preparación',
      shipped: 'Enviado',
      completed: 'Completado',
      cancelled: 'Cancelado',
    },
  }

  const paymentStatusByLanguage: Record<string, LabelMap> = {
    pt: {
      pending: 'Pendente',
      pending_payment_link: 'Pendente de link',
      payment_link_sent: 'Link enviado',
      paid: 'Pago',
      failed: 'Falhou',
      cancelled: 'Cancelado',
      expired: 'Expirado',
      refunded: 'Reembolsado',
    },
    en: {
      pending: 'Pending',
      pending_payment_link: 'Awaiting link',
      payment_link_sent: 'Link sent',
      paid: 'Paid',
      failed: 'Failed',
      cancelled: 'Cancelled',
      expired: 'Expired',
      refunded: 'Refunded',
    },
    es: {
      pending: 'Pendiente',
      pending_payment_link: 'Pendiente de enlace',
      payment_link_sent: 'Enlace enviado',
      paid: 'Pagado',
      failed: 'Falló',
      cancelled: 'Cancelado',
      expired: 'Caducado',
      refunded: 'Reembolsado',
    },
  }

  const t = $derived(copyByLanguage[data.language] ?? copyByLanguage.pt)
  const orderLabels = $derived(orderStatusByLanguage[data.language] ?? orderStatusByLanguage.pt)
  const paymentLabels = $derived(paymentStatusByLanguage[data.language] ?? paymentStatusByLanguage.pt)
  const money = new Intl.NumberFormat(data.language === 'en' ? 'en-GB' : data.language === 'es' ? 'es-ES' : 'pt-PT', {
    style: 'currency',
    currency: 'EUR',
  })
  const dateFormatter = new Intl.DateTimeFormat(data.language === 'en' ? 'en-GB' : data.language === 'es' ? 'es-ES' : 'pt-PT')
  const orderStatusLabel = (status: string) => orderLabels[status] ?? status.replaceAll('_', ' ')
  const paymentStatusLabel = (status: string) => paymentLabels[status] ?? status.replaceAll('_', ' ')
</script>

<svelte:head>
  <title>{t.title} | DaFábrica4You</title>
  <meta name="robots" content="noindex, nofollow" />
</svelte:head>

<Reveal class="account-card account-orders" variant="card">
    <div class="account-card-head">
      <h2>{t.title}</h2>
    </div>

    {#if data.orders.length}
      <div class="account-order-list" role="table" aria-label={t.title}>
        <div class="account-order-table-head" role="row">
          <span role="columnheader">{t.order}</span>
          <span role="columnheader">{t.status}</span>
          <span role="columnheader">{t.payment}</span>
          <span role="columnheader">{t.total}</span>
        </div>
        {#each data.orders as order (order.id)}
          <article class="account-order-row" role="row">
            <div class="account-order-main" role="cell">
              <strong>{t.order} {order.orderNumber}</strong>
              <span class="account-order-date">{dateFormatter.format(new Date(order.createdAt))}</span>
            </div>
            <div class="account-order-cell" role="cell">
              <span class="account-order-mobile-label">{t.status}</span>
              <strong class="account-order-status">{orderStatusLabel(order.status)}</strong>
            </div>
            <div class="account-order-cell" role="cell">
              <span class="account-order-mobile-label">{t.payment}</span>
              <strong class="account-order-status muted">{paymentStatusLabel(order.paymentStatus)}</strong>
            </div>
            <div class="account-order-cell account-order-total" role="cell">
              <span class="account-order-mobile-label">{t.total}</span>
              <strong>{money.format(order.totalGross)}</strong>
            </div>
          </article>
        {/each}
      </div>
    {:else}
      <p class="account-empty">{t.empty}</p>
    {/if}
  </Reveal>

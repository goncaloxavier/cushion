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

  const t = $derived(copyByLanguage[data.language] ?? copyByLanguage.pt)
  const money = new Intl.NumberFormat(data.language === 'en' ? 'en-GB' : data.language === 'es' ? 'es-ES' : 'pt-PT', {
    style: 'currency',
    currency: 'EUR',
  })
  const dateFormatter = new Intl.DateTimeFormat(data.language === 'en' ? 'en-GB' : data.language === 'es' ? 'es-ES' : 'pt-PT')
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
      <div class="account-order-list">
        {#each data.orders as order (order.id)}
          <article>
            <div>
              <strong>{t.order} {order.orderNumber}</strong>
              <span>{dateFormatter.format(new Date(order.createdAt))}</span>
            </div>
            <div>
              <span>{t.status}</span>
              <strong>{order.status}</strong>
            </div>
            <div>
              <span>{t.payment}</span>
              <strong>{order.paymentStatus}</strong>
            </div>
            <strong>{t.total} {money.format(order.totalGross)}</strong>
          </article>
        {/each}
      </div>
    {:else}
      <p class="account-empty">{t.empty}</p>
    {/if}
  </Reveal>

<script lang="ts">
  import {browser} from '$app/environment'
  import SeoHead from '$lib/components/SeoHead.svelte'
  import {cartTotalQuantity, clearCart, readCart, type StoreCartItem} from '$lib/cart'
  import {
    calculateStoreEstimate,
    readInitialStorePostalCode,
    readStorePostalCode,
    storeDeliveryEventName,
  } from '$lib/store-shipping'
  import {onMount} from 'svelte'

  let {data, form} = $props()

  let cart = $state<StoreCartItem[]>([])
  let deliveryPostalCode = $state(browser ? readInitialStorePostalCode() : '')
  let clearedAfterSuccess = false
  const checkoutCopy = {
    pt: {
      kicker: 'Checkout',
      title: 'Finalizar pedido',
      successKicker: 'Pedido recebido',
      successTotal: 'Total',
      backToStore: 'Voltar à loja',
      emptyKicker: 'Carrinho',
      emptyTitle: 'O carrinho está vazio',
      continueStore: 'Continuar na loja',
      formKicker: 'Dados',
      formTitle: 'Informação para a encomenda',
      customer: 'Dados do cliente',
      billing: 'Morada de faturação',
      delivery: 'Morada de entrega',
      name: 'Nome',
      email: 'Email',
      phone: 'Telefone',
      nif: 'NIF',
      purchaseType: 'Tipo de compra',
      individual: 'Particular',
      company: 'Empresa',
      address: 'Morada',
      postalCode: 'Código postal',
      locality: 'Localidade',
      notes: 'Notas',
      submit: 'Submeter pedido',
      reviewCart: 'Rever carrinho',
      summaryKicker: 'Resumo',
      productCount: (count: number) => `${count} produto${count === 1 ? '' : 's'}`,
      productsNet: 'Produtos s/ IVA',
      transport: 'Transporte',
      vat: 'IVA 23%',
      total: 'Total',
      toConfirm: 'A confirmar',
      guestHint:
        'Pode finalizar como convidado. Criar conta permite consultar histórico de encomendas.',
      notReady: 'Checkout ainda não configurado neste ambiente.',
    },
    en: {
      kicker: 'Checkout',
      title: 'Complete request',
      successKicker: 'Request received',
      successTotal: 'Total',
      backToStore: 'Back to store',
      emptyKicker: 'Cart',
      emptyTitle: 'The cart is empty',
      continueStore: 'Continue shopping',
      formKicker: 'Details',
      formTitle: 'Order information',
      customer: 'Customer details',
      billing: 'Billing address',
      delivery: 'Delivery address',
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      nif: 'Tax number',
      purchaseType: 'Purchase type',
      individual: 'Individual',
      company: 'Company',
      address: 'Address',
      postalCode: 'Postal code',
      locality: 'Locality',
      notes: 'Notes',
      submit: 'Submit request',
      reviewCart: 'Review cart',
      summaryKicker: 'Summary',
      productCount: (count: number) => `${count} product${count === 1 ? '' : 's'}`,
      productsNet: 'Products excl. VAT',
      transport: 'Transport',
      vat: 'VAT 23%',
      total: 'Total',
      toConfirm: 'To confirm',
      guestHint: 'You can check out as a guest. An account lets you see order history.',
      notReady: 'Checkout is not configured in this environment yet.',
    },
    es: {
      kicker: 'Checkout',
      title: 'Finalizar pedido',
      successKicker: 'Pedido recibido',
      successTotal: 'Total',
      backToStore: 'Volver a tienda',
      emptyKicker: 'Carrito',
      emptyTitle: 'El carrito está vacío',
      continueStore: 'Continuar en tienda',
      formKicker: 'Datos',
      formTitle: 'Información del pedido',
      customer: 'Datos del cliente',
      billing: 'Dirección de facturación',
      delivery: 'Dirección de entrega',
      name: 'Nombre',
      email: 'Email',
      phone: 'Teléfono',
      nif: 'NIF',
      purchaseType: 'Tipo de compra',
      individual: 'Particular',
      company: 'Empresa',
      address: 'Dirección',
      postalCode: 'Código postal',
      locality: 'Localidad',
      notes: 'Notas',
      submit: 'Enviar pedido',
      reviewCart: 'Revisar carrito',
      summaryKicker: 'Resumen',
      productCount: (count: number) => `${count} producto${count === 1 ? '' : 's'}`,
      productsNet: 'Productos sin IVA',
      transport: 'Transporte',
      vat: 'IVA 23%',
      total: 'Total',
      toConfirm: 'Por confirmar',
      guestHint:
        'Puedes finalizar como invitado. Crear una cuenta permite consultar el historial.',
      notReady: 'Checkout aún no está configurado en este entorno.',
    },
  }

  const content = $derived(data.site[data.language])
  const labels = $derived(checkoutCopy[data.language])
  const customer = $derived(data.customer)
  const billingAddress = $derived(data.addresses.find((address) => address.addressType === 'billing'))
  const deliveryAddress = $derived(data.addresses.find((address) => address.addressType === 'delivery'))
  const langQuery = $derived(`?lang=${data.language}`)
  const values = $derived(form?.values ?? {})
  const money = $derived(
    new Intl.NumberFormat(data.language === 'en' ? 'en-GB' : data.language === 'es' ? 'es-ES' : 'pt-PT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }),
  )
  const rows = $derived.by(() =>
    cart
      .map((item) => {
        const product = content.storeProducts.find((candidate) => candidate.slug === item.slug)
        const variant = product?.variants[item.variantIndex]
        if (!product || !variant) return null
        const unitPrice = variant.prices[item.finish]
        return {item, product, variant, unitPrice}
      })
      .filter((row): row is NonNullable<typeof row> => row !== null),
  )
  const estimate = $derived(
    calculateStoreEstimate(
      rows.map((row) => ({
        unitPrice: row.unitPrice,
        quantity: row.item.quantity,
        weightKg: row.variant.weightKg,
      })),
      deliveryPostalCode,
      {transportMultiplier: content.storePage.transportMultiplier},
    ),
  )
  const cartPayload = $derived(JSON.stringify(cart))
  const itemCount = $derived(cartTotalQuantity(cart))

  $effect(() => {
    if (form?.success && !clearedAfterSuccess) {
      clearCart()
      cart = []
      clearedAfterSuccess = true
    }
  })

  onMount(() => {
    const refreshDelivery = () => {
      deliveryPostalCode = readStorePostalCode()
    }
    cart = readCart()
    refreshDelivery()
    window.addEventListener(storeDeliveryEventName, refreshDelivery)
    return () => window.removeEventListener(storeDeliveryEventName, refreshDelivery)
  })
</script>

<SeoHead title="Finalizar compra" description="Finalização de pedido da loja DaFábrica4You." noindex />

<main class="checkout-page">
  <section class="checkout-shell">
    <header class="checkout-head">
      <p class="kicker">{labels.kicker}</p>
      <h1>{labels.title}</h1>
    </header>

    {#if form?.success}
      <div class="checkout-success">
        <p class="kicker">{labels.successKicker}</p>
        <h1>{form.orderNumber}</h1>
        <p>{form.message}</p>
        <p>{labels.successTotal}: <strong>{money.format(form.totalGross)}</strong></p>
        <a class="button primary" href={`/loja${langQuery}`}>{labels.backToStore}</a>
      </div>
    {:else if !rows.length}
      <div class="checkout-success">
        <p class="kicker">{labels.emptyKicker}</p>
        <h1>{labels.emptyTitle}</h1>
        <a class="button primary" href={`/loja${langQuery}`}>{labels.continueStore}</a>
      </div>
    {:else}
      <div class="checkout-flow">
        <form method="POST" id="checkout-order-form" class="checkout-form">
          <input type="hidden" name="csrfToken" value={data.csrfToken} />
          <input type="hidden" name="language" value={data.language} />
          <input type="hidden" name="cartItems" value={cartPayload} />

          <div class="checkout-card-head">
            <div>
              <p class="kicker">{labels.formKicker}</p>
              <h2>{labels.formTitle}</h2>
            </div>
          </div>

          {#if form?.message}
            <p class="form-feedback">{form.message}</p>
          {/if}
          {#if !data.databaseReady}
            <p class="form-feedback">{labels.notReady}</p>
          {/if}

          <fieldset>
            <legend>{labels.customer}</legend>
            <label>
              <span>{labels.name}</span>
              <input name="name" autocomplete="name" required value={values.name ?? customer?.name ?? ''} />
            </label>
            <label>
              <span>{labels.email}</span>
              <input name="email" type="email" autocomplete="email" required value={values.email ?? customer?.email ?? ''} />
            </label>
            <label>
              <span>{labels.phone}</span>
              <input name="phone" autocomplete="tel" required value={values.phone ?? customer?.phone ?? ''} />
            </label>
            <label>
              <span>{labels.nif}</span>
              <input name="nif" inputmode="numeric" value={values.nif ?? customer?.nif ?? ''} />
            </label>
            <label>
              <span>{labels.purchaseType}</span>
              <select name="purchaseType">
                <option value="individual" selected={(values.purchaseType ?? customer?.purchaseType) !== 'company'}>{labels.individual}</option>
                <option value="company" selected={(values.purchaseType ?? customer?.purchaseType) === 'company'}>{labels.company}</option>
              </select>
            </label>
          </fieldset>

          <fieldset>
            <legend>{labels.billing}</legend>
            <label>
              <span>{labels.address}</span>
              <input name="billingAddress" autocomplete="billing street-address" required value={values.billingAddress ?? billingAddress?.addressLine1 ?? ''} />
            </label>
            <label>
              <span>{labels.postalCode}</span>
              <input name="billingPostalCode" autocomplete="billing postal-code" required value={values.billingPostalCode ?? billingAddress?.postalCode ?? deliveryPostalCode} />
            </label>
            <label>
              <span>{labels.locality}</span>
              <input name="billingLocality" autocomplete="billing address-level2" required value={values.billingLocality ?? billingAddress?.locality ?? ''} />
            </label>
          </fieldset>

          <fieldset>
            <legend>{labels.delivery}</legend>
            <label>
              <span>{labels.address}</span>
              <input name="deliveryAddress" autocomplete="shipping street-address" required value={values.deliveryAddress ?? deliveryAddress?.addressLine1 ?? ''} />
            </label>
            <label>
              <span>{labels.postalCode}</span>
              <input name="deliveryPostalCode" autocomplete="shipping postal-code" required value={values.deliveryPostalCode ?? deliveryAddress?.postalCode ?? deliveryPostalCode} />
            </label>
            <label>
              <span>{labels.locality}</span>
              <input name="deliveryLocality" autocomplete="shipping address-level2" required value={values.deliveryLocality ?? deliveryAddress?.locality ?? ''} />
            </label>
          </fieldset>

          <label class="checkout-notes">
            <span>{labels.notes}</span>
            <textarea name="customerNotes" rows="4">{values.customerNotes ?? ''}</textarea>
          </label>

        </form>

        <aside class="checkout-summary">
          <div class="checkout-card-head">
            <div>
              <p class="kicker">{labels.summaryKicker}</p>
              <h2>{labels.productCount(itemCount)}</h2>
            </div>
            <a class="button subtle" href={`/carrinho${langQuery}`}>{labels.reviewCart}</a>
          </div>

          <div class="checkout-lines">
            {#each rows as row}
              <article>
                <div>
                  <strong>{row.product.title}</strong>
                  <span>{row.variant.label} · {content.storePage.finishLabels[row.item.finish]}</span>
                </div>
                <span>{row.item.quantity} x {money.format(row.unitPrice)}</span>
              </article>
            {/each}
          </div>

          <dl>
            <div>
              <dt>{labels.productsNet}</dt>
              <dd>{money.format(estimate.productNet)}</dd>
            </div>
            <div>
              <dt>{labels.transport}</dt>
              <dd>{estimate.transport ? money.format(estimate.transport.transportNet) : labels.toConfirm}</dd>
            </div>
            <div>
              <dt>{labels.vat}</dt>
              <dd>{estimate.vat !== null ? money.format(estimate.vat) : labels.toConfirm}</dd>
            </div>
            <div class="checkout-total">
              <dt>{labels.total}</dt>
              <dd>{estimate.totalGross !== null ? money.format(estimate.totalGross) : labels.toConfirm}</dd>
            </div>
          </dl>
          {#if !customer}
            <p class="checkout-account-hint">{labels.guestHint}</p>
          {/if}
        </aside>

        <div class="checkout-actions checkout-final-actions">
          <button class="button primary" type="submit" form="checkout-order-form" disabled={!data.databaseReady || estimate.totalGross === null}>
            {labels.submit}
          </button>
        </div>
      </div>
    {/if}
  </section>
</main>

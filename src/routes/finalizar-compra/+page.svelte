<script lang="ts">
  import {enhance} from '$app/forms'
  import {browser} from '$app/environment'
  import '$lib/styles/account-checkout.css'
  import SeoHead from '$lib/components/SeoHead.svelte'
  import {cartTotalQuantity, clearCart, readCart, storeVariantForCartItem, type StoreCartItem} from '$lib/cart'
  import {
    calculateStoreEstimate,
    readInitialStorePostalCode,
    readStorePostalCode,
    isSupportedStorePostalCode,
    storeDeliveryEventName,
  } from '$lib/store-shipping'
  import {onMount} from 'svelte'

  let {data, form} = $props()

  let cart = $state<StoreCartItem[]>([])
  // Belt-and-suspenders alongside the server-side idempotency check: disables
  // the button the instant a submit fires so a flurry of clicks never even
  // reaches the network, rather than relying only on the DB unique constraint.
  let submitting = $state(false)
  let privacyConsentAccepted = $state(false)
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
      optionalField: 'opcional',
      purchaseType: 'Tipo de compra',
      individual: 'Particular',
      company: 'Empresa',
      address: 'Morada',
      postalCode: 'Código postal',
      locality: 'Localidade',
      notes: 'Notas',
      submit: 'Submeter pedido',
      submitting: 'A enviar…',
      reviewCart: 'Rever carrinho',
      summaryKicker: 'Resumo',
      productCount: (count: number) => `${count} produto${count === 1 ? '' : 's'}`,
      productsNet: 'Produtos s/ IVA',
      transport: 'Transporte',
      vat: 'IVA 23%',
      total: 'Total',
      toConfirm: 'A confirmar',
      transportOverweight: 'O peso excede o limite de transporte automático. Contacte-nos para organizar a entrega.',
      deliveryAddressUnsupported: 'Esta morada de entrega está fora das zonas atualmente servidas. Escolha ou crie outra morada.',
      guestHint:
        'Pode finalizar como convidado. Criar conta permite consultar histórico de encomendas.',
      notReady: 'Checkout ainda não configurado neste ambiente.',
      preferredAddress: 'Preferida',
      differentAddress: 'Criar nova morada',
      differentAddressHint: 'Será usada nesta encomenda e guardada na sua conta.',
      chooseAddress: 'Selecionar',
      selectedAddress: 'Selecionada',
      createAddressAction: 'Criar',
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
      optionalField: 'optional',
      purchaseType: 'Purchase type',
      individual: 'Individual',
      company: 'Company',
      address: 'Address',
      postalCode: 'Postal code',
      locality: 'Locality',
      notes: 'Notes',
      submit: 'Submit request',
      submitting: 'Sending…',
      reviewCart: 'Review cart',
      summaryKicker: 'Summary',
      productCount: (count: number) => `${count} product${count === 1 ? '' : 's'}`,
      productsNet: 'Products excl. VAT',
      transport: 'Transport',
      vat: 'VAT 23%',
      total: 'Total',
      toConfirm: 'To confirm',
      transportOverweight: 'The weight exceeds the automatic delivery limit. Contact us to arrange delivery.',
      deliveryAddressUnsupported: 'This delivery address is outside the currently served areas. Choose or create another address.',
      guestHint: 'You can check out as a guest. An account lets you see order history.',
      notReady: 'Checkout is not configured in this environment yet.',
      preferredAddress: 'Preferred',
      differentAddress: 'Create new address',
      differentAddressHint: 'Used for this order and saved to your account.',
      chooseAddress: 'Select',
      selectedAddress: 'Selected',
      createAddressAction: 'Create',
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
      optionalField: 'opcional',
      purchaseType: 'Tipo de compra',
      individual: 'Particular',
      company: 'Empresa',
      address: 'Dirección',
      postalCode: 'Código postal',
      locality: 'Localidad',
      notes: 'Notas',
      submit: 'Enviar pedido',
      submitting: 'Enviando…',
      reviewCart: 'Revisar carrito',
      summaryKicker: 'Resumen',
      productCount: (count: number) => `${count} producto${count === 1 ? '' : 's'}`,
      productsNet: 'Productos sin IVA',
      transport: 'Transporte',
      vat: 'IVA 23%',
      total: 'Total',
      toConfirm: 'Por confirmar',
      transportOverweight: 'El peso supera el límite de transporte automático. Contáctenos para organizar la entrega.',
      deliveryAddressUnsupported: 'Esta dirección de entrega está fuera de las zonas atendidas. Elija o cree otra dirección.',
      guestHint:
        'Puedes finalizar como invitado. Crear una cuenta permite consultar el historial.',
      notReady: 'Checkout aún no está configurado en este entorno.',
      preferredAddress: 'Preferida',
      differentAddress: 'Crear nueva dirección',
      differentAddressHint: 'Se usará en este pedido y se guardará en tu cuenta.',
      chooseAddress: 'Seleccionar',
      selectedAddress: 'Seleccionada',
      createAddressAction: 'Crear',
    },
  }

  const paymentCopy: Record<
    string,
    {
      title: string
      mbwayHint: string
      multibancoHint: string
      card: string
      cardHint: string
      soon: string
      mbwayNote: string
      multibancoNote: string
      cardSoon: string
    }
  > = {
    pt: {
      title: 'Método de pagamento',
      mbwayHint: 'Confirme no telemóvel, sem introduzir cartão',
      multibancoHint: 'Receba uma referência para pagar no Multibanco ou app',
      card: 'Cartão',
      cardHint: 'Visa, Mastercard',
      soon: 'Em breve',
      mbwayNote: 'Vamos enviar um pedido MB WAY para o telemóvel indicado acima',
      multibancoNote: 'A referência Multibanco é enviada após confirmarmos a encomenda',
      cardSoon: 'Pagamento por cartão a chegar em breve',
    },
    en: {
      title: 'Payment method',
      mbwayHint: 'Confirm on your phone, no card details needed',
      multibancoHint: 'Get a reference to pay at Multibanco or your bank app',
      card: 'Card',
      cardHint: 'Visa, Mastercard',
      soon: 'Soon',
      mbwayNote: "We'll send an MB WAY request to the phone entered above",
      multibancoNote: 'The Multibanco reference is sent once we confirm the order',
      cardSoon: 'Card payment is coming soon',
    },
    es: {
      title: 'Método de pago',
      mbwayHint: 'Confirma en el móvil, sin introducir tarjeta',
      multibancoHint: 'Recibe una referencia para pagar en Multibanco o la app',
      card: 'Tarjeta',
      cardHint: 'Visa, Mastercard',
      soon: 'Pronto',
      mbwayNote: 'Enviaremos una solicitud MB WAY al móvil indicado arriba',
      multibancoNote: 'La referencia Multibanco se envía tras confirmar el pedido',
      cardSoon: 'El pago con tarjeta llegará pronto',
    },
  }

  type CheckoutAddress = {
    id: string
    addressType: 'billing' | 'delivery'
    name: string
    nif: string
    addressLine1: string
    addressLine2: string
    postalCode: string
    locality: string
    country: string
    isDefault: boolean
  }

  const values = $derived((form?.values ?? {}) as Record<string, string>)
  const initialAddressChoice = (addressType: 'billing' | 'delivery') => {
    const field = addressType === 'billing' ? 'billingAddressId' : 'deliveryAddressId'
    if (values[field]) return values[field]
    const addresses = (data.addresses as CheckoutAddress[]).filter((address) => address.addressType === addressType)
    return addresses.find((address) => address.isDefault)?.id ?? addresses[0]?.id ?? 'custom'
  }
  const formatAddress = (address: CheckoutAddress) =>
    [
      address.addressLine1,
      address.addressLine2,
      `${address.postalCode} ${address.locality}`.trim(),
      address.country,
    ]
      .filter(Boolean)
      .join(' · ')

  const content = $derived(data.site)
  const labels = $derived(checkoutCopy[data.language])
  const pay = $derived(paymentCopy[data.language] ?? paymentCopy.pt)
  let paymentMethod = $state('mbway')
  let paymentMethodLoadedFor = $state('')
  const customer = $derived(data.customer)
  const billingAddresses = $derived((data.addresses as CheckoutAddress[]).filter((address) => address.addressType === 'billing'))
  const deliveryAddresses = $derived((data.addresses as CheckoutAddress[]).filter((address) => address.addressType === 'delivery'))
  let selectedBillingAddressId = $state('custom')
  let selectedDeliveryAddressId = $state('custom')
  let addressChoicesLoadedFor = $state('')
  let customDeliveryPostalCode = $state('')
  const billingAddress = $derived(billingAddresses.find((address) => address.id === selectedBillingAddressId) ?? null)
  const deliveryAddress = $derived(deliveryAddresses.find((address) => address.id === selectedDeliveryAddressId) ?? null)
  const useCustomBillingAddress = $derived(!customer || !billingAddresses.length || selectedBillingAddressId === 'custom' || !billingAddress)
  const useCustomDeliveryAddress = $derived(!customer || !deliveryAddresses.length || selectedDeliveryAddressId === 'custom' || !deliveryAddress)
  const deliveryAddressUnsupported = $derived(
    Boolean(deliveryAddress && !isSupportedStorePostalCode(deliveryAddress.postalCode)),
  )
  const langQuery = $derived(`?lang=${data.language}`)
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
        const variant = product ? storeVariantForCartItem(product, item) : undefined
        if (!product || !variant) return null
        const finish = product.hasFinishChoice ? item.finish : 'natural'
        const unitPrice = variant.prices[finish]
        return {item, product, variant, finish, unitPrice}
      })
      .filter((row): row is NonNullable<typeof row> => row !== null),
  )
  const estimate = $derived(
    calculateStoreEstimate(
      rows.map((row) => ({
        unitPrice: row.unitPrice,
        quantity: row.item.quantity,
        weightKg: row.variant.weightKg,
        flatTransportPrice: row.product.flatTransportPrice,
      })),
      deliveryAddress?.postalCode ?? (customDeliveryPostalCode || deliveryPostalCode),
      {transportMultiplier: content.storePage.transportMultiplier},
    ),
  )
  const estimateStatus = $derived(
    estimate.transportIssue === 'overweight' ? labels.transportOverweight : labels.toConfirm,
  )
  const cartPayload = $derived(JSON.stringify(cart))
  const itemCount = $derived(cartTotalQuantity(cart))

  $effect(() => {
    const nextPaymentMethod = values.paymentMethod || 'mbway'
    if (paymentMethodLoadedFor === nextPaymentMethod) return

    paymentMethod = nextPaymentMethod
    paymentMethodLoadedFor = nextPaymentMethod
  })

  $effect(() => {
    const choiceKey = [
      customer?.id ?? 'guest',
      values.billingAddressId ?? '',
      values.deliveryAddressId ?? '',
      billingAddresses.map((address) => `${address.id}:${address.isDefault ? '1' : '0'}`).join('|'),
      deliveryAddresses.map((address) => `${address.id}:${address.isDefault ? '1' : '0'}`).join('|'),
    ].join('::')

    if (addressChoicesLoadedFor === choiceKey) return
    selectedBillingAddressId = initialAddressChoice('billing')
    selectedDeliveryAddressId = initialAddressChoice('delivery')
    addressChoicesLoadedFor = choiceKey
  })

  $effect(() => {
    const nextPostalCode = values.deliveryPostalCode || deliveryPostalCode
    if (!customDeliveryPostalCode && nextPostalCode) customDeliveryPostalCode = nextPostalCode
  })

  $effect(() => {
    if (form?.success && !clearedAfterSuccess) {
      clearCart()
      cart = []
      clearedAfterSuccess = true
    }
  })

  onMount(() => {
    const refreshDelivery = () => {
      const postalCode = readStorePostalCode()
      deliveryPostalCode = postalCode
      if (!customDeliveryPostalCode) customDeliveryPostalCode = postalCode
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
        <form
          method="POST"
          id="checkout-order-form"
          class="checkout-form"
          use:enhance={() => {
            submitting = true
            return async ({update}) => {
              await update()
              submitting = false
            }
          }}
        >
          <input type="hidden" name="csrfToken" value={data.csrfToken} />
          <input type="hidden" name="submissionToken" value={data.submissionToken} />
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
              <span>{labels.purchaseType}</span>
              <select name="purchaseType">
                <option value="individual" selected={(values.purchaseType ?? customer?.purchaseType) !== 'company'}>{labels.individual}</option>
                <option value="company" selected={(values.purchaseType ?? customer?.purchaseType) === 'company'}>{labels.company}</option>
              </select>
            </label>
          </fieldset>

          <fieldset>
            <legend>{labels.billing}</legend>
            {#if customer}
              <div class="checkout-address-choices">
                {#each billingAddresses as address (address.id)}
                  <label class="checkout-address-choice" class:selected={selectedBillingAddressId === address.id}>
                    <input type="radio" name="billingAddressId" value={address.id} bind:group={selectedBillingAddressId} />
                    <span class="checkout-address-choice-body">
                      <strong>
                        {address.name || labels.billing}
                        {#if address.isDefault}<em>{labels.preferredAddress}</em>{/if}
                      </strong>
                      <small>{formatAddress(address)}</small>
                    </span>
                    <span class="checkout-address-choice-action">
                      {selectedBillingAddressId === address.id ? labels.selectedAddress : labels.chooseAddress}
                    </span>
                  </label>
                {/each}
                <label class="checkout-address-choice" class:selected={useCustomBillingAddress}>
                  <input type="radio" name="billingAddressId" value="custom" bind:group={selectedBillingAddressId} />
                  <span class="checkout-address-choice-body">
                    <strong>{labels.differentAddress}</strong>
                    <small>{labels.differentAddressHint}</small>
                  </span>
                  <span class="checkout-address-choice-action">{labels.createAddressAction}</span>
                </label>
              </div>
            {/if}

            {#if useCustomBillingAddress}
              <label>
                <span>{labels.name}</span>
                <input name="billingName" autocomplete="billing name" required value={values.billingName ?? customer?.name ?? ''} />
              </label>
              <label>
                <span>{labels.nif} <em>({labels.optionalField})</em></span>
                <input name="nif" inputmode="numeric" value={values.nif ?? customer?.nif ?? ''} />
              </label>
              <label>
                <span>{labels.address}</span>
                <input name="billingAddress" autocomplete="billing street-address" required value={values.billingAddress ?? ''} />
              </label>
              <label>
                <span>{labels.postalCode}</span>
                <input name="billingPostalCode" autocomplete="billing postal-code" required value={values.billingPostalCode ?? deliveryPostalCode} />
              </label>
              <label>
                <span>{labels.locality}</span>
                <input name="billingLocality" autocomplete="billing address-level2" required value={values.billingLocality ?? ''} />
              </label>
            {:else if billingAddress}
              <input type="hidden" name="billingName" value={billingAddress.name} />
              <input type="hidden" name="nif" value={billingAddress.nif} />
              <input type="hidden" name="billingAddress" value={billingAddress.addressLine1} />
              <input type="hidden" name="billingPostalCode" value={billingAddress.postalCode} />
              <input type="hidden" name="billingLocality" value={billingAddress.locality} />
            {/if}
          </fieldset>

          <fieldset>
            <legend>{labels.delivery}</legend>
            {#if customer}
              <div class="checkout-address-choices">
                {#each deliveryAddresses as address (address.id)}
                  <label class="checkout-address-choice" class:selected={selectedDeliveryAddressId === address.id}>
                    <input type="radio" name="deliveryAddressId" value={address.id} bind:group={selectedDeliveryAddressId} />
                    <span class="checkout-address-choice-body">
                      <strong>
                        {address.name || labels.delivery}
                        {#if address.isDefault}<em>{labels.preferredAddress}</em>{/if}
                      </strong>
                      <small>{formatAddress(address)}</small>
                    </span>
                    <span class="checkout-address-choice-action">
                      {selectedDeliveryAddressId === address.id ? labels.selectedAddress : labels.chooseAddress}
                    </span>
                  </label>
                {/each}
                <label class="checkout-address-choice" class:selected={useCustomDeliveryAddress}>
                  <input type="radio" name="deliveryAddressId" value="custom" bind:group={selectedDeliveryAddressId} />
                  <span class="checkout-address-choice-body">
                    <strong>{labels.differentAddress}</strong>
                    <small>{labels.differentAddressHint}</small>
                  </span>
                  <span class="checkout-address-choice-action">{labels.createAddressAction}</span>
                </label>
              </div>
            {/if}

            {#if useCustomDeliveryAddress}
              <label>
                <span>{labels.name}</span>
                <input name="deliveryName" autocomplete="shipping name" required value={values.deliveryName ?? customer?.name ?? ''} />
              </label>
              <label>
                <span>{labels.address}</span>
                <input name="deliveryAddress" autocomplete="shipping street-address" required value={values.deliveryAddress ?? ''} />
              </label>
              <label>
                <span>{labels.postalCode}</span>
                <input name="deliveryPostalCode" autocomplete="shipping postal-code" required bind:value={customDeliveryPostalCode} />
              </label>
              <label>
                <span>{labels.locality}</span>
                <input name="deliveryLocality" autocomplete="shipping address-level2" required value={values.deliveryLocality ?? ''} />
              </label>
            {:else if deliveryAddress}
              <input type="hidden" name="deliveryName" value={deliveryAddress.name} />
              <input type="hidden" name="deliveryAddress" value={deliveryAddress.addressLine1} />
              <input type="hidden" name="deliveryPostalCode" value={deliveryAddress.postalCode} />
              <input type="hidden" name="deliveryLocality" value={deliveryAddress.locality} />
            {/if}
            {#if deliveryAddressUnsupported}
              <p class="checkout-address-warning" role="alert">{labels.deliveryAddressUnsupported}</p>
            {/if}
          </fieldset>

          <fieldset class="checkout-payment">
            <legend>{pay.title}</legend>
            <div class="payment-methods">
              <label class="payment-method" class:selected={paymentMethod === 'mbway'}>
                <input type="radio" name="paymentMethod" value="mbway" bind:group={paymentMethod} />
                <span class="payment-method-mark" aria-hidden="true"></span>
                <span class="payment-logo payment-logo-mbway" aria-hidden="true">
                  <img src="/payment/mb-way.svg" alt="" loading="lazy" decoding="async" />
                </span>
                <span class="payment-method-body">
                  <strong>MB WAY</strong>
                  <small>{pay.mbwayHint}</small>
                </span>
              </label>
              <label class="payment-method" class:selected={paymentMethod === 'multibanco'}>
                <input type="radio" name="paymentMethod" value="multibanco" bind:group={paymentMethod} />
                <span class="payment-method-mark" aria-hidden="true"></span>
                <span class="payment-logo payment-logo-multibanco" aria-hidden="true">
                  <img src="/payment/multibanco.svg" alt="" loading="lazy" decoding="async" />
                </span>
                <span class="payment-method-body">
                  <strong>Multibanco</strong>
                  <small>{pay.multibancoHint}</small>
                </span>
              </label>
              <label class="payment-method" class:selected={paymentMethod === 'card'}>
                <input type="radio" name="paymentMethod" value="card" bind:group={paymentMethod} />
                <span class="payment-method-mark" aria-hidden="true"></span>
                <span class="payment-card-logos" aria-hidden="true">
                  <img src="/payment/visa.svg" alt="" loading="lazy" decoding="async" />
                  <img src="/payment/mastercard.svg" alt="" loading="lazy" decoding="async" />
                </span>
                <span class="payment-method-body">
                  <strong>{pay.card} <span class="payment-soon">{pay.soon}</span></strong>
                  <small>{pay.cardHint}</small>
                </span>
              </label>
            </div>

            {#if paymentMethod === 'mbway'}
              <p class="payment-note">{pay.mbwayNote}</p>
            {:else if paymentMethod === 'multibanco'}
              <p class="payment-note">{pay.multibancoNote}</p>
            {:else if paymentMethod === 'card'}
              <div class="payment-card-slot" aria-hidden="true">
                <span class="payment-card-line">•••• •••• •••• ••••</span>
                <span class="payment-card-meta"><span>MM/AA</span><span>CVC</span></span>
                <p class="payment-note">{pay.cardSoon}</p>
              </div>
            {/if}
          </fieldset>

          <label class="checkout-notes">
            <span>{labels.notes}</span>
            <textarea name="customerNotes" rows="4">{values.customerNotes ?? ''}</textarea>
          </label>

          <label class="consent-field">
            <input
              name="privacyConsent"
              type="checkbox"
              required
              aria-required="true"
              bind:checked={privacyConsentAccepted}
            />
            <span>
              {content.common.privacyConsentPrefix}
              <a href={content.common.privacyPolicyUrl} target="_blank" rel="noreferrer"
                >{content.common.privacyPolicyLabel}</a
              >
            </span>
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
                  <span>
                    {row.variant.label}{#if row.product.hasFinishChoice} · {content.storePage.finishLabels[row.finish]}{/if}
                  </span>
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
              <dd>{estimate.transport ? money.format(estimate.transport.transportNet) : estimateStatus}</dd>
            </div>
            <div>
              <dt>{labels.vat}</dt>
              <dd>{estimate.vat !== null ? money.format(estimate.vat) : estimateStatus}</dd>
            </div>
            <div class="checkout-total">
              <dt>{labels.total}</dt>
              <dd>{estimate.totalGross !== null ? money.format(estimate.totalGross) : estimateStatus}</dd>
            </div>
          </dl>
          {#if !customer}
            <p class="checkout-account-hint">{labels.guestHint}</p>
          {/if}
        </aside>

        <div class="checkout-actions checkout-final-actions">
          <button
            class="button primary"
            type="submit"
            form="checkout-order-form"
            disabled={!data.databaseReady ||
              estimate.totalGross === null ||
              paymentMethod === 'card' ||
              submitting ||
              !privacyConsentAccepted}
          >
            {submitting ? labels.submitting : labels.submit}
          </button>
        </div>
      </div>
    {/if}
  </section>
</main>

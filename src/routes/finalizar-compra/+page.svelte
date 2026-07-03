<script lang="ts">
  import {browser} from '$app/environment'
  import PageHero from '$lib/components/PageHero.svelte'
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

  const content = $derived(data.site[data.language])
  const customer = $derived(data.customer)
  const billingAddress = $derived(data.addresses.find((address) => address.addressType === 'billing'))
  const deliveryAddress = $derived(data.addresses.find((address) => address.addressType === 'delivery'))
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
  <PageHero kicker="Checkout" title="Finalizar pedido" lead="" />

  <section class="section checkout-section">
    {#if form?.success}
      <div class="checkout-success">
        <p class="kicker">Pedido recebido</p>
        <h1>{form.orderNumber}</h1>
        <p>{form.message}</p>
        <p>Total: <strong>{money.format(form.totalGross)}</strong></p>
        <a class="button primary" href={`/loja?lang=${data.language}`}>Voltar à loja</a>
      </div>
    {:else if !rows.length}
      <div class="checkout-success">
        <p class="kicker">Carrinho</p>
        <h1>O carrinho está vazio</h1>
        <a class="button primary" href={`/loja?lang=${data.language}`}>Continuar na loja</a>
      </div>
    {:else}
      <div class="checkout-layout">
        <form method="POST" class="checkout-form">
          <input type="hidden" name="csrfToken" value={data.csrfToken} />
          <input type="hidden" name="language" value={data.language} />
          <input type="hidden" name="cartItems" value={cartPayload} />

          {#if form?.message}
            <p class="form-feedback">{form.message}</p>
          {/if}
          {#if !data.databaseReady}
            <p class="form-feedback">Checkout ainda não configurado neste ambiente.</p>
          {/if}

          <fieldset>
            <legend>Dados do cliente</legend>
            <label>
              <span>Nome</span>
              <input name="name" autocomplete="name" required value={values.name ?? customer?.name ?? ''} />
            </label>
            <label>
              <span>Email</span>
              <input name="email" type="email" autocomplete="email" required value={values.email ?? customer?.email ?? ''} />
            </label>
            <label>
              <span>Telefone</span>
              <input name="phone" autocomplete="tel" required value={values.phone ?? customer?.phone ?? ''} />
            </label>
            <label>
              <span>NIF</span>
              <input name="nif" inputmode="numeric" value={values.nif ?? customer?.nif ?? ''} />
            </label>
            <label>
              <span>Tipo de compra</span>
              <select name="purchaseType">
                <option value="individual" selected={(values.purchaseType ?? customer?.purchaseType) !== 'company'}>Particular</option>
                <option value="company" selected={(values.purchaseType ?? customer?.purchaseType) === 'company'}>Empresa</option>
              </select>
            </label>
          </fieldset>

          <fieldset>
            <legend>Morada de faturação</legend>
            <label>
              <span>Morada</span>
              <input name="billingAddress" autocomplete="billing street-address" required value={values.billingAddress ?? billingAddress?.addressLine1 ?? ''} />
            </label>
            <label>
              <span>Código postal</span>
              <input name="billingPostalCode" autocomplete="billing postal-code" required value={values.billingPostalCode ?? billingAddress?.postalCode ?? deliveryPostalCode} />
            </label>
            <label>
              <span>Localidade</span>
              <input name="billingLocality" autocomplete="billing address-level2" required value={values.billingLocality ?? billingAddress?.locality ?? ''} />
            </label>
          </fieldset>

          <fieldset>
            <legend>Morada de entrega</legend>
            <label>
              <span>Morada</span>
              <input name="deliveryAddress" autocomplete="shipping street-address" required value={values.deliveryAddress ?? deliveryAddress?.addressLine1 ?? ''} />
            </label>
            <label>
              <span>Código postal</span>
              <input name="deliveryPostalCode" autocomplete="shipping postal-code" required value={values.deliveryPostalCode ?? deliveryAddress?.postalCode ?? deliveryPostalCode} />
            </label>
            <label>
              <span>Localidade</span>
              <input name="deliveryLocality" autocomplete="shipping address-level2" required value={values.deliveryLocality ?? deliveryAddress?.locality ?? ''} />
            </label>
          </fieldset>

          <label class="checkout-notes">
            <span>Notas</span>
            <textarea name="customerNotes" rows="4">{values.customerNotes ?? ''}</textarea>
          </label>

          <button class="button primary" type="submit" disabled={!data.databaseReady || estimate.totalGross === null}>
            Submeter pedido
          </button>
        </form>

        <aside class="checkout-summary">
          <p class="kicker">Resumo</p>
          <h2>{itemCount} produto(s)</h2>
          <div class="checkout-lines">
            {#each rows as row}
              <article>
                <strong>{row.product.title}</strong>
                <span>{row.variant.label} · {content.storePage.finishLabels[row.item.finish]}</span>
                <span>{row.item.quantity} x {money.format(row.unitPrice)}</span>
              </article>
            {/each}
          </div>
          <dl>
            <div>
              <dt>Produtos s/ IVA</dt>
              <dd>{money.format(estimate.productNet)}</dd>
            </div>
            <div>
              <dt>Transporte</dt>
              <dd>{estimate.transport ? money.format(estimate.transport.transportNet) : 'A confirmar'}</dd>
            </div>
            <div>
              <dt>IVA 23%</dt>
              <dd>{estimate.vat !== null ? money.format(estimate.vat) : 'A confirmar'}</dd>
            </div>
            <div class="checkout-total">
              <dt>Total</dt>
              <dd>{estimate.totalGross !== null ? money.format(estimate.totalGross) : 'A confirmar'}</dd>
            </div>
          </dl>
          {#if !customer}
            <p class="checkout-account-hint">
              Pode finalizar como convidado. Criar conta permite consultar histórico de encomendas.
            </p>
          {/if}
        </aside>
      </div>
    {/if}
  </section>
</main>

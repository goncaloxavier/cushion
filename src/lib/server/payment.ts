export type PaymentPreparation =
  | {
      ok: true
      provider: 'ifthenpay_paybylink'
      status: 'created'
      paymentUrl: string
      reference: string
      response: Record<string, unknown>
    }
  | {
      ok: false
      provider: 'ifthenpay_paybylink'
      status: 'not_configured'
      reason: string
      response: Record<string, unknown>
    }

export type PaymentOrderInput = {
  orderId: string
  orderNumber: string
  totalGross: number
  customerEmail: string
}

export const ifthenpayConfigured = () =>
  Boolean(process.env.IFTHENPAY_BACKOFFICE_KEY && process.env.IFTHENPAY_PAYBYLINK_ENDPOINT)

export const prepareIfthenpayPayByLink = async (
  order: PaymentOrderInput,
): Promise<PaymentPreparation> => {
  if (!ifthenpayConfigured()) {
    return {
      ok: false,
      provider: 'ifthenpay_paybylink',
      status: 'not_configured',
      reason: 'Ifthenpay PayByLink credentials/API endpoint are not configured.',
      response: {
        orderId: order.orderId,
        orderNumber: order.orderNumber,
        failClosed: true,
      },
    }
  }

  // Deliberately disabled until the contract, callback URLs, credentials and
  // status mapping are confirmed with Ifthenpay. This boundary is here so the
  // checkout creates a real order without inventing a payment implementation.
  return {
    ok: false,
    provider: 'ifthenpay_paybylink',
    status: 'not_configured',
    reason: 'Ifthenpay PayByLink adapter is present but intentionally disabled.',
    response: {
      endpointPresent: Boolean(process.env.IFTHENPAY_PAYBYLINK_ENDPOINT),
      orderNumber: order.orderNumber,
      failClosed: true,
    },
  }
}

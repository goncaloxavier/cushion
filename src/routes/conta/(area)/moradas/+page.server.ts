import {fail, redirect} from '@sveltejs/kit'
import {csrfOk, sameOriginOk} from '$lib/server/form-guard'
import {databaseConfigured} from '$lib/server/db'
import {
  createCustomerAddress,
  deleteCustomerAddress,
  listCustomerAddresses,
  setCustomerDefaultAddress,
  updateCustomerAddress,
  type CustomerAddressInput,
} from '$lib/server/orders'
import type {Actions, PageServerLoad} from './$types'

const csrfCookieName = 'df4y_customer_account_csrf'

const clean = (value: FormDataEntryValue | null, max = 240) =>
  String(value ?? '')
    .normalize('NFC')
    .replace(/\p{Cc}+/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)

const cleanCountry = (value: FormDataEntryValue | null) =>
  clean(value, 2).toUpperCase() || 'PT'

const addressTypeFrom = (value: FormDataEntryValue | null) =>
  clean(value, 20) === 'billing' ? 'billing' : 'delivery'

const actionGuard = async (
  args: Parameters<NonNullable<Actions[string]>>[0],
  csrfToken: string,
  values: Record<string, unknown> = {},
) => {
  if (!args.locals.customer) redirect(303, '/conta/entrar')
  if (!sameOriginOk(args.request.headers.get('origin'), args.request.headers.get('referer'), args.url.origin)) {
    return fail(403, {address: 'error', message: 'Não foi possível validar a origem do pedido.', values})
  }
  if (!csrfOk(args.cookies.get(csrfCookieName), csrfToken)) {
    return fail(403, {address: 'error', message: 'Atualize a página e tente novamente.', values})
  }
  if (!databaseConfigured()) {
    return fail(503, {address: 'error', message: 'A área de cliente ainda não está configurada.', values})
  }
  return null
}

// Guard + CSRF live in the shared (area) layout; await parent() ensures the
// guard runs before this touches locals.customer.
export const load: PageServerLoad = async ({locals, parent}) => {
  await parent()
  return {
    addresses: await listCustomerAddresses(locals.customer!.id),
  }
}

export const actions: Actions = {
  saveAddress: async (args) => {
    const {locals, request} = args
    const data = await request.formData()
    const csrfToken = clean(data.get('csrfToken'), 128)
    const addressId = clean(data.get('addressId'), 80)
    const addressType = addressTypeFrom(data.get('addressType'))
    const input: CustomerAddressInput = {
      name: clean(data.get('name'), 120),
      line1: clean(data.get('addressLine1'), 240),
      line2: clean(data.get('addressLine2'), 240),
      postalCode: clean(data.get('postalCode'), 32),
      locality: clean(data.get('locality'), 120),
      country: cleanCountry(data.get('country')),
    }
    const values = {addressId, addressType, ...input}

    const guarded = await actionGuard(args, csrfToken, values)
    if (guarded) return guarded
    if (!input.line1 || !input.postalCode || !input.locality) {
      return fail(400, {address: 'error', message: 'Preencha a morada, código postal e localidade.', values})
    }

    if (addressId) {
      const updated = await updateCustomerAddress(locals.customer!.id, addressId, input)
      if (!updated) {
        return fail(404, {address: 'error', message: 'Não foi possível encontrar essa morada.', values})
      }
      return {address: 'saved'}
    }

    const existing = await listCustomerAddresses(locals.customer!.id)
    const hasSameType = existing.some((address) => address.addressType === addressType)
    await createCustomerAddress(locals.customer!.id, addressType, input, !hasSameType)
    return {address: 'saved'}
  },

  setDefault: async (args) => {
    const data = await args.request.formData()
    const csrfToken = clean(data.get('csrfToken'), 128)
    const addressId = clean(data.get('addressId'), 80)
    const guarded = await actionGuard(args, csrfToken, {addressId})
    if (guarded) return guarded
    if (!addressId) {
      return fail(400, {address: 'error', message: 'Escolha uma morada.'})
    }

    const changed = await setCustomerDefaultAddress(args.locals.customer!.id, addressId)
    if (!changed) {
      return fail(404, {address: 'error', message: 'Não foi possível encontrar essa morada.'})
    }
    return {address: 'default'}
  },

  deleteAddress: async (args) => {
    const data = await args.request.formData()
    const csrfToken = clean(data.get('csrfToken'), 128)
    const addressId = clean(data.get('addressId'), 80)
    const guarded = await actionGuard(args, csrfToken, {addressId})
    if (guarded) return guarded
    if (!addressId) {
      return fail(400, {address: 'error', message: 'Escolha uma morada.'})
    }

    const deleted = await deleteCustomerAddress(args.locals.customer!.id, addressId)
    if (!deleted) {
      return fail(404, {address: 'error', message: 'Não foi possível encontrar essa morada.'})
    }
    return {address: 'deleted'}
  },
}

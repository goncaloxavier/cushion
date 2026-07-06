import type {StaffUser} from '$lib/server/auth'
import type {CustomerUser} from '$lib/server/customer-auth'

declare global {
  namespace App {
    interface Locals {
      staff: StaffUser | null
      customer: CustomerUser | null
    }
  }
}

export {}

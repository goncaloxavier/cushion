import type {StaffUser} from '$lib/server/auth'

declare global {
  namespace App {
    interface Locals {
      staff: StaffUser | null
    }
  }
}

export {}

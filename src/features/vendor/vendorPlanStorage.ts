export type VendorPlanChoice = 'free' | 'premium'

const STORAGE_KEY = 'vendorPlan'

export function parseVendorPlan(value: string | null | undefined): VendorPlanChoice | null {
  return value === 'free' || value === 'premium' ? value : null
}

export function getSavedVendorPlan(): VendorPlanChoice | null {
  return parseVendorPlan(localStorage.getItem(STORAGE_KEY))
}

/** Where a newly verified vendor should go after OTP (business profile first). */
export function vendorPostVerificationPath(_plan?: VendorPlanChoice | null): string {
  return '/vendor/plan-form'
}

export function saveVendorPlan(plan: VendorPlanChoice) {
  localStorage.setItem(STORAGE_KEY, plan)
}

export function clearSavedVendorPlan() {
  localStorage.removeItem(STORAGE_KEY)
}

export function vendorSignupPlanPath() {
  return '/vendor/choose-your-plan?signup=1'
}

export function vendorRegisterPath(plan: VendorPlanChoice) {
  return `/register?role=vendor&plan=${plan}`
}

export function signUpPathForRole(role: 'user' | 'vendor') {
  return role === 'vendor' ? vendorSignupPlanPath() : `/register?role=${role}`
}

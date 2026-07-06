import { request } from '@/api/request'

type AnyRecord = Record<string, unknown>

export type BillingPeriod = 'monthly' | 'quarterly' | 'yearly' | 'lifetime'

export type AdminSubscriptionPlan = {
  id: number
  package_key: string
  title: string
  billing_period: BillingPeriod | null
  billing_period_label: string | null
  amount: number
  original_price: number | null
  discount_label: string | null
  promotional_text: string | null
  promotion_starts_at: string | null
  promotion_ends_at: string | null
  currency: string
  description: string
  perks: string[]
  is_active: boolean
  is_recommended: boolean
  trial_eligible: boolean
  trial_duration_days: number | null
  sort_order: number
}

export type SubscriptionPlanPayload = {
  package_key: string
  title: string
  billing_period: BillingPeriod
  amount: number
  original_price?: number | null
  promotional_text?: string | null
  promotion_starts_at?: string | null
  promotion_ends_at?: string | null
  description?: string | null
  perks?: string[]
  is_active?: boolean
  is_recommended?: boolean
  trial_eligible?: boolean
  trial_duration_days?: number | null
  sort_order?: number
}

function asRecord(value: unknown): AnyRecord | null {
  if (!value || typeof value !== 'object') return null
  return value as AnyRecord
}

function asString(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  return fallback
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function asNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null
  const parsed = asNumber(value, Number.NaN)
  return Number.isFinite(parsed) ? parsed : null
}

function asBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value
  if (value === 1 || value === '1' || value === 'true') return true
  if (value === 0 || value === '0' || value === 'false') return false
  return fallback
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map((v) => asString(v)).filter(Boolean)
}

function messageFromResponse(root: AnyRecord | null, fallback: string): string {
  return asString(root?.message, fallback)
}

/**
 * Axios rejects on 4xx/5xx before our `res.data.success` checks ever run, so
 * validation errors (422, from FormRequest rules) need to be unwrapped here —
 * otherwise callers only ever see axios's generic "Request failed with status
 * code 422" instead of the real reason.
 */
function formatApiError(error: unknown, fallback: string): never {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { status?: number; data?: unknown } }
    if (axiosError.response?.data) {
      const data = asRecord(axiosError.response.data)
      const message = asString(data?.message, fallback)
      const fieldErrors = asRecord(data?.errors)
      const details = fieldErrors
        ? ': ' + Object.values(fieldErrors).flat().map((v) => asString(v)).filter(Boolean).join(', ')
        : ''
      throw new Error(`${message}${details}`)
    }
  }
  throw error instanceof Error ? error : new Error(fallback)
}

function parsePlan(raw: unknown): AdminSubscriptionPlan | null {
  const o = asRecord(raw)
  if (!o) return null

  return {
    id: asNumber(o.id),
    package_key: asString(o.package_key),
    title: asString(o.title),
    billing_period: (asString(o.billing_period) || null) as BillingPeriod | null,
    billing_period_label: asString(o.billing_period_label) || null,
    amount: asNumber(o.amount),
    original_price: asNullableNumber(o.original_price),
    discount_label: asString(o.discount_label) || null,
    promotional_text: asString(o.promotional_text) || null,
    promotion_starts_at: asString(o.promotion_starts_at) || null,
    promotion_ends_at: asString(o.promotion_ends_at) || null,
    currency: asString(o.currency, 'NGN'),
    description: asString(o.description),
    perks: asStringArray(o.perks),
    is_active: asBoolean(o.is_active, true),
    is_recommended: asBoolean(o.is_recommended, false),
    trial_eligible: asBoolean(o.trial_eligible, false),
    trial_duration_days: asNullableNumber(o.trial_duration_days),
    sort_order: asNumber(o.sort_order),
  }
}

function parsePlanList(raw: unknown): AdminSubscriptionPlan[] {
  if (!Array.isArray(raw)) return []
  return raw.map(parsePlan).filter((p): p is AdminSubscriptionPlan => p !== null)
}

export async function adminListSubscriptionPlans(): Promise<AdminSubscriptionPlan[]> {
  try {
    const res = await request.post('/admin/subscription-plans')
    const root = asRecord(res.data)
    if (!root || root.success !== true) {
      throw new Error(messageFromResponse(root, 'Failed to load subscription plans.'))
    }
    const inner = asRecord(root.data)
    return parsePlanList(inner?.plans)
  } catch (error) {
    formatApiError(error, 'Failed to load subscription plans.')
  }
}

export async function adminCreateSubscriptionPlan(
  payload: SubscriptionPlanPayload,
): Promise<AdminSubscriptionPlan> {
  try {
    const res = await request.post('/admin/subscription-plans/store', payload)
    const root = asRecord(res.data)
    const plan = root?.success === true ? parsePlan(root.data) : null
    if (!plan) {
      throw new Error(messageFromResponse(root, 'Failed to create subscription plan.'))
    }
    return plan
  } catch (error) {
    formatApiError(error, 'Failed to create subscription plan.')
  }
}

export async function adminUpdateSubscriptionPlan(
  payload: SubscriptionPlanPayload & { id: number },
): Promise<AdminSubscriptionPlan> {
  try {
    const res = await request.post('/admin/subscription-plans/update', payload)
    const root = asRecord(res.data)
    const plan = root?.success === true ? parsePlan(root.data) : null
    if (!plan) {
      throw new Error(messageFromResponse(root, 'Failed to update subscription plan.'))
    }
    return plan
  } catch (error) {
    formatApiError(error, 'Failed to update subscription plan.')
  }
}

export async function adminDeleteSubscriptionPlan(id: number): Promise<void> {
  try {
    const res = await request.post('/admin/subscription-plans/delete', { id })
    const root = asRecord(res.data)
    if (!root || root.success !== true) {
      throw new Error(messageFromResponse(root, 'Failed to delete subscription plan.'))
    }
  } catch (error) {
    formatApiError(error, 'Failed to delete subscription plan.')
  }
}

export async function adminToggleSubscriptionPlanActive(
  id: number,
  isActive: boolean,
): Promise<AdminSubscriptionPlan> {
  try {
    const res = await request.post('/admin/subscription-plans/toggle-active', {
      id,
      is_active: isActive,
    })
    const root = asRecord(res.data)
    const plan = root?.success === true ? parsePlan(root.data) : null
    if (!plan) {
      throw new Error(messageFromResponse(root, 'Failed to update plan status.'))
    }
    return plan
  } catch (error) {
    formatApiError(error, 'Failed to update plan status.')
  }
}

export async function adminSetRecommendedSubscriptionPlan(id: number): Promise<AdminSubscriptionPlan> {
  try {
    const res = await request.post('/admin/subscription-plans/set-recommended', { id })
    const root = asRecord(res.data)
    const plan = root?.success === true ? parsePlan(root.data) : null
    if (!plan) {
      throw new Error(messageFromResponse(root, 'Failed to update recommended plan.'))
    }
    return plan
  } catch (error) {
    formatApiError(error, 'Failed to update recommended plan.')
  }
}

export async function adminReorderSubscriptionPlans(orderedIds: number[]): Promise<AdminSubscriptionPlan[]> {
  try {
    const res = await request.post('/admin/subscription-plans/reorder', { ordered_ids: orderedIds })
    const root = asRecord(res.data)
    if (!root || root.success !== true) {
      throw new Error(messageFromResponse(root, 'Failed to reorder subscription plans.'))
    }
    const inner = asRecord(root.data)
    return parsePlanList(inner?.plans)
  } catch (error) {
    formatApiError(error, 'Failed to reorder subscription plans.')
  }
}

import { request } from '@/api/request'

export type WalletTransaction = {
  id: number
  type: 'credit' | 'debit'
  amount: number
  balance_after: number
  description: string
  reference: string | null
  metadata?: Record<string, unknown> | null
  created_at: string
  created_at_human?: string | null
}

export type UserWallet = {
  balance: number
  currency: string
  transactions: WalletTransaction[]
  pagination?: {
    current_page: number
    per_page: number
    last_page: number
    total: number
  }
}

export type AdminUserWallet = UserWallet & {
  id?: number
  user_id?: number
  earn_balance: number
  top_up_balance: number
  summary?: {
    transaction_count: number
    total_credited: number
    total_debited: number
  }
}

type RawRecord = Record<string, unknown>

function asRecord(value: unknown): RawRecord | null {
  if (!value || typeof value !== 'object') return null
  return value as RawRecord
}

function pickString(source: RawRecord, keys: string[], fallback = ''): string {
  for (const key of keys) {
    const value = source[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
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

function parseTransaction(raw: unknown): WalletTransaction | null {
  const row = asRecord(raw)
  if (!row) return null
  const type = row.type === 'debit' ? 'debit' : 'credit'
  const metadata = asRecord(row.metadata)
  return {
    id: asNumber(row.id),
    type,
    amount: asNumber(row.amount),
    balance_after: asNumber(row.balance_after ?? row.balanceAfter),
    description: pickString(row, ['description'], 'Wallet transaction'),
    reference: pickString(row, ['reference'], '') || null,
    metadata,
    created_at: pickString(row, ['created_at', 'createdAt']),
    created_at_human: pickString(row, ['created_at_human', 'createdAtHuman'], '') || null,
  }
}

function parseWallet(raw: unknown): UserWallet {
  const row = asRecord(raw) ?? {}
  const transactionsRaw = Array.isArray(row.transactions) ? row.transactions : []
  const pagination = asRecord(row.pagination)
  return {
    balance: asNumber(row.balance),
    currency: pickString(row, ['currency'], 'NGN'),
    transactions: transactionsRaw
      .map((item) => parseTransaction(item))
      .filter((item): item is WalletTransaction => item !== null),
    pagination: pagination
      ? {
          current_page: asNumber(pagination.current_page ?? pagination.currentPage, 1),
          per_page: asNumber(pagination.per_page ?? pagination.perPage, 50),
          last_page: asNumber(pagination.last_page ?? pagination.lastPage, 1),
          total: asNumber(pagination.total),
        }
      : undefined,
  }
}

function parseAdminWallet(raw: unknown): AdminUserWallet {
  const base = parseWallet(raw)
  const row = asRecord(raw) ?? {}
  const summary = asRecord(row.summary)
  return {
    ...base,
    id: asNumber(row.id) || undefined,
    user_id: asNumber(row.user_id ?? row.userId) || undefined,
    earn_balance: asNumber(row.earn_balance ?? row.earnBalance),
    top_up_balance: asNumber(row.top_up_balance ?? row.topUpBalance),
    summary: summary
      ? {
          transaction_count: asNumber(summary.transaction_count ?? summary.transactionCount),
          total_credited: asNumber(summary.total_credited ?? summary.totalCredited),
          total_debited: asNumber(summary.total_debited ?? summary.totalDebited),
        }
      : undefined,
  }
}

export async function fetchUserWallet(params?: {
  page?: number
  per_page?: number
}): Promise<UserWallet> {
  const res = await request.get('/user/wallet', {
    params: {
      page: params?.page ?? 1,
      per_page: params?.per_page ?? 20,
    },
  })
  const root = asRecord(res.data)
  if (!root || root.success !== true) {
    throw new Error(pickString(root ?? {}, ['message'], 'Failed to load wallet.'))
  }
  const data = asRecord(root.data)
  return parseWallet(data?.wallet)
}

export async function fetchAdminUserWallet(
  userId: number,
  params?: { page?: number; per_page?: number },
): Promise<AdminUserWallet> {
  const res = await request.post('/admin/users/wallet', {
    user_id: userId,
    page: params?.page ?? 1,
    per_page: params?.per_page ?? 50,
  })
  const root = asRecord(res.data)
  if (!root || root.success !== true) {
    throw new Error(pickString(root ?? {}, ['message'], 'Failed to load user wallet.'))
  }
  const data = asRecord(root.data)
  return parseAdminWallet(data?.wallet)
}

export type WalletTopUpInit = {
  payment_id: number
  amount: number
  currency: string
  tx_ref: string
  gateway: string
}

export async function initWalletTopUp(amount: number, gateway?: string): Promise<WalletTopUpInit> {
  const res = await request.post('/user/wallet/top-up', { amount, gateway })
  const root = asRecord(res.data)
  if (!root || root.success !== true) {
    throw new Error(pickString(root ?? {}, ['message'], 'Could not start top-up.'))
  }
  const data = asRecord(root.data)
  const checkout = asRecord(data?.checkout) ?? {}
  return {
    payment_id: asNumber(checkout.payment_id ?? checkout.paymentId),
    amount: asNumber(checkout.amount),
    currency: pickString(checkout, ['currency'], 'NGN'),
    tx_ref: pickString(checkout, ['tx_ref', 'txRef']),
    gateway: pickString(checkout, ['gateway'], 'paystack'),
  }
}

export async function confirmWalletTopUp(payload: {
  payment_id: number
  gateway_transaction_id: string
  gateway: string
}): Promise<UserWallet> {
  const res = await request.post('/user/wallet/top-up/confirm', payload)
  const root = asRecord(res.data)
  if (!root || root.success !== true) {
    throw new Error(pickString(root ?? {}, ['message'], 'Could not confirm top-up.'))
  }
  const data = asRecord(root.data)
  return parseWallet(data?.wallet)
}

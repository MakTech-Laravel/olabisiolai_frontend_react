import { request } from '@/api/request'

export type WalletTransaction = {
  id: number
  type: 'credit' | 'debit'
  amount: number
  balance_after: number
  description: string
  reference: string | null
  created_at: string
}

export type UserWallet = {
  balance: number
  currency: string
  transactions: WalletTransaction[]
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
  return {
    id: asNumber(row.id),
    type,
    amount: asNumber(row.amount),
    balance_after: asNumber(row.balance_after ?? row.balanceAfter),
    description: pickString(row, ['description'], 'Wallet transaction'),
    reference: pickString(row, ['reference'], '') || null,
    created_at: pickString(row, ['created_at', 'createdAt']),
  }
}

function parseWallet(raw: unknown): UserWallet {
  const row = asRecord(raw) ?? {}
  const transactionsRaw = Array.isArray(row.transactions) ? row.transactions : []
  return {
    balance: asNumber(row.balance),
    currency: pickString(row, ['currency'], 'NGN'),
    transactions: transactionsRaw
      .map((item) => parseTransaction(item))
      .filter((item): item is WalletTransaction => item !== null),
  }
}

export async function fetchUserWallet(): Promise<UserWallet> {
  const res = await request.get('/user/wallet')
  const root = asRecord(res.data)
  if (!root || root.success !== true) {
    throw new Error(pickString(root ?? {}, ['message'], 'Failed to load wallet.'))
  }
  const data = asRecord(root.data)
  return parseWallet(data?.wallet)
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

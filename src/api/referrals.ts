import { request } from '@/api/request'

export type ReferralInviteStatus = 'pending' | 'joined' | 'verified' | 'paid'

export type ReferralInvite = {
  id: number
  invitee_name: string | null
  invitee_email: string | null
  status: ReferralInviteStatus
  credited_amount: number | null
  created_at: string
}

export type UserReferrals = {
  code: string
  referral_link: string
  total_earned: number
  invites: ReferralInvite[]
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

function parseInvite(raw: unknown): ReferralInvite | null {
  const row = asRecord(raw)
  if (!row) return null
  const status = pickString(row, ['status'], 'pending') as ReferralInviteStatus
  return {
    id: asNumber(row.id),
    invitee_name: pickString(row, ['invitee_name', 'inviteeName'], '') || null,
    invitee_email: pickString(row, ['invitee_email', 'inviteeEmail'], '') || null,
    status,
    credited_amount: row.credited_amount != null || row.creditedAmount != null
      ? asNumber(row.credited_amount ?? row.creditedAmount)
      : null,
    created_at: pickString(row, ['created_at', 'createdAt']),
  }
}

function parseReferrals(raw: unknown): UserReferrals {
  const row = asRecord(raw) ?? {}
  const invitesRaw = Array.isArray(row.invites) ? row.invites : []
  return {
    code: pickString(row, ['code']),
    referral_link: pickString(row, ['referral_link', 'referralLink']),
    total_earned: asNumber(row.total_earned ?? row.totalEarned),
    invites: invitesRaw
      .map((item) => parseInvite(item))
      .filter((item): item is ReferralInvite => item !== null),
  }
}

export async function fetchUserReferrals(): Promise<UserReferrals> {
  const res = await request.get('/user/referrals')
  const root = asRecord(res.data)
  if (!root || root.success !== true) {
    throw new Error(pickString(root ?? {}, ['message'], 'Failed to load referrals.'))
  }
  const data = asRecord(root.data)
  return parseReferrals(data?.referrals)
}

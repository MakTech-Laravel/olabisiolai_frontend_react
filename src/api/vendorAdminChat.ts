import { request } from '@/api/request'
import type { Conversation } from '@/types/conversation'
import type { ApiResponse } from '@/types/api'
import { normalizeConversation, unwrapApi } from '@/utils/messageUtils'

export async function fetchVendorAdminConversation(): Promise<Conversation> {
  const res = await request.get('/vendor/admin-chat')
  const { data } = unwrapApi(res.data as ApiResponse<Record<string, unknown>>)
  const raw = data?.conversation ?? data
  return normalizeConversation(raw as Record<string, unknown>)
}

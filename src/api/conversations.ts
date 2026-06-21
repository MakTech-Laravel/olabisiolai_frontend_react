import axios from 'axios'

import { api } from '@/api/client'
import { messagingPath } from '@/api/messagingPaths'
import type { ApiResponse } from '@/types/api'
import type { Conversation } from '@/types/conversation'
import { normalizeConversation, unwrapApi } from '@/utils/messageUtils'

export async function getConversations(params: {
  page?: number
  type?: string
  archived?: boolean
}): Promise<{ conversations: Conversation[]; meta: ApiResponse<Conversation[]>['meta'] }> {
  const res = await api.get<ApiResponse<Record<string, unknown>[]>>(messagingPath('/conversations'), {
    params: {
      page: params.page ?? 1,
      ...(params.type != null && params.type !== '' ? { type: params.type } : {}),
      ...(params.archived != null ? { archived: params.archived } : {}),
    },
  })
  const { data, meta } = unwrapApi(res.data)
  const list = Array.isArray(data) ? data.map((r) => normalizeConversation(r)) : []
  return { conversations: list, meta }
}

export async function getConversation(uuid: string): Promise<Conversation> {
  const res = await api.get<ApiResponse<Record<string, unknown>>>(messagingPath(`/conversations/${uuid}`))
  const { data } = unwrapApi(res.data)
  return normalizeConversation(data)
}

function conversationApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as ApiResponse<unknown> | undefined
    if (data?.message) return data.message
    if (error.response?.status === 403) {
      return 'Please verify your email before sending messages.'
    }
  }
  if (error instanceof Error && error.message) return error.message
  return fallback
}

export async function createConversation(
  participantUuids: string[],
  businessInfoId?: number,
): Promise<Conversation> {
  try {
    const res = await api.post<ApiResponse<Record<string, unknown>>>(
      messagingPath('/conversations'),
      {
        type: 'direct',
        participants: participantUuids.map((u) => u.trim().toUpperCase()),
        ...(businessInfoId != null && businessInfoId > 0
          ? { business_info_id: businessInfoId }
          : {}),
      },
    )
    const body = res.data
    if (body?.success === false) {
      throw new Error(body.message || 'Could not start conversation')
    }
    const { data } = unwrapApi(body)
    const conv = normalizeConversation(data)
    if (!conv.uuid) {
      throw new Error('Conversation created but no thread id was returned.')
    }
    return conv
  } catch (error) {
    throw new Error(conversationApiErrorMessage(error, 'Could not start conversation'))
  }
}

export async function searchConversations(query: string): Promise<Conversation[]> {
  const res = await api.get<ApiResponse<Record<string, unknown>[]>>(messagingPath('/conversations/search'), {
    params: { q: query },
  })
  const { data } = unwrapApi(res.data)
  return Array.isArray(data) ? data.map((r) => normalizeConversation(r)) : []
}

export type MessageRecipient = {
  uuid: string
  display_name: string
  subtitle: string
  avatar_url: string | null
  is_verified?: boolean
  role?: string
  business_info_id?: number | null
}

function normalizeMessageRecipient(raw: Record<string, unknown>): MessageRecipient | null {
  const uuid = typeof raw.uuid === 'string' ? raw.uuid.trim().toUpperCase() : ''
  const displayName =
    typeof raw.display_name === 'string'
      ? raw.display_name.trim()
      : typeof raw.name === 'string'
        ? raw.name.trim()
        : ''
  if (!uuid || !displayName) return null

  const subtitle =
    typeof raw.subtitle === 'string' ? raw.subtitle.trim() : ''
  const avatarUrl =
    typeof raw.avatar_url === 'string' && raw.avatar_url.trim() !== ''
      ? raw.avatar_url.trim()
      : null
  const businessInfoId =
    typeof raw.business_info_id === 'number' && raw.business_info_id > 0
      ? raw.business_info_id
      : null

  return {
    uuid,
    display_name: displayName,
    subtitle,
    avatar_url: avatarUrl,
    is_verified: raw.is_verified === true,
    role: typeof raw.role === 'string' ? raw.role : undefined,
    business_info_id: businessInfoId,
  }
}

export async function searchMessageRecipients(query: string): Promise<MessageRecipient[]> {
  const q = query.trim()
  if (q.length < 2) return []

  const res = await api.get<ApiResponse<Record<string, unknown>[]>>(
    messagingPath('/conversations/recipients/search'),
    { params: { q } },
  )
  const { data } = unwrapApi(res.data)
  if (!Array.isArray(data)) return []

  return data
    .map((row) => normalizeMessageRecipient(row))
    .filter((row): row is MessageRecipient => row !== null)
}

export async function deleteConversation(uuid: string): Promise<void> {
  await api.delete(messagingPath(`/conversations/${uuid}`))
}

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

export async function createConversation(participantUuids: string[]): Promise<Conversation> {
  try {
    const res = await api.post<ApiResponse<Record<string, unknown>>>(
      messagingPath('/conversations'),
      {
        type: 'direct',
        participants: participantUuids.map((u) => u.trim().toUpperCase()),
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

export async function deleteConversation(uuid: string): Promise<void> {
  await api.delete(messagingPath(`/conversations/${uuid}`))
}

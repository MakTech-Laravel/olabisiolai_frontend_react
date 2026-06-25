import { useQuery } from '@tanstack/react-query'

import { getConversations } from '@/api/conversations'
import { QUERY_KEYS } from '@/constants/queryKeys'

export type ConversationInboxParams =
  | { inbox: 'personal' }
  | { businessInfoId: number }

function inboxScopeKey(inbox?: ConversationInboxParams): string {
  if (!inbox) return 'all'
  if ('inbox' in inbox && inbox.inbox === 'personal') return 'personal'
  if ('businessInfoId' in inbox && inbox.businessInfoId > 0) {
    return `business:${inbox.businessInfoId}`
  }
  return 'all'
}

export function useConversations(inbox?: ConversationInboxParams) {
  const scope = inboxScopeKey(inbox)

  return useQuery({
    queryKey: QUERY_KEYS.conversations(scope),
    queryFn: async () => {
      const params =
        inbox && 'inbox' in inbox && inbox.inbox === 'personal'
          ? { inbox: 'personal' as const, page: 1 }
          : inbox && 'businessInfoId' in inbox
            ? { business_info_id: inbox.businessInfoId, page: 1 }
            : { page: 1 }

      const { conversations } = await getConversations(params)
      return conversations
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })
}

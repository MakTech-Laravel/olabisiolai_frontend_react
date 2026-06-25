import { useQuery, useQueryClient } from '@tanstack/react-query'

import { getConversation } from '@/api/conversations'
import { QUERY_KEYS } from '@/constants/queryKeys'
import type { Conversation } from '@/types/conversation'

export function useConversation(uuid: string | null) {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: QUERY_KEYS.conversation(uuid ?? ''),
    queryFn: () => getConversation(uuid!),
    enabled: Boolean(uuid),
    initialData: () => {
      if (!uuid) return undefined
      const caches = queryClient.getQueriesData<Conversation[]>({ queryKey: ['conversations'] })
      for (const [, list] of caches) {
        if (!Array.isArray(list)) continue
        const hit = list.find((c) => c.uuid === uuid)
        if (hit) return hit
      }
      return undefined
    },
    staleTime: 30_000,
  })
}

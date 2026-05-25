import { useQuery } from '@tanstack/react-query'

import { getConversations } from '@/api/conversations'
import { QUERY_KEYS } from '@/constants/queryKeys'

export function useConversations() {
  return useQuery({
    queryKey: QUERY_KEYS.conversations,
    queryFn: async () => {
      const { conversations } = await getConversations({ page: 1 })
      return conversations
    },
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })
}

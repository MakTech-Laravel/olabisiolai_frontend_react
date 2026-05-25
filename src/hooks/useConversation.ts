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
      const list = queryClient.getQueryData<Conversation[]>(QUERY_KEYS.conversations)
      return list?.find((c) => c.uuid === uuid)
    },
    staleTime: 30_000,
  })
}

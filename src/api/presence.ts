import { api } from '@/api/client'
import { messagingPath } from '@/api/messagingPaths'
import type { ApiResponse } from '@/types/api'
import { unwrapApi } from '@/utils/messageUtils'

export async function pingMessagingPresence(): Promise<void> {
  const res = await api.post<ApiResponse<null>>(messagingPath('/presence/ping'), null, {
    skipAuthRedirect: true,
  })
  unwrapApi(res.data)
}

export async function setMessagingOffline(): Promise<void> {
  const res = await api.post<ApiResponse<null>>(messagingPath('/presence/offline'), null, {
    skipAuthRedirect: true,
  })
  unwrapApi(res.data)
}

import * as React from 'react'

import type { ReverbEcho } from '@/lib/echo'
import {
  CONNECTION_STATUS_LABELS,
  type ConnectionStatus,
  useEchoContext,
} from '@/providers/EchoProvider'

export type { ConnectionStatus }
export { CONNECTION_STATUS_LABELS }

export function useEcho(): {
  echo: ReverbEcho | null
  enabled: boolean
  status: ConnectionStatus
  socketId: string | null
} {
  return useEchoContext()
}

export type ChannelKind = 'public' | 'private' | 'presence'

export type UseEchoChannelOptions<T> = {
  channel: string
  event: string
  onEvent: (payload: T) => void
  kind?: ChannelKind
  enabled?: boolean
}

export function useEchoChannel<T = unknown>({
  channel,
  event,
  onEvent,
  kind = 'public',
  enabled = true,
}: UseEchoChannelOptions<T>): void {
  const { echo } = useEcho()
  const handlerRef = React.useRef(onEvent)
  React.useEffect(() => {
    handlerRef.current = onEvent
  })

  React.useEffect(() => {
    if (!echo || !enabled || !channel) return

    const subscription =
      kind === 'private'
        ? echo.private(channel)
        : kind === 'presence'
          ? echo.join(channel)
          : echo.channel(channel)

    const listener = (payload: T) => handlerRef.current(payload)
    subscription.listen(event, listener as (payload: unknown) => void)

    return () => {
      try {
        subscription.stopListening(event, listener as (payload: unknown) => void)
      } catch {
        // channel may already be torn down
      }
      echo.leave(channel)
    }
  }, [echo, channel, event, kind, enabled])
}

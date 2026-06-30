import * as React from 'react'

import { useAuth } from '@/auth/useAuth'
import { messagingEnv } from '@/config/messagingEnv'
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications'
import { setMessagingOffline } from '@/api/presence'
import { createEcho, disconnectEcho, type ReverbEcho } from '@/lib/echo'

export type ConnectionStatus =
  | 'disabled'
  | 'connecting'
  | 'connected'
  | 'unavailable'
  | 'disconnected'
  | 'failed'

export const CONNECTION_STATUS_LABELS: Record<ConnectionStatus, string> = {
  disabled: 'Disabled (not configured)',
  connecting: 'Connecting…',
  connected: 'Connected',
  unavailable: 'Unavailable',
  disconnected: 'Disconnected',
  failed: 'Failed',
}

export type EchoContextValue = {
  echo: ReverbEcho | null
  enabled: boolean
  status: ConnectionStatus
  socketId: string | null
}

const EchoContext = React.createContext<EchoContextValue | null>(null)

type PusherConnection = {
  socket_id?: string
  bind: (event: string, cb: (payload?: unknown) => void) => void
  unbind: (event: string, cb: (payload?: unknown) => void) => void
}

function getPusherConnection(echo: ReverbEcho): PusherConnection | null {
  const connector = echo.connector as { pusher?: { connection?: PusherConnection } }
  return connector?.pusher?.connection ?? null
}

let warnedMissingReverbEnv = false

export function EchoProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, accessToken } = useAuth()
  const enabled = messagingEnv.isReverbConfigured()
  const [echo, setEcho] = React.useState<ReverbEcho | null>(null)
  const [status, setStatus] = React.useState<ConnectionStatus>(
    enabled ? 'connecting' : 'disabled',
  )
  const [socketId, setSocketId] = React.useState<string | null>(null)
  const wasAuthenticatedRef = React.useRef(isAuthenticated)

  React.useEffect(() => {
    if (
      import.meta.env.PROD &&
      !enabled &&
      !warnedMissingReverbEnv
    ) {
      warnedMissingReverbEnv = true
      console.warn(
        '[Realtime] Laravel Echo is disabled: production bundle is missing VITE_REVERB_APP_KEY and/or VITE_REVERB_HOST. ' +
          'Set them as Docker build-args on Coolify, then rebuild the frontend. ' +
          'VITE_REVERB_HOST must be the WebSocket host (e.g. ws.gidira.tech), not the API host. ' +
          'See olabisiolai_frontend_react/.env.example and Olabisiolai_Laravel12/docs/COOLIFY_REVERB.md.',
      )
    }
  }, [enabled])

  React.useEffect(() => {
    if (!enabled) {
      disconnectEcho()
      setEcho(null)
      setStatus('disabled')
      setSocketId(null)
      return
    }

    const instance = createEcho(accessToken)
    setEcho(instance)

    if (!instance) {
      setStatus('disabled')
      setSocketId(null)
      return
    }

    const connection = getPusherConnection(instance)

    const onConnected = (payload?: unknown) => {
      const id = (payload as { socket_id?: string } | undefined)?.socket_id ?? null
      setSocketId(id ?? connection?.socket_id ?? null)
      setStatus('connected')
    }
    const onConnecting = () => setStatus('connecting')
    const onUnavailable = () => setStatus('unavailable')
    const onDisconnected = () => {
      setSocketId(null)
      setStatus('disconnected')
    }
    const onFailed = () => setStatus('failed')
    const onError = () => setStatus('failed')

    if (connection) {
      connection.bind('connected', onConnected)
      connection.bind('connecting', onConnecting)
      connection.bind('unavailable', onUnavailable)
      connection.bind('disconnected', onDisconnected)
      connection.bind('failed', onFailed)
      connection.bind('error', onError)
    }

    return () => {
      if (connection) {
        connection.unbind('connected', onConnected)
        connection.unbind('connecting', onConnecting)
        connection.unbind('unavailable', onUnavailable)
        connection.unbind('disconnected', onDisconnected)
        connection.unbind('failed', onFailed)
        connection.unbind('error', onError)
      }
      instance.disconnect()
      setEcho(null)
      setSocketId(null)
    }
  }, [enabled, accessToken])

  React.useEffect(() => {
    if (!isAuthenticated) {
      if (wasAuthenticatedRef.current) {
        void setMessagingOffline().catch(() => {})
      }
      wasAuthenticatedRef.current = false
      return
    }
    wasAuthenticatedRef.current = true
  }, [isAuthenticated])

  useRealtimeNotifications(echo)

  const value = React.useMemo<EchoContextValue>(
    () => ({ echo, enabled, status, socketId }),
    [echo, enabled, status, socketId],
  )

  return <EchoContext.Provider value={value}>{children}</EchoContext.Provider>
}

export function useEchoContext(): EchoContextValue {
  const ctx = React.useContext(EchoContext)
  if (!ctx) {
    throw new Error('useEchoContext must be used within EchoProvider')
  }
  return ctx
}

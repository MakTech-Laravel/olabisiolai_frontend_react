import * as React from 'react'

import { useAuth } from '@/auth/useAuth'
import { messagingEnv } from '@/config/messagingEnv'
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications'
import { setMessagingOffline } from '@/api/presence'
import { createEcho, disconnectEcho, getEcho } from '@/lib/echo'
import type { ReverbEcho } from '@/lib/echo'

export type EchoContextValue = {
  echo: ReverbEcho | null
}

const EchoContext = React.createContext<EchoContextValue | null>(null)

let warnedMissingReverbEnv = false

export function EchoProvider({ children }: { children: React.ReactNode }) {
  const { accessToken, isAuthenticated } = useAuth()
  const [echo, setEcho] = React.useState<ReverbEcho | null>(() => getEcho())
  /** Avoid POST /presence/offline for guests — that route requires auth and triggers a 401 → /login redirect. */
  const wasAuthenticatedRef = React.useRef(isAuthenticated)

  React.useEffect(() => {
    if (
      import.meta.env.PROD &&
      !messagingEnv.isReverbConfigured() &&
      !warnedMissingReverbEnv
    ) {
      warnedMissingReverbEnv = true
      console.warn(
        '[Realtime] Laravel Echo is disabled: production bundle is missing VITE_REVERB_APP_KEY and/or VITE_REVERB_HOST. ' +
        'Set them as Docker build-args (or Coolify build environment) so Vite can embed them, then rebuild the frontend. ' +
        'VITE_REVERB_HOST must be the API hostname (same host as VITE_API_BASE_URL) where /app is proxied to Reverb. ' +
        'See olabisiolai_frontend_react/.env.example and Olabisiolai_Laravel12/docs/COOLIFY_REVERB.md.',
      )
    }
  }, [])

  React.useEffect(() => {
    if (!messagingEnv.isReverbConfigured()) {
      disconnectEcho()
      setEcho(null)
      return
    }
    if (!isAuthenticated) {
      if (wasAuthenticatedRef.current) {
        void setMessagingOffline().catch(() => { })
      }
      wasAuthenticatedRef.current = false
      disconnectEcho()
      setEcho(null)
      return
    }
    wasAuthenticatedRef.current = true
    const instance = createEcho(accessToken)
    setEcho(instance)
  }, [isAuthenticated, accessToken])

  useRealtimeNotifications(echo)

  const value = React.useMemo(() => ({ echo }), [echo])

  return <EchoContext.Provider value={value}>{children}</EchoContext.Provider>
}

export function useEchoContext(): EchoContextValue {
  const ctx = React.useContext(EchoContext)
  if (!ctx) {
    throw new Error('useEchoContext must be used within EchoProvider')
  }
  return ctx
}

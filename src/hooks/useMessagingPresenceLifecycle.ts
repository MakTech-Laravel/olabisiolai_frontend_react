import * as React from 'react'

import {
  pingMessagingPresence,
  setMessagingOffline,
} from '@/api/presence'

const PING_INTERVAL_MS = 60_000

/**
 * Keeps messaging presence fresh while inbox is open; marks offline on leave.
 */
export function useMessagingPresenceLifecycle(enabled: boolean) {
  const offlineSent = React.useRef(false)

  const markOffline = React.useCallback(() => {
    if (offlineSent.current) return
    offlineSent.current = true
    void setMessagingOffline().catch(() => { })
  }, [])

  React.useEffect(() => {
    if (!enabled) return

    offlineSent.current = false

    const ping = () => {
      void pingMessagingPresence().catch(() => { })
    }

    ping()
    const interval = window.setInterval(ping, PING_INTERVAL_MS)

    const onPageHide = () => markOffline()
    window.addEventListener('pagehide', onPageHide)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener('pagehide', onPageHide)
      markOffline()
    }
  }, [enabled, markOffline])
}

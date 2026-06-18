import * as React from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { hasAnyRole } from '@/auth/roles'
import { useAuth } from '@/auth/useAuth'
import { isSpatieSuperAdmin } from '@/auth/adminSpatie'
import { messagingEnv } from '@/config/messagingEnv'
import type { ReverbEcho } from '@/lib/echo'
import { EchoService } from '@/services/echoService'
import { handleRealtimeNotification } from '@/services/realtimeNotificationHandlers'
import type { RealtimeNotificationPayload } from '@/types/realtimeNotification'

/**
 * Subscribes to user/admin private channels and the public announcements channel.
 * Call from {@link EchoProvider} with its local `echo` instance (not via {@link useEcho} —
 * the context is not available until after the provider mounts).
 */
export function useRealtimeNotifications(echo: ReverbEcho | null): void {
  const queryClient = useQueryClient()
  const { user, isAuthenticated } = useAuth()

  const isAdmin = React.useMemo(
    () => Boolean(user && (hasAnyRole(user, 'admin') || isSpatieSuperAdmin(user))),
    [user],
  )

  const handlerCtx = React.useMemo(
    () => ({
      queryClient,
      isAdmin,
    }),
    [queryClient, isAdmin],
  )

  const onPayload = React.useCallback(
    (payload: RealtimeNotificationPayload) => {
      handleRealtimeNotification(payload, handlerCtx)
    },
    [handlerCtx],
  )

  React.useEffect(() => {
    if (!echo || !messagingEnv.isReverbConfigured()) return

    const svc = new EchoService(echo)
    const cleanups: Array<() => void> = []

    cleanups.push(
      svc.subscribePublicAnnouncements({
        onAnnouncement: onPayload,
      }),
    )

    if (isAuthenticated && user?.id) {
      const uid = Number(user.id)
      if (Number.isFinite(uid) && uid > 0) {
        cleanups.push(
          svc.subscribeToUserChannel(uid, {
            onNewMessageNotification: onPayload,
            onAppNotification: onPayload,
            onUserPresence: () => {},
          }),
        )

        if (isAdmin) {
          cleanups.push(
            svc.subscribeToAdminChannel(uid, {
              onAppNotification: onPayload,
            }),
          )
        }
      }
    }

    return () => {
      cleanups.forEach((fn) => fn())
    }
  }, [echo, isAuthenticated, user?.id, isAdmin, onPayload])
}

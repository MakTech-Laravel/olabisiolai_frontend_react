import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import { QUERY_KEYS } from '@/constants/queryKeys'
import { startDirectConversationWithVendor } from '@/features/messaging/startDirectConversation'
import {
  hasPendingDirectMessageState,
  type DirectMessageLocationState,
} from '@/lib/directMessage'
import { showError } from '@/lib/sweetAlert'

type Options = {
  isAuthenticated: boolean
  conversationQueryParam?: string
  messagesPath?: '/messages' | '/user/messages'
}

/**
 * Fallback when user returns from login with DM state but without `?c=` yet
 * (e.g. bookmarked flow). Normal path creates the thread in DirectMessageButton before navigate.
 */
export function useStartDirectConversation({
  isAuthenticated,
  conversationQueryParam = 'c',
  messagesPath = '/messages',
}: Options) {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const inFlightRef = useRef(false)
  const [starting, setStarting] = useState(false)

  const paramC = searchParams.get(conversationQueryParam)
  const pending = hasPendingDirectMessageState(location.state)
  const state = pending ? (location.state as DirectMessageLocationState) : null

  useEffect(() => {
    if (!isAuthenticated || paramC || !state || inFlightRef.current) return

    inFlightRef.current = true
    let cancelled = false

    void (async () => {
      setStarting(true)
      try {
        const conv = await startDirectConversationWithVendor({
          vendorUserUuid: state.participantUserUuid,
          businessInfoId: state.businessInfoId ?? 0,
        })
        if (cancelled) return

        await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.conversations })

        const next = new URLSearchParams(searchParams)
        next.set(conversationQueryParam, conv.uuid)
        navigate(
          {
            pathname: messagesPath,
            search: `?${next.toString()}`,
          },
          {
            replace: true,
            state: { from: state.from } satisfies DirectMessageLocationState,
          },
        )
      } catch (err) {
        const message =
          err instanceof Error && err.message
            ? err.message
            : 'Could not start conversation'
        showError(message)
      } finally {
        inFlightRef.current = false
        if (!cancelled) setStarting(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [
    isAuthenticated,
    paramC,
    state,
    conversationQueryParam,
    messagesPath,
    navigate,
    queryClient,
    searchParams,
  ])

  return { starting, pendingPeer: pending && !paramC }
}

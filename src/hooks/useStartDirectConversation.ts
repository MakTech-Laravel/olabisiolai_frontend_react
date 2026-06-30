import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import { startDirectConversationWithVendor } from '@/features/messaging/startDirectConversation'
import { seedNewConversationInCache } from '@/features/messaging/conversationCache'
import { moveCatalogDraftToConversation, peekPendingCatalogForConversation, prepareCatalogMessageWithImage } from '@/features/catalog/catalogMessageContext'
import {
  hasPendingDirectMessageState,
  type DirectMessageLocationState,
} from '@/lib/directMessage'
import { showError } from '@/lib/sweetAlert'

type Options = {
  isAuthenticated: boolean
  conversationQueryParam?: string
  messagesPath?: '/messages' | '/user/messages'
  inboxScope?: 'personal'
}

/**
 * Fallback when user returns from login with DM state but without `?c=` yet
 * (e.g. bookmarked flow). Normal path creates the thread in DirectMessageButton before navigate.
 */
export function useStartDirectConversation({
  isAuthenticated,
  conversationQueryParam = 'c',
  messagesPath = '/messages',
  inboxScope = 'personal',
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

        seedNewConversationInCache(queryClient, conv, 'personal')
        moveCatalogDraftToConversation(conv.uuid)
        const catalogPending = peekPendingCatalogForConversation(conv.uuid)
        if (catalogPending) {
          await prepareCatalogMessageWithImage(conv.uuid, catalogPending)
        }

        const next = new URLSearchParams(searchParams)
        if (inboxScope === 'personal') {
          next.set('scope', 'personal')
        }
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
    inboxScope,
  ])

  return { starting, pendingPeer: pending && !paramC }
}

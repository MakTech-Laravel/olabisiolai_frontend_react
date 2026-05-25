import * as React from 'react'
import { Loader2 } from 'lucide-react'

import { MessageBubble } from '@/components/chat/MessageBubble'
import { CHAT_NEAR_BOTTOM_PX } from '@/constants/config'
import type { MessagesPage } from '@/features/messaging/types'
import type { Message } from '@/types/message'
import { formatDaySeparator, isSameDay } from '@/utils/formatters'
import { flattenMessagesChronological } from '@/utils/flattenMessages'

type Row =
  | { kind: 'day'; key: string; label: string }
  | { kind: 'msg'; message: Message; showAvatar: boolean }

function buildRows(messages: Message[]): Row[] {
  const rows: Row[] = []
  let prevDayKey: string | null = null
  for (let idx = 0; idx < messages.length; idx++) {
    const m = messages[idx]
    const dayKey = m.created_at.slice(0, 10)
    if (dayKey !== prevDayKey) {
      rows.push({
        kind: 'day',
        key: `d-${dayKey}`,
        label: formatDaySeparator(m.created_at),
      })
      prevDayKey = dayKey
    }
    const prevMsg = idx > 0 ? messages[idx - 1] : null
    const showAvatar =
      !prevMsg ||
      prevMsg.sender.id !== m.sender.id ||
      !isSameDay(prevMsg.created_at, m.created_at)
    rows.push({ kind: 'msg', message: m, showAvatar })
  }
  return rows
}

function isNearBottom(el: HTMLElement): boolean {
  return el.scrollHeight - el.scrollTop - el.clientHeight < CHAT_NEAR_BOTTOM_PX
}

export function InfiniteMessageList({
  pages,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  selfUserId,
  peerIsOnline = false,
  onReply,
  onEdit,
  onDelete,
  onMarkPeerMessageRead,
}: {
  pages: MessagesPage[]
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => void
  selfUserId: number
  peerIsOnline?: boolean
  onReply: (m: Message) => void
  onEdit: (m: Message) => void
  onDelete: (m: Message) => void
  onMarkPeerMessageRead?: (messageUuid: string) => void
}) {
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const initialScrollDone = React.useRef(false)
  const prependingRef = React.useRef(false)
  const prependAnchor = React.useRef({ scrollHeight: 0, scrollTop: 0 })
  const listSnapshot = React.useRef<{ first: string | null; last: string | null }>({
    first: null,
    last: null,
  })

  const chronological = React.useMemo(
    () => flattenMessagesChronological(pages),
    [pages],
  )
  const rows = React.useMemo(() => buildRows(chronological), [chronological])

  const messageByUuid = React.useMemo(() => {
    const map = new Map<string, Message>()
    for (const m of chronological) {
      map.set(m.uuid, m)
    }
    return map
  }, [chronological])

  const [highlightUuid, setHighlightUuid] = React.useState<string | null>(null)
  const highlightTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  )

  const resolveParentMessage = React.useCallback(
    (message: Message): Message | null => {
      if (message.parent) return message.parent
      if (!message.parent_uuid) return null
      return messageByUuid.get(message.parent_uuid) ?? null
    },
    [messageByUuid],
  )

  const scrollToMessage = React.useCallback((uuid: string) => {
    const el = scrollRef.current
    if (!el) return
    const target = el.querySelector(`[data-message-uuid="${uuid}"]`)
    if (!target) return
    target.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setHighlightUuid(uuid)
    if (highlightTimer.current) clearTimeout(highlightTimer.current)
    highlightTimer.current = setTimeout(() => setHighlightUuid(null), 2000)
  }, [])

  React.useEffect(() => {
    return () => {
      if (highlightTimer.current) clearTimeout(highlightTimer.current)
    }
  }, [])

  const loadOlder = React.useCallback(() => {
    const el = scrollRef.current
    if (!el || !hasNextPage || isFetchingNextPage) return
    prependingRef.current = true
    prependAnchor.current = {
      scrollHeight: el.scrollHeight,
      scrollTop: el.scrollTop,
    }
    void fetchNextPage()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const onScroll = React.useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    if (el.scrollTop < 80) {
      loadOlder()
    }
  }, [loadOlder])

  React.useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [onScroll])

  React.useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el || chronological.length === 0) return

    const first = chronological[0]?.uuid ?? null
    const last = chronological[chronological.length - 1]?.uuid ?? null
    const snap = listSnapshot.current

    if (!initialScrollDone.current) {
      el.scrollTop = el.scrollHeight
      initialScrollDone.current = true
    } else if (prependingRef.current && first !== snap.first) {
      const delta = el.scrollHeight - prependAnchor.current.scrollHeight
      el.scrollTop = prependAnchor.current.scrollTop + delta
      prependingRef.current = false
    } else if (last !== snap.last) {
      const newest = chronological[chronological.length - 1]
      const shouldStick =
        newest != null &&
        (isNearBottom(el) || newest.sender.id === selfUserId)
      if (shouldStick) {
        el.scrollTop = el.scrollHeight
      }
    }

    if (prependingRef.current && !isFetchingNextPage && first === snap.first) {
      prependingRef.current = false
    }

    listSnapshot.current = { first, last }
  }, [chronological, selfUserId, isFetchingNextPage])

  const lastMarkedPeerUuid = React.useRef<string | null>(null)

  React.useEffect(() => {
    if (!onMarkPeerMessageRead) return
    const latestPeer = [...chronological]
      .reverse()
      .find((m) => m.sender.id !== selfUserId)
    if (!latestPeer || latestPeer.uuid === lastMarkedPeerUuid.current) return
    lastMarkedPeerUuid.current = latestPeer.uuid
    onMarkPeerMessageRead(latestPeer.uuid)
  }, [chronological, selfUserId, onMarkPeerMessageRead])

  return (
    <div
      ref={scrollRef}
      className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-5 sm:px-6 sm:py-8 md:px-8"
    >
      {isFetchingNextPage ? (
        <div className="flex justify-center py-2">
          <Loader2 className="size-6 animate-spin text-chat-meta" />
        </div>
      ) : hasNextPage ? (
        <p className="pb-2 text-center text-[11px] text-chat-meta">
          Scroll up for older messages
        </p>
      ) : null}
      <div className="flex w-full min-w-0 flex-col">
        {rows.map((row) => {
          if (row.kind === 'day') {
            return (
              <div
                key={row.key}
                className="flex w-full items-center gap-4 py-2"
              >
                <div className="h-px flex-1 bg-chat-border-subtle" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-chat-meta">
                  {row.label}
                </span>
                <div className="h-px flex-1 bg-chat-border-subtle" />
              </div>
            )
          }
          return (
            <div key={row.message.uuid} className="w-full min-w-0 py-1">
              <MessageBubble
                message={row.message}
                parentMessage={resolveParentMessage(row.message)}
                isOwn={row.message.sender.id === selfUserId}
                peerIsOnline={peerIsOnline}
                showAvatar={row.showAvatar}
                highlighted={highlightUuid === row.message.uuid}
                onReply={() => onReply(row.message)}
                onEdit={() => onEdit(row.message)}
                onDelete={() => onDelete(row.message)}
                onScrollToParent={scrollToMessage}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}


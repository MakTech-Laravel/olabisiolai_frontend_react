import { ConversationItem } from '@/components/chat/ConversationItem'
import { ConversationSearch } from '@/components/chat/ConversationSearch'
import { Skeleton } from '@/components/ui/Skeleton'
import { EMPTY_TYPING_USERS } from '@/constants/messagingUi'
import { useMessagingStore } from '@/store/messagingStore'
import type { Conversation } from '@/types/conversation'
import { MessageSquare } from 'lucide-react'

function ConversationListSkeleton() {
  return (
    <div className="space-y-1 px-2 py-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-3 border-b border-border-light px-2 py-3.5">
          <Skeleton className="size-[50px] rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-3 w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ConversationList({
  activeUuid,
  selfUserId,
  onSelect,
  onSearchPick,
  conversations,
  isLoading = false,
  emptyDescription = 'When you message a business, conversations appear here.',
}: {
  activeUuid: string | null
  selfUserId: number
  onSelect: (uuid: string) => void
  onSearchPick: (c: Conversation) => void
  conversations?: Conversation[]
  isLoading?: boolean
  emptyDescription?: string
}) {
  const list = conversations ?? []
  const typingUsersMap = useMessagingStore((s) => s.typingUsers)

  if (isLoading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <ConversationListSkeleton />
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
      <div className="shrink-0 px-2">
        <ConversationSearch onPick={onSearchPick} />
      </div>
      {!list.length ? (
        <div className="flex flex-1 flex-col items-center justify-center px-8 py-16 text-center">
          <div className="mb-4 grid size-16 place-items-center rounded-2xl bg-white shadow-sm">
            <MessageSquare className="size-8 text-chat-meta" strokeWidth={1.75} aria-hidden />
          </div>
          <p className="font-heading text-[17px] font-bold text-ink">No messages yet</p>
          <p className="mt-2 max-w-xs text-[13.5px] leading-relaxed text-chat-meta">
            {emptyDescription}
          </p>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto bg-white lg:flex-1">
          {list.map((c) => (
            <ConversationItem
              key={c.uuid}
              conversation={c}
              selfUserId={selfUserId}
              isActive={c.uuid === activeUuid}
              typingUsers={typingUsersMap[c.uuid] ?? EMPTY_TYPING_USERS}
              onClick={() => onSelect(c.uuid)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

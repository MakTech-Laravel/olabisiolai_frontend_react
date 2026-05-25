import { ConversationItem } from '@/components/chat/ConversationItem'
import { ConversationSearch } from '@/components/chat/ConversationSearch'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { EMPTY_TYPING_USERS } from '@/constants/messagingUi'
import { useConversations } from '@/hooks/useConversations'
import { useMessagingStore } from '@/store/messagingStore'
import type { Conversation } from '@/types/conversation'

function ConversationListSkeleton() {
  return (
    <div className="space-y-3 px-2 py-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4">
          <Skeleton className="size-12 rounded-xl" />
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
}: {
  activeUuid: string | null
  selfUserId: number
  onSelect: (uuid: string) => void
  onSearchPick: (c: Conversation) => void
}) {
  const { data, isLoading } = useConversations()
  const typingUsersMap = useMessagingStore((s) => s.typingUsers)

  if (isLoading) {
    return <ConversationListSkeleton />
  }

  if (!data?.length) {
    return (
      <EmptyState
        title="No conversations yet"
        description="Start a new conversation to see it here."
      />
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
      <div className="shrink-0 px-2">
        <ConversationSearch onPick={onSearchPick} />
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-2 pb-4">
        {data.map((c) => (
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
    </div>
  )
}

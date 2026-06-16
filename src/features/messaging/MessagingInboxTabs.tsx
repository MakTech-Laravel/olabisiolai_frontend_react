import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import { fetchUserBusinesses } from '@/api/userBusinesses'
import { cn } from '@/lib/utils'
import type { Conversation } from '@/types/conversation'

export type MessagingInboxKey = 'all' | 'personal' | `business:${number}`

type MessagingInboxTabsProps = {
  conversations: Conversation[]
  activeInbox: MessagingInboxKey
  onChange: (inbox: MessagingInboxKey) => void
  className?: string
}

function unreadForConversations(list: Conversation[]): number {
  return list.reduce((sum, conversation) => sum + (conversation.unread_count ?? 0), 0)
}

export function MessagingInboxTabs({
  conversations,
  activeInbox,
  onChange,
  className,
}: MessagingInboxTabsProps) {
  const businessesQuery = useQuery({
    queryKey: ['user', 'businesses', 'messaging-inbox'],
    queryFn: fetchUserBusinesses,
    staleTime: 60_000,
  })

  const businesses = businessesQuery.data ?? []

  const tabs = useMemo(() => {
    const personal = conversations.filter((c) => !c.business_info_id)
    const items: Array<{ key: MessagingInboxKey; label: string; unread: number }> = [
      { key: 'all', label: 'All', unread: unreadForConversations(conversations) },
      { key: 'personal', label: 'You', unread: unreadForConversations(personal) },
    ]

    for (const business of businesses) {
      const scoped = conversations.filter((c) => c.business_info_id === business.id)
      items.push({
        key: `business:${business.id}`,
        label: business.businessName,
        unread: unreadForConversations(scoped),
      })
    }

    return items
  }, [businesses, conversations])

  if (tabs.length <= 2) {
    return null
  }

  return (
    <div className={cn('flex gap-2 overflow-x-auto pb-2', className)}>
      {tabs.map((tab) => {
        const active = tab.key === activeInbox
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            aria-pressed={active}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-semibold transition-colors',
              active ? 'bg-chat-accent text-white' : 'bg-auth-bg text-body-secondary',
            )}
          >
            <span className="max-w-[120px] truncate">{tab.label}</span>
            {tab.unread > 0 ? (
              <span
                className={cn(
                  'inline-flex min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold',
                  active ? 'bg-white/20 text-white' : 'bg-brand text-white',
                )}
              >
                {tab.unread > 99 ? '99+' : tab.unread}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

export function filterConversationsByInbox(
  conversations: Conversation[],
  inbox: MessagingInboxKey,
): Conversation[] {
  if (inbox === 'all') return conversations
  if (inbox === 'personal') {
    return conversations.filter((conversation) => !conversation.business_info_id)
  }
  if (inbox.startsWith('business:')) {
    const businessId = Number(inbox.replace('business:', ''))
    if (!Number.isFinite(businessId) || businessId <= 0) return conversations
    return conversations.filter((conversation) => conversation.business_info_id === businessId)
  }
  return conversations
}

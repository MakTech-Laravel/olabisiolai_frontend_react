import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'

import { searchConversations } from '@/api/conversations'
import { SEARCH_DEBOUNCE_MS } from '@/constants/config'
import type { Conversation } from '@/types/conversation'
import { cn } from '@/lib/utils'

export function ConversationSearch({
  onPick,
}: {
  onPick: (c: Conversation) => void
}) {
  const [q, setQ] = React.useState('')
  const [debounced, setDebounced] = React.useState('')

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [q])

  const { data, isFetching } = useQuery({
    queryKey: ['conversations', 'search', debounced],
    queryFn: () => searchConversations(debounced),
    enabled: debounced.length > 0,
  })

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-chat-meta" />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search conversations..."
        className={cn(
          'h-11 w-full rounded-full border border-transparent bg-card pl-11 pr-4 text-sm text-ink placeholder:text-chat-meta/70 outline-none sm:h-12',
        )}
      />
      {debounced && data && data.length > 0 ? (
        <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-xl border border-chat-border bg-card py-1 shadow-lg">
          {data.map((c) => (
            <li key={c.uuid}>
              <button
                type="button"
                className="w-full px-4 py-2 text-left text-sm hover:bg-muted"
                onClick={() => {
                  onPick(c)
                  setQ('')
                  setDebounced('')
                }}
              >
                {c.name ?? c.uuid}
                {isFetching ? ' …' : ''}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

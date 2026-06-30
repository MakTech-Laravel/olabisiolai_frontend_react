import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { showError } from '@/lib/sweetAlert'

import { createConversation, searchMessageRecipients, type MessageRecipient } from '@/api/conversations'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/button'
import { SEARCH_DEBOUNCE_MS } from '@/constants/config'
import { cn } from '@/lib/utils'

function resetModalState(
  setQuery: React.Dispatch<React.SetStateAction<string>>,
  setDebounced: React.Dispatch<React.SetStateAction<string>>,
  setSelected: React.Dispatch<React.SetStateAction<MessageRecipient | null>>,
) {
  setQuery('')
  setDebounced('')
  setSelected(null)
}

export function NewConversationModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: (uuid: string) => void
}) {
  const [query, setQuery] = React.useState('')
  const [debounced, setDebounced] = React.useState('')
  const [selected, setSelected] = React.useState<MessageRecipient | null>(null)
  const qc = useQueryClient()

  React.useEffect(() => {
    if (!open) return
    const t = setTimeout(() => setDebounced(query.trim()), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [open, query])

  React.useEffect(() => {
    if (!open) {
      resetModalState(setQuery, setDebounced, setSelected)
    }
  }, [open])

  const recipientsQuery = useQuery({
    queryKey: ['message-recipients', debounced],
    queryFn: () => searchMessageRecipients(debounced),
    enabled: open && debounced.length >= 2,
  })

  const startConversation = useMutation({
    mutationFn: (recipient: MessageRecipient) => createConversation([recipient.uuid]),
    onSuccess: (c) => {
      void qc.invalidateQueries({ queryKey: ['conversations'] })
      onCreated(c.uuid)
      onClose()
      resetModalState(setQuery, setDebounced, setSelected)
    },
    onError: () => showError('Could not start conversation'),
  })

  if (!open) return null

  const results = recipientsQuery.data ?? []
  const showResults = debounced.length >= 2
  const isSearching = recipientsQuery.isFetching

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-chat-border bg-card p-6 shadow-xl">
        <h3 className="text-lg font-bold text-ink">New direct message</h3>
        <p className="mt-2 text-sm text-chat-meta">
          Search by name, business name, or email to find who you want to message.
        </p>

        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-chat-meta" />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelected(null)
            }}
            className="h-11 w-full rounded-xl border border-chat-border bg-chat-input-bg pl-10 pr-3 text-sm text-ink placeholder:text-chat-meta/70 outline-none focus:border-chat-accent"
            placeholder="Search people or businesses…"
            autoComplete="off"
            autoFocus
          />
        </div>

        {selected ? (
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-chat-accent/30 bg-chat-accent/5 px-3 py-2.5">
            <Avatar
              src={selected.avatar_url}
              name={selected.display_name}
              className="size-10 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{selected.display_name}</p>
              {selected.subtitle ? (
                <p className="truncate text-xs text-chat-meta">{selected.subtitle}</p>
              ) : null}
            </div>
            <button
              type="button"
              className="shrink-0 text-xs font-medium text-chat-meta hover:text-ink"
              onClick={() => setSelected(null)}
            >
              Change
            </button>
          </div>
        ) : null}

        {!selected && showResults ? (
          <div className="mt-2 max-h-52 overflow-y-auto rounded-xl border border-chat-border bg-chat-input-bg">
            {isSearching && results.length === 0 ? (
              <p className="px-4 py-3 text-sm text-chat-meta">Searching…</p>
            ) : null}
            {!isSearching && results.length === 0 ? (
              <p className="px-4 py-3 text-sm text-chat-meta">No matches found. Try another name or email.</p>
            ) : null}
            <ul>
              {results.map((recipient) => (
                <li key={recipient.uuid}>
                  <button
                    type="button"
                    className={cn(
                      'flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted',
                    )}
                    onClick={() => {
                      setSelected(recipient)
                      setQuery(recipient.display_name)
                      setDebounced('')
                    }}
                  >
                    <Avatar
                      src={recipient.avatar_url}
                      name={recipient.display_name}
                      className="size-9 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">
                        {recipient.display_name}
                        {recipient.is_verified ? (
                          <span className="ml-1 text-xs text-chat-accent">Verified</span>
                        ) : null}
                      </p>
                      {recipient.subtitle ? (
                        <p className="truncate text-xs text-chat-meta">{recipient.subtitle}</p>
                      ) : null}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {!selected && query.trim().length > 0 && query.trim().length < 2 ? (
          <p className="mt-2 text-xs text-chat-meta">Type at least 2 characters to search.</p>
        ) : null}

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-chat-accent text-text-white"
            disabled={!selected || startConversation.isPending}
            onClick={() => {
              if (selected) startConversation.mutate(selected)
            }}
          >
            Start
          </Button>
        </div>
      </div>
    </div>
  )
}

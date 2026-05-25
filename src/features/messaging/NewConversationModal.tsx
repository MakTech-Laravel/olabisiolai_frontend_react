import * as React from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { showError } from '@/lib/sweetAlert'

import { createConversation } from '@/api/conversations'
import { Button } from '@/components/ui/button'
import { QUERY_KEYS } from '@/constants/queryKeys'

export function NewConversationModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: (uuid: string) => void
}) {
  const [userUuid, setUserUuid] = React.useState('')
  const qc = useQueryClient()
  const m = useMutation({
    mutationFn: () => createConversation([userUuid.trim().toUpperCase()]),
    onSuccess: (c) => {
      void qc.invalidateQueries({ queryKey: QUERY_KEYS.conversations })
      onCreated(c.uuid)
      onClose()
      setUserUuid('')
    },
    onError: () => showError('Could not start conversation'),
  })

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-chat-border bg-card p-6 shadow-xl">
        <h3 className="text-lg font-bold text-ink">New direct message</h3>
        <p className="mt-2 text-sm text-chat-meta">
          Enter the other participant&apos;s user UUID.
        </p>
        <input
          type="text"
          value={userUuid}
          onChange={(e) => setUserUuid(e.target.value.toUpperCase())}
          className="mt-4 h-11 w-full rounded-xl border border-chat-border bg-chat-input-bg px-3 font-mono text-sm uppercase tracking-wide"
          placeholder="User UUID"
          autoCapitalize="characters"
          spellCheck={false}
        />
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-chat-accent text-text-white"
            disabled={!userUuid.trim() || m.isPending}
            onClick={() => m.mutate()}
          >
            Start
          </Button>
        </div>
      </div>
    </div>
  )
}

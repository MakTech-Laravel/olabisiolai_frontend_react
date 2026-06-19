import { useState, type ReactNode } from 'react'

import { MessagingPeerProfilePanel } from '@/components/messaging/PersonProfilePanel'
import { peerPersonalName } from '@/lib/messagingPeer'
import { cn } from '@/lib/utils'
import type { ConversationPeer } from '@/types/messagingPeer'

type MessagingPeerLinkProps = {
  peer: ConversationPeer | null | undefined
  className?: string
  children?: ReactNode
}

export function MessagingPeerLink({ peer, className, children }: MessagingPeerLinkProps) {
  const [open, setOpen] = useState(false)
  const label = peer ? peerPersonalName(peer) : 'Member'

  if (!peer) {
    return <span className={className}>{children ?? label}</span>
  }

  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          setOpen(true)
        }}
        className={cn(
          'truncate text-left text-inherit hover:text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 rounded-sm',
          className,
        )}
        aria-label={`View ${label} profile`}
      >
        {children ?? label}
      </button>
      <MessagingPeerProfilePanel open={open} onClose={() => setOpen(false)} peer={peer} />
    </>
  )
}

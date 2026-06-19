import type { Conversation } from '@/types/conversation'

export type MessagingInboxKey = 'all'

type MessagingInboxTabsProps = {
  conversations: Conversation[]
  activeInbox: MessagingInboxKey
  onChange: (inbox: MessagingInboxKey) => void
  className?: string
}

/** Business pages are not messaging identities — personal inbox only (no per-business tabs). */
export function MessagingInboxTabs(_props: MessagingInboxTabsProps) {
  return null
}

export function filterConversationsByInbox(
  conversations: Conversation[],
  _inbox: MessagingInboxKey,
): Conversation[] {
  return conversations
}

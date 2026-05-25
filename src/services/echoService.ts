import { ECHO_CHANNELS } from '@/constants/channels'
import { ECHO_EVENTS } from '@/constants/events'
import type { ReverbEcho } from '@/lib/echo'
import type { RealtimeNotificationPayload } from '@/types/realtimeNotification'
import type { Message, TypingUser } from '@/types/message'
import type { PresenceUser } from '@/types/presence'
import { normalizeMessage } from '@/utils/messageUtils'

export interface ConversationEventHandlers {
  onMessageSent: (message: Message) => void
  onMessageEdited: (uuid: string, body: string, editedAt: string) => void
  onMessageDeleted: (uuid: string) => void
  onMessageRead: (messageUuid: string, readerId: number, readAt: string) => void
}

export interface PresenceEventHandlers {
  onJoin: (user: PresenceUser) => void
  onLeave: (user: PresenceUser) => void
  onTyping: (typingUser: TypingUser) => void
}

export interface UserEventHandlers {
  onNewMessageNotification: (payload: RealtimeNotificationPayload) => void
  onAppNotification: (payload: RealtimeNotificationPayload) => void
  onUserPresence: (payload: { status: string; last_seen_at: string | null }) => void
}

export interface AdminEventHandlers {
  onAppNotification: (payload: RealtimeNotificationPayload) => void
}

export interface PublicEventHandlers {
  onAnnouncement: (payload: RealtimeNotificationPayload) => void
}

interface MessageSentPayload {
  message: {
    uuid: string
    body: string | null
    type: string
    status: string
    conversation_id: number
    sender_id: number
    parent_id: number | null
    parent_uuid?: string | null
    parent?: Record<string, unknown> | null
    attachments?: Record<string, unknown>[]
    created_at: string
  }
  sender: { id: number; name: string }
  conversation_id: number
}

export class EchoService {
  private readonly echo: ReverbEcho

  constructor(echo: ReverbEcho) {
    this.echo = echo
  }

  subscribeConversation(
    conversationId: number,
    conv: ConversationEventHandlers,
    presence: PresenceEventHandlers,
  ): () => void {
    const privateChannel = this.echo.private(ECHO_CHANNELS.conversation(conversationId))
    const presenceChannel = this.echo.join(ECHO_CHANNELS.conversation(conversationId))

    privateChannel.listen(ECHO_EVENTS.messageSent, (payload: MessageSentPayload) => {
      const msg = normalizeMessage({
        uuid: payload.message.uuid,
        body: payload.message.body,
        type: payload.message.type,
        status: payload.message.status,
        conversation_id: payload.message.conversation_id,
        sender: payload.sender,
        parent_uuid: payload.message.parent_uuid ?? null,
        parent: payload.message.parent ?? null,
        created_at: payload.message.created_at,
        attachments: payload.message.attachments ?? [],
        read_by: [],
      } as unknown as Record<string, unknown>)
      conv.onMessageSent(msg)
    })

    privateChannel.listen(
      ECHO_EVENTS.messageEdited,
      (p: { message_uuid: string; new_body: string; edited_at: string }) => {
        conv.onMessageEdited(p.message_uuid, p.new_body, p.edited_at)
      },
    )

    privateChannel.listen(ECHO_EVENTS.messageDeleted, (p: { message_uuid: string }) => {
      conv.onMessageDeleted(p.message_uuid)
    })

    privateChannel.listen(
      ECHO_EVENTS.messageRead,
      (p: { message_uuid: string; reader_id: number; read_at: string }) => {
        conv.onMessageRead(p.message_uuid, p.reader_id, p.read_at)
      },
    )

    presenceChannel.here((users: PresenceUser[]) => {
      users.forEach((u) => presence.onJoin(u))
    })

    presenceChannel.joining((user: PresenceUser) => {
      presence.onJoin(user)
    })

    presenceChannel.leaving((user: PresenceUser) => {
      presence.onLeave(user)
    })

    presenceChannel.listen(ECHO_EVENTS.userTyping, (p: TypingUser) => {
      presence.onTyping(p)
    })
    ;(presenceChannel as unknown as {
      listenForWhisper?: (event: string, cb: (payload: TypingUser) => void) => void
    }).listenForWhisper?.('typing', (p: TypingUser) => {
      presence.onTyping(p)
    })

    return () => {
      privateChannel.stopListening(ECHO_EVENTS.messageSent)
      privateChannel.stopListening(ECHO_EVENTS.messageEdited)
      privateChannel.stopListening(ECHO_EVENTS.messageDeleted)
      privateChannel.stopListening(ECHO_EVENTS.messageRead)
      presenceChannel.stopListening(ECHO_EVENTS.userTyping)
      this.echo.leave(ECHO_CHANNELS.conversation(conversationId))
    }
  }

  whisperTyping(
    conversationId: number,
    payload: { user_id: number; user_name: string; is_typing: boolean },
  ) {
    const channel = this.echo.join(`conversation.${conversationId}`) as unknown as {
      whisper?: (event: string, data: unknown) => void
    }
    channel.whisper?.('typing', payload)
  }

  subscribeToUserChannel(userId: number, handlers: UserEventHandlers): () => void {
    const channel = this.echo.private(ECHO_CHANNELS.user(userId))

    channel.listen(ECHO_EVENTS.newMessage, (payload: RealtimeNotificationPayload) => {
      handlers.onNewMessageNotification(payload)
    })

    channel.listen(ECHO_EVENTS.appNotification, (payload: RealtimeNotificationPayload) => {
      handlers.onAppNotification(payload)
    })

    channel.listen(
      ECHO_EVENTS.userPresence,
      (payload: { status: string; last_seen_at: string | null }) => {
        handlers.onUserPresence(payload)
      },
    )

    return () => {
      channel.stopListening(ECHO_EVENTS.newMessage)
      channel.stopListening(ECHO_EVENTS.appNotification)
      channel.stopListening(ECHO_EVENTS.userPresence)
      this.echo.leave(ECHO_CHANNELS.user(userId))
    }
  }

  subscribeToAdminChannel(adminId: number, handlers: AdminEventHandlers): () => void {
    const channel = this.echo.private(ECHO_CHANNELS.admin(adminId))

    channel.listen(ECHO_EVENTS.appNotification, (payload: RealtimeNotificationPayload) => {
      handlers.onAppNotification(payload)
    })

    return () => {
      channel.stopListening(ECHO_EVENTS.appNotification)
      this.echo.leave(ECHO_CHANNELS.admin(adminId))
    }
  }

  subscribePublicAnnouncements(handlers: PublicEventHandlers): () => void {
    const channel = this.echo.channel(ECHO_CHANNELS.publicAnnouncements)

    channel.listen(ECHO_EVENTS.appNotification, (payload: RealtimeNotificationPayload) => {
      handlers.onAnnouncement(payload)
    })

    return () => {
      channel.stopListening(ECHO_EVENTS.appNotification)
      this.echo.leave(ECHO_CHANNELS.publicAnnouncements)
    }
  }
}

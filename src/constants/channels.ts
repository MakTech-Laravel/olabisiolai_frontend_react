/** Must match {@link App\Broadcasting\ChannelNames} on the API. */
export const ECHO_CHANNELS = {
  publicAnnouncements: 'announcements',
  user: (userId: number) => `user.${userId}`,
  admin: (adminId: number) => `admin.${adminId}`,
  conversation: (conversationId: number) => `conversation.${conversationId}`,
} as const

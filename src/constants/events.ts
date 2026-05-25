export const ECHO_EVENTS = {
  messageSent: '.message.sent',
  messageEdited: '.message.edited',
  messageDeleted: '.message.deleted',
  messageRead: '.message.read',
  userTyping: '.user.typing',
  newMessage: '.new_message',
  userPresence: '.user.presence',
  /** Generic app notification (verification, payment, admin alerts). */
  appNotification: '.app.notification',
} as const

export const TYPING_DEBOUNCE_MS = 300
/** Matches Laravel UploadAttachmentRequest / SendMessageRequest mimes rule. */
export const MESSAGING_ATTACHMENT_ACCEPT =
  '.jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.mp4,.mp3,.wav'
export const MESSAGING_ATTACHMENT_MAX_COUNT = 10
/** Messages fetched per cursor page (must match backend MessageService page size). */
export const MESSAGES_PAGE_SIZE = 30
/** Distance from bottom (px) treated as "at bottom" for auto-scroll on new messages. */
export const CHAT_NEAR_BOTTOM_PX = 120
/** Min gap between `is_typing: true` API calls while the user keeps typing (heartbeat for receivers). */
export const TYPING_SEND_MIN_INTERVAL_MS = 900
export const TYPING_IDLE_STOP_MS = 5000
export const SEARCH_DEBOUNCE_MS = 400
export const READ_MARK_DEBOUNCE_MS = 500
export const TYPING_INDICATOR_CLEAR_MS = 8000

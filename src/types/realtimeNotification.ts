export type RealtimeNotificationTone = 'info' | 'success' | 'warning' | 'error'

export type RealtimeNotificationType =
  | 'new_message'
  | 'verification_approved'
  | 'verification_flagged'
  | 'verification_submitted'
  | 'payment_completed'
  | 'referral_reward_paid'
  | 'system_announcement'

export type RealtimeNotificationPayload = {
  type: RealtimeNotificationType | string
  title?: string
  message?: string
  tone?: RealtimeNotificationTone | string
  action_url?: string | null
  data?: Record<string, unknown>
  conversation_uuid?: string
  sender_id?: number
  sender_name?: string
  preview?: string
  unread_count?: number
  from_platform_admin?: boolean
}

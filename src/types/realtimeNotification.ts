export type RealtimeNotificationTone = 'info' | 'success' | 'warning' | 'error'

export type RealtimeNotificationType =
  | 'new_message'
  | 'new_follower'
  | 'verification_approved'
  | 'verification_flagged'
  | 'verification_submitted'
  | 'payment_completed'
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
  follower_id?: number
  follower_name?: string
  business_info_id?: number
  business_name?: string
}

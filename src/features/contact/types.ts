export type ContactMessageStatus = 'new' | 'read' | 'archived'

export type ContactMessageDto = {
  id: number
  full_name: string
  email: string
  subject: string
  message: string
  status: ContactMessageStatus | 'replied'
  admin_notes: string | null
  read_at: string | null
  created_at: string
  updated_at: string
}

export type ContactMessagePagination = {
  current_page: number
  last_page: number
  per_page: number
  total: number
}

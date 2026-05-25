export type AttachmentType = 'image' | 'document' | 'video' | 'audio'

export interface Attachment {
  id?: number
  uuid: string
  file_name: string
  file_size?: number
  mime_type: string
  type: AttachmentType
  url: string
  thumbnail_url: string | null
  thumbnail_path?: string | null
  metadata?: Record<string, unknown> | null
}

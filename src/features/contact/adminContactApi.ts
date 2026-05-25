import { request } from '@/api/request'
import type {
  ContactMessageDto,
  ContactMessagePagination,
  ContactMessageStatus,
} from '@/features/contact/types'

export type AdminContactListParams = {
  page?: number
  per_page?: number
  status?: ContactMessageStatus
  search?: string
}

export type ContactMessageStatusCounts = {
  all: number
  new: number
  read: number
  archived: number
}

export type AdminContactListResult = {
  data: ContactMessageDto[]
  pagination: ContactMessagePagination
  counts: ContactMessageStatusCounts
}

function parseContactMessageRows(raw: unknown): ContactMessageDto[] {
  if (Array.isArray(raw)) return raw as ContactMessageDto[]
  if (raw && typeof raw === 'object' && Array.isArray((raw as { data?: unknown }).data)) {
    return (raw as { data: ContactMessageDto[] }).data
  }
  return []
}

const EMPTY_COUNTS: ContactMessageStatusCounts = {
  all: 0,
  new: 0,
  read: 0,
  archived: 0,
}

export async function adminListContactMessages(
  params: AdminContactListParams = {},
): Promise<AdminContactListResult> {
  const res = await request.post('/admin/contact-messages', params)
  const body = res.data as {
    success?: boolean
    data?: unknown
    pagination?: ContactMessagePagination
    counts?: ContactMessageStatusCounts
  }

  if (body?.success === false) {
    throw new Error('Could not load contact messages.')
  }

  return {
    data: parseContactMessageRows(body?.data),
    pagination: body.pagination ?? {
      current_page: 1,
      last_page: 1,
      per_page: 15,
      total: 0,
    },
    counts: body.counts ?? EMPTY_COUNTS,
  }
}

export async function adminViewContactMessage(id: number): Promise<ContactMessageDto> {
  const res = await request.post(`/admin/contact-messages/${id}/view`, {})
  return (res.data as { data: ContactMessageDto }).data
}

export type AdminContactUpdatePayload = {
  status?: ContactMessageStatus
  admin_notes?: string | null
}

export async function adminUpdateContactMessage(
  id: number,
  payload: AdminContactUpdatePayload,
): Promise<ContactMessageDto> {
  const res = await request.post(`/admin/contact-messages/${id}/update`, payload)
  return (res.data as { data: ContactMessageDto }).data
}

export async function adminDeleteContactMessage(id: number): Promise<void> {
  await request.post(`/admin/contact-messages/${id}/delete`, {})
}

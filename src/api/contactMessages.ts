import axios from 'axios'

import { request } from '@/api/request'

export type SubmitContactMessagePayload = {
  full_name: string
  email: string
  subject: string
  message: string
}

type LaravelEnvelope<T> = {
  success?: boolean
  message?: string
  data?: T
}

export async function submitContactMessage(
  payload: SubmitContactMessagePayload,
): Promise<void> {
  const response = await request.post<LaravelEnvelope<unknown>>(
    '/contact-messages',
    payload,
    { skipAuthRedirect: true },
  )

  if (!response.data?.success) {
    throw new Error(response.data?.message || 'Could not send your message.')
  }
}

export function getContactSubmitErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as LaravelEnvelope<unknown> | undefined
    if (data?.message) return data.message
    const errors = data && typeof data === 'object' && 'errors' in data
      ? (data as { errors?: Record<string, string[]> }).errors
      : undefined
    const first = errors ? Object.values(errors).flat().find(Boolean) : null
    if (first) return first
  }

  if (error instanceof Error && error.message) return error.message
  return fallback
}

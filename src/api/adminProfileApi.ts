import { request } from '@/api/request'

type ApiEnvelope<T> = {
  success: boolean
  message: string
  data: T
}

export type AdminProfile = {
  id: number
  first_name?: string
  last_name?: string
  name?: string
  email: string
  phone?: string | null
  image?: string | null
  is_super_admin?: boolean
  roles?: string[]
  status?: string
  email_verified_at?: string | null
}

export type AdminProfilePayload = {
  admin: AdminProfile
  roles: string[]
  permissions: string[]
}

export async function fetchAdminProfile(): Promise<AdminProfilePayload> {
  const response = await request.get<ApiEnvelope<AdminProfilePayload>>('/admin/profile')
  const body = response.data
  if (!body?.success || !body.data?.admin) {
    throw new Error(body?.message || 'Could not load admin profile.')
  }
  return body.data
}

export type UpdateAdminProfileInput = {
  first_name?: string
  last_name?: string
  email?: string
  phone?: string | null
  current_password?: string
  password?: string
  password_confirmation?: string
}

export async function updateAdminProfile(input: UpdateAdminProfileInput): Promise<AdminProfilePayload> {
  const response = await request.put<ApiEnvelope<AdminProfilePayload>>('/admin/profile', input)
  const body = response.data
  if (!body?.success || !body.data?.admin) {
    throw new Error(body?.message || 'Could not update admin profile.')
  }
  return body.data
}

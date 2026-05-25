import { request } from '@/api/request'

export type ChangeUserPasswordBody = {
  current_password: string
  password: string
  password_confirmation: string
}

type ApiEnvelope = {
  success: boolean
  message: string
}

/** `POST /user/password` — authenticated customer; new password min 8 chars + confirmation. */
export async function changeUserPassword(body: ChangeUserPasswordBody): Promise<void> {
  const response = await request.post<ApiEnvelope>('/user/password', body)
  const resBody = response.data
  if (!resBody?.success) {
    throw new Error(resBody?.message || 'Could not update password')
  }
}

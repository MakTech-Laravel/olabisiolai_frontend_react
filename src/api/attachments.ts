import { api } from '@/api/client'
import { messagingPath } from '@/api/messagingPaths'
import type { ApiResponse } from '@/types/api'
import type { Attachment } from '@/types/attachment'
import { normalizeAttachment, unwrapApi } from '@/utils/messageUtils'

export async function uploadAttachment(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<Attachment> {
  const form = new FormData()
  form.append('file', file)
  const res = await api.post<ApiResponse<Record<string, unknown>>>(messagingPath('/attachments'), form, {
    onUploadProgress: (evt) => {
      if (!onProgress || !evt.total) return
      onProgress(Math.round((evt.loaded / evt.total) * 100))
    },
  })
  const { data } = unwrapApi(res.data)
  return normalizeAttachment(data)
}

export async function deleteAttachment(uuid: string): Promise<void> {
  await api.delete(messagingPath(`/attachments/${uuid}`))
}

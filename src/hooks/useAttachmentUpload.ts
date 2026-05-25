import * as React from 'react'

import { uploadAttachment } from '@/api/attachments'
import { MESSAGING_ATTACHMENT_MAX_COUNT } from '@/constants/config'
import type { Attachment } from '@/types/attachment'

export function useAttachmentUpload() {
  const [files, setFiles] = React.useState<File[]>([])
  const [progress, setProgress] = React.useState<Record<string, number>>({})
  const [isUploading, setIsUploading] = React.useState(false)

  const addFiles = React.useCallback((list: FileList | File[]) => {
    setFiles((f) => {
      const incoming = Array.from(list)
      const merged = [...f, ...incoming].slice(0, MESSAGING_ATTACHMENT_MAX_COUNT)
      return merged
    })
  }, [])

  const removeFile = React.useCallback((index: number) => {
    setFiles((f) => f.filter((_, i) => i !== index))
  }, [])

  const clearFiles = React.useCallback(() => {
    setFiles([])
    setProgress({})
  }, [])

  const uploadAll = React.useCallback(async (): Promise<Attachment[]> => {
    if (files.length === 0) return []
    setIsUploading(true)
    const out: Attachment[] = []
    try {
      for (const f of files) {
        const key = `${f.name}-${f.size}`
        const att = await uploadAttachment(f, (pct) =>
          setProgress((p) => ({ ...p, [key]: pct })),
        )
        out.push(att)
      }
      clearFiles()
      return out
    } finally {
      setIsUploading(false)
    }
  }, [files, clearFiles])

  return { files, addFiles, removeFile, clearFiles, uploadAll, progress, isUploading }
}

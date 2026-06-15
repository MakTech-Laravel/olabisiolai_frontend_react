import { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { patchUserSettings } from '@/api/userSettings'
import { useAuth } from '@/auth/useAuth'
import { getLaravelErrorMessage } from '@/lib/laravelApiError'

export function useProfilePhotoUpload() {
  const queryClient = useQueryClient()
  const { refreshSession } = useAuth()
  const inputRef = useRef<HTMLInputElement>(null)
  const [avatarCacheKey, setAvatarCacheKey] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (file: File) => patchUserSettings({}, { image: file }),
    onSuccess: async (payload) => {
      queryClient.setQueryData(['user-settings'], payload)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
      if (payload.profile.image_path) {
        setAvatarCacheKey(Date.now())
      }
      await refreshSession()
      void queryClient.invalidateQueries({ queryKey: ['user-settings'] })
      setError(null)
    },
    onError: (err) => {
      if (inputRef.current) {
        inputRef.current.value = ''
      }
      setError(getLaravelErrorMessage(err, 'Could not update profile photo.'))
    },
  })

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (JPEG, PNG, or WebP).')
      return
    }
    setError(null)
    mutation.mutate(file)
  }

  return {
    inputRef,
    onFileChange,
    openFilePicker: () => inputRef.current?.click(),
    isUploading: mutation.isPending,
    avatarCacheKey,
    error,
    clearError: () => setError(null),
  }
}

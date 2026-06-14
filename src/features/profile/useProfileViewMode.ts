import { useMemo } from 'react'

import type { AuthUser } from '@/auth/types'
import { useAuth } from '@/auth/useAuth'

import {
  getProfileModeCapabilities,
  resolveProfileViewMode,
  type ProfileModeCapabilities,
  type ProfileViewMode,
} from './profileViewMode'

type UseProfileViewModeResult = {
  mode: ProfileViewMode
  capabilities: ProfileModeCapabilities
  isAuthenticated: boolean
  viewer: AuthUser | null
}

export function useProfileViewMode(profileOwnerUserId: number | null): UseProfileViewModeResult {
  const { user, isAuthenticated, isUserLoading, isSessionLoading } = useAuth()

  const mode = useMemo(() => {
    if (isSessionLoading || isUserLoading) {
      return 'public' as ProfileViewMode
    }

    if (!isAuthenticated || !user) {
      return 'public'
    }

    return resolveProfileViewMode(user, profileOwnerUserId)
  }, [isAuthenticated, isSessionLoading, isUserLoading, profileOwnerUserId, user])

  const capabilities = useMemo(() => getProfileModeCapabilities(mode), [mode])

  return {
    mode,
    capabilities,
    isAuthenticated,
    viewer: user,
  }
}

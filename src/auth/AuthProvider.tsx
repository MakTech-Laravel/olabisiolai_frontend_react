import * as React from 'react'

import { api } from '@/api/client'
import { AuthContext, type AuthContextValue } from '@/auth/context'
import { fetchCurrentUser } from '@/auth/session'
import {
  AUTH_STORAGE_KEYS,
  clearAccessToken,
  getAccessToken,
  getStoredAuthUser,
  setAccessToken,
  setStoredAuthUser,
} from '@/auth/token'
import { type AuthUser } from '@/auth/types'
import { isSpatieSuperAdmin } from '@/auth/adminSpatie'
import { getRoleLogoutPath } from '@/auth/rolePolicy'
import { getUserRoles, hasAnyRole } from '@/auth/roles'
import { subscribeAuthStorageChange } from '@/auth/authSync'
import { env } from '@/config/env'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialToken = React.useMemo(() => getAccessToken(), [])
  const initialUser = React.useMemo(() => {
    if (env.authStrategy !== 'bearer_memory' || !initialToken) return null
    return getStoredAuthUser()
  }, [initialToken])
  const [accessTokenState, setAccessTokenState] = React.useState<string | null>(
    () => initialToken,
  )
  const [user, setUserState] = React.useState<AuthUser | null>(() => initialUser)
  /** Keeps latest user for refreshSession (state updates are async; login + refresh same tick needs this). */
  const userRef = React.useRef<AuthUser | null>(initialUser)
  React.useEffect(() => {
    userRef.current = user
  }, [user])
  const [isSessionLoading, setIsSessionLoading] = React.useState(
    () => env.authStrategy === 'http_only_cookie',
  )
  const [isUserLoading, setIsUserLoading] = React.useState(() => {
    return env.authStrategy === 'bearer_memory' && Boolean(initialToken) && !Boolean(initialUser)
  })

  const setUser = React.useCallback((nextUser: AuthUser | null) => {
    userRef.current = nextUser
    setStoredAuthUser(nextUser)
    setUserState(nextUser)
  }, [])

  const resetAuthState = React.useCallback(() => {
    clearAccessToken()
    setAccessTokenState(null)
    setUser(null)
    setIsUserLoading(false)
  }, [setUser])

  const refreshSession = React.useCallback(async (): Promise<AuthUser | null> => {
    const prev = userRef.current ?? getStoredAuthUser()
    const shouldBlock = env.authStrategy === 'http_only_cookie' || !prev
    if (shouldBlock) {
      setIsUserLoading(true)
    }
    try {
      const { user: fetchedUser, unauthorized } = await fetchCurrentUser()
      if (fetchedUser) {
        // Profile probe must not replace a valid admin session with a misparsed object (missing route role).
        if (
          prev &&
          (hasAnyRole(prev, 'admin') || isSpatieSuperAdmin(prev)) &&
          !hasAnyRole(fetchedUser, 'admin') &&
          !isSpatieSuperAdmin(fetchedUser)
        ) {
          return prev
        }
        setUser(fetchedUser)
        return fetchedUser
      }

      // Only clear the session when the API explicitly rejected the token.
      if (unauthorized && env.authStrategy === 'bearer_memory' && getAccessToken()) {
        resetAuthState()
        return null
      }

      // Network / server errors: keep the last known user so other tabs stay signed in.
      if (prev) {
        return prev
      }
      return null
    } finally {
      if (shouldBlock) {
        setIsUserLoading(false)
      }
    }
  }, [resetAuthState, setUser])

  React.useEffect(() => {
    if (env.authStrategy !== 'http_only_cookie') {
      setIsSessionLoading(false)
      return
    }

    let cancelled = false
    void (async () => {
      const { user: u } = await fetchCurrentUser()
      if (!cancelled) {
        setUser(u)
        setIsSessionLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  // After reload, re-fetch profile when Bearer token was restored from session/local storage.
  // Skip when on the register-OTP page: the token belongs to an unverified user
  // whose /me endpoint returns 404. The token is used for the verify-otp call instead.
  React.useEffect(() => {
    if (env.authStrategy !== 'bearer_memory') return
    if (!getAccessToken()) return

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      if (
        url.pathname === '/otp-verification' &&
        url.searchParams.get('purpose') === 'register'
      ) {
        setIsUserLoading(false)
        return
      }

      // Premium checkout must render immediately after business create; do not block on /me.
      if (url.pathname === '/vendor/premium-payment' && (userRef.current ?? getStoredAuthUser())) {
        setIsUserLoading(false)
      }
    }

    void refreshSession()
  }, [refreshSession])

  // Keep auth in sync across browser tabs (localStorage + BroadcastChannel).
  React.useEffect(() => {
    if (env.authStrategy !== 'bearer_memory') return
    if (env.bearerTokenPersistence !== 'local') return
    if (typeof window === 'undefined') return

    const syncFromStorage = () => {
      const token = getAccessToken()
      const storedUser = getStoredAuthUser()

      if (!token) {
        if (userRef.current || accessTokenState) {
          setAccessTokenState(null)
          setUserState(null)
          userRef.current = null
          setIsUserLoading(false)
        }
        return
      }

      setAccessTokenState(token)
      if (storedUser) {
        setUserState(storedUser)
        userRef.current = storedUser
        setIsUserLoading(false)
        return
      }

      void refreshSession()
    }

    const onStorage = (event: StorageEvent) => {
      if (event.storageArea !== window.localStorage) return
      if (
        event.key !== null &&
        event.key !== AUTH_STORAGE_KEYS.access &&
        event.key !== AUTH_STORAGE_KEYS.user &&
        event.key !== AUTH_STORAGE_KEYS.refresh
      ) {
        return
      }

      syncFromStorage()
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        syncFromStorage()
      }
    }

    window.addEventListener('storage', onStorage)
    document.addEventListener('visibilitychange', onVisible)
    const unsubscribeBroadcast = subscribeAuthStorageChange(syncFromStorage)

    return () => {
      window.removeEventListener('storage', onStorage)
      document.removeEventListener('visibilitychange', onVisible)
      unsubscribeBroadcast()
    }
  }, [accessTokenState, refreshSession])

  const setToken = React.useCallback((token: string) => {
    setAccessToken(token)
    setAccessTokenState(token)
  }, [])

  const can = React.useCallback(
    (permission: string) => {
      // Super-admin must pass all UI checks even when JWT/profile omits route role `admin`.
      if (isSpatieSuperAdmin(user)) return true
      if (!hasAnyRole(user, 'admin')) return false
      // Admin shell landing: RoleGate already proved panel access; API still enforces each action.
      if (permission === 'view dashboard') return true
      return Boolean(user?.permissions?.includes(permission))
    },
    [user],
  )

  const hasRole = React.useCallback(
    (spatieRoleName: string) => {
      if (user?.adminSpatieRoles?.includes(spatieRoleName)) return true
      if (user?.roles?.includes(spatieRoleName)) return true
      if (!hasAnyRole(user, 'admin')) return false
      return false
    },
    [user],
  )

  const logout = React.useCallback(async () => {
    try {
      const { setMessagingOffline } = await import('@/api/presence')
      await setMessagingOffline().catch(() => { })
    } catch {
      // ignore
    }
    resetAuthState()
    try {
      const logoutPathCandidates: string[] = []
      if (env.logoutMode === 'multi') {
        const roles = getUserRoles(user)
        const roleLogout = roles.map((r) => getRoleLogoutPath(r)).find(Boolean)
        if (roleLogout) logoutPathCandidates.push(roleLogout)
      }
      logoutPathCandidates.push(env.authLogoutPath, '/auth/logout', '/logout')

      const uniquePaths = Array.from(new Set(logoutPathCandidates.filter(Boolean)))
      for (const path of uniquePaths) {
        try {
          await api.post(path)
          break
        } catch {
          // try the next logout endpoint
        }
      }
    } catch {
      // Session may already be invalid; still clear client state
    } finally {
      if (typeof window !== 'undefined' && window.location.pathname !== '/') {
        window.location.assign('/')
      }
    }
  }, [user])

  const value = React.useMemo<AuthContextValue>(
    () => ({
      authStrategy: env.authStrategy,
      accessToken: accessTokenState,
      isAuthenticated:
        env.authStrategy === 'http_only_cookie'
          ? Boolean(user)
          : Boolean(accessTokenState) && (Boolean(user) || isUserLoading),
      isSessionLoading,
      isUserLoading,
      user,
      setToken,
      resetAuthState,
      logout,
      setUser,
      refreshSession,
      can,
      hasRole,
    }),
    [
      accessTokenState,
      can,
      hasRole,
      isSessionLoading,
      isUserLoading,
      logout,
      refreshSession,
      setToken,
      resetAuthState,
      user,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

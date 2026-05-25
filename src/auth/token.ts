import { env, type BearerTokenPersistence } from '@/config/env'
import { type AuthUser } from '@/auth/types'

const STORAGE_KEY_ACCESS = 'react-vite-laravel.bearer_token'
const STORAGE_KEY_REFRESH = 'react-vite-laravel.refresh_token'
const STORAGE_KEY_USER = 'react-vite-laravel.auth_user'

/** In-RAM only — lost on full reload. */
let memoryAccessToken: string | null = null
let memoryRefreshToken: string | null = null
let memoryAuthUser: AuthUser | null = null

function readAccess(mode: BearerTokenPersistence): string | null {
  if (typeof window === 'undefined') return null
  if (mode === 'memory') return memoryAccessToken
  try {
    if (mode === 'session') return sessionStorage.getItem(STORAGE_KEY_ACCESS)
    return localStorage.getItem(STORAGE_KEY_ACCESS)
  } catch {
    return null
  }
}

function writeAccess(mode: BearerTokenPersistence, token: string) {
  if (typeof window === 'undefined') return
  if (mode === 'memory') {
    memoryAccessToken = token
    return
  }
  try {
    if (mode === 'session') {
      sessionStorage.setItem(STORAGE_KEY_ACCESS, token)
      return
    }
    localStorage.setItem(STORAGE_KEY_ACCESS, token)
  } catch {
    memoryAccessToken = token
  }
}

function readRefresh(mode: BearerTokenPersistence): string | null {
  if (typeof window === 'undefined') return null
  if (mode === 'memory') return memoryRefreshToken
  try {
    if (mode === 'session') return sessionStorage.getItem(STORAGE_KEY_REFRESH)
    return localStorage.getItem(STORAGE_KEY_REFRESH)
  } catch {
    return null
  }
}

function writeRefresh(mode: BearerTokenPersistence, token: string) {
  if (typeof window === 'undefined') return
  if (mode === 'memory') {
    memoryRefreshToken = token
    return
  }
  try {
    if (mode === 'session') {
      sessionStorage.setItem(STORAGE_KEY_REFRESH, token)
      return
    }
    localStorage.setItem(STORAGE_KEY_REFRESH, token)
  } catch {
    memoryRefreshToken = token
  }
}

function readUser(mode: BearerTokenPersistence): AuthUser | null {
  if (typeof window === 'undefined') return null
  if (mode === 'memory') return memoryAuthUser
  try {
    const raw =
      mode === 'session'
        ? sessionStorage.getItem(STORAGE_KEY_USER)
        : localStorage.getItem(STORAGE_KEY_USER)
    if (!raw) return null
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

function writeUser(mode: BearerTokenPersistence, user: AuthUser | null) {
  if (typeof window === 'undefined') return
  if (mode === 'memory') {
    memoryAuthUser = user
    return
  }
  try {
    if (user) {
      const raw = JSON.stringify(user)
      if (mode === 'session') {
        sessionStorage.setItem(STORAGE_KEY_USER, raw)
        return
      }
      localStorage.setItem(STORAGE_KEY_USER, raw)
      return
    }

    if (mode === 'session') {
      sessionStorage.removeItem(STORAGE_KEY_USER)
      return
    }
    localStorage.removeItem(STORAGE_KEY_USER)
  } catch {
    memoryAuthUser = user
  }
}

function clearAllAuthStorage() {
  memoryAccessToken = null
  memoryRefreshToken = null
  memoryAuthUser = null
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(STORAGE_KEY_ACCESS)
    localStorage.removeItem(STORAGE_KEY_ACCESS)
    sessionStorage.removeItem(STORAGE_KEY_REFRESH)
    localStorage.removeItem(STORAGE_KEY_REFRESH)
    sessionStorage.removeItem(STORAGE_KEY_USER)
    localStorage.removeItem(STORAGE_KEY_USER)
  } catch {
    // ignore
  }
}

/**
 * Passport Bearer access token (only for `bearer_memory` strategy).
 */
export function getAccessToken(): string | null {
  if (env.authStrategy === 'http_only_cookie') return null
  return readAccess(env.bearerTokenPersistence)
}

export function setAccessToken(token: string) {
  if (env.authStrategy === 'http_only_cookie') return
  writeAccess(env.bearerTokenPersistence, token)
}

/**
 * Refresh token — only used when `env.refreshTokenEnabled` and login/refresh responses include it.
 */
export function getRefreshToken(): string | null {
  if (env.authStrategy === 'http_only_cookie' || !env.refreshTokenEnabled) {
    return null
  }
  return readRefresh(env.bearerTokenPersistence)
}

export function setRefreshToken(token: string) {
  if (env.authStrategy === 'http_only_cookie' || !env.refreshTokenEnabled) return
  writeRefresh(env.bearerTokenPersistence, token)
}

/** Persist the last known authenticated user for Bearer auth reload recovery. */
export function getStoredAuthUser(): AuthUser | null {
  if (env.authStrategy === 'http_only_cookie') return null
  return readUser(env.bearerTokenPersistence)
}

export function setStoredAuthUser(user: AuthUser | null) {
  if (env.authStrategy === 'http_only_cookie') return
  writeUser(env.bearerTokenPersistence, user)
}

/** Clears access + refresh tokens (logout / invalid session). */
export function clearAccessToken() {
  clearAllAuthStorage()
}

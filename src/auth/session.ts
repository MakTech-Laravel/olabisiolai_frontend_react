import { api } from '@/api/client'
import { extractUserFromAuthPayload } from '@/api/laravelResponse'
import { env } from '@/config/env'
import { type AuthUser } from '@/auth/types'

/** GET current user — Laravel Passport Bearer or cookie session. */
export async function fetchCurrentUser(): Promise<AuthUser | null> {
  // Order matters: this API has no `GET /me`; `/auth/profile` and `/admin/me` are the real probes.
  const primary = ['/auth/profile', '/admin/me'] as const
  const custom =
    env.authMePath &&
      env.authMePath !== '/me' &&
      !primary.includes(env.authMePath as (typeof primary)[number])
      ? [env.authMePath]
      : []
  const pathCandidates = Array.from(new Set([...primary, ...custom, env.authMePath].filter(Boolean)))

  for (const path of pathCandidates) {
    try {
      const res = await api.get<unknown>(path, {
        skipAuthRedirect: true,
      })
      const user = extractUserFromAuthPayload(res.data)
      if (user) return user
    } catch {
      // try next candidate path
    }
  }
  return null
}

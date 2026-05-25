import {
  extractBearerTokenFromLoginBody,
  extractRefreshTokenFromLoginBody,
} from '@/api/laravelResponse'
import { refreshClient } from '@/api/refreshClient'
import { env } from '@/config/env'
import { getRefreshToken } from '@/auth/token'

export type RefreshResult = {
  accessToken: string
  refreshToken?: string
}

/** POST refresh endpoint with stored refresh token; no dependency on main `api` client. */
export async function performTokenRefresh(): Promise<RefreshResult | null> {
  if (!env.refreshTokenEnabled || !env.authRefreshPath) return null
  const rt = getRefreshToken()
  if (!rt) return null

  const res = await refreshClient.post<unknown>(env.authRefreshPath, {
    [env.refreshTokenBodyKey]: rt,
  })

  const access = extractBearerTokenFromLoginBody(res.data)
  if (!access) return null

  const newRefresh = extractRefreshTokenFromLoginBody(res.data)
  return {
    accessToken: access,
    refreshToken: newRefresh ?? undefined,
  }
}

import * as React from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import {
  extractBearerTokenFromLoginBody,
  extractRefreshTokenFromLoginBody,
  extractUserFromAuthPayload,
} from '@/api/laravelResponse'
import { useAuth } from '@/auth/useAuth'
import { request } from '@/api/request'
import { env } from '@/config/env'
import { setRefreshToken } from '@/auth/token'
import { getUserRoles } from '@/auth/roles'
import { resolvePostLoginPath } from '@/features/auth/service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

function nextParamPointsAtLoginLoop(nextRaw: string | null) {
  if (!nextRaw) return false
  let s = nextRaw
  for (let i = 0; i < 8; i++) {
    if (s.includes('/login')) return true
    try {
      s = decodeURIComponent(s)
    } catch {
      return true
    }
  }
  return s.includes('/login')
}

function isUnsafePostLoginPath(pathname: string | undefined) {
  if (!pathname) return true
  return (
    pathname === '/unauthorized' ||
    pathname === '/login' ||
    pathname.startsWith('/login/') ||
    pathname.startsWith('/otp-verification')
  )
}

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { setToken, setUser, refreshSession, authStrategy } = useAuth()

  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    const next = searchParams.get('next')
    if (nextParamPointsAtLoginLoop(next)) {
      navigate('/login', { replace: true })
    }
  }, [navigate, searchParams])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await request.post<unknown>('/login', { email, password })
      const body = res.data
      const loggedInUser = extractUserFromAuthPayload(body)

      let effectiveUser = loggedInUser

      if (authStrategy === 'http_only_cookie') {
        const u = await refreshSession()
        if (!u) {
          throw new Error(
            'No session cookie detected. Your Laravel API returns a Bearer token in JSON, not HttpOnly cookies. Set VITE_AUTH_STRATEGY=bearer_memory in .env and restart the dev server.',
          )
        }
        effectiveUser = u
      } else {
        const token = extractBearerTokenFromLoginBody(body)
        if (!token) {
          throw new Error(
            'Login response did not include a token. Expected Laravel sendResponse data.token or data.access_token.',
          )
        }
        setToken(token)
        const refresh = extractRefreshTokenFromLoginBody(body)
        if (refresh) setRefreshToken(refresh)
        if (loggedInUser) setUser(loggedInUser)
        const refreshed = await refreshSession()
        effectiveUser = refreshed ?? loggedInUser
      }

      const roles = getUserRoles(effectiveUser)
      if (roles.length === 0) {
        throw new Error('Login succeeded, but no valid role was found for this account.')
      }

      const isVendor = roles.includes('vendor')

      if (isVendor) {
        navigate(await resolvePostLoginPath(effectiveUser, 'vendor'), { replace: true })
        return
      }

      const returnTo = (location.state as { from?: { pathname?: string; state?: unknown } } | null)
        ?.from
      if (returnTo?.pathname && !isUnsafePostLoginPath(returnTo.pathname)) {
        navigate(returnTo.pathname, {
          replace: true,
          state: returnTo.state,
        })
        return
      }

      navigate(await resolvePostLoginPath(effectiveUser, 'user'), { replace: true })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Login failed. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-5xl items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Auth: <code className="text-xs">{env.authStrategy}</code>
            {authStrategy === 'http_only_cookie'
              ? ' — expects HttpOnly session cookie from the API'
              : ` — Passport Bearer (${env.bearerTokenPersistence}${env.refreshTokenEnabled ? ', refresh on 401' : ''})`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="password">
                Password
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            {error ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            ) : null}
            <Button className="w-full" disabled={loading} type="submit">
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

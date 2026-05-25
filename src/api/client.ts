import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios'

import { getXsrfTokenFromCookie } from '@/auth/csrf'
import { performTokenRefresh } from '@/auth/performTokenRefresh'
import {
  clearAccessToken,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from '@/auth/token'
import { env, type AuthStrategy } from '@/config/env'

function shouldLog() {
  return env.isDev
}

function shouldAttachBearer(strategy: AuthStrategy) {
  return strategy === 'bearer_memory'
}

function isLoginRoute(pathname: string) {
  return (
    pathname === '/login' ||
    pathname.startsWith('/login/') ||
    pathname === '/admin/login'
  )
}

function normalizePath(p: string) {
  return p.replace(/^\/+/, '').replace(/\/+$/, '')
}

function isAuthRefreshRequest(config: InternalAxiosRequestConfig): boolean {
  if (!env.refreshTokenEnabled || !env.authRefreshPath) return false
  const u = config.url ?? ''
  const ref = normalizePath(env.authRefreshPath)
  const cur = normalizePath(u)
  return cur === ref || cur.endsWith(ref)
}

function redirectToLogin() {
  const next = encodeURIComponent(
    window.location.pathname + window.location.search,
  )
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
    window.location.assign(`/admin/login?next=${next}`)
    return
  }
  window.location.assign(`/login?next=${next}`)
}

export const api: AxiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  headers: {
    Accept: 'application/json',
  },
  // Only cookie-session auth requires credentials. Bearer mode must avoid
  // credentialed CORS so APIs with `Access-Control-Allow-Origin: *` keep working.
  withCredentials: env.authStrategy === 'http_only_cookie',
})

api.interceptors.request.use((config) => {
  config.headers = config.headers ?? {}

  if (shouldAttachBearer(env.authStrategy)) {
    const token = getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }

  const method = config.method?.toLowerCase() ?? 'get'
  if (['post', 'put', 'patch', 'delete'].includes(method)) {
    const xsrf = getXsrfTokenFromCookie()
    if (xsrf) {
      config.headers['X-XSRF-TOKEN'] = xsrf
    }
  }

  if (shouldLog()) {
    console.debug('[api] request', {
      method: config.method,
      url: config.baseURL ? `${config.baseURL}${config.url ?? ''}` : config.url,
      params: config.params,
      auth: env.authStrategy,
    })
  }

  return config
})

api.interceptors.response.use(
  (res) => {
    if (shouldLog()) {
      console.debug('[api] response', {
        status: res.status,
        url: res.config.url,
      })
    }
    return res
  },
  async (err: AxiosError) => {
    if (shouldLog()) {
      console.debug('[api] error', {
        status: err.response?.status,
        url: err.config?.url,
        message: err.message,
      })
    }

    const config = err.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined

    if (err.response?.status !== 401 || !config) {
      return Promise.reject(err)
    }

    // Session probes / login page — never clear tokens or redirect here
    if (config.skipAuthRedirect) {
      return Promise.reject(err)
    }

    if (typeof window !== 'undefined' && isLoginRoute(window.location.pathname)) {
      return Promise.reject(err)
    }

    // Refresh endpoint failed — cannot recover
    if (isAuthRefreshRequest(config)) {
      clearAccessToken()
      redirectToLogin()
      return Promise.reject(err)
    }

    // Optional: one retry after successful token refresh
    if (
      env.refreshTokenEnabled &&
      getRefreshToken() &&
      !config._retry
    ) {
      try {
        const tokens = await performTokenRefresh()
        if (tokens?.accessToken) {
          setAccessToken(tokens.accessToken)
          if (tokens.refreshToken) {
            setRefreshToken(tokens.refreshToken)
          }
          config.headers = config.headers ?? {}
          config.headers.Authorization = `Bearer ${tokens.accessToken}`
          config._retry = true
          return api(config)
        }
      } catch {
        // fall through to logout
      }
    }

    clearAccessToken()
    redirectToLogin()
    return Promise.reject(err)
  },
)

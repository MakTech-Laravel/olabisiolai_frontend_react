import axios from 'axios'

import { getXsrfTokenFromCookie } from '@/auth/csrf'
import { env } from '@/config/env'

/**
 * Axios instance for token refresh only — no global 401→/login interceptor
 * (avoids circular refresh / redirect loops).
 */
export const refreshClient = axios.create({
  baseURL: env.apiBaseUrl,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

refreshClient.interceptors.request.use((config) => {
  config.headers = config.headers ?? {}
  const method = config.method?.toLowerCase() ?? 'post'
  if (['post', 'put', 'patch', 'delete'].includes(method)) {
    const xsrf = getXsrfTokenFromCookie()
    if (xsrf) {
      config.headers['X-XSRF-TOKEN'] = xsrf
    }
  }
  return config
})

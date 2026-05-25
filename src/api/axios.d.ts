import 'axios'

declare module 'axios' {
  interface AxiosRequestConfig {
    /** When true, 401 does not navigate to /login (session probes, login page). */
    skipAuthRedirect?: boolean
    /** Set after a successful token refresh retry (prevents infinite refresh). */
    _retry?: boolean
  }
}

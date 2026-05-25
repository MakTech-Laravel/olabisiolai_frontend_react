import { logError } from '@/lib/error.utils'

export function attachGlobalErrorCapture() {
  const onWindowError = (event: ErrorEvent) => {
    logError(event.error ?? event.message, 'window.onerror')
  }

  const onUnhandledRejection = (event: PromiseRejectionEvent) => {
    logError(event.reason, 'window.onunhandledrejection')
  }

  window.addEventListener('error', onWindowError)
  window.addEventListener('unhandledrejection', onUnhandledRejection)

  return () => {
    window.removeEventListener('error', onWindowError)
    window.removeEventListener('unhandledrejection', onUnhandledRejection)
  }
}


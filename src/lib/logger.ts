import { isDebugLike } from '@/lib/env'

type LogPayload = unknown[]

function safeLog(method: 'debug' | 'info' | 'warn' | 'error', ...args: LogPayload) {
  if (!isDebugLike) return
  console[method](...args)
}

export const logger = {
  debug: (...args: LogPayload) => safeLog('debug', ...args),
  info: (...args: LogPayload) => safeLog('info', ...args),
  warn: (...args: LogPayload) => safeLog('warn', ...args),
  error: (...args: LogPayload) => safeLog('error', ...args),
  group: (label: string, fn: () => void) => {
    if (!isDebugLike) return
    console.groupCollapsed(label)
    try {
      fn()
    } finally {
      console.groupEnd()
    }
  },
}


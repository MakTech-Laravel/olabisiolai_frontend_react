import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

import { getAccessToken } from '@/auth/token'
import { env } from '@/config/env'
import { messagingEnv } from '@/config/messagingEnv'
import { ECHO_CHANNELS } from '@/constants/channels'
import { ECHO_EVENTS } from '@/constants/events'
export type ReverbEcho = Echo<'reverb'>

declare global {
  interface Window {
    Pusher: typeof Pusher
    Echo?: ReverbEcho
  }
}

window.Pusher = Pusher

let echoInstance: ReverbEcho | null = null
/** Last successful connection identity; avoids disconnecting mid-handshake on React Strict Mode remounts. */
let echoConnectionFingerprint: string | null = null

export function resolveBroadcastAuthUrl(apiBaseUrl: string): string {
  const trimmed = apiBaseUrl.replace(/\/+$/, '')
  const root = trimmed.replace(/\/api\/v\d+.*$/i, '')
  return `${root}/api/broadcasting/auth`
}

export function isReverbConfigured(): boolean {
  return messagingEnv.isReverbConfigured()
}

function buildEchoFingerprint(accessToken?: string | null): string {
  return [
    messagingEnv.reverbKey ?? '',
    messagingEnv.reverbHost ?? '',
    String(messagingEnv.reverbPort),
    messagingEnv.reverbScheme,
    resolveBroadcastAuthUrl(env.apiBaseUrl),
    env.authStrategy,
    accessToken ?? '',
  ].join('|')
}

function buildAuthHeaders(accessToken?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  }

  if (env.authStrategy !== 'http_only_cookie') {
    Object.defineProperty(headers, 'Authorization', {
      get(): string {
        const token = accessToken ?? getAccessToken()
        return token ? `Bearer ${token}` : ''
      },
      enumerable: true,
      configurable: true,
    })
  }

  return headers
}

export function createEcho(accessToken?: string | null): ReverbEcho | null {
  if (!messagingEnv.isReverbConfigured()) {
    disconnectEcho()
    return null
  }

  const fingerprint = buildEchoFingerprint(accessToken)
  if (echoInstance && echoConnectionFingerprint === fingerprint) {
    return echoInstance
  }

  disconnectEcho()

  const useTls = messagingEnv.reverbScheme === 'https'
  echoInstance = new Echo<'reverb'>({
    broadcaster: 'reverb',
    key: messagingEnv.reverbKey!,
    wsHost: messagingEnv.reverbHost!,
    wsPort: messagingEnv.reverbPort,
    wssPort: messagingEnv.reverbPort,
    forceTLS: useTls,
    enabledTransports: useTls ? ['wss'] : ['ws', 'wss'],
    disableStats: true,
    authEndpoint: resolveBroadcastAuthUrl(env.apiBaseUrl),
    auth: { headers: buildAuthHeaders(accessToken) },
    ...(env.authStrategy === 'http_only_cookie'
      ? { withCredentials: true }
      : {}),
  })

  echoConnectionFingerprint = fingerprint
  window.Echo = echoInstance
  return echoInstance
}

export function getEcho(): ReverbEcho | null {
  return echoInstance
}

export function disconnectEcho(): void {
  echoInstance?.disconnect()
  echoInstance = null
  echoConnectionFingerprint = null
  delete window.Echo
}

export function subscribeToUserNotifications(
  userId: number | string,
  onNotification: (payload: Record<string, unknown>) => void,
): () => void {
  const echo = getEcho()
  if (!echo) {
    return () => undefined
  }

  const channelName = ECHO_CHANNELS.user(Number(userId))
  const channel = echo.private(channelName)

  channel.listen(ECHO_EVENTS.appNotification, (payload: Record<string, unknown>) => {
    onNotification(payload)
  })
  channel.listen(ECHO_EVENTS.newMessage, (payload: Record<string, unknown>) => {
    onNotification(payload)
  })
  return () => {
    echo.leave(channelName)
  }
}

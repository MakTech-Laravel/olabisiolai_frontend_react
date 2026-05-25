import Echo from 'laravel-echo'
import Pusher from 'pusher-js'

import { env } from '@/config/env'
import { messagingEnv } from '@/config/messagingEnv'

export type ReverbEcho = Echo<'reverb'>

declare global {
  interface Window {
    Pusher: typeof Pusher
  }
}

window.Pusher = Pusher

let echoInstance: ReverbEcho | null = null
/** Last successful connection identity; avoids disconnecting mid-handshake on React Strict Mode remounts. */
let echoConnectionFingerprint: string | null = null

function buildEchoFingerprint(accessToken: string | null): string {
  return [
    messagingEnv.reverbKey ?? '',
    messagingEnv.reverbHost ?? '',
    String(messagingEnv.reverbPort),
    messagingEnv.reverbScheme,
    messagingEnv.broadcastingAuthUrl,
    env.authStrategy,
    accessToken ?? '',
  ].join('|')
}

export function createEcho(accessToken: string | null): ReverbEcho | null {
  if (!messagingEnv.isReverbConfigured()) {
    disconnectEcho()
    return null
  }

  const fingerprint = buildEchoFingerprint(accessToken)
  if (echoInstance && echoConnectionFingerprint === fingerprint) {
    return echoInstance
  }

  disconnectEcho()

  const headers: Record<string, string> = {
    Accept: 'application/json',
  }
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  const useTls = messagingEnv.reverbScheme === 'https'
  echoInstance = new Echo<'reverb'>({
    broadcaster: 'reverb',
    key: messagingEnv.reverbKey!,
    wsHost: messagingEnv.reverbHost!,
    wsPort: messagingEnv.reverbPort,
    wssPort: messagingEnv.reverbPort,
    forceTLS: useTls,
    /** On HTTPS pages Pusher already prefers TLS; avoid plain `ws://` attempts to the same host. */
    enabledTransports: useTls ? ['wss'] : ['ws'],
    disableStats: true,
    authEndpoint: messagingEnv.broadcastingAuthUrl,
    auth: { headers },
    ...(env.authStrategy === 'http_only_cookie'
      ? { withCredentials: true }
      : {}),
  })

  echoConnectionFingerprint = fingerprint
  return echoInstance
}

export function getEcho(): ReverbEcho | null {
  return echoInstance
}

export function disconnectEcho(): void {
  echoInstance?.disconnect()
  echoInstance = null
  echoConnectionFingerprint = null
}

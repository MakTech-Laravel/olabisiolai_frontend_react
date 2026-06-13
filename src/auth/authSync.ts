const AUTH_SYNC_CHANNEL = 'react-vite-laravel.auth-sync'

export function broadcastAuthStorageChange() {
  if (typeof window === 'undefined') return
  try {
    const channel = new BroadcastChannel(AUTH_SYNC_CHANNEL)
    channel.postMessage({ type: 'auth-changed' })
    channel.close()
  } catch {
    // BroadcastChannel unavailable — storage events still cover other tabs.
  }
}

export function subscribeAuthStorageChange(handler: () => void): () => void {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') {
    return () => {}
  }

  const channel = new BroadcastChannel(AUTH_SYNC_CHANNEL)
  channel.onmessage = () => handler()
  return () => channel.close()
}

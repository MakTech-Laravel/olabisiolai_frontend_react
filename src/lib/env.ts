export type EnvironmentMode = 'production' | 'development' | 'local'

function normalizeEnvironmentMode(raw: string | undefined): EnvironmentMode {
  const value = (raw ?? '').toLowerCase().trim()
  if (value === 'production' || value === 'development' || value === 'local') {
    return value
  }
  // Safe fallback: use Vite mode when explicit env mode is not provided.
  if (import.meta.env.PROD) return 'production'
  if (import.meta.env.DEV) return 'development'
  return 'local'
}

export const environmentMode: EnvironmentMode = normalizeEnvironmentMode(
  import.meta.env.VITE_ENVIRONMENT_MODE as string | undefined,
)

export const isProd = environmentMode === 'production'
export const isDev = environmentMode === 'development'
export const isLocal = environmentMode === 'local'
export const isDebugLike = isDev || isLocal


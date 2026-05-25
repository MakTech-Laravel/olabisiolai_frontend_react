# Error handling and favicon system

This project includes a production-safe error system and a cache-first favicon workflow.

## Environment mode

The runtime behavior is controlled by:

- `VITE_ENVIRONMENT_MODE=production|development|local`

Helper exports in `src/lib/env.ts`:

- `environmentMode`
- `isProd`
- `isDev`
- `isLocal`
- `isDebugLike`

## Error handling architecture

- `src/components/error/ErrorBoundary.tsx`
  - wraps app rendering with `react-error-boundary`
  - reports boundary errors through `logError`
  - attaches global error listeners (`window.onerror`, `unhandledrejection`)
- `src/components/error/ErrorFallback.tsx`
  - user-friendly fallback UI
  - always shows basic message and action buttons
  - only shows technical details in development/local

Utilities:

- `src/lib/error.utils.ts`
  - `normalizeError`
  - `getErrorMessage`
  - `getErrorStack`
  - `logError`
- `src/lib/logger.ts`
  - dev/local-only logging (`debug`, `info`, `warn`, `error`)
  - grouped logs with `logger.group(...)`

## Vite overlay

- Development/local: Vite overlay remains enabled by default.
- Production build: no Vite overlay is shown.

No custom plugin is required for this default behavior.

## Favicon system (cache-first)

Files:

- `src/utils/favicon.ts`
  - `setFavicon(url?)`
  - `loadFavicon(options?)`
- `src/hooks/useFavicon.ts`
  - hook used once at app bootstrap

Flow:

1. Try local cache (`localStorage`) first
2. If cached favicon exists and is valid, apply it and skip API call
3. If missing and API endpoint is configured, fetch and cache result
4. Fallback to `/favicon.ico` on failure or empty response
5. Replace existing `<link rel="icon">` automatically

Optional env config:

- `VITE_FAVICON_API_URL` (optional)
- `VITE_FAVICON_RESPONSE_PATH` (optional, default: `data.favicon`)
- `VITE_FAVICON_CACHE_TTL_MS` (optional)

If `VITE_FAVICON_API_URL` is not set, system stays in manual/fallback mode.

## Manual usage example

```ts
import { setFavicon } from '@/utils/favicon'

setFavicon('https://cdn.example.com/brand/favicon.ico')
```

## Notes

- In production UI, stack traces are hidden from users.
- Global runtime errors are captured and logged through a single utility path.
- Favicon fetch is optimized to avoid redundant API requests.


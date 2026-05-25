import * as React from 'react'
import { ErrorBoundary } from 'react-error-boundary'

export function ChatErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallbackRender={({ error, resetErrorBoundary }) => (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 p-8 text-center">
          <p className="font-semibold text-ink">Something went wrong</p>
          <p className="max-w-md text-sm text-chat-meta">
            {error instanceof Error ? error.message : 'Unexpected error'}
          </p>
          <button
            type="button"
            className="rounded-xl bg-chat-accent px-4 py-2 text-sm font-semibold text-text-white"
            onClick={resetErrorBoundary}
          >
            Try again
          </button>
        </div>
      )}
      onError={(err) => {
        console.error('[ChatErrorBoundary]', err)
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

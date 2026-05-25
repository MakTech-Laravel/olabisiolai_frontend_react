import * as React from 'react'
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary'

import { ErrorFallback } from '@/components/error/ErrorFallback'
import { attachGlobalErrorCapture } from '@/lib/errorCapture'
import { logError } from '@/lib/error.utils'

export function ErrorBoundary({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    return attachGlobalErrorCapture()
  }, [])

  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error) => {
        logError(error, 'ErrorBoundary')
      }}
    >
      {children}
    </ReactErrorBoundary>
  )
}


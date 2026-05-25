import { type FallbackProps } from 'react-error-boundary'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getErrorMessage, getErrorStack } from '@/lib/error.utils'
import { isDebugLike } from '@/lib/env'

export function ErrorFallback({ error }: FallbackProps) {
  const message = getErrorMessage(error)
  const stack = getErrorStack(error)

  return (
    <div
      className="mx-auto flex min-h-dvh max-w-3xl items-center justify-center px-4 py-12"
      role="alert"
      aria-live="assertive"
    >
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Something went wrong</CardTitle>
          <CardDescription>
            We hit an unexpected error. You can reload the app or go back home.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isDebugLike ? (
            <div className="space-y-2">
              <div className="rounded-md border bg-muted p-3 text-sm">{message}</div>
              {stack ? (
                <pre className="max-h-60 overflow-auto rounded-md border bg-muted p-3 text-xs">
                  {stack}
                </pre>
              ) : null}
            </div>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => window.location.reload()}>
              Reload Page
            </Button>
            <Button asChild variant="outline" type="button">
              <Link to="/">Go Home</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


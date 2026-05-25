import { type FallbackProps } from 'react-error-boundary'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl items-center justify-center px-4 py-12">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Something went wrong</CardTitle>
          <CardDescription>
            An unexpected error occurred. Try again, or refresh the page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <pre className="max-h-56 overflow-auto rounded-md border bg-muted p-3 text-xs">
            {error instanceof Error ? error.message : String(error)}
          </pre>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={resetErrorBoundary}>
              Try again
            </Button>
            <Button type="button" variant="outline" onClick={() => window.location.reload()}>
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


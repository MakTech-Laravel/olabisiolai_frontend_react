import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center gap-6 px-4 text-center">
      <div>
        <div className="text-7xl font-semibold tracking-tight">404</div>
        <p className="mt-2 text-muted-foreground">That page doesn’t exist.</p>
      </div>
      <Button asChild type="button">
        <Link to="/">Go home</Link>
      </Button>
    </div>
  )
}


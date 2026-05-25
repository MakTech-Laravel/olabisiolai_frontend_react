import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Unauthorized() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl items-center justify-center px-4 py-12">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Unauthorized</CardTitle>
          <CardDescription>You don’t have permission to access this page.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild type="button">
            <Link to="/">Go home</Link>
          </Button>
          <Button asChild variant="outline" type="button">
            <Link to="/login">Sign in</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}


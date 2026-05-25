import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

import { useAuth } from '@/auth/useAuth'

export default function Account() {
  const { accessToken, authStrategy, user, logout } = useAuth()

  return (
    <div className="mx-auto min-h-dvh max-w-5xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>
            Protected area — strategy: <code className="text-xs">{authStrategy}</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user ? (
            <div className="text-sm text-muted-foreground">
              Signed in as{' '}
              <span className="font-medium text-foreground">
                {user.name ?? user.email ?? String(user.id)}
              </span>
            </div>
          ) : null}
          <div className="text-sm text-muted-foreground">
            Bearer token in memory:{' '}
            <span className="font-medium">{accessToken ? 'yes' : 'no'}</span>
            {authStrategy === 'http_only_cookie' ? (
              <span className="block text-xs">
                (HttpOnly cookie — token never stored in JS)
              </span>
            ) : null}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              void logout()
            }}
          >
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

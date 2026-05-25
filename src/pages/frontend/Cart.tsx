import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Cart() {
  return (
    <div className="mx-auto min-h-dvh max-w-5xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Cart</CardTitle>
          <CardDescription>
            Your selected items will appear here once cart flow is connected.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Your cart is currently empty. Browse businesses and add services to continue.
          </div>
          <Button asChild type="button">
            <Link to="/">Continue shopping</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}


import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type NavItem = { label: string; to: string }

export function DashboardLayout({
  title,
  nav,
  children,
}: {
  title: string
  nav: NavItem[]
  children: React.ReactNode
}) {
  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="font-semibold tracking-tight">{title}</div>
          <Button asChild variant="outline" type="button">
            <Link to="/">Home</Link>
          </Button>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-4 py-6 md:grid-cols-[240px_1fr]">
        <aside className="rounded-lg border bg-card p-3">
          <nav className="grid gap-1">
            {nav.map((i) => (
              <Link
                key={i.to}
                to={i.to}
                className={cn(
                  'rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
              >
                {i.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="min-w-0">{children}</main>
      </div>

      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-muted-foreground">
          Dashboard template • Role-based routes
        </div>
      </footer>
    </div>
  )
}


import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, List, Search, UserRound } from 'lucide-react'

import { useAuth } from '@/auth/useAuth'
import { isBottomNavActive, shouldShowAppBottomNav } from '@/lib/appNavigation'
import { cn } from '@/lib/utils'

type NavItem = {
  key: 'home' | 'search' | 'catalog' | 'profile'
  label: string
  to: string
  icon: typeof Home
  requiresAuth?: boolean
}

const navItems: NavItem[] = [
  { key: 'home', label: 'Home', to: '/', icon: Home },
  { key: 'search', label: 'Search', to: '/filters', icon: Search },
  { key: 'catalog', label: 'Catalog', to: '/catalog', icon: List, requiresAuth: true },
  { key: 'profile', label: 'Profile', to: '/user/profile', icon: UserRound, requiresAuth: true },
]

export function AppBottomNav() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, isSessionLoading } = useAuth()

  if (!shouldShowAppBottomNav(pathname)) {
    return null
  }

  const visibleItems = navItems.filter((item) => !item.requiresAuth || isAuthenticated)

  return (
    <nav
      aria-label="App navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border-light bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/90 lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex h-16 max-w-lg items-stretch justify-around px-2">
        {visibleItems.map(({ key, label, to, icon: Icon }) => {
          const active =
            key === 'catalog'
              ? pathname.startsWith('/catalog')
              : key === 'profile'
                ? pathname.startsWith('/user/profile') || pathname.startsWith('/user/settings')
                : isBottomNavActive(pathname, to)

          return (
            <Link
              key={key}
              to={to}
              className={cn(
                'flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg px-2 text-[11px] font-medium transition-colors',
                active ? 'text-brand' : 'text-muted-foreground hover:text-ink',
              )}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className={cn('size-5 shrink-0', active && 'stroke-[2.5]')} aria-hidden />
              <span className="truncate">{label}</span>
            </Link>
          )
        })}

        {!isSessionLoading && !isAuthenticated ? (
          <>
            <button
              type="button"
              onClick={() => navigate("/catalog")}
              className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg px-2 text-[11px] font-medium text-muted-foreground hover:text-ink"
            >
              <List className="size-5 shrink-0" aria-hidden />
              <span className="truncate">Catalog</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/login', { state: { from: '/user/profile' } })}
              className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg px-2 text-[11px] font-medium text-muted-foreground hover:text-ink"
            >
              <UserRound className="size-5 shrink-0" aria-hidden />
              <span className="truncate">Profile</span>
            </button>
          </>
        ) : null}
      </div>
    </nav>
  )
}

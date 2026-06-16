import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  BookOpen,
  ChevronRight,
  LogOut,
  MessageSquareQuote,
  ShieldAlert,
  Star,
  UserCog,
} from 'lucide-react'

import { fetchUserBusinesses, createUserBusiness } from '@/api/userBusinesses'
import { resolveActiveProfileMode } from '@/features/profile/profileViewMode'
import { useAuth } from '@/auth/useAuth'
import { FrontendHeader } from '@/components/partials/frontend/FrontendHeader'
import { CreateBusinessPageButton } from '@/components/profile/CreateBusinessPageButton'
import { cn } from '@/lib/utils'

type HubRowProps = {
  icon: ReactNode
  label: string
  description?: string
  to?: string
  onClick?: () => void
  external?: boolean
  destructive?: boolean
}

function HubSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl bg-card shadow-sm">
      <h2 className="border-b border-border-light px-4 py-3 text-xs font-semibold uppercase tracking-wide text-chat-meta">
        {title}
      </h2>
      <div className="divide-y divide-border-light">{children}</div>
    </section>
  )
}

function HubRow({ icon, label, description, to, onClick, external, destructive }: HubRowProps) {
  const content = (
    <>
      <span
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-soft text-brand',
          destructive && 'bg-red-50 text-brand-red',
        )}
        aria-hidden
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn('block text-sm font-medium text-ink', destructive && 'text-brand-red')}>{label}</span>
        {description ? <span className="mt-0.5 block text-xs text-chat-meta">{description}</span> : null}
      </span>
      <ChevronRight className="size-4 shrink-0 text-chat-meta" aria-hidden />
    </>
  )

  const className =
    'flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-surface-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30'

  if (to) {
    if (external) {
      return (
        <a href={to} className={className} target="_blank" rel="noopener noreferrer">
          {content}
        </a>
      )
    }

    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    )
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  )
}

export default function SettingsHub() {
  const { user, logout } = useAuth()
  const activeMode = resolveActiveProfileMode(user)
  const isVendorMode = activeMode === 'vendor'

  const businessesQuery = useQuery({
    queryKey: ['user', 'businesses', 'settings-hub'],
    queryFn: fetchUserBusinesses,
    enabled: Boolean(user?.id),
    retry: false,
  })

  const hasBusinessPage = (businessesQuery.data?.length ?? 0) > 0

  return (
    <div className="container mx-auto min-h-screen text-ink">
      <FrontendHeader />

      <main className="mx-auto w-full px-4 py-6 sm:px-6 sm:py-8">
        <Link
          to="/user/profile"
          className="mb-4 inline-flex items-center text-sm font-medium text-chat-accent hover:underline"
        >
          ← Back to profile
        </Link>

        <header className="mb-6">
          <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">Settings & Activity</h1>
          <p className="mt-1 text-sm text-body-secondary">
            Account controls, vendor reviews, and help.
          </p>
        </header>

        <div className="space-y-4">
          <HubSection title="Reviews & vendor tools">
            <HubRow icon={<Star className="size-4" />} label="My Reviews" to="/user/reviews" />
            <HubRow
              icon={<Star className="size-4" />}
              label="Write a Review"
              description="Leave feedback for a business you used"
              to="/reviews"
            />
            {isVendorMode ? (
              <HubRow
                icon={<MessageSquareQuote className="size-4" />}
                label="Reviews Received"
                description="See and reply to customer reviews"
                to="/vendor/reviews"
              />
            ) : null}
          </HubSection>

          <HubSection title="Account">
            <HubRow
              icon={<UserCog className="size-4" />}
              label="Account Settings"
              description="Password, notifications, verification"
              to="/user/settings/account"
            />
            {!hasBusinessPage ? (
              <div className="px-4 py-3">
                <CreateBusinessPageButton fullWidth />
              </div>
            ) : null}
            <HubRow
              icon={<LogOut className="size-4" />}
              label="Logout"
              destructive
              onClick={() => {
                void logout()
              }}
            />
          </HubSection>

          <HubSection title="Reports & help">
            <HubRow
              icon={<ShieldAlert className="size-4" />}
              label="Report a Vendor"
              description="Tell us about a listing concern"
              to="/user/report?type=vendor"
            />
            <HubRow
              icon={<ShieldAlert className="size-4" />}
              label="Report a Customer"
              description="Report inappropriate customer behaviour"
              to="/user/report?type=customer"
            />
            <HubRow
              icon={<ShieldAlert className="size-4" />}
              label="Report a Problem"
              description="Technical issues or general complaints"
              to="/user/report?type=problem"
            />
            <HubRow
              icon={<BookOpen className="size-4" />}
              label="Business Tips Library"
              description="Guides for growing your business on Gidira"
              to="/business-tips"
            />
          </HubSection>
        </div>
      </main>
    </div>
  )
}

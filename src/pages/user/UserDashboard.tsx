import { Heart, Loader2, MessageSquareText, Settings, UserPlus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

import { fetchFollowStats } from '@/api/follows'
import { fetchNotifications } from '@/api/notifications'
import { useAuth } from '@/auth/useAuth'
import { SwitchProfileModeButton } from '@/components/profile/SwitchProfileModeButton'
import { FrontendHeader } from '@/components/partials/frontend/FrontendHeader'
import { QUERY_KEYS } from '@/constants/queryKeys'
import {
  formatNotificationTime,
  toneDotClass,
  toUserNotificationDisplay,
} from '@/features/notifications/notificationDisplay'
import { cn } from '@/lib/utils'

const LOGO_FOOTER = '/images/landing/gidira-logo-footer.svg'

const footerColumns = [
  {
    title: 'Company',
    links: [
      { label: 'About Gidira', to: '/about' },
      { label: 'Contact Us', to: '/contact' },
      { label: 'Careers', to: '/careers' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms & Conditions', to: '/terms' },
      { label: 'Privacy Policy', to: '/privacy-policy' },
      { label: 'Cookies Policy', to: '/cookies-policy' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Business Tips', to: '/business-tips' },
      { label: 'FAQs', to: '/faq' },
    ],
  },
] as const

type StatCard = {
  title: string
  subtitle: string
  icon: typeof Heart
  to?: string
}

const statCards: StatCard[] = [
  {
    title: 'Favorites',
    subtitle: 'ALL FAVORITES ARE HERE',
    icon: Heart,
    to: '/user/favorites',
  },
  {
    title: 'Messages',
    subtitle: 'ALL DIRECTLY MESSAGES',
    icon: MessageSquareText,
    to: '/user/messages',
  },
  {
    title: 'Settings & Activity',
    subtitle: 'SAVED, REVIEWS, ACCOUNT & MORE',
    icon: Settings,
    to: '/user/settings',
  },
]

const RECENT_ACTIVITY_LIMIT = 5

export default function UserDashboard() {
  const { user } = useAuth()
  const displayName = user?.name?.trim() || user?.email?.split('@')[0] || 'Julian'

  const activityQuery = useQuery({
    queryKey: QUERY_KEYS.notifications({
      page: 1,
      perPage: RECENT_ACTIVITY_LIMIT,
      unreadOnly: false,
    }),
    queryFn: () =>
      fetchNotifications({ page: 1, perPage: RECENT_ACTIVITY_LIMIT, unreadOnly: false }),
    staleTime: 15_000,
  })

  const followStatsQuery = useQuery({
    queryKey: ['follow-stats', user?.id],
    queryFn: () => fetchFollowStats(),
    enabled: Boolean(user?.id),
    staleTime: 30_000,
  })

  const activityItems = (activityQuery.data?.items ?? []).map(toUserNotificationDisplay)
  const followersCount = followStatsQuery.data?.followers_count ?? 0
  const followingCount = followStatsQuery.data?.following_count ?? 0

  return (
    <div className="min-h-screen bg-auth-bg text-ink">
      <FrontendHeader />

      <main className="mx-auto w-full max-w-[1400px] px-3 py-6 sm:px-4 sm:py-7 md:px-6 xl:px-12">
        <section className="rounded-2xl bg-card p-4 sm:p-6 md:p-10">
          <div>
            <h1 className="text-3xl font-bold leading-tight tracking-[-0.4px] sm:text-4xl md:text-5xl md:leading-[58px]">
              Welcome back, {displayName}.
            </h1>
            <p className="mt-2 text-base text-chat-meta sm:text-lg">Glad you&apos;re here</p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              {followStatsQuery.isLoading ? (
                <>
                  <span className="h-9 w-28 animate-pulse rounded-full bg-surface-soft" />
                  <span className="h-9 w-28 animate-pulse rounded-full bg-surface-soft" />
                </>
              ) : (
                <>
                  <div className="inline-flex items-center gap-2 rounded-full border border-border-light bg-surface-soft px-4 py-2 text-sm text-ink">
                    <UserPlus className="size-4 text-brand" aria-hidden />
                    <span>
                      <span className="font-semibold">{followersCount.toLocaleString()}</span>{' '}
                      {followersCount === 1 ? 'Follower' : 'Followers'}
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-border-light bg-surface-soft px-4 py-2 text-sm text-ink">
                    <span>
                      <span className="font-semibold">{followingCount.toLocaleString()}</span>{' '}
                      Following
                    </span>
                  </div>
                </>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <SwitchProfileModeButton />
              <Link
                to="/user/profile"
                className="inline-flex h-10 items-center rounded-xl border border-border-light bg-card px-4 text-sm font-semibold text-ink hover:bg-surface-soft"
              >
                My profile
              </Link>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {statCards.map((card) => {
              const Icon = card.icon
              const content = (
                <>
                  <Icon className="size-5 text-ink-muted" />
                  <h2 className="mt-2 font-heading text-[34px] font-bold leading-9">
                    {card.title}
                  </h2>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.6px] text-chat-meta">
                    {card.subtitle}
                  </p>
                </>
              )
              return card.to ? (
                <Link
                  key={card.title}
                  to={card.to}
                  className="block rounded-xl bg-card p-5 shadow-[0_3px_6.1px_rgba(0,0,0,0.24)] transition hover:opacity-95 sm:p-6"
                >
                  {content}
                </Link>
              ) : (
                <article
                  key={card.title}
                  className="rounded-xl bg-card p-5 shadow-[0_3px_6.1px_rgba(0,0,0,0.24)] sm:p-6"
                >
                  {content}
                </article>
              )
            })}
          </div>

          <section className="mt-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h3 className="font-heading text-3xl font-bold leading-8">Recent Activity</h3>
              <Link
                to="/user/activity"
                className="text-sm font-semibold text-chat-accent hover:underline"
              >
                View all activity
              </Link>
            </div>

            <div className="mt-4 rounded-2xl bg-chat-input-bg px-4 py-5 sm:px-8 md:px-10 md:py-6">
              {activityQuery.isError ? (
                <p className="text-sm text-chat-meta">
                  Could not load activity.{' '}
                  <button
                    type="button"
                    className="font-semibold text-chat-accent underline"
                    onClick={() => void activityQuery.refetch()}
                  >
                    Retry
                  </button>
                </p>
              ) : activityQuery.isLoading ? (
                <div className="flex items-center gap-2 py-6 text-chat-meta">
                  <Loader2 className="size-5 animate-spin" aria-hidden />
                  <span className="text-sm">Loading activity…</span>
                </div>
              ) : activityItems.length === 0 ? (
                <p className="text-sm text-chat-meta">
                  No recent activity yet. Messages and account updates will appear here.
                </p>
              ) : (
                <div className="space-y-6">
                  {activityItems.map((item) => (
                    <Link
                      key={item.id}
                      to={item.href}
                      className="relative block pl-5 transition-opacity hover:opacity-90"
                    >
                      <span
                        className={cn(
                          'absolute left-0 top-1.5 size-2 rounded-full',
                          toneDotClass(item.tone),
                        )}
                        aria-hidden
                      />
                      <p className="text-sm font-semibold">{item.title}</p>
                      {item.message ? (
                        <p className="text-xs text-chat-meta line-clamp-2">{item.message}</p>
                      ) : null}
                      <p className="mt-0.5 text-[10px] font-semibold tracking-[1px] text-chat-meta/60">
                        {formatNotificationTime(item.createdAt).toUpperCase()}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        </section>
      </main>

      <footer className="mt-4 bg-footer-bar">
        <div className="mx-auto w-full max-w-[1400px] px-4 py-14 xl:px-12">
          <div className="grid gap-8 md:grid-cols-[280px_1fr]">
            <div>
              <img src={LOGO_FOOTER} alt="Gidira" className="h-8 w-auto" />
              <p className="mt-4 text-sm text-white">FIND BETTER | CONNECT FASTER</p>
            </div>

            <div className="grid gap-8 sm:grid-cols-3">
              {footerColumns.map((column) => (
                <div key={column.title}>
                  <h4 className="text-base font-semibold text-white">{column.title}</h4>
                  <ul className="mt-4 space-y-2">
                    {column.links.map((link) => (
                      <li key={link.label}>
                        <Link
                          to={link.to}
                          className="text-sm text-footer-muted hover:text-white"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 border-t border-white/20 pt-8 text-center">
            <p className="text-sm text-footer-muted">
              © 2026 GIDIRA. All rights reserved. Built for Nigeria&apos;s Digital Economy.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

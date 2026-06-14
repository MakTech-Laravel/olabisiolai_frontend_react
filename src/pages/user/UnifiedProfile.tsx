import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Loader2, Settings, UserPlus } from 'lucide-react'

import { fetchFollowStats } from '@/api/follows'
import { fetchUserSettings } from '@/api/userSettings'
import { useAuth } from '@/auth/useAuth'
import { FrontendHeader } from '@/components/partials/frontend/FrontendHeader'
import { SwitchProfileModeButton } from '@/components/profile/SwitchProfileModeButton'
import { HeaderAvatar } from '@/components/ui/HeaderAvatar'
import { Button } from '@/components/ui/button'
import {
  fetchVendorBusinessProfile,
  VendorBusinessNotFoundError,
} from '@/features/business/vendorBusinessProfileApi'
import { resolveActiveProfileMode } from '@/features/profile/profileViewMode'
import { businessProfilePath } from '@/lib/businessProfile'
import { resolveMediaUrl } from '@/lib/mediaUrl'

const DEFAULT_AVATAR = '/images/avatar/default-header-avatar.png'

export default function UnifiedProfile() {
  const { user } = useAuth()
  const displayName = user?.name?.trim() || user?.email?.split('@')[0] || 'Guest'
  const activeMode = resolveActiveProfileMode(user)

  const settingsQuery = useQuery({
    queryKey: ['user-settings'],
    queryFn: fetchUserSettings,
    enabled: Boolean(user?.id),
    staleTime: 30_000,
  })

  const followStatsQuery = useQuery({
    queryKey: ['follow-stats', user?.id],
    queryFn: () => fetchFollowStats(),
    enabled: Boolean(user?.id),
    staleTime: 30_000,
  })

  const vendorBusinessQuery = useQuery({
    queryKey: ['vendor', 'business', 'profile-hub'],
    queryFn: fetchVendorBusinessProfile,
    enabled: Boolean(user?.id) && activeMode === 'vendor',
    retry: false,
  })

  const profile = settingsQuery.data?.profile
  const avatarUrl = resolveMediaUrl(
    profile?.image_path ?? user?.image_path ?? profile?.image_url ?? user?.image_url,
    DEFAULT_AVATAR,
  )
  const followersCount = followStatsQuery.data?.followers_count ?? 0
  const followingCount = followStatsQuery.data?.following_count ?? 0
  const vendorBusiness =
    vendorBusinessQuery.data ??
    (vendorBusinessQuery.error instanceof VendorBusinessNotFoundError ? null : undefined)

  return (
    <div className="min-h-screen bg-auth-bg text-ink">
      <FrontendHeader />

      <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
        <section className="rounded-2xl bg-card p-6 shadow-sm sm:p-8">
          <div className="flex flex-col items-center text-center">
            <HeaderAvatar src={avatarUrl} alt={displayName} className="size-24 rounded-full border-4 border-surface-soft" />
            <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight">{displayName}</h1>
            <p className="mt-1 text-sm text-chat-meta">
              {activeMode === 'vendor' ? 'Vendor mode' : 'Customer mode'}
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              {followStatsQuery.isLoading ? (
                <Loader2 className="size-5 animate-spin text-brand" aria-label="Loading stats" />
              ) : (
                <>
                  <div className="inline-flex items-center gap-2 rounded-full border border-border-light bg-surface-soft px-4 py-2 text-sm">
                    <UserPlus className="size-4 text-brand" aria-hidden />
                    <span>
                      <span className="font-semibold">{followersCount.toLocaleString()}</span> Followers
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-border-light bg-surface-soft px-4 py-2 text-sm">
                    <span>
                      <span className="font-semibold">{followingCount.toLocaleString()}</span> Following
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <SwitchProfileModeButton fullWidth />

            {activeMode === 'vendor' && vendorBusiness ? (
              <Button asChild variant="outline" className="h-12 w-full rounded-xl text-base font-medium">
                <Link to={businessProfilePath(vendorBusiness.id)}>View & edit business profile</Link>
              </Button>
            ) : null}

            <Button asChild variant="outline" className="h-12 w-full rounded-xl text-base font-medium">
              <Link to="/user/settings">
                <Settings className="mr-2 size-5" aria-hidden />
                Settings & Activity
              </Link>
            </Button>
          </div>

          {activeMode === 'vendor' && vendorBusinessQuery.isLoading ? (
            <p className="mt-4 text-center text-sm text-chat-meta">Loading business profile…</p>
          ) : null}
        </section>
      </main>
    </div>
  )
}

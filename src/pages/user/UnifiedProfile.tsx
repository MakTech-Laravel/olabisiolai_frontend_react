import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { createUserBusiness, fetchUserBusinesses, setActiveBusinessId as updateActiveBusinessId } from '@/api/userBusinesses'
import { fetchFollowStats } from '@/api/follows'
import { fetchUserSettings } from '@/api/userSettings'
import { fetchUserReviews } from '@/api/userReviews'
import { useAuth } from '@/auth/useAuth'
import { FrontendHeader } from '@/components/partials/frontend/FrontendHeader'
import { ProfileBusinessSection } from '@/components/profile/hub/ProfileBusinessSection'
import {
  ProfileHubHeader,
  ProfileIdentitySection,
} from '@/components/profile/hub/ProfileIdentitySection'
import { ProfileHubFooter } from '@/components/profile/hub/ProfileHubFooter'
import { ProfileManageSheet } from '@/components/profile/hub/ProfileManageSheet'
import { ProfilePersonalTools } from '@/components/profile/hub/ProfilePersonalTools'
import type { ProfileHubBusiness } from '@/components/profile/hub/profileHubUtils'
import { resolveActiveProfileMode } from '@/features/profile/profileViewMode'
import { useProfilePhotoUpload } from '@/hooks/useProfilePhotoUpload'
import { resolveMediaUrl } from '@/lib/mediaUrl'
import { showError, showSuccess, alert } from '@/lib/sweetAlert'

const DEFAULT_AVATAR = '/images/avatar/default-header-avatar.png'

function profileHandle(user: { email?: string | null; name?: string | null }, location?: string | null) {
  const base =
    user.email?.split('@')[0]?.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '') ||
    user.name?.trim().toLowerCase().replace(/\s+/g, '') ||
    'you'
  const handle = `@${base}`
  return location ? `${handle} · ${location}` : handle
}

export default function UnifiedProfile() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const displayName = user?.name?.trim() || user?.email?.split('@')[0] || 'Guest'

  const [manageBusiness, setManageBusiness] = useState<ProfileHubBusiness | null>(null)
  const [isAddingBusiness, setIsAddingBusiness] = useState(false)

  const {
    inputRef: profilePhotoInputRef,
    onFileChange: onProfilePhotoChange,
    openFilePicker: openProfilePhotoPicker,
    isUploading: isProfilePhotoUploading,
    avatarCacheKey,
    error: profilePhotoError,
  } = useProfilePhotoUpload()

  const activeProfileMode = resolveActiveProfileMode(user)

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

  const reviewsQuery = useQuery({
    queryKey: ['user-reviews-count', user?.id],
    queryFn: () => fetchUserReviews(1),
    enabled: Boolean(user?.id) && activeProfileMode === 'customer',
    staleTime: 60_000,
  })

  const businessesQuery = useQuery({
    queryKey: ['user', 'businesses'],
    queryFn: fetchUserBusinesses,
    enabled: Boolean(user?.id),
    staleTime: 30_000,
  })

  const hubBusinesses = useMemo<ProfileHubBusiness[]>(() => {
    return (businessesQuery.data ?? []).map((business) => ({
      ...business,
      isPremiumActive: business.isPremiumActive,
      followersCount: business.followersCount,
      reviewsCount: business.reviewsCount,
    }))
  }, [businessesQuery.data])

  const profile = settingsQuery.data?.profile
  const locationLabel = profile?.location?.trim() || null
  const handleLabel = profileHandle({ email: user?.email, name: user?.name }, locationLabel)

  const baseAvatarUrl = resolveMediaUrl(
    profile?.image_path ?? user?.image_path ?? profile?.image_url ?? user?.image_url,
    DEFAULT_AVATAR,
  )
  const avatarPath = profile?.image_path ?? user?.image_path ?? null
  const avatarUrl =
    avatarCacheKey && avatarPath
      ? `${baseAvatarUrl}${baseAvatarUrl.includes('?') ? '&' : '?'}v=${avatarCacheKey}`
      : baseAvatarUrl

  const followingCount = followStatsQuery.data?.following_count ?? 0
  const reviewsCount = reviewsQuery.data?.pagination?.total ?? reviewsQuery.data?.count ?? 0

  function handleManage(business: ProfileHubBusiness) {
    void persistActiveBusiness(business.id)
    setManageBusiness(business)
  }

  async function persistActiveBusiness(businessId: number | null) {
    try {
      await updateActiveBusinessId(businessId)
      void queryClient.invalidateQueries({ queryKey: ['user-settings'] })
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Could not update active business.')
    }
  }

  async function handleAddBusiness() {
    if (isAddingBusiness) return

    const confirmed = await alert.confirm({
      title: 'Add another business?',
      text: 'A new business page will be created. You can edit its details afterwards.',
      icon: 'question',
      confirmText: 'Yes, create',
      cancelText: 'Cancel',
    })

    if (!confirmed) return

    setIsAddingBusiness(true)
    try {
      const created = await createUserBusiness()
      await queryClient.invalidateQueries({ queryKey: ['user', 'businesses'] })
      await persistActiveBusiness(created.id)
      setManageBusiness(created)
      showSuccess('Your new business page is ready.')
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Could not create another business page.')
    } finally {
      setIsAddingBusiness(false)
    }
  }

  return (
    <div className="min-h-screen bg-auth-bg text-ink">
      <div className="lg:hidden">
        <ProfileHubHeader avatarUrl={avatarUrl} />
      </div>
      <div className="hidden lg:block">
        <FrontendHeader />
      </div>

      <div className="mx-auto w-full max-w-[1400px] lg:px-8 lg:pb-10">
        <main className="mx-auto w-full min-w-0 max-w-[430px] pb-8 lg:max-w-none">
          <div className="lg:space-y-4 lg:mt-4">
            <div className="">
              <ProfileIdentitySection
                displayName={displayName}
                handleLabel={handleLabel}
                avatarUrl={avatarUrl}
                followingCount={followingCount}
                reviewsCount={reviewsCount}
                isPhotoUploading={isProfilePhotoUploading}
                photoError={profilePhotoError}
                onOpenPhotoPicker={openProfilePhotoPicker}
                onPhotoChange={onProfilePhotoChange}
                photoInputRef={profilePhotoInputRef}
              />
            </div>

            <div className="lg:min-w-0">
              <div className="mb-1 hidden lg:block">
                <h1 className="font-heading text-2xl font-bold tracking-tight text-ink">Overview</h1>
                <p className="mt-1 text-sm text-body-secondary">
                  Your profile, activity, and business pages
                </p>
              </div>

              <ProfilePersonalTools />

              <ProfileBusinessSection
                businesses={hubBusinesses}
                isLoading={businessesQuery.isLoading}
                isAddingBusiness={isAddingBusiness}
                onManage={handleManage}
                onAddBusiness={() => void handleAddBusiness()}
              />
              <ProfileHubFooter />
            </div>
          </div>
        </main>
      </div>

      <ProfileManageSheet
        business={manageBusiness}
        open={manageBusiness !== null}
        onClose={() => setManageBusiness(null)}
        onBusinessDeleted={() => setManageBusiness(null)}
      />
    </div>
  )
}

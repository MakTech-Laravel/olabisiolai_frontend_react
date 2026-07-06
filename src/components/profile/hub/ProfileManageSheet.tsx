import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  BadgeCheck,
  ChevronRight,
  Crown,
  Loader2,
  MessageSquare,
  Pencil,
  Rocket,
  Share2,
  Trash2,
  XCircle,
} from 'lucide-react'

import { ProfileHubSlidePanel } from '@/components/profile/hub/ProfileHubSlidePanel'
import { ProfileContactLeadsBreakdown } from '@/components/profile/hub/ProfileContactLeadsBreakdown'
import { ProfileInsightsPanel } from '@/components/profile/hub/ProfileInsightsPanel'
import {
  ProfileManageBackBar,
  profileHubChipClass,
} from '@/components/profile/hub/ProfileIdentitySection'
import { isBusinessVerified, type ProfileHubBusiness, verificationChipLabel } from '@/components/profile/hub/profileHubUtils'
import { deleteUserBusiness, setActiveBusinessId } from '@/api/userBusinesses'
import { shareProfileUrl, appOrigin } from '@/features/share/appShare'
import { VENDOR_PREMIUM_INFO_PATH } from '@/hooks/useVendorSubscriptionAccess'
import { cancelSubscription, fetchSubscriptionStatus } from '@/features/subscription/vendorSubscriptionApi'
import { businessProfilePath } from '@/lib/businessProfile'
import { alert, showError, showSuccess } from '@/lib/sweetAlert'
import { cn } from '@/lib/utils'

type ProfileManageSheetProps = {
  business: ProfileHubBusiness | null
  open: boolean
  onClose: () => void
  onBusinessDeleted?: () => void
}

function ManageToolRow({
  iconClass,
  icon,
  title,
  subtitle,
  onClick,
  to,
  onNavigate,
  trailing,
  disabled,
}: {
  iconClass: string
  icon: React.ReactNode
  title: string
  subtitle: string
  onClick?: () => void
  to?: string
  onNavigate?: () => void
  trailing?: React.ReactNode
  disabled?: boolean
}) {
  const className = cn(
    'flex w-full items-center gap-3.5 border-b border-border-light px-4 py-[15px] text-left transition-colors last:border-b-0 active:bg-auth-bg',
    disabled && 'cursor-not-allowed opacity-50',
  )

  const content = (
    <>
      <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', iconClass)}>{icon}</span>
      <span className="min-w-0 flex-1">
        <b className="block text-[15px] font-semibold text-ink">{title}</b>
        <small className="block text-[12.5px] text-chat-meta">{subtitle}</small>
      </span>
      {trailing ?? <ChevronRight className="size-[18px] shrink-0 text-[#c3cad4]" strokeWidth={2} aria-hidden />}
    </>
  )

  if (to && !disabled) {
    return (
      <Link to={to} className={className} onClick={onNavigate}>
        {content}
      </Link>
    )
  }

  return (
    <button type="button" className={className} onClick={onClick} disabled={disabled}>
      {content}
    </button>
  )
}

function businessInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'B'
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase()
  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase()
}

export function ProfileManageSheet({ business, open, onClose, onBusinessDeleted }: ProfileManageSheetProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const isPremiumActive = business?.isPremiumActive === true
  const canBoost = isPremiumActive && isBusinessVerified(business?.verificationStatus ?? '')

  const subscriptionQuery = useQuery({
    queryKey: ['vendor', 'subscription', 'status', 'profile-manage', business?.id],
    queryFn: () => fetchSubscriptionStatus({ businessId: business!.id }),
    enabled: open && business !== null && isPremiumActive,
    staleTime: 60_000,
  })

  const premiumSubscription = subscriptionQuery.data?.subscription
  const premiumRenewalLabel = (() => {
    if (premiumSubscription?.is_trial) {
      const days = premiumSubscription.trial_days_remaining
      return typeof days === 'number'
        ? `Free trial · ${days} day${days === 1 ? '' : 's'} left`
        : 'Free trial active'
    }

    if (!premiumSubscription?.expires_at) {
      return 'Analytics & badge active'
    }

    const daysRemaining =
      typeof premiumSubscription.days_remaining === 'number' ? premiumSubscription.days_remaining : null

    if (daysRemaining !== null && daysRemaining > 0) {
      return `Renews ${premiumSubscription.expires_at} · ${daysRemaining} day${daysRemaining === 1 ? '' : 's'} left`
    }

    if (premiumSubscription.is_expired) {
      return `Expired ${premiumSubscription.expires_at}`
    }

    return `Renews ${premiumSubscription.expires_at}`
  })()

  const publicUrl = business ? `${appOrigin()}${businessProfilePath(business.id)}` : ''

  async function openVendorRoute(path: string) {
    if (!business) return
    try {
      await setActiveBusinessId(business.id)
    } catch {
      // Continue navigation even if persisting active business fails.
    }
    onClose()
    navigate(`${path}?business_id=${business.id}`)
  }

  async function handleShare() {
    if (!business) return
    await shareProfileUrl(publicUrl, business.businessName ?? 'Business')
  }

  async function handleCancelPremium() {
    if (!business || isCancelling) return

    const confirmed = await alert.confirm({
      title: 'Cancel Premium plan?',
      text: premiumSubscription?.is_trial
        ? 'Your free trial will end immediately and this business will revert to the Free plan.'
        : 'This business will immediately revert to the Free plan. This cannot be undone and there is no refund for time remaining.',
      icon: 'warning',
      confirmText: 'Yes, cancel plan',
      cancelText: 'Keep Premium',
      confirmButtonColor: '#dc2626',
    })

    if (!confirmed) return

    setIsCancelling(true)
    try {
      const result = await cancelSubscription({ businessId: business.id })
      showSuccess(result.message)
      void queryClient.invalidateQueries({ queryKey: ['vendor', 'subscription'] })
      void queryClient.invalidateQueries({ queryKey: ['vendor'] })
      void queryClient.invalidateQueries({ queryKey: ['user', 'businesses'] })
      onClose()
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Could not cancel the plan.')
    } finally {
      setIsCancelling(false)
    }
  }

  async function handleDeletePage() {
    if (!business || isDeleting) return

    const confirmed = await alert.confirm({
      title: 'Delete business page?',
      text: `This will permanently remove "${business.businessName}". This cannot be undone.`,
      icon: 'warning',
      confirmText: 'Yes, delete',
      cancelText: 'Cancel',
      confirmButtonColor: '#dc2626',
    })

    if (!confirmed) return

    setIsDeleting(true)
    try {
      await deleteUserBusiness(business.id)
      await queryClient.invalidateQueries({ queryKey: ['user', 'businesses'] })
      showSuccess('Business page deleted.')
      onClose()
      onBusinessDeleted?.()
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Could not delete this business page.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <ProfileHubSlidePanel open={open && business !== null} onClose={onClose}>
      {business ? (
        <>
          <ProfileManageBackBar onBack={onClose} />
          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="relative h-32 bg-gradient-to-br from-[#cdd6e3] to-[#aebacb]">
              {business.coverPhotoUrls[0] ? (
                <img src={business.coverPhotoUrls[0]} alt="" className="size-full object-cover" />
              ) : null}
              <Link
                to={businessProfilePath(business.id)}
                onClick={onClose}
                className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-[rgba(15,22,32,0.62)] px-3 py-1.5 text-xs font-semibold text-white"
              >
                <Pencil className="size-3" aria-hidden />
                Edit cover
              </Link>
            </div>

            <div className="relative bg-white px-[18px] pb-[18px]">
              <div
                className="relative -mt-10 flex size-[78px] items-center justify-center overflow-hidden rounded-[20px] border-4 border-white font-heading text-[28px] font-bold text-white shadow-sm"
                style={{
                  background: business.logoUrl
                    ? undefined
                    : 'linear-gradient(135deg,#1C86E8,#1B4FD8)',
                }}
              >
                {business.logoUrl ? (
                  <img src={business.logoUrl} alt="" className="size-full object-cover" />
                ) : (
                  businessInitials(business.businessName)
                )}
                <Link
                  to={businessProfilePath(business.id)}
                  onClick={onClose}
                  className="absolute -bottom-1.5 -right-1.5 flex size-7 items-center justify-center rounded-full bg-[rgba(15,22,32,0.62)] text-white"
                  aria-label="Edit logo"
                >
                  <Pencil className="size-3.5" aria-hidden />
                </Link>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <h2 className="font-heading text-[22px] font-bold tracking-[-0.01em] text-ink">
                  {business.businessName}
                </h2>
                {isBusinessVerified(business.verificationStatus) ? (
                  <BadgeCheck className="size-4 text-chat-accent" aria-hidden />
                ) : null}
              </div>
              <p className="mt-1 text-[13.5px] text-body-secondary">
                {business.categoryName}
                {business.locationLabel ? ` · ${business.locationLabel}` : ''}
              </p>
              <div className="mt-3 flex gap-6">
                <Link
                  to={`/user/business-followers?business_id=${business.id}`}
                  onClick={onClose}
                  className="text-left transition-opacity hover:opacity-80"
                >
                  <b className="font-heading text-[17px] font-bold text-ink">
                    {(business.followersCount ?? 0).toLocaleString()}
                  </b>
                  <span className="ml-1.5 text-[12.5px] text-chat-meta">followers</span>
                </Link>
                <Link
                  to={`/user/business-reviews?business_id=${business.id}`}
                  onClick={onClose}
                  className="text-left transition-opacity hover:opacity-80"
                >
                  <b className="font-heading text-[17px] font-bold text-ink">
                    {(business.reviewsCount ?? 0).toLocaleString()}
                  </b>
                  <span className="ml-1.5 text-[12.5px] text-chat-meta">reviews</span>
                </Link>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {isPremiumActive ? (
                  <span className={profileHubChipClass('premium')}>
                    <Crown className="size-2.5 fill-white text-white" aria-hidden />
                    Premium
                  </span>
                ) : (
                  <span className={profileHubChipClass('free')}>Free</span>
                )}
                {business.boostStatus === 'active' ? (
                  <span className={profileHubChipClass('boost')}>
                    <Rocket className="size-2.5" aria-hidden />
                    Boosted
                  </span>
                ) : null}
                {isBusinessVerified(business.verificationStatus) ? (
                  <span className={profileHubChipClass('verified')}>Verified</span>
                ) : (
                  <span className={profileHubChipClass('free')}>{verificationChipLabel(business.verificationStatus)}</span>
                )}
              </div>
            </div>

            <ProfileInsightsPanel
              businessId={business.id}
              followersCount={business.followersCount}
              isPremiumActive={isPremiumActive}
            />
            <ProfileContactLeadsBreakdown businessId={business.id} isPremiumActive={isPremiumActive} />

            <div className="px-[18px] pb-6 pt-2">
              <div className="mb-3 overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(16,22,32,0.05)]">
                <ManageToolRow
                  iconClass="bg-[#EAF2FD] text-chat-accent"
                  icon={<BadgeCheck className="size-5" strokeWidth={2} />}
                  title={isBusinessVerified(business.verificationStatus) ? 'Verification' : 'Verify business'}
                  subtitle={
                    isBusinessVerified(business.verificationStatus)
                      ? 'Reviewed by our team'
                      : 'Get the blue check'
                  }
                  to={`/vendor/verification?business_id=${business.id}`}
                  onNavigate={onClose}
                  trailing={
                    isBusinessVerified(business.verificationStatus) ? (
                      <span className="rounded-full bg-[#E7F6EF] px-2.5 py-1 text-[11px] font-bold text-[#13a36b]">
                        Verified
                      </span>
                    ) : undefined
                  }
                />
                {isPremiumActive ? (
                  <ManageToolRow
                    iconClass="bg-gradient-to-br from-[#FBF1DC] to-[#F6E4BC] text-[#9A6B1F]"
                    icon={<Crown className="size-5" strokeWidth={2} />}
                    title="Premium"
                    subtitle={premiumRenewalLabel}
                    onClick={() => void openVendorRoute(VENDOR_PREMIUM_INFO_PATH)}
                    trailing={
                      <span
                        className={cn(
                          'rounded-full px-2.5 py-1 text-[11px] font-bold',
                          premiumSubscription?.is_trial
                            ? 'bg-amber-100 text-amber-700'
                            : premiumSubscription?.is_expired
                              ? 'bg-[#FDEAEA] text-brand'
                              : 'bg-[#E7F6EF] text-[#13a36b]',
                        )}
                      >
                        {premiumSubscription?.is_trial
                          ? 'Trial'
                          : premiumSubscription?.is_expired
                            ? 'Expired'
                            : 'Active'}
                      </span>
                    }
                  />
                ) : null}
                {isPremiumActive ? (
                  <ManageToolRow
                    iconClass="bg-[#FDEAEA] text-brand"
                    icon={<XCircle className="size-5" strokeWidth={2} />}
                    title="Cancel Premium plan"
                    subtitle="Revert to the Free plan immediately"
                    onClick={() => void handleCancelPremium()}
                    disabled={isCancelling}
                    trailing={isCancelling ? <Loader2 className="size-4 animate-spin text-body-secondary" aria-hidden /> : undefined}
                  />
                ) : (
                  <ManageToolRow
                    iconClass="bg-gradient-to-br from-[#FBF1DC] to-[#F6E4BC] text-[#9A6B1F]"
                    icon={<Crown className="size-5" strokeWidth={2} />}
                    title="Upgrade to Premium"
                    subtitle="Analytics, boost, catalog & badge"
                    onClick={() => void openVendorRoute(VENDOR_PREMIUM_INFO_PATH)}
                  />
                )}
                {isPremiumActive ? (
                  <ManageToolRow
                    iconClass="bg-[#FDEAEA] text-brand"
                    icon={<Rocket className="size-5" strokeWidth={2} />}
                    title="Boost listing"
                    subtitle="Reach more customers near you"
                    disabled={!canBoost}
                    onClick={() => void openVendorRoute('/vendor/boost')}
                  />
                ) : (
                  <ManageToolRow
                    iconClass="bg-[#FDEAEA] text-brand"
                    icon={<Rocket className="size-5" strokeWidth={2} />}
                    title="Boost listing"
                    subtitle="Available on Premium"
                    trailing={
                      <span className={profileHubChipClass('premium')}>
                        <Crown className="size-2.5 fill-white text-white" aria-hidden />
                        Premium
                      </span>
                    }
                    onClick={() => void openVendorRoute(VENDOR_PREMIUM_INFO_PATH)}
                  />
                )}
                <ManageToolRow
                  iconClass="bg-[#EAF2FD] text-chat-accent"
                  icon={<MessageSquare className="size-5" strokeWidth={2} />}
                  title="Messages"
                  subtitle="Customer enquiries for this business"
                  to={`/user/messages?business_id=${business.id}`}
                  onNavigate={onClose}
                />
                <ManageToolRow
                  iconClass="bg-[#EAF2FD] text-chat-accent"
                  icon={<Share2 className="size-5" strokeWidth={2} />}
                  title="Share page"
                  subtitle="Send your business link to customers"
                  onClick={() => void handleShare()}
                />
              </div>

              <Link
                to={businessProfilePath(business.id)}
                onClick={onClose}
                className="flex w-full items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-border-light bg-white px-3.5 py-3.5 text-[14.5px] font-semibold text-ink"
              >
                <Pencil className="size-[18px] text-body-secondary" strokeWidth={2} aria-hidden />
                View &amp; edit page
              </Link>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => void handleDeletePage()}
                className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-[#f5c4c4] bg-white px-3.5 py-3.5 text-[14.5px] font-semibold text-brand disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isDeleting ? (
                  <Loader2 className="size-[18px] animate-spin" aria-hidden />
                ) : (
                  <Trash2 className="size-[18px]" strokeWidth={2} aria-hidden />
                )}
                {isDeleting ? 'Deleting…' : 'Delete page'}
              </button>
            </div>
          </div>
        </>
      ) : null}
    </ProfileHubSlidePanel>
  )
}

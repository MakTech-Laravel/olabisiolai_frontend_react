import { Loader2, Plus, Store } from 'lucide-react'

import { CreateBusinessPageButton } from '@/components/profile/CreateBusinessPageButton'

import { ProfileBusinessCard } from './ProfileBusinessCard'
import { ProfileHubSection } from './ProfileHubSection'
import type { ProfileHubBusiness } from './profileHubUtils'

type ProfileBusinessSectionProps = {
  businesses: ProfileHubBusiness[] | undefined
  isLoading: boolean
  isAddingBusiness?: boolean
  onManage: (business: ProfileHubBusiness) => void
  onAddBusiness: () => void
}

export function ProfileBusinessSection({
  businesses,
  isLoading,
  isAddingBusiness = false,
  onManage,
  onAddBusiness,
}: ProfileBusinessSectionProps) {
  const count = businesses?.length ?? 0
  const title = count === 0 ? 'Grow on Gidira' : count === 1 ? 'Your business' : 'Your businesses'
  const countLabel = count > 0 ? `${count} page${count === 1 ? '' : 's'}` : undefined

  return (
    <ProfileHubSection title={title} countLabel={countLabel}>
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="size-6 animate-spin text-brand" aria-label="Loading businesses" />
        </div>
      ) : count === 0 ? (
        <div className="rounded-[22px] border border-dashed border-[#d6dde6] bg-white px-[22px] py-[26px] text-center shadow-[0_1px_2px_rgba(16,22,32,0.05)] lg:max-w-xl">
          <div className="mx-auto mb-3.5 flex size-[58px] items-center justify-center rounded-[17px] bg-gradient-to-br from-[#FCE9EA] to-[#FBE3E4]">
            <Store className="size-7 text-brand" strokeWidth={2} aria-hidden />
          </div>
          <h3 className="font-heading text-lg font-bold text-ink">Create a business page</h3>
          <p className="mx-auto mt-1.5 max-w-[280px] text-[13.5px] leading-relaxed text-body-secondary">
            List on Gidira in one tap. We set up a free page instantly — edit everything later with pencil icons.
          </p>
          <div className="mt-[18px]">
            <CreateBusinessPageButton fullWidth />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
          {businesses?.map((business) => (
            <ProfileBusinessCard key={business.id} business={business} onManage={() => onManage(business)} />
          ))}

          <button
            type="button"
            disabled={isAddingBusiness}
            onClick={onAddBusiness}
            className="mt-0.5 flex w-full items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-[#cfe2fb] bg-white px-3.5 py-3.5 text-[14.5px] font-semibold text-chat-accent transition-colors hover:bg-[#EAF2FD] disabled:cursor-not-allowed disabled:opacity-70 lg:col-span-2"
          >
            {isAddingBusiness ? (
              <Loader2 className="size-[18px] animate-spin" aria-hidden />
            ) : (
              <Plus className="size-[18px]" strokeWidth={2} aria-hidden />
            )}
            {isAddingBusiness ? 'Creating…' : 'Add another business'}
          </button>
        </div>
      )}
    </ProfileHubSection>
  )
}

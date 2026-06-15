import { ChevronRight, Heart, Settings, Star } from 'lucide-react'
import { Link } from 'react-router-dom'

import { ProfileHubSection } from './ProfileHubSection'

const tools = [
  {
    label: 'Following',
    description: 'Every business you follow & save',
    to: '/user/following',
    icon: Heart,
  },
  {
    label: 'Reviews written',
    description: 'See reviews you left',
    to: '/user/reviews',
    icon: Star,
  },
  {
    label: 'Settings & activity',
    description: 'Account, privacy, help',
    to: '/user/settings',
    icon: Settings,
  },
] as const

type ProfilePersonalToolsProps = {
  reviewsCount?: number
}

export function ProfilePersonalTools({ reviewsCount }: ProfilePersonalToolsProps) {
  return (
    <ProfileHubSection title="Your activity">
      <div className="divide-y divide-border-light overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(16,22,32,0.05),0_1px_1px_rgba(16,22,32,0.04)]">
        {tools.map((tool) => {
          const Icon = tool.icon
          const description =
            tool.label === 'Reviews written' && reviewsCount != null
              ? `${reviewsCount} review${reviewsCount === 1 ? '' : 's'}`
              : tool.description

          return (
            <Link
              key={tool.to}
              to={tool.to}
              className="flex w-full items-center gap-3.5 px-4 py-[15px] text-left transition-colors active:bg-auth-bg lg:hover:bg-auth-bg"
            >
              <span className="flex size-[38px] shrink-0 items-center justify-center rounded-[11px] bg-[#EAF2FD] text-chat-accent">
                <Icon className="size-[19px]" strokeWidth={2} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <b className="block text-[15px] font-semibold text-ink">{tool.label}</b>
                <small className="block text-[12.5px] text-chat-meta">{description}</small>
              </span>
              <ChevronRight className="size-[18px] shrink-0 text-[#c3cad4]" strokeWidth={2} aria-hidden />
            </Link>
          )
        })}
      </div>
    </ProfileHubSection>
  )
}

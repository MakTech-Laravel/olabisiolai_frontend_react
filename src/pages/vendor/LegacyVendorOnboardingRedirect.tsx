import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'

import {
  defaultOnboardingStatus,
  fetchVendorOnboardingStatus,
  onboardingRedirectPath,
} from '@/features/subscription/vendorOnboardingApi'

/** Legacy `/vendor/plan-form` route — forwards to unified profile or payment. */
export default function LegacyVendorOnboardingRedirect() {
  const navigate = useNavigate()

  const { data, isLoading, isFetched } = useQuery({
    queryKey: ['vendor', 'onboarding', 'status'],
    queryFn: fetchVendorOnboardingStatus,
    retry: 1,
    staleTime: 0,
    refetchOnMount: 'always',
  })

  useEffect(() => {
    if (isLoading || !isFetched) {
      return
    }

    navigate(onboardingRedirectPath(data ?? defaultOnboardingStatus()), { replace: true })
  }, [data, isFetched, isLoading, navigate])

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Loader2 className="size-8 animate-spin text-brand-red" aria-label="Redirecting" />
    </div>
  )
}

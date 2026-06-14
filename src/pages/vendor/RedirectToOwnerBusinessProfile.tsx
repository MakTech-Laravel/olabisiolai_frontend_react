import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'

import {
  fetchVendorBusinessProfile,
  VendorBusinessNotFoundError,
} from '@/features/business/vendorBusinessProfileApi'
import { businessProfilePath } from '@/lib/businessProfile'

/** `/vendor/profile` now lives on the public business page in owner mode. */
export default function RedirectToOwnerBusinessProfile() {
  const navigate = useNavigate()

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['vendor', 'business', 'profile-redirect'],
    queryFn: fetchVendorBusinessProfile,
    retry: false,
  })

  useEffect(() => {
    if (isLoading) {
      return
    }

    if (data?.id) {
      navigate(businessProfilePath(data.id), { replace: true })
      return
    }

    if (isError && error instanceof VendorBusinessNotFoundError) {
      navigate('/user/profile', { replace: true })
      return
    }

    if (isError) {
      navigate('/user/profile', { replace: true })
    }
  }, [data, error, isError, isLoading, navigate])

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Loader2 className="size-8 animate-spin text-brand-red" aria-label="Opening business profile" />
    </div>
  )
}

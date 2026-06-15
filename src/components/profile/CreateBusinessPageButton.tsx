import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, Store } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import { fetchUserBusinesses, createUserBusiness } from '@/api/userBusinesses'
import { getProfileModeErrorMessage, switchToVendorMode } from '@/api/userMode'
import { useAuth } from '@/auth/useAuth'
import { businessProfilePath } from '@/lib/businessProfile'
import { Button } from '@/components/ui/button'
import { showError, showSuccess } from '@/lib/sweetAlert'
import { cn } from '@/lib/utils'
type CreateBusinessPageButtonProps = {
  className?: string
  fullWidth?: boolean
}

export function CreateBusinessPageButton({
  className,
  fullWidth = false,
}: CreateBusinessPageButtonProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user, setUser, refreshSession } = useAuth()
  const [loading, setLoading] = useState(false)

  const businessesQuery = useQuery({
    queryKey: ['user', 'businesses', 'create-cta'],
    queryFn: fetchUserBusinesses,
    enabled: Boolean(user?.id),
    retry: false,
  })

  if (!user) return null

  const vendorBusiness = businessesQuery.data?.[0]
  const businessCount = businessesQuery.data?.length ?? 0
  const hasBusiness = businessCount > 0
  async function handleCreate() {
    if (loading) return

    setLoading(true)
    try {
      if (businessCount > 0) {
        await createUserBusiness()
        showSuccess('Your new business page is ready.')
      } else {
        const result = await switchToVendorMode()
        setUser(result.user)
        showSuccess(
          result.created_business
            ? 'Your business page is ready. Complete your listing to start reaching customers on Gidira.'
            : 'Your business page is ready.',
        )
        await refreshSession()
      }
      void queryClient.invalidateQueries({ queryKey: ['user', 'businesses'] })

      navigate('/user/profile', { replace: true })
    } catch (error) {
      showError(getProfileModeErrorMessage(error, 'Could not create your business page. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  if (hasBusiness && vendorBusiness) {
    return (
      <Button
        asChild
        variant="default"
        className={cn(
          'gap-2',
          fullWidth && 'h-12 w-full rounded-xl text-base font-medium',
          className,
        )}
      >
        <Link to={businessProfilePath(vendorBusiness.id)}>
          <Store className="size-5 shrink-0" aria-hidden />
          View business page
        </Link>
      </Button>
    )
  }

  if (businessesQuery.isLoading) {
    return (
      <Button
        type="button"
        disabled
        className={cn(fullWidth && 'h-12 w-full rounded-xl text-base font-medium', className)}
      >
        <Loader2 className="size-5 animate-spin" aria-hidden />
        Loading…
      </Button>
    )
  }

  return (
    <Button
      type="button"
      variant="default"
      disabled={loading}
      onClick={() => void handleCreate()}
      className={cn(
        'gap-2',
        fullWidth && 'h-12 w-full rounded-xl text-base font-medium',
        className,
      )}
    >
      {loading ? (
        <Loader2 className="size-5 animate-spin" aria-hidden />
      ) : (
        <Store className="size-5 shrink-0" aria-hidden />
      )}
      {loading ? 'Creating…' : 'Create a Business Page'}
    </Button>
  )
}

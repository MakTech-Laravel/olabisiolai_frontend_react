import { useState } from 'react'
import { Loader2, Store, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import {
  getProfileModeErrorMessage,
  switchToCustomerMode,
  switchToVendorMode,
} from '@/api/userMode'
import { useAuth } from '@/auth/useAuth'
import { resolveActiveProfileMode } from '@/features/profile/profileViewMode'
import { businessProfilePath } from '@/lib/businessProfile'
import { Button } from '@/components/ui/button'
import { showError, showSuccess } from '@/lib/sweetAlert'
import { cn } from '@/lib/utils'

type SwitchProfileModeButtonProps = {
  className?: string
  fullWidth?: boolean
}

export function SwitchProfileModeButton({
  className,
  fullWidth = false,
}: SwitchProfileModeButtonProps) {
  const navigate = useNavigate()
  const { user, setUser, refreshSession } = useAuth()
  const [loading, setLoading] = useState(false)

  if (!user) return null

  const activeMode = resolveActiveProfileMode(user)
  const isVendorMode = activeMode === 'vendor'

  async function handleSwitch() {
    if (loading) return

    setLoading(true)
    try {
      if (isVendorMode) {
        const result = await switchToCustomerMode()
        setUser(result.user)
        showSuccess('Switched to customer mode.')
        await refreshSession()
        navigate('/user/profile', { replace: true })
        return
      }

      const result = await switchToVendorMode()
      setUser(result.user)
      showSuccess(
        result.created_business
          ? 'Vendor mode enabled. Your free business profile is ready — complete it with the pencil icons.'
          : 'Vendor mode enabled.',
      )
      await refreshSession()

      if (result.business_id) {
        navigate(businessProfilePath(result.business_id), { replace: true })
        return
      }

      navigate('/user/profile', { replace: true })
    } catch (error) {
      showError(getProfileModeErrorMessage(error, 'Could not switch profile mode. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      type="button"
      variant={isVendorMode ? 'outline' : 'default'}
      disabled={loading}
      onClick={() => void handleSwitch()}
      className={cn(
        'gap-2',
        fullWidth && 'h-12 w-full rounded-xl text-base font-medium',
        className,
      )}
    >
      {loading ? (
        <Loader2 className="size-5 animate-spin" aria-hidden />
      ) : isVendorMode ? (
        <UserRound className="size-5 shrink-0" aria-hidden />
      ) : (
        <Store className="size-5 shrink-0" aria-hidden />
      )}
      {loading ? 'Switching…' : isVendorMode ? 'Switch to Customer Mode' : 'Switch to Vendor Mode'}
    </Button>
  )
}

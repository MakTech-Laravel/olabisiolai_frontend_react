import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'

/** Legacy `/user/dashboard` — forwards to unified profile hub. */
export default function UserDashboard() {
  const navigate = useNavigate()

  useEffect(() => {
    navigate('/user/profile', { replace: true })
  }, [navigate])

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Loader2 className="size-8 animate-spin text-brand-red" aria-label="Redirecting" />
    </div>
  )
}

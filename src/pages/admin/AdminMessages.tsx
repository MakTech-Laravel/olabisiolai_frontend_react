import { useQuery } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'

import { fetchAdminMessagingIdentity } from '@/api/adminMessagingIdentity'
import { MessagingLayout } from '@/features/messaging/MessagingLayout'

export default function AdminMessages() {
  const identityQuery = useQuery({
    queryKey: ['admin', 'messaging', 'identity'],
    queryFn: fetchAdminMessagingIdentity,
    staleTime: 5 * 60_000,
  })

  if (identityQuery.isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" aria-hidden />
        Loading messages…
      </div>
    )
  }

  if (identityQuery.isError || !identityQuery.data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {identityQuery.error instanceof Error
          ? identityQuery.error.message
          : 'Could not load admin messaging.'}
      </div>
    )
  }

  return (
    <div className="h-[calc(100dvh-8rem)] min-h-[480px]">
      <MessagingLayout selfUser={identityQuery.data} conversationQueryParam="c" inboxScope="all" />
    </div>
  )
}

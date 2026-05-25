import { Link, type LinkProps } from 'react-router-dom'

import { businessProfilePath } from '@/lib/businessProfile'
import { cn } from '@/lib/utils'

type BusinessProfileLinkProps = Omit<LinkProps, 'to'> & {
  businessId: number
  businessName: string
}

/**
 * Navigates to the public business profile without triggering parent card clicks.
 */
export function BusinessProfileLink({
  businessId,
  businessName,
  className,
  onClick,
  children,
  ...rest
}: BusinessProfileLinkProps) {
  return (
    <Link
      to={businessProfilePath(businessId)}
      onClick={(event) => {
        event.stopPropagation()
        onClick?.(event)
      }}
      className={cn(
        'text-inherit hover:text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-sm',
        className,
      )}
      aria-label={`View ${businessName} profile`}
      {...rest}
    >
      {children ?? businessName}
    </Link>
  )
}

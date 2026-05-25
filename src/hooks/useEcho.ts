import type { ReverbEcho } from '@/lib/echo'
import { useEchoContext } from '@/providers/EchoProvider'

export function useEcho(): ReverbEcho | null {
  return useEchoContext().echo
}

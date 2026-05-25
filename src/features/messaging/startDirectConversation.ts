import { createConversation } from '@/api/conversations'
import { fetchPublicBusinessById } from '@/features/business/publicBusinessApi'
import type { Conversation } from '@/types/conversation'

export async function resolveVendorParticipantUuid(
  vendorUserUuid?: string | null,
  businessInfoId?: number,
): Promise<string | null> {
  let peerUuid = vendorUserUuid?.trim().toUpperCase() ?? ''

  if (!peerUuid && businessInfoId != null && businessInfoId > 0) {
    const business = await fetchPublicBusinessById(businessInfoId)
    peerUuid = business?.vendorUserUuid?.trim().toUpperCase() ?? ''
  }

  return peerUuid || null
}

/**
 * Find or create a direct conversation with a business vendor.
 * Backend returns an existing direct thread when one already exists.
 */
export async function startDirectConversationWithVendor(input: {
  vendorUserUuid?: string | null
  businessInfoId: number
}): Promise<Conversation> {
  const peerUuid = await resolveVendorParticipantUuid(
    input.vendorUserUuid,
    input.businessInfoId,
  )

  if (!peerUuid) {
    throw new Error('This business cannot receive direct messages yet.')
  }

  return createConversation([peerUuid])
}

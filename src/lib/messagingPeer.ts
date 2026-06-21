import type { ConversationPeer, FollowerOwnedBusiness } from '@/types/messagingPeer'

export type { FollowerOwnedBusiness }

/** Listing / thread title from the API (business name when messaging a vendor). */
export function peerDisplayName(peer: ConversationPeer | null | undefined): string {
  if (!peer) return 'Member'
  return peer.display_name?.trim() || peer.name?.trim() || peer.personal_name?.trim() || 'Member'
}

/** Registered personal name (profile panel, vendor inbox). */
export function peerPersonalName(peer: ConversationPeer | null | undefined): string {
  if (!peer) return 'Member'
  return peer.personal_name?.trim() || peer.display_name?.trim() || peer.name?.trim() || 'Member'
}

export function peerOwnedBusinesses(peer: ConversationPeer | null | undefined): FollowerOwnedBusiness[] {
  return peer?.owned_businesses ?? []
}

export function followerFromPeer(peer: ConversationPeer): {
  personalName: string
  imageUrl: string | null
  followedAt: string | null
  ownedBusinesses: FollowerOwnedBusiness[]
} {
  return {
    personalName: peerPersonalName(peer),
    imageUrl: peer.avatar_url ?? null,
    followedAt: null,
    ownedBusinesses: peerOwnedBusinesses(peer),
  }
}

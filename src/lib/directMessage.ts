/** Location state consumed by DirectMessage / user Messages to open or create a thread. */
export type DirectMessageLocationState = {
  from?: string
  /** Vendor account UUID (required to create a direct conversation). */
  participantUserUuid?: string
  /** Fallback: resolve vendor UUID via public business profile API. */
  businessInfoId?: number
}

export function buildDirectMessageState(
  input: DirectMessageLocationState,
): DirectMessageLocationState {
  const participantUserUuid = input.participantUserUuid?.trim().toUpperCase()
  return {
    from: input.from,
    participantUserUuid: participantUserUuid || undefined,
    businessInfoId:
      input.businessInfoId != null && input.businessInfoId > 0
        ? input.businessInfoId
        : undefined,
  }
}

/** True when navigation state requests opening/creating a vendor direct thread. */
export function hasPendingDirectMessageState(state: unknown): boolean {
  if (!state || typeof state !== 'object') return false
  const s = state as DirectMessageLocationState
  return Boolean(
    s.participantUserUuid?.trim() ||
    (s.businessInfoId != null && s.businessInfoId > 0),
  )
}

/** Navigate target for starting a direct message with a business vendor. */
export type DirectMessageNavigateTarget = {
  pathname: string
  state: DirectMessageLocationState
}

export function directMessageTo(
  input: DirectMessageLocationState,
  messagesPath: '/messages' | '/user/messages' = '/messages',
): DirectMessageNavigateTarget {
  return {
    pathname: messagesPath,
    state: buildDirectMessageState(input),
  }
}

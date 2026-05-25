import type { TypingUser } from '@/types/message'

/** Stable empty list for Zustand selectors / props — never use `?? []` inline (new ref each snapshot → infinite loops in React 19). */
export const EMPTY_TYPING_USERS: TypingUser[] = []

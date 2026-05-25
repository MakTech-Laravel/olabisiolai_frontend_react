import type { AuthUser } from '@/auth/types';

/** Display name for forms (reviews, profile labels, etc.). */
export function getAuthDisplayName(user: AuthUser | null | undefined): string {
  if (!user) return '';

  const direct = user.name?.trim();
  if (direct) return direct;

  const emailLocal = user.email?.split('@')[0]?.trim();
  if (emailLocal) return emailLocal;

  return '';
}

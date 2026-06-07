export type AuthUser = {
  id: string | number
  name?: string
  email?: string
  phone?: string | null
  image_path?: string | null
  image_url?: string | null
  role?: string
  roles?: string[]
  email_verified_at?: string | null
  phone_verified_at?: string | null
  email_verified?: boolean
  email_verification_required?: boolean
  can_make_purchases?: boolean
  /**
   * Spatie `admin` guard permission names (from AdminResource / admin login).
   * Used with `can()` in the admin area. Do not mix with app route role strings.
   */
  permissions?: string[]
  /** Spatie role names assigned to this admin (e.g. super-admin, editor-unit). */
  adminSpatieRoles?: string[]
  /** From AdminResource — true when this account has the Spatie `super-admin` role. */
  is_super_admin?: boolean
}


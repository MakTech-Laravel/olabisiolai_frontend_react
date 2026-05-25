# Role management & route protection

This template supports **role-based route protection** for React Router using a reusable guard component.

## Concepts

### Role mode (single vs multi)

Configure how roles are represented on the user object:

- **single** (default): `user.role = "admin"`
- **multi**: `user.roles = ["admin", "seller"]`

Env:

- `VITE_ROLE_MODE=single|multi`

Implementation:

- `getUserRoles()` in `src/auth/roles.ts` normalizes the user into a `string[]`.

### Role policy (default + env override)

Role policy defines per-role defaults like **dashboard** and **fallback redirect**.

Code defaults:

- `src/auth/rolePolicy.ts` exports `defaultRolePolicy` and `rolePolicy`.

Optional env override (JSON string):

- `VITE_ROLE_POLICY_JSON={"admin":{"fallback":"/admin/login","dashboard":"/admin"}}`

If the env JSON is invalid, it is ignored.

## Protecting routes

Use `RoleGate` to wrap any element that should be role-protected:

- File: `src/routes/RoleGate.tsx`

Example (admin-only, custom fallback):

```tsx
<RoleGate allow="admin" fallback="/admin/login">
  <Dashboard />
</RoleGate>
```

Example (allow multiple roles):

```tsx
<RoleGate allow={["admin", "vendor"]} fallback="/unauthorized">
  <VendorArea />
</RoleGate>
```

### Fallback rules

When a user is authenticated but **does not match** the required role(s):

1. Use `fallback` prop (if provided)
2. Else use role policy fallback (based on `user.role`, if present)
3. Else redirect to `/unauthorized`

When a user is **not authenticated**:

- Redirect to `/login` by default (can be overridden via `unauthenticatedTo` prop)

## Example routes in this repo

See `src/routes/router.tsx` for example setup:

- `/admin` is protected by `RoleGate allow="admin" fallback="/admin/login"`
- `/seller` is protected by `RoleGate allow="seller" fallback="/seller/login"`
- `/unauthorized` is a generic forbidden page

## Adding a new role (checklist)

1. **Backend**: ensure login + `/me` returns the role info (single `role` or multi `roles`)
2. **Frontend user typing**: `src/auth/types.ts` already supports `role?: string` and `roles?: string[]`
3. **Create pages** for that area (example: `src/pages/vendor/VendorDashboard.tsx`)
4. **Add routes** in `src/routes/router.tsx` and wrap with `RoleGate`
5. **Add fallback** route/page (example: `/vendor/login` or `/unauthorized`)
6. (Optional) **Add policy** default in `src/auth/rolePolicy.ts` or override via `VITE_ROLE_POLICY_JSON`

## Security note

Role checks in the SPA are for **UX and navigation**. You must still enforce authorization on the server for each API endpoint.


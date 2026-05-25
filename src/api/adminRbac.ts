import { api } from "@/api/client";
import { unwrapLaravelData } from "@/api/laravelResponse";
import { env } from "@/config/env";

/**
 * When `VITE_API_BASE_URL` already ends with `/v1`, request paths must be `/admin/...` only.
 * Adding `/v1/admin/...` would produce `.../api/v1/v1/admin/...` (Laravel route not found).
 */
function apiBaseAlreadyIncludesV1(): boolean {
  const base = env.apiBaseUrl.replace(/\/+$/, "").toLowerCase();
  return base.endsWith("/v1");
}

function adminResourcePaths(resource: "roles" | "permissions"): string[] {
  const primary = `/admin/${resource}`;
  if (apiBaseAlreadyIncludesV1()) return [primary];
  return [primary, `/v1/admin/${resource}`];
}

function adminRolesBasePaths(): string[] {
  return adminResourcePaths("roles");
}

export type AdminPermissionRow = {
  id: number;
  name: string;
  guard_name?: string;
};

export type AdminRoleRow = {
  id: number;
  name: string;
  guard_name?: string;
  permissions?: AdminPermissionRow[];
};

function toRecord(v: unknown): Record<string, unknown> | null {
  if (!v || typeof v !== "object") return null;
  return v as Record<string, unknown>;
}

function pickArray(body: unknown): unknown[] {
  const direct = unwrapLaravelData(body);
  if (Array.isArray(direct)) return direct;
  const rec = toRecord(direct);
  if (rec && Array.isArray(rec.data)) return rec.data;
  return [];
}

function toPermissionRow(raw: unknown, index: number): AdminPermissionRow {
  const o = toRecord(raw) ?? {};
  const id = typeof o.id === "number" ? o.id : index + 1;
  return {
    id,
    name: typeof o.name === "string" ? o.name : "",
    guard_name: typeof o.guard_name === "string" ? o.guard_name : undefined,
  };
}

function toRoleRow(raw: unknown, index: number): AdminRoleRow {
  const o = toRecord(raw) ?? {};
  const id = typeof o.id === "number" ? o.id : index + 1;
  const permsRaw = o.permissions;
  const permissions = Array.isArray(permsRaw)
    ? permsRaw.map((p, i) => toPermissionRow(p, i))
    : undefined;
  return {
    id,
    name: typeof o.name === "string" ? o.name : "",
    guard_name: typeof o.guard_name === "string" ? o.guard_name : undefined,
    permissions,
  };
}

async function getWithPathFallback(paths: string[]): Promise<unknown> {
  let last: unknown = null;
  for (const path of paths) {
    try {
      const res = await api.get<unknown>(path);
      return res.data;
    } catch (e) {
      last = e;
    }
  }
  throw last;
}

export async function fetchAdminRoles(): Promise<AdminRoleRow[]> {
  const body = await getWithPathFallback(adminResourcePaths("roles"));
  return pickArray(body).map(toRoleRow);
}

export async function fetchAdminPermissions(): Promise<AdminPermissionRow[]> {
  const body = await getWithPathFallback(adminResourcePaths("permissions"));
  return pickArray(body).map(toPermissionRow);
}

export async function createAdminRole(payload: {
  name: string;
  permissions: string[];
}): Promise<AdminRoleRow> {
  let last: unknown = null;
  for (const prefix of adminRolesBasePaths()) {
    try {
      const res = await api.post<unknown>(prefix, payload);
      const row = unwrapLaravelData(res.data);
      return toRoleRow(row ?? res.data, 0);
    } catch (e) {
      last = e;
    }
  }
  throw last;
}

export async function updateAdminRole(
  id: number,
  payload: { name: string; permissions: string[] },
): Promise<AdminRoleRow> {
  let last: unknown = null;
  for (const prefix of adminRolesBasePaths()) {
    try {
      const res = await api.put<unknown>(`${prefix}/${id}`, payload);
      const row = unwrapLaravelData(res.data);
      return toRoleRow(row ?? res.data, 0);
    } catch (e) {
      last = e;
    }
  }
  throw last;
}

export async function deleteAdminRole(id: number): Promise<void> {
  let last: unknown = null;
  for (const prefix of adminRolesBasePaths()) {
    try {
      await api.delete(`${prefix}/${id}`);
      return;
    } catch (e) {
      last = e;
    }
  }
  throw last;
}

export async function fetchAdminRoleById(id: number): Promise<AdminRoleRow> {
  let last: unknown = null;
  for (const prefix of adminRolesBasePaths()) {
    try {
      const res = await api.get<unknown>(`${prefix}/${id}`);
      const row = unwrapLaravelData(res.data);
      return toRoleRow(row ?? res.data, 0);
    } catch (e) {
      last = e;
    }
  }
  throw last;
}

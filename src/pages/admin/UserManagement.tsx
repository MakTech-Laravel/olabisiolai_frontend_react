import { Eye, Loader2, Pencil, Plus, Shield, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  type AdminPermissionRow,
  type AdminRoleRow,
  createAdminRole,
  deleteAdminRole,
  fetchAdminPermissions,
  fetchAdminRoles,
  fetchAdminRoleById,
  updateAdminRole,
} from "@/api/adminRbac";
import { useAuth } from "@/auth/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getAuthErrorMessage } from "@/features/auth/errorMessage";

function permissionResourceLabel(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length <= 1) return name;
  return parts.slice(1).join(" ");
}

function groupPermissionsByResource(perms: AdminPermissionRow[]): Map<string, AdminPermissionRow[]> {
  const map = new Map<string, AdminPermissionRow[]>();
  for (const p of perms) {
    const key = permissionResourceLabel(p.name) || p.name;
    const list = map.get(key) ?? [];
    list.push(p);
    map.set(key, list);
  }
  for (const [, list] of map) {
    list.sort((a, b) => a.name.localeCompare(b.name));
  }
  return new Map([...map.entries()].sort((a, b) => a[0].localeCompare(b[0])));
}

export default function UserManagement() {
  const { can } = useAuth();
  const [roles, setRoles] = useState<AdminRoleRow[]>([]);
  const [allPermissions, setAllPermissions] = useState<AdminPermissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formName, setFormName] = useState("");
  const [selectedPermNames, setSelectedPermNames] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<AdminRoleRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [editorHydrating, setEditorHydrating] = useState(false);
  const [viewRoleRow, setViewRoleRow] = useState<AdminRoleRow | null>(null);
  const [viewRoleLoading, setViewRoleLoading] = useState(false);

  const grouped = useMemo(() => groupPermissionsByResource(allPermissions), [allPermissions]);
  const viewGrouped = useMemo(() => {
    if (!viewRoleRow?.permissions?.length) return new Map<string, AdminPermissionRow[]>();
    return groupPermissionsByResource(viewRoleRow.permissions);
  }, [viewRoleRow]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [r, p] = await Promise.all([fetchAdminRoles(), fetchAdminPermissions()]);
      setRoles(r);
      setAllPermissions(p);
    } catch (e) {
      setError(getAuthErrorMessage(e, "Could not load roles or permissions."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditorMode("create");
    setEditingId(null);
    setFormName("");
    setSelectedPermNames(new Set());
    setFormError(null);
    setEditorHydrating(false);
    setEditorOpen(true);
  }

  async function openEdit(role: AdminRoleRow) {
    setEditorMode("edit");
    setEditingId(role.id);
    setFormName(role.name);
    setFormError(null);
    setSelectedPermNames(new Set((role.permissions ?? []).map((x) => x.name)));
    setEditorOpen(true);
    setEditorHydrating(true);
    try {
      const full = await fetchAdminRoleById(role.id);
      setSelectedPermNames(new Set((full.permissions ?? []).map((x) => x.name)));
    } catch {
      setSelectedPermNames(new Set((role.permissions ?? []).map((x) => x.name)));
    } finally {
      setEditorHydrating(false);
    }
  }

  async function openViewRole(role: AdminRoleRow) {
    setViewRoleRow(role);
    setViewRoleLoading(true);
    try {
      const full = await fetchAdminRoleById(role.id);
      setViewRoleRow(full);
    } catch {
      setViewRoleRow(role);
    } finally {
      setViewRoleLoading(false);
    }
  }

  function closeEditor() {
    setEditorOpen(false);
    setEditorHydrating(false);
  }

  function togglePerm(name: string) {
    setSelectedPermNames((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  async function submitForm() {
    const trimmed = formName.trim();
    if (!trimmed) {
      setFormError("Role name is required.");
      return;
    }
    setSaving(true);
    setFormError(null);
    const permList = [...selectedPermNames];
    try {
      if (editorMode === "create") {
        await createAdminRole({ name: trimmed, permissions: permList });
      } else if (editingId != null) {
        await updateAdminRole(editingId, { name: trimmed, permissions: permList });
      }
      closeEditor();
      await load();
    } catch (e) {
      setFormError(getAuthErrorMessage(e, "Save failed."));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteAdminRole(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (e) {
      setError(getAuthErrorMessage(e, "Could not delete role."));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-chat-accent">User management</p>
          <h1 className="mt-1 text-2xl font-semibold leading-tight text-ink-heading sm:text-3xl">
            Roles &amp; permissions
          </h1>

        </div>
        {can("create roles") ? (
          <Button type="button" onClick={openCreate} className="gap-2 shrink-0">
            <Plus className="size-4" />
            New role
          </Button>
        ) : null}
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-tint-red/40 bg-tint-red/10 px-3 py-2 text-sm text-brand-red">
          {error}
        </div>
      ) : null}

      <section className="rounded-2xl border border-border-gray bg-card p-3 shadow-sm sm:p-4 lg:p-6">
        <div className="mb-4 flex items-center gap-2 border-b border-border-gray pb-4">
          <span className="inline-flex size-10 items-center justify-center rounded-xl bg-surface-soft text-chat-accent">
            <Shield className="size-4" />
          </span>
          <div>
            <h2 className="text-lg font-semibold text-ink">Admin roles</h2>
            <p className="text-sm text-chat-meta">Assign Spatie permissions to each role. Backend enforces the same checks.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr className="border-b border-border-gray">
                <th className="px-2 py-2 text-left text-xs font-semibold text-body-secondary sm:px-4 sm:py-3 sm:text-sm">
                  Role
                </th>
                <th className="px-2 py-2 text-left text-xs font-semibold text-body-secondary sm:px-4 sm:py-3 sm:text-sm">
                  Permissions
                </th>
                <th className="px-2 py-2 text-right text-xs font-semibold text-body-secondary sm:px-4 sm:py-3 sm:text-sm">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-4 py-10 text-center text-sm text-chat-meta">
                    <Loader2 className="mx-auto size-6 animate-spin text-chat-accent" />
                  </td>
                </tr>
              ) : null}
              {!loading &&
                roles.map((role) => (
                  <tr key={role.id} className="border-b border-border-light">
                    <td className="px-2 py-3 text-sm font-medium text-ink sm:px-4 sm:py-4">{role.name}</td>
                    <td className="px-2 py-3 text-sm text-body-secondary sm:px-4 sm:py-4">
                      {(role.permissions?.length ?? 0).toLocaleString()} assigned
                    </td>
                    <td className="px-2 py-3 sm:px-4 sm:py-4">
                      <div className="flex justify-end gap-1">
                        {can("view roles") ? (
                          <button
                            type="button"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted"
                            onClick={() => void openViewRole(role)}
                            title="View role and permissions"
                          >
                            <Eye className="size-4 text-body-secondary" />
                          </button>
                        ) : null}
                        {can("edit roles") ? (
                          <button
                            type="button"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted"
                            onClick={() => void openEdit(role)}
                            title="Edit role"
                          >
                            <Pencil className="size-4 text-body-secondary" />
                          </button>
                        ) : null}
                        {can("delete roles") ? (
                          <button
                            type="button"
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-muted"
                            onClick={() => setDeleteTarget(role)}
                            title="Delete role"
                          >
                            <Trash2 className="size-4 text-brand-red" />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              {!loading && roles.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-sm text-chat-meta">
                    No roles returned. Ensure you have the <span className="font-medium text-ink">view roles</span>{" "}
                    permission and the API route prefix matches this app.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {editorOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
          onClick={() => (saving ? null : closeEditor())}
          role="presentation"
        >
          <div
            className="relative flex max-h-[min(90dvh,720px)] w-full max-w-lg flex-col rounded-2xl bg-card shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between border-b border-border-gray px-5 py-4">
              <h2 className="text-lg font-semibold text-ink">
                {editorMode === "create" ? "Create role" : "Edit role"}
              </h2>
              <button
                type="button"
                disabled={saving}
                className="inline-flex size-9 items-center justify-center rounded-lg text-body-secondary hover:bg-muted"
                onClick={closeEditor}
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto px-5 py-4">
              {editorMode === "edit" && editorHydrating ? (
                <p className="flex items-center gap-2 text-xs text-chat-meta">
                  <Loader2 className="size-3.5 animate-spin" />
                  Loading full permission set from API…
                </p>
              ) : null}
              <div className="space-y-2">
                <label className="text-sm font-medium text-ink" htmlFor="rbac-role-name">
                  Role name
                </label>
                <Input
                  id="rbac-role-name"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. support-lead"
                  disabled={saving || (editorMode === "edit" && editorHydrating)}
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-ink">Permissions</p>
                <div className="max-h-[min(50vh,360px)] space-y-4 overflow-y-auto rounded-xl border border-border-gray p-3">
                  {[...grouped.entries()].map(([resource, plist]) => (
                    <div key={resource}>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-chat-meta">{resource}</p>
                      <ul className="grid gap-2 sm:grid-cols-2">
                        {plist.map((p) => (
                          <li key={p.id}>
                            <label className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted">
                              <input
                                type="checkbox"
                                className="mt-0.5 size-4 rounded border-border-gray"
                                checked={selectedPermNames.has(p.name)}
                                onChange={() => togglePerm(p.name)}
                                disabled={saving || (editorMode === "edit" && editorHydrating)}
                              />
                              <span className="text-ink">{p.name}</span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {formError ? (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {formError}
                </div>
              ) : null}
            </div>

            <div className="flex justify-end gap-2 border-t border-border-gray px-5 py-4">
              <Button type="button" variant="outline" disabled={saving} onClick={closeEditor}>
                Cancel
              </Button>
              <Button
                type="button"
                disabled={saving || (editorMode === "edit" && editorHydrating)}
                onClick={() => void submitForm()}
                className="min-w-[100px]"
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {viewRoleRow ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
          onClick={() => setViewRoleRow(null)}
          role="presentation"
        >
          <div
            className="relative flex max-h-[min(90dvh,720px)] w-full max-w-lg flex-col rounded-2xl bg-card shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between border-b border-border-gray px-5 py-4">
              <h2 className="text-lg font-semibold text-ink">Role details</h2>
              <button
                type="button"
                className="inline-flex size-9 items-center justify-center rounded-lg text-body-secondary hover:bg-muted"
                onClick={() => setViewRoleRow(null)}
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="space-y-3 overflow-y-auto px-5 py-4">
              {viewRoleLoading ? (
                <p className="flex items-center gap-2 text-sm text-chat-meta">
                  <Loader2 className="size-4 animate-spin" />
                  Loading from API…
                </p>
              ) : null}
              <p className="text-sm text-body-secondary">
                <span className="font-medium text-ink">{viewRoleRow.name}</span>
              </p>
              <div className="max-h-[min(50vh,360px)] space-y-4 overflow-y-auto rounded-xl border border-border-gray p-3">
                {[...viewGrouped.entries()].length ? (
                  [...viewGrouped.entries()].map(([resource, plist]) => (
                    <div key={resource}>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-chat-meta">{resource}</p>
                      <ul className="grid gap-1.5 sm:grid-cols-2">
                        {plist.map((p) => (
                          <li key={p.id} className="text-sm text-ink">
                            {p.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-chat-meta">No permissions assigned to this role.</p>
                )}
              </div>
            </div>
            <div className="flex justify-end border-t border-border-gray px-5 py-4">
              <Button type="button" variant="outline" onClick={() => setViewRoleRow(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6"
          onClick={() => (deleting ? null : setDeleteTarget(null))}
          role="presentation"
        >
          <div
            className="relative w-full max-w-md rounded-2xl bg-card p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <h2 className="text-lg font-semibold text-ink">Delete role</h2>
            <p className="mt-2 text-sm text-body-secondary">
              Remove role <span className="font-semibold text-ink">{deleteTarget.name}</span>? Admins using this role
              may lose access until reassigned.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="outline" disabled={deleting} onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={deleting}
                onClick={() => void confirmDelete()}
                className="min-w-[100px]"
              >
                {deleting ? <Loader2 className="size-4 animate-spin" /> : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

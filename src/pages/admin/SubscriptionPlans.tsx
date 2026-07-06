import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Loader2, Plus, Star, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";

import {
  adminCreateSubscriptionPlan,
  adminDeleteSubscriptionPlan,
  adminListSubscriptionPlans,
  adminReorderSubscriptionPlans,
  adminSetRecommendedSubscriptionPlan,
  adminToggleSubscriptionPlanActive,
  adminUpdateSubscriptionPlan,
  type AdminSubscriptionPlan,
  type BillingPeriod,
  type SubscriptionPlanPayload,
} from "@/features/admin/adminSubscriptionPlansApi";
import { alert, showError } from "@/lib/sweetAlert";

const BILLING_PERIODS: { value: BillingPeriod; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
  { value: "lifetime", label: "Lifetime" },
];

type FormState = {
  package_key: string;
  title: string;
  billing_period: BillingPeriod;
  amount: string;
  original_price: string;
  promotional_text: string;
  promotion_starts_at: string;
  promotion_ends_at: string;
  description: string;
  perks: string;
  is_active: boolean;
  is_recommended: boolean;
  trial_eligible: boolean;
  trial_duration_days: string;
};

const EMPTY_FORM: FormState = {
  package_key: "",
  title: "",
  billing_period: "yearly",
  amount: "",
  original_price: "",
  promotional_text: "",
  promotion_starts_at: "",
  promotion_ends_at: "",
  description: "",
  perks: "",
  is_active: true,
  is_recommended: false,
  trial_eligible: false,
  trial_duration_days: "",
};

function planToForm(plan: AdminSubscriptionPlan): FormState {
  return {
    package_key: plan.package_key,
    title: plan.title,
    billing_period: plan.billing_period ?? "yearly",
    amount: String(plan.amount),
    original_price: plan.original_price != null ? String(plan.original_price) : "",
    promotional_text: plan.promotional_text ?? "",
    promotion_starts_at: plan.promotion_starts_at ? plan.promotion_starts_at.slice(0, 10) : "",
    promotion_ends_at: plan.promotion_ends_at ? plan.promotion_ends_at.slice(0, 10) : "",
    description: plan.description,
    perks: plan.perks.join(", "),
    is_active: plan.is_active,
    is_recommended: plan.is_recommended,
    trial_eligible: plan.trial_eligible,
    trial_duration_days: plan.trial_duration_days != null ? String(plan.trial_duration_days) : "",
  };
}

function formToPayload(form: FormState): SubscriptionPlanPayload {
  return {
    package_key: form.package_key.trim(),
    title: form.title.trim(),
    billing_period: form.billing_period,
    amount: Number(form.amount) || 0,
    original_price: form.original_price.trim() ? Number(form.original_price) : null,
    promotional_text: form.promotional_text.trim() || null,
    promotion_starts_at: form.promotion_starts_at || null,
    promotion_ends_at: form.promotion_ends_at || null,
    description: form.description.trim() || null,
    perks: form.perks.split(",").map((s) => s.trim()).filter(Boolean),
    is_active: form.is_active,
    is_recommended: form.is_recommended,
    trial_eligible: form.trial_eligible,
    trial_duration_days: form.trial_eligible && form.trial_duration_days.trim()
      ? Number(form.trial_duration_days)
      : null,
  };
}

function formatAmount(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString()}`;
}

function messageFromUnknown(e: unknown): string {
  if (e instanceof Error && e.message) return e.message;
  return "Request failed.";
}

export default function SubscriptionPlans() {
  const qc = useQueryClient();

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<AdminSubscriptionPlan | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);

  const listQuery = useQuery({
    queryKey: ["admin", "subscription-plans"],
    queryFn: adminListSubscriptionPlans,
  });

  const plans = listQuery.data ?? [];

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "subscription-plans"] });

  const createMut = useMutation({
    mutationFn: () => adminCreateSubscriptionPlan(formToPayload(form)),
    onSuccess: () => {
      void invalidate();
      closeModal();
      alert.crud.created("Subscription plan");
    },
    onError: (e: unknown) => setFormError(messageFromUnknown(e)),
  });

  const updateMut = useMutation({
    mutationFn: () => {
      if (!editingPlan) throw new Error("No plan selected");
      return adminUpdateSubscriptionPlan({ ...formToPayload(form), id: editingPlan.id });
    },
    onSuccess: () => {
      void invalidate();
      closeModal();
      alert.crud.updated("Subscription plan");
    },
    onError: (e: unknown) => setFormError(messageFromUnknown(e)),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => adminDeleteSubscriptionPlan(id),
    onSuccess: () => {
      void invalidate();
      alert.crud.deleted("Subscription plan");
    },
    onError: (e: unknown) => showError(messageFromUnknown(e)),
  });

  const toggleActiveMut = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      adminToggleSubscriptionPlanActive(id, active),
    onSuccess: () => void invalidate(),
    onError: (e: unknown) => showError(messageFromUnknown(e)),
  });

  const setRecommendedMut = useMutation({
    mutationFn: (id: number) => adminSetRecommendedSubscriptionPlan(id),
    onSuccess: () => {
      void invalidate();
      alert.crud.saved("Recommended plan");
    },
    onError: (e: unknown) => showError(messageFromUnknown(e)),
  });

  const reorderMut = useMutation({
    mutationFn: (orderedIds: number[]) => adminReorderSubscriptionPlans(orderedIds),
    onSuccess: () => void invalidate(),
    onError: (e: unknown) => showError(messageFromUnknown(e)),
  });

  useEffect(() => {
    if (!showEditModal) return;

    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [showEditModal]);

  const closeModal = () => {
    setShowEditModal(false);
    setEditingPlan(null);
    setIsAdding(false);
    setForm(EMPTY_FORM);
    setFormError(null);
  };

  const openAdd = () => {
    setIsAdding(true);
    setEditingPlan(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowEditModal(true);
  };

  const openEdit = (plan: AdminSubscriptionPlan) => {
    setIsAdding(false);
    setEditingPlan(plan);
    setForm(planToForm(plan));
    setFormError(null);
    setShowEditModal(true);
  };

  const handleDelete = async (plan: AdminSubscriptionPlan) => {
    const confirmed = await alert.confirmDelete(plan.title);
    if (!confirmed) return;
    deleteMut.mutate(plan.id);
  };

  const handleSave = () => {
    setFormError(null);
    if (!form.package_key.trim()) return setFormError("Plan key is required.");
    if (!form.title.trim()) return setFormError("Title is required.");
    if (!form.amount.trim() || Number(form.amount) <= 0) return setFormError("Amount must be greater than 0.");
    if (form.trial_eligible && !form.trial_duration_days.trim()) {
      return setFormError("Trial duration (days) is required when trial is enabled.");
    }
    if (isAdding) createMut.mutate();
    else updateMut.mutate();
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= plans.length) return;
    const reordered = [...plans];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    reorderMut.mutate(reordered.map((p) => p.id));
  };

  const saving = createMut.isPending || updateMut.isPending;

  const autoDiscountLabel = (() => {
    const amount = Number(form.amount);
    const originalPrice = Number(form.original_price);
    if (!originalPrice || !amount || originalPrice <= amount) return null;
    const percentOff = Math.round(((originalPrice - amount) / originalPrice) * 100);
    return percentOff > 0 ? `Save ${percentOff}%` : null;
  })();

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 font-sans">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Subscription Plans</h1>
          <p className="text-sm text-gray-500">
            Manage Premium plans and free trials shown across the app.
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-2.5 sm:px-5 text-sm font-medium text-white shadow-sm hover:bg-blue-600 active:scale-95 transition-all"
        >
          <Plus className="size-4" />
          Add Plan
        </button>
      </div>

      {listQuery.isError ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Failed to load subscription plans. Are you signed in as an admin?
        </div>
      ) : null}

      {listQuery.isFetching ? (
        <div className="mb-3 flex items-center gap-2 text-sm text-gray-600">
          <Loader2 className="size-4 animate-spin text-blue-500" aria-hidden />
          <span>Updating…</span>
        </div>
      ) : null}

      {/* ── Desktop table ── */}
      <div className="hidden md:block rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wide">Plan</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wide">Billing</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wide">Price</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wide">Trial</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-900 uppercase tracking-wide">Active</th>
                <th className="px-4 py-4 text-right text-xs font-semibold text-gray-900 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {plans.map((plan, index) => (
                <tr key={plan.id} className="group hover:bg-gray-50/70 transition-colors">
                  <td className="px-4 py-4 align-top">
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col">
                        <button
                          type="button"
                          onClick={() => move(index, -1)}
                          disabled={index === 0 || reorderMut.isPending}
                          className="text-gray-400 hover:text-gray-700 disabled:opacity-30"
                          aria-label="Move up"
                        >
                          <ArrowUp className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => move(index, 1)}
                          disabled={index === plans.length - 1 || reorderMut.isPending}
                          className="text-gray-400 hover:text-gray-700 disabled:opacity-30"
                          aria-label="Move down"
                        >
                          <ArrowDown className="size-3.5" />
                        </button>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{plan.title}</p>
                        <p className="text-xs text-gray-400">{plan.package_key}</p>
                      </div>
                      {plan.is_recommended ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                          <Star className="size-3" /> Recommended
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top text-gray-600">{plan.billing_period_label ?? plan.billing_period ?? "—"}</td>
                  <td className="px-4 py-4 align-top">
                    <p className="font-medium text-gray-800">{formatAmount(plan.amount, plan.currency)}</p>
                    {plan.original_price ? (
                      <p className="text-xs text-gray-400 line-through">{formatAmount(plan.original_price, plan.currency)}</p>
                    ) : null}
                    {plan.discount_label ? (
                      <p className="text-xs font-medium text-emerald-600">{plan.discount_label}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-4 align-top text-gray-600">
                    {plan.trial_eligible ? `${plan.trial_duration_days ?? 0} days` : "—"}
                  </td>
                  <td className="px-4 py-4 align-top">
                    <button
                      type="button"
                      onClick={() => toggleActiveMut.mutate({ id: plan.id, active: !plan.is_active })}
                      disabled={toggleActiveMut.isPending}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                        plan.is_active
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {plan.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="flex items-center justify-end gap-2">
                      {!plan.is_recommended ? (
                        <button
                          type="button"
                          onClick={() => setRecommendedMut.mutate(plan.id)}
                          disabled={setRecommendedMut.isPending}
                          className="rounded-md px-2 py-1 text-xs font-medium text-amber-600 hover:bg-amber-50"
                        >
                          Make recommended
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => openEdit(plan)}
                        className="text-gray-900 hover:text-blue-600 transition-colors p-1 rounded-md hover:bg-blue-50"
                        aria-label={`Edit ${plan.title}`}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(plan)}
                        disabled={deleteMut.isPending}
                        className="text-red-400 hover:text-red-600 transition-colors p-1 rounded-md hover:bg-red-50 disabled:opacity-50"
                        aria-label={`Delete ${plan.title}`}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {plans.length === 0 && !listQuery.isFetching ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-500">
                    No subscription plans yet. Click "Add Plan" to create one.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Mobile cards ── */}
      <div className="md:hidden space-y-3">
        {plans.map((plan, index) => (
          <div key={plan.id} className="rounded-2xl border border-gray-200 bg-white shadow-sm p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <p className="font-semibold text-gray-800 text-sm">{plan.title}</p>
                <p className="text-xs text-gray-400">{plan.package_key}</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <button
                  type="button"
                  onClick={() => toggleActiveMut.mutate({ id: plan.id, active: !plan.is_active })}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    plan.is_active ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {plan.is_active ? "Active" : "Inactive"}
                </button>
                {plan.is_recommended ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                    <Star className="size-3" /> Recommended
                  </span>
                ) : null}
              </div>
            </div>
            <p className="text-sm font-medium text-gray-800">
              {formatAmount(plan.amount, plan.currency)}
              {plan.original_price ? (
                <span className="ml-2 text-xs text-gray-400 line-through">
                  {formatAmount(plan.original_price, plan.currency)}
                </span>
              ) : null}
            </p>
            <p className="text-xs text-gray-500">{plan.billing_period_label ?? plan.billing_period ?? "—"}</p>
            {plan.trial_eligible ? (
              <p className="text-xs text-gray-500">Trial: {plan.trial_duration_days ?? 0} days</p>
            ) : null}
            <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="rounded-md border border-gray-200 p-1.5 text-gray-500 disabled:opacity-30"
                >
                  <ArrowUp className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === plans.length - 1}
                  className="rounded-md border border-gray-200 p-1.5 text-gray-500 disabled:opacity-30"
                >
                  <ArrowDown className="size-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => openEdit(plan)} className="text-sm font-medium text-blue-600">
                  Edit
                </button>
                <button type="button" onClick={() => handleDelete(plan)} className="text-red-500">
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Edit Modal ── */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overscroll-contain bg-black/50 p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl max-h-[92dvh]">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 pb-3 pt-4 sm:px-5 sm:pb-4 sm:pt-5">
              <h3 className="text-base font-semibold text-gray-900">{isAdding ? "Add Plan" : "Edit Plan"}</h3>
              <button
                type="button"
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors"
                aria-label="Close modal"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="max-h-[calc(92dvh-132px)] overflow-y-auto px-4 py-4 space-y-4 sm:px-5">
              {formError ? (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{formError}</p>
              ) : null}

              <div className="grid grid-cols-2 gap-3">
                <Field label="Plan key">
                  <input
                    type="text"
                    value={form.package_key}
                    onChange={(e) => setForm({ ...form, package_key: e.target.value })}
                    placeholder="premium_yearly"
                    className={inputClass}
                  />
                </Field>
                <Field label="Title">
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Premium Yearly"
                    className={inputClass}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Billing period">
                  <select
                    value={form.billing_period}
                    onChange={(e) => setForm({ ...form, billing_period: e.target.value as BillingPeriod })}
                    className={inputClass}
                  >
                    {BILLING_PERIODS.map((bp) => (
                      <option key={bp.value} value={bp.value}>
                        {bp.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Amount">
                  <input
                    type="number"
                    min={1}
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field label="Original price (optional)">
                <input
                  type="number"
                  min={0}
                  value={form.original_price}
                  onChange={(e) => setForm({ ...form, original_price: e.target.value })}
                  className={inputClass}
                />
                {autoDiscountLabel ? (
                  <p className="mt-1 text-xs font-medium text-emerald-600">
                    Discount badge shown automatically: "{autoDiscountLabel}"
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-gray-400">
                    Set a price higher than Amount to show a struck-through price and an auto-calculated discount badge.
                  </p>
                )}
              </Field>

              <Field label="Promotional text (optional)">
                <input
                  type="text"
                  value={form.promotional_text}
                  onChange={(e) => setForm({ ...form, promotional_text: e.target.value })}
                  placeholder="Launch offer — ends soon!"
                  className={inputClass}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Promotion starts (optional)">
                  <input
                    type="date"
                    value={form.promotion_starts_at}
                    onChange={(e) => setForm({ ...form, promotion_starts_at: e.target.value })}
                    className={inputClass}
                  />
                </Field>
                <Field label="Promotion ends (optional)">
                  <input
                    type="date"
                    value={form.promotion_ends_at}
                    onChange={(e) => setForm({ ...form, promotion_ends_at: e.target.value })}
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field label="Description">
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className={inputClass}
                />
              </Field>

              <Field label="Features / perks (comma separated)">
                <input
                  type="text"
                  value={form.perks}
                  onChange={(e) => setForm({ ...form, perks: e.target.value })}
                  placeholder="Up to 25 photos, Priority boost access"
                  className={inputClass}
                />
              </Field>

              <div className="flex flex-wrap items-center gap-4 pt-1">
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  />
                  Active
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.is_recommended}
                    onChange={(e) => setForm({ ...form, is_recommended: e.target.checked })}
                  />
                  Recommended
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.trial_eligible}
                    onChange={(e) => setForm({ ...form, trial_eligible: e.target.checked })}
                  />
                  Trial eligible
                </label>
              </div>

              {form.trial_eligible ? (
                <Field label="Trial duration (days)">
                  <input
                    type="number"
                    min={1}
                    value={form.trial_duration_days}
                    onChange={(e) => setForm({ ...form, trial_duration_days: e.target.value })}
                    className={inputClass}
                  />
                </Field>
              ) : null}
            </div>

            <div className="sticky bottom-0 flex gap-3 border-t border-gray-100 bg-white px-4 pb-4 pt-3 sm:justify-end sm:px-5 sm:pb-5 sm:pt-2">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 sm:flex-none sm:py-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-600 sm:flex-none sm:py-2 disabled:opacity-60"
              >
                {saving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                {isAdding ? "Add" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputClass =
  "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

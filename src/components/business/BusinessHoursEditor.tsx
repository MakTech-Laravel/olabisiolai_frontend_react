import { Clock } from "lucide-react";

import type { BusinessHourEntry } from "@/features/business/businessHours";
import { cn } from "@/lib/utils";

function ClosedToggle({
  checked,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-muted-foreground">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 rounded border-border-light text-sky-600 focus-visible:ring-2 focus-visible:ring-sky-500/25"
        aria-label={`${label} closed`}
      />
      Closed
    </label>
  );
}

type Props = {
  hours: BusinessHourEntry[];
  disabled?: boolean;
  errors?: Record<string, string>;
  onChange: (hours: BusinessHourEntry[]) => void;
  className?: string;
};

function fieldError(errors: Record<string, string> | undefined, day: string, field: "opens_at" | "closes_at"): string | null {
  if (!errors) return null;

  for (const [key, message] of Object.entries(errors)) {
    if (!key.startsWith("business_hours.")) continue;
    if (!key.includes(day) && !message.toLowerCase().includes(day)) continue;
    if (key.endsWith(field) || message.toLowerCase().includes(field.replace("_", " "))) {
      return message;
    }
  }

  const index = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].indexOf(day);
  if (index < 0) return null;

  return errors[`business_hours.${index}.${field}`] ?? null;
}

export function BusinessHoursEditor({ hours, disabled, errors, onChange, className }: Props) {
  const updateDay = (day: BusinessHourEntry["day"], patch: Partial<BusinessHourEntry>) => {
    onChange(
      hours.map((entry) =>
        entry.day === day
          ? {
            ...entry,
            ...patch,
            opensAt: patch.isClosed === true ? null : patch.opensAt ?? entry.opensAt,
            closesAt: patch.isClosed === true ? null : patch.closesAt ?? entry.closesAt,
          }
          : entry,
      ),
    );
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-stat-muted">
        <Clock className="size-4 shrink-0" aria-hidden />
        Business hours
      </div>
      <p className="text-xs text-muted-foreground">
        Set when customers can reach you. Closed days appear in red on your public profile.
      </p>

      <ul className="divide-y divide-border-light rounded-xl border border-border-light bg-card">
        {hours.map((entry) => {
          const openError = fieldError(errors, entry.day, "opens_at");
          const closeError = fieldError(errors, entry.day, "closes_at");

          return (
            <li
              key={entry.day}
              className={cn(
                "flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
                entry.isClosed && "bg-red-50/40",
              )}
            >
              <div className="flex min-w-[120px] items-center justify-between gap-3 sm:justify-start">
                <span
                  className={cn(
                    "text-sm font-medium",
                    entry.isClosed ? "text-brand-red" : "text-body-secondary",
                  )}
                >
                  {entry.dayLabel}
                </span>
                <div className="sm:hidden">
                  <ClosedToggle
                    checked={entry.isClosed}
                    disabled={disabled}
                    label={entry.dayLabel}
                    onChange={(checked) => updateDay(entry.day, { isClosed: checked })}
                  />
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                {entry.isClosed ? (
                  <span className="text-sm font-semibold text-brand-red sm:min-w-[200px] sm:text-right">
                    Closed
                  </span>
                ) : (
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <input
                      type="time"
                      value={entry.opensAt ?? ""}
                      disabled={disabled}
                      onChange={(e) => updateDay(entry.day, { opensAt: e.target.value || null })}
                      className="h-10 min-w-[120px] rounded-lg border border-border-light bg-background px-3 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-sky-500/25"
                      aria-label={`${entry.dayLabel} opening time`}
                    />
                    <span className="text-xs font-medium text-muted-foreground">to</span>
                    <input
                      type="time"
                      value={entry.closesAt ?? ""}
                      disabled={disabled}
                      onChange={(e) => updateDay(entry.day, { closesAt: e.target.value || null })}
                      className="h-10 min-w-[120px] rounded-lg border border-border-light bg-background px-3 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-sky-500/25"
                      aria-label={`${entry.dayLabel} closing time`}
                    />
                  </div>
                )}

                <div className="hidden sm:block">
                  <ClosedToggle
                    checked={entry.isClosed}
                    disabled={disabled}
                    label={entry.dayLabel}
                    onChange={(checked) => updateDay(entry.day, { isClosed: checked })}
                  />
                </div>
              </div>

              {openError || closeError ? (
                <p className="text-xs text-destructive sm:col-span-2 sm:w-full sm:text-right">
                  {openError ?? closeError}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

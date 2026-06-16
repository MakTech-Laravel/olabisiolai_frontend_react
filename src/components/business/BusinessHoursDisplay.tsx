import {
  formatHoursRange,
  isBusinessOpenNow,
  isTodayHoursLabel,
  parseBusinessHours,
  parseBusinessHoursDisplay,
  type BusinessHourEntry,
  type BusinessHoursDisplayRow,
} from "@/features/business/businessHours";
import { cn } from "@/lib/utils";

type Props = {
  hours?: BusinessHourEntry[] | unknown;
  displayRows?: BusinessHoursDisplayRow[] | unknown;
  className?: string;
  title?: string;
};

function rowHasSchedule(row: BusinessHoursDisplayRow): boolean {
  if (row.isClosed) return true;

  return Boolean(
    row.opensAtFormatted ||
    row.closesAtFormatted ||
    (row.opensAt && row.closesAt),
  );
}

export function BusinessHoursDisplay({
  hours,
  displayRows,
  className,
  title = "Business Hours",
}: Props) {
  const rows = parseBusinessHoursDisplay(displayRows);
  const fallbackHours = parseBusinessHours(hours);
  const useDisplayRows = rows.length > 0 && rows.some(rowHasSchedule);

  const items: Array<{ label: string; isClosed: boolean; text: string }> = useDisplayRows
    ? rows.map((row) => ({
      label: row.label,
      isClosed: row.isClosed,
      text: formatHoursRange(row),
    }))
    : fallbackHours.map((entry) => ({
      label: entry.dayLabel,
      isClosed: entry.isClosed,
      text: formatHoursRange(entry),
    }));

  if (items.length === 0) {
    return null;
  }

  const openNow = isBusinessOpenNow(hours, displayRows);

  return (
    <div className={cn("rounded-2xl bg-surface-soft p-6", className)}>
      {title ? (
        <h3 className="text-sm font-semibold uppercase tracking-widest text-stat-muted">{title}</h3>
      ) : null}
      <ul className={cn("space-y-2 text-sm", title ? "mt-4" : undefined)}>
        {items.map((item) => {
          const isToday = isTodayHoursLabel(item.label);
          return (
            <li
              key={item.label}
              className={cn(
                "flex justify-between gap-4",
                item.isClosed && "font-medium text-brand-red",
                isToday && !item.isClosed && "font-medium",
              )}
            >
              <span className={cn("flex items-center gap-2", item.isClosed ? undefined : "text-body-secondary")}>
                {item.label}
                {isToday && openNow ? (
                  <span className="rounded-full bg-[#E7F6EF] px-2 py-0.5 text-[11px] font-bold text-[#13a36b]">
                    Open now
                  </span>
                ) : null}
              </span>
              <span className={cn(!item.isClosed && "font-semibold text-ink")}>{item.text}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

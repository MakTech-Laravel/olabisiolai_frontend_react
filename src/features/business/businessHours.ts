export type BusinessDay =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type BusinessHourEntry = {
  day: BusinessDay;
  dayLabel: string;
  dayShort: string;
  isClosed: boolean;
  opensAt: string | null;
  closesAt: string | null;
  opensAtFormatted: string | null;
  closesAtFormatted: string | null;
};

export type BusinessHoursDisplayRow = {
  label: string;
  isClosed: boolean;
  opensAt: string | null;
  closesAt: string | null;
  opensAtFormatted: string | null;
  closesAtFormatted: string | null;
};

/** Sentinel times representing an "open 24 hours" day (no DB schema change needed). */
export const TWENTY_FOUR_HOURS_OPENS_AT = "00:00";
export const TWENTY_FOUR_HOURS_CLOSES_AT = "23:59";

export function isTwentyFourHours(entry: {
  isClosed: boolean;
  opensAt: string | null;
  closesAt: string | null;
}): boolean {
  return (
    !entry.isClosed &&
    entry.opensAt === TWENTY_FOUR_HOURS_OPENS_AT &&
    entry.closesAt === TWENTY_FOUR_HOURS_CLOSES_AT
  );
}

export const BUSINESS_DAYS: Array<{ day: BusinessDay; label: string; short: string }> = [
  { day: "monday", label: "Monday", short: "Mon" },
  { day: "tuesday", label: "Tuesday", short: "Tue" },
  { day: "wednesday", label: "Wednesday", short: "Wed" },
  { day: "thursday", label: "Thursday", short: "Thu" },
  { day: "friday", label: "Friday", short: "Fri" },
  { day: "saturday", label: "Saturday", short: "Sat" },
  { day: "sunday", label: "Sunday", short: "Sun" },
];

export function defaultBusinessHours(): BusinessHourEntry[] {
  return [
    { day: "monday", dayLabel: "Monday", dayShort: "Mon", isClosed: false, opensAt: "08:00", closesAt: "19:00", opensAtFormatted: null, closesAtFormatted: null },
    { day: "tuesday", dayLabel: "Tuesday", dayShort: "Tue", isClosed: false, opensAt: "08:00", closesAt: "19:00", opensAtFormatted: null, closesAtFormatted: null },
    { day: "wednesday", dayLabel: "Wednesday", dayShort: "Wed", isClosed: false, opensAt: "08:00", closesAt: "19:00", opensAtFormatted: null, closesAtFormatted: null },
    { day: "thursday", dayLabel: "Thursday", dayShort: "Thu", isClosed: false, opensAt: "08:00", closesAt: "19:00", opensAtFormatted: null, closesAtFormatted: null },
    { day: "friday", dayLabel: "Friday", dayShort: "Fri", isClosed: false, opensAt: "08:00", closesAt: "19:00", opensAtFormatted: null, closesAtFormatted: null },
    { day: "saturday", dayLabel: "Saturday", dayShort: "Sat", isClosed: false, opensAt: "09:00", closesAt: "16:00", opensAtFormatted: null, closesAtFormatted: null },
    { day: "sunday", dayLabel: "Sunday", dayShort: "Sun", isClosed: true, opensAt: null, closesAt: null, opensAtFormatted: null, closesAtFormatted: null },
  ];
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asString(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
}

function asBool(value: unknown): boolean {
  if (value === false || value === 0 || value === "0" || value === "false") {
    return false;
  }

  return value === true || value === 1 || value === "1" || value === "true";
}

function pickField(row: Record<string, unknown>, snake: string, camel: string): unknown {
  if (snake in row) return row[snake];
  if (camel in row) return row[camel];
  return undefined;
}

function normalizeTimeForInput(value: unknown): string | null {
  const raw = asString(value).trim();
  if (!raw) return null;
  const match = raw.match(/^(\d{1,2}):(\d{2})/);
  if (match) {
    return `${match[1].padStart(2, "0")}:${match[2]}`;
  }
  return raw;
}

export function parseBusinessHourEntry(raw: unknown): BusinessHourEntry | null {
  const row = asRecord(raw);
  if (!row) return null;
  const day = asString(row.day).toLowerCase() as BusinessDay;
  if (!BUSINESS_DAYS.some((d) => d.day === day)) return null;

  const meta = BUSINESS_DAYS.find((d) => d.day === day)!;
  const isClosed = asBool(pickField(row, "is_closed", "isClosed"));

  return {
    day,
    dayLabel: asString(pickField(row, "day_label", "dayLabel")) || meta.label,
    dayShort: asString(pickField(row, "day_short", "dayShort")) || meta.short,
    isClosed,
    opensAt: isClosed
      ? null
      : normalizeTimeForInput(
        pickField(row, "opens_at", "opensAt") ?? pickField(row, "opening_time", "openingTime"),
      ),
    closesAt: isClosed
      ? null
      : normalizeTimeForInput(
        pickField(row, "closes_at", "closesAt") ?? pickField(row, "closing_time", "closingTime"),
      ),
    opensAtFormatted: asString(pickField(row, "opens_at_formatted", "opensAtFormatted")) || null,
    closesAtFormatted: asString(pickField(row, "closes_at_formatted", "closesAtFormatted")) || null,
  };
}

export function parseBusinessHours(raw: unknown): BusinessHourEntry[] {
  if (!Array.isArray(raw)) return defaultBusinessHours();

  const parsed = raw
    .map((entry) => parseBusinessHourEntry(entry))
    .filter((entry): entry is BusinessHourEntry => entry !== null);

  if (parsed.length === 0) return defaultBusinessHours();

  const byDay = new Map(parsed.map((entry) => [entry.day, entry]));

  return BUSINESS_DAYS.map((meta) => {
    const existing = byDay.get(meta.day);
    return (
      existing ?? {
        day: meta.day,
        dayLabel: meta.label,
        dayShort: meta.short,
        isClosed: true,
        opensAt: null,
        closesAt: null,
        opensAtFormatted: null,
        closesAtFormatted: null,
      }
    );
  });
}

export function parseBusinessHoursDisplay(raw: unknown): BusinessHoursDisplayRow[] {
  if (!Array.isArray(raw)) return [];

  return raw
    .map((entry) => {
      const row = asRecord(entry);
      if (!row) return null;
      const label = asString(row.label).trim();
      if (!label) return null;

      const isClosed = asBool(pickField(row, "is_closed", "isClosed"));

      return {
        label,
        isClosed,
        opensAt: normalizeTimeForInput(pickField(row, "opens_at", "opensAt")),
        closesAt: normalizeTimeForInput(pickField(row, "closes_at", "closesAt")),
        opensAtFormatted: asString(pickField(row, "opens_at_formatted", "opensAtFormatted")) || null,
        closesAtFormatted: asString(pickField(row, "closes_at_formatted", "closesAtFormatted")) || null,
      };
    })
    .filter((row): row is BusinessHoursDisplayRow => row !== null);
}

export function formatHoursRange(entry: BusinessHoursDisplayRow | BusinessHourEntry): string {
  if (entry.isClosed) return "Closed";

  if (isTwentyFourHours(entry)) return "Open 24 hours";

  const open = ("opensAtFormatted" in entry ? entry.opensAtFormatted : null) ?? formatTime12h(entry.opensAt);
  const close = ("closesAtFormatted" in entry ? entry.closesAtFormatted : null) ?? formatTime12h(entry.closesAt);

  if (!open || !close) return "Hours not set";

  return `${open} - ${close}`;
}

function formatTime12h(value: string | null): string | null {
  if (!value) return null;
  const [hourPart, minutePart] = value.split(":");
  const hour = Number(hourPart);
  const minute = Number(minutePart);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;

  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;

  return `${String(hour12).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${period}`;
}

export function validateBusinessHours(hours: BusinessHourEntry[]): Record<string, string> {
  const errors: Record<string, string> = {};

  hours.forEach((entry, index) => {
    if (entry.isClosed) return;

    if (!entry.opensAt || !entry.closesAt) {
      errors[`business_hours.${index}.opens_at`] = `Set opening and closing times for ${entry.dayLabel}, or mark as closed.`;
      return;
    }

    if (entry.closesAt <= entry.opensAt) {
      errors[`business_hours.${index}.closes_at`] = `Closing time must be after opening time for ${entry.dayLabel}.`;
    }
  });

  return errors;
}

export function serializeBusinessHoursForApi(
  hours: BusinessHourEntry[],
): Array<{ day: string; is_closed: boolean; is_24_hours: boolean; opens_at?: string; closes_at?: string }> {
  return hours.map((entry) => {
    const row: { day: string; is_closed: boolean; is_24_hours: boolean; opens_at?: string; closes_at?: string } = {
      day: entry.day,
      is_closed: entry.isClosed,
      is_24_hours: isTwentyFourHours(entry),
    };
    if (!entry.isClosed && entry.opensAt) {
      row.opens_at = entry.opensAt;
    }
    if (!entry.isClosed && entry.closesAt) {
      row.closes_at = entry.closesAt;
    }
    return row;
  });
}

export function appendBusinessHoursToFormData(formData: FormData, hours: BusinessHourEntry[]): void {
  hours.forEach((entry, index) => {
    formData.append(`business_hours[${index}][day]`, entry.day);
    formData.append(`business_hours[${index}][is_closed]`, entry.isClosed ? "1" : "0");
    formData.append(`business_hours[${index}][is_24_hours]`, isTwentyFourHours(entry) ? "1" : "0");
    if (!entry.isClosed && entry.opensAt) {
      formData.append(`business_hours[${index}][opens_at]`, entry.opensAt);
    }
    if (!entry.isClosed && entry.closesAt) {
      formData.append(`business_hours[${index}][closes_at]`, entry.closesAt);
    }
  });
}

export function cloneBusinessHours(hours: BusinessHourEntry[]): BusinessHourEntry[] {
  return hours.map((entry) => ({ ...entry }));
}

const JS_DAY_TO_BUSINESS_DAY: BusinessDay[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

export function currentBusinessDay(date = new Date()): BusinessDay {
  return JS_DAY_TO_BUSINESS_DAY[date.getDay()];
}

function timeToMinutes(value: string | null): number | null {
  if (!value) return null;
  const [hourPart, minutePart] = value.split(":");
  const hour = Number(hourPart);
  const minute = Number(minutePart);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return hour * 60 + minute;
}

function isOpenAtMinutes(
  opensAt: string | null,
  closesAt: string | null,
  nowMinutes: number,
): boolean {
  const open = timeToMinutes(opensAt);
  const close = timeToMinutes(closesAt);
  if (open === null || close === null) return false;
  if (opensAt === TWENTY_FOUR_HOURS_OPENS_AT && closesAt === TWENTY_FOUR_HOURS_CLOSES_AT) {
    return true;
  }
  if (close <= open) {
    return nowMinutes >= open || nowMinutes < close;
  }
  return nowMinutes >= open && nowMinutes < close;
}

export function isBusinessOpenNow(
  hours?: BusinessHourEntry[] | unknown,
  displayRows?: BusinessHoursDisplayRow[] | unknown,
  date = new Date(),
): boolean {
  const parsedRows = parseBusinessHoursDisplay(displayRows);
  const useDisplayRows = parsedRows.length > 0 && parsedRows.some(rowHasSchedule);

  if (useDisplayRows) {
    const todayMeta = BUSINESS_DAYS.find((d) => d.day === currentBusinessDay(date));
    const todayRow = parsedRows.find(
      (row) => row.label.toLowerCase() === todayMeta?.label.toLowerCase(),
    );
    if (!todayRow || todayRow.isClosed) return false;
    const nowMinutes = date.getHours() * 60 + date.getMinutes();
    return isOpenAtMinutes(todayRow.opensAt, todayRow.closesAt, nowMinutes);
  }

  const parsedHours = parseBusinessHours(hours);
  const today = currentBusinessDay(date);
  const todayEntry = parsedHours.find((entry) => entry.day === today);
  if (!todayEntry || todayEntry.isClosed) return false;
  const nowMinutes = date.getHours() * 60 + date.getMinutes();
  return isOpenAtMinutes(todayEntry.opensAt, todayEntry.closesAt, nowMinutes);
}

function rowHasSchedule(row: BusinessHoursDisplayRow): boolean {
  if (row.isClosed) return true;
  return Boolean(
    row.opensAtFormatted ||
      row.closesAtFormatted ||
      (row.opensAt && row.closesAt),
  );
}

export function isTodayHoursLabel(label: string, date = new Date()): boolean {
  const todayMeta = BUSINESS_DAYS.find((d) => d.day === currentBusinessDay(date));
  if (!todayMeta) return false;
  const normalized = label.trim().toLowerCase();
  return (
    normalized === todayMeta.label.toLowerCase() ||
    normalized === todayMeta.short.toLowerCase()
  );
}

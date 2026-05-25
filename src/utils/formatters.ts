import { dayjs } from '@/lib/dayjs'

export { formatNaira, formatMoney, formatNairaRange, CURRENCY_CODE, CURRENCY_SYMBOL } from '@/lib/currency'

/** Laravel humanDateTime default: `d M Y, h:i A` → "23 May 2026, 4:45 AM" */
export function formatHumanDateTime(iso: string): string {
  const d = dayjs(iso)
  if (!d.isValid()) return iso
  return d.format('D MMM YYYY, h:mm A')
}

export function formatMessageTime(iso: string): string {
  const d = dayjs(iso)
  if (!d.isValid()) return iso
  return d.format('h:mm A')
}

export function formatRelative(iso: string): string {
  const d = dayjs(iso)
  if (!d.isValid()) return formatHumanDateTime(iso)
  return d.fromNow()
}

/** Presence / read timestamps — never show raw ISO in the UI. */
export function formatLastSeen(iso: string): string {
  const d = dayjs(iso)
  if (!d.isValid()) return formatHumanDateTime(iso)

  const now = dayjs()
  if (d.isSame(now, 'day')) return `today at ${d.format('h:mm A')}`
  if (d.isSame(now.subtract(1, 'day'), 'day')) return `yesterday at ${d.format('h:mm A')}`
  if (now.diff(d, 'day') < 7) return d.fromNow()
  return formatHumanDateTime(iso)
}

export function formatReadAt(iso: string): string {
  return formatHumanDateTime(iso)
}

export function isSameDay(a: string, b: string): boolean {
  return dayjs(a).isSame(dayjs(b), 'day')
}

export function formatDaySeparator(iso: string): string {
  const d = dayjs(iso)
  if (d.isSame(dayjs(), 'day')) return 'Today'
  if (d.isSame(dayjs().subtract(1, 'day'), 'day')) return 'Yesterday'
  return d.format('MMMM D, YYYY')
}

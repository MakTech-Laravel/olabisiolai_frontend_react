import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

export { formatNaira, formatMoney, formatNairaRange, CURRENCY_CODE, CURRENCY_SYMBOL } from '@/lib/currency'

export function formatMessageTime(iso: string): string {
  return dayjs(iso).format('h:mm A')
}

export function formatRelative(iso: string): string {
  return dayjs(iso).fromNow()
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

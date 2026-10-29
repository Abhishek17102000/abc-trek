// Dates are plain 'YYYY-MM-DD' strings in the device's local time.
const p2 = (n: number) => String(n).padStart(2, '0')

export const toStr = (y: number, m: number, d: number) => `${y}-${p2(m)}-${p2(d)}`

export function todayLocal(now = new Date()): string {
  return toStr(now.getFullYear(), now.getMonth() + 1, now.getDate())
}

const ms = (date: string) => {
  const [y, m, d] = date.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

export function addDays(date: string, n: number): string {
  const dt = new Date(ms(date) + n * 86400000)
  return toStr(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate())
}

/** b - a in whole days. */
export const diffDays = (a: string, b: string): number => Math.round((ms(b) - ms(a)) / 86400000)

export const isDate = (s: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(ms(s))

export function fmt(date: string, o: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }): string {
  return new Date(ms(date)).toLocaleDateString('en-GB', { ...o, timeZone: 'UTC' })
}

export const hourNow = (now = new Date()) => now.getHours()

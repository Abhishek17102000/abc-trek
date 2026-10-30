import type { Analysis } from './plan'
import { addDays, diffDays } from './dates'
import { PLACES } from '../data/trek'

export interface ReminderPrefs {
  enabled: boolean
  /** HH:MM */
  morning: string
  evening: string
}

export const DEFAULT_REMINDERS: ReminderPrefs = { enabled: false, morning: '07:00', evening: '18:30' }

export interface PlannedReminder {
  id: string
  title: string
  body: string
  /** Local calendar date and minutes after midnight. */
  date: string
  minutes: number
}

const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

export const hasEvening = (c?: { evening?: unknown }) => !!c?.evening
export const hasMorning = (c?: { morning?: unknown }) => !!c?.morning

/**
 * Reminders to hand to the phone's alarm scheduler. The phone fires them even when the app is closed, so they are
 * rebuilt every time the app opens or a check-in is saved (answered ones disappear).
 */
export function planReminders(
  plan: Analysis,
  checkins: Record<string, { morning?: unknown; evening?: unknown }>,
  prefs: ReminderPrefs,
  today: string,
  horizonDays = 14,
): PlannedReminder[] {
  if (!prefs.enabled) return []
  const out: PlannedReminder[] = []
  const first = plan.days[0]?.date
  const last = addDays(today, horizonDays)
  const morning = toMin(prefs.morning)
  const evening = toMin(prefs.evening)

  // before the trip: one nudge a day with a countdown
  if (first && today < first) {
    for (let d = today; d < first && d <= last; d = addDays(d, 1)) {
      const left = diffDays(d, first)
      out.push({ id: `prep:${d}`, date: d, minutes: Math.max(morning, 9 * 60), title: `${left} day${left === 1 ? '' : 's'} to Annapurna 🏔️`, body: left <= 1 ? 'Final check: passport, insurance, cash, charged power bank.' : 'Open the Prepare tab and tick off what is due today.' })
    }
  }

  for (const day of plan.days) {
    if (day.date < today || day.date > last) continue
    if (day.kind !== 'trek' && day.kind !== 'rest') continue
    const c = checkins[day.date]
    const where = day.night && PLACES[day.night] ? ` (${PLACES[day.night].name}, ${PLACES[day.night].alt.toLocaleString()} m)` : ''
    if (!hasMorning(c)) {
      out.push({ id: `am:${day.date}`, date: day.date, minutes: morning, title: 'Morning health check ⛰️', body: `Do the altitude self-check before you set off. Today: ${day.title.replace(/^Day \d+: /, '')}${where}.` })
    }
    if (!hasEvening(c)) {
      out.push({ id: `pm:${day.date}`, date: day.date, minutes: evening, title: 'Evening check-in 🌙', body: 'Log where you slept, water and spending. It updates tomorrow\'s plan.' })
    }
  }
  return out.sort((a, b) => (a.date + String(a.minutes).padStart(4, '0') < b.date + String(b.minutes).padStart(4, '0') ? -1 : 1))
}

/** Stable positive 31-bit id for Android notification ids. */
export function notificationId(key: string): number {
  let h = 2166136261
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return (h >>> 0) & 0x7fffffff
}

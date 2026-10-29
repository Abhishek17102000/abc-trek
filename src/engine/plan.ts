import { PLACES, VARIANTS, type Stage, type Tier, type VariantId } from '../data/trek'
import { addDays, diffDays } from './dates'

export interface Trip {
  arriveKtm: string
  returnDate: string
  /** HH:MM of the flight home, '' if unknown. */
  returnTime: string
  trekStart: string
  variant: VariantId
  tier: Tier
  toPokhara: 'bus' | 'flight'
  /** Extra rest days taken after finishing a stage (stage id → days). */
  restDays: Record<string, number>
  guide: boolean
}

/** Stage id → date you actually reached that night's stop. Drives automatic re-planning. */
export type Progress = Record<string, string>

export type DayKind = 'arrive' | 'travel' | 'prep' | 'trek' | 'rest' | 'buffer' | 'return'

export interface PlanDay {
  date: string
  kind: DayKind
  title: string
  note: string
  stage?: Stage
  stageIdx?: number
  /** Where you sleep that night. */
  night?: string
  done: boolean
}

export interface SleepWarning {
  date: string
  from: string
  to: string
  gain: number
}

export type BufferStatus = 'comfortable' | 'tight' | 'conflict'

export interface Analysis {
  days: PlanDay[]
  lastTrekDate: string
  /** Spare days between getting back to Pokhara and the flight home. */
  bufferDays: number
  status: BufferStatus
  trekDays: number
  sleepWarnings: SleepWarning[]
}

export const DEFAULT_TRIP: Trip = {
  arriveKtm: '2026-11-02',
  returnDate: '2026-11-10',
  returnTime: '',
  trekStart: '2026-11-04',
  variant: 'direct',
  tier: 'comfort',
  toPokhara: 'bus',
  restDays: {},
  guide: false,
}

const alt = (id: string) => PLACES[id]?.alt ?? 0

export function buildPlan(trip: Trip, progress: Progress = {}, today?: string): Analysis {
  const days: PlanDay[] = []
  const isDone = (date: string) => !!today && date < today
  const push = (d: Omit<PlanDay, 'done'>) => days.push({ ...d, done: isDone(d.date) })

  const gap = diffDays(trip.arriveKtm, trip.trekStart)
  if (gap <= 1) {
    push({
      date: trip.arriveKtm,
      kind: 'arrive',
      title: 'Arrive Kathmandu → Pokhara',
      note: 'Tight: you must catch a domestic flight to Pokhara the same afternoon. Permits are normally bought in Pokhara the day before the trek.',
      night: 'pkr',
    })
  } else {
    push({ date: trip.arriveKtm, kind: 'arrive', title: 'Arrive Kathmandu', note: 'Land, get a SIM and cash, settle in at Thamel and sleep early.', night: 'ktm' })
    push({
      date: addDays(trip.arriveKtm, 1),
      kind: 'travel',
      title: `Kathmandu → Pokhara (${trip.toPokhara === 'bus' ? 'tourist bus ~7 h' : 'flight ~30 min'})`,
      note: 'Buy ACAP (and check on TIMS) at the Pokhara counter, rent any gear, and withdraw trail cash.',
      night: 'pkr',
    })
    for (let d = addDays(trip.arriveKtm, 2); d < trip.trekStart; d = addDays(d, 1)) {
      push({ date: d, kind: 'prep', title: 'Pokhara: prep day', note: 'Permits, gear, groceries, rest.', night: 'pkr' })
    }
  }

  const stages = VARIANTS[trip.variant].stages
  let cursor = trip.trekStart
  let lastTrek = trip.trekStart
  let prevNight = 'pkr'
  const sleepWarnings: SleepWarning[] = []
  stages.forEach((stage, idx) => {
    const date = progress[stage.id] ?? cursor
    push({ date, kind: 'trek', title: `Day ${idx + 1}: ${stage.title}`, note: stage.note, stage, stageIdx: idx, night: stage.to })
    const gain = alt(stage.to) - alt(prevNight)
    if (alt(stage.to) > 3000 && gain > 500) sleepWarnings.push({ date, from: PLACES[prevNight].name, to: PLACES[stage.to].name, gain })
    prevNight = stage.to
    let last = date
    const rest = idx < stages.length - 1 ? (trip.restDays[stage.id] ?? 0) : 0
    for (let r = 0; r < rest; r++) {
      last = addDays(last, 1)
      push({ date: last, kind: 'rest', title: `Rest day at ${PLACES[stage.to].name}`, note: 'Acclimatise: sleep at the same altitude, short easy walk, drink plenty.', night: stage.to })
    }
    cursor = addDays(last, 1)
    lastTrek = last
  })
  // the final stage ends in Pokhara, so trailing rest days (if any) are not applicable
  const lastTrekDate = days.filter((d) => d.kind === 'trek').slice(-1)[0]?.date ?? lastTrek

  const bufferDays = diffDays(lastTrekDate, trip.returnDate) - 1
  for (let d = addDays(lastTrekDate, 1); d < trip.returnDate; d = addDays(d, 1)) {
    push({ date: d, kind: 'buffer', title: 'Spare day in Pokhara', note: 'Your safety margin for delays (weather, landslides, a rest day on the trail) or just recovery and lakeside coffee.', night: 'pkr' })
  }
  push({
    date: trip.returnDate,
    kind: 'return',
    title: 'Pokhara → Kathmandu → home',
    note: trip.returnTime ? `Flight home at ${trip.returnTime}.` : 'Add your flight time in Settings so I can check the connection.',
  })

  days.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
  const status: BufferStatus = bufferDays >= 1 ? 'comfortable' : bufferDays === 0 ? 'tight' : 'conflict'
  return { days, lastTrekDate, bufferDays, status, trekDays: stages.length + Object.values(trip.restDays).reduce((a, b) => a + b, 0), sleepWarnings }
}

export const dayFor = (a: Analysis, date: string) => a.days.find((d) => d.date === date)

export type Phase = 'before' | 'during' | 'after'
export function phaseOf(a: Analysis, today: string): Phase {
  const first = a.days[0]?.date
  const last = a.days[a.days.length - 1]?.date
  if (!first || today < first) return 'before'
  if (last && today > last) return 'after'
  return 'during'
}

/** What does adding a rest day (or switching variant) do to the buffer? Pure what-if. */
export function whatIf(trip: Trip, progress: Progress, change: Partial<Trip>): Analysis {
  return buildPlan({ ...trip, ...change }, progress)
}

export const bufferMessage = (a: Analysis): { tone: 'good' | 'warn' | 'bad'; text: string } => {
  if (a.status === 'comfortable') return { tone: 'good', text: `${a.bufferDays} spare day${a.bufferDays > 1 ? 's' : ''} before your flight. A comfortable margin.` }
  if (a.status === 'tight') {
    return { tone: 'warn', text: 'Zero spare days: you reach Pokhara the day before your flight home. Any delay (weather, landslide, a rest day for altitude) puts the flight at risk. Consider moving the flight later.' }
  }
  return { tone: 'bad', text: `The trek ends ${-a.bufferDays} day${a.bufferDays === -1 ? '' : 's'} after your flight home. Move the return flight, start earlier, or choose the direct route.` }
}

/** The trip as it would be if you stayed an extra day where you slept last night (null if today is not a trek day). */
export function withRestHere(trip: Trip, plan: Analysis, today: string): Trip | null {
  const day = plan.days.find((d) => d.date === today)
  if (day?.kind !== 'trek' || day.stageIdx === undefined) return null
  if (day.stageIdx === 0) return { ...trip, trekStart: addDays(trip.trekStart, 1) }
  const prev = VARIANTS[trip.variant].stages[day.stageIdx - 1].id
  return { ...trip, restDays: { ...trip.restDays, [prev]: (trip.restDays[prev] ?? 0) + 1 } }
}

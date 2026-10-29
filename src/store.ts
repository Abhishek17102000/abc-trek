import { useSyncExternalStore } from 'react'
import { DEFAULT_TRIP, type Progress, type Trip } from './engine/plan'
import type { Expense } from './engine/budget'
import type { RedFlags, Symptoms } from './engine/ams'
import type { Wx } from './engine/weather'

export interface MorningLog {
  at: number
  sleep: 1 | 2 | 3 | 4 | 5
  symptoms: Symptoms
  flags: RedFlags
  spo2?: number
  pulse?: number
  note: string
}

export interface EveningLog {
  at: number
  place: string
  water: number
  mood: 1 | 2 | 3 | 4 | 5
  weather: string
  note: string
}

export interface EmergencyCard {
  name: string
  bloodGroup: string
  allergies: string
  medicines: string
  contact1: string
  contact1Phone: string
  contact2: string
  contact2Phone: string
  insurer: string
  policy: string
  helpline: string
  hotelPokhara: string
}

export interface State {
  v: 1
  onboarded: boolean
  name: string
  trip: Trip
  progress: Progress
  /** Checklist items ticked (tasks done / gear packed). */
  done: Record<string, boolean>
  checkins: Record<string, { morning?: MorningLog; evening?: EveningLog }>
  expenses: Expense[]
  priceOverrides: Record<string, number>
  emergency: EmergencyCard
  notes: string
  /** Facts the user has verified on the ground. */
  verified: Record<string, boolean>
  forecast: Record<string, { fetched: number; daily: Wx[] }>
  /** Pretend it is this date, to explore later days of the trip. */
  simDate: string | null
}

export const EMPTY_EMERGENCY: EmergencyCard = {
  name: '', bloodGroup: '', allergies: '', medicines: '', contact1: '', contact1Phone: '', contact2: '', contact2Phone: '', insurer: '', policy: '', helpline: '', hotelPokhara: '',
}

export const DEFAULT_STATE: State = {
  v: 1,
  onboarded: false,
  name: '',
  trip: DEFAULT_TRIP,
  progress: {},
  done: {},
  checkins: {},
  expenses: [],
  priceOverrides: {},
  emergency: EMPTY_EMERGENCY,
  notes: '',
  verified: {},
  forecast: {},
  simDate: null,
}

const KEY = 'abctrek.v1'

/** Merges saved data over defaults so new fields never crash an old save. */
export function hydrate(raw: unknown): State {
  if (!raw || typeof raw !== 'object') return DEFAULT_STATE
  const r = raw as Partial<State>
  return {
    ...DEFAULT_STATE,
    ...r,
    v: 1,
    trip: { ...DEFAULT_TRIP, ...(r.trip ?? {}), restDays: { ...(r.trip?.restDays ?? {}) } },
    emergency: { ...EMPTY_EMERGENCY, ...(r.emergency ?? {}) },
    progress: r.progress ?? {},
    done: r.done ?? {},
    checkins: r.checkins ?? {},
    expenses: Array.isArray(r.expenses) ? r.expenses : [],
    priceOverrides: r.priceOverrides ?? {},
    verified: r.verified ?? {},
    forecast: r.forecast ?? {},
  }
}

function load(): State {
  try {
    const s = localStorage.getItem(KEY)
    return s ? hydrate(JSON.parse(s)) : DEFAULT_STATE
  } catch {
    return DEFAULT_STATE
  }
}

let state: State = load()
const listeners = new Set<() => void>()

export const getState = () => state

export function setState(update: (s: State) => State | Partial<State>): void {
  const next = update(state)
  state = { ...state, ...next }
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* storage full or blocked: keep working in memory */
  }
  listeners.forEach((l) => l())
}

export function replaceState(next: unknown): void {
  state = hydrate(next)
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l())
}

export function resetState(): void {
  replaceState(DEFAULT_STATE)
}

export function useStore<T>(select: (s: State) => T): T {
  return select(useSyncExternalStore((cb) => (listeners.add(cb), () => void listeners.delete(cb)), getState, getState))
}

export const useAll = () => useStore((s) => s)

export const uid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

// ───────── Backup ─────────
export function exportJson(): string {
  return JSON.stringify({ app: 'abc-trek', exportedAt: new Date().toISOString(), state }, null, 2)
}

export function importJson(text: string): boolean {
  try {
    const parsed = JSON.parse(text)
    if (parsed?.app !== 'abc-trek' || typeof parsed.state !== 'object') return false
    replaceState(parsed.state)
    return true
  } catch {
    return false
  }
}

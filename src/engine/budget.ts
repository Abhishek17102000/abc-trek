import { ACAP_NPR, FLIGHT_ONE_WAY_NPR, GUIDE_PER_DAY_NPR, NPR_PER_INR, PRICES, TIMS_NPR } from '../data/lists'
import { PLACES } from '../data/trek'
import type { Analysis, Trip } from './plan'

export type Currency = 'INR' | 'NPR'
export type ExpCat = 'transport' | 'stay' | 'food' | 'permits' | 'gear' | 'misc'
export const EXP_CATS: { id: ExpCat; label: string }[] = [
  { id: 'transport', label: 'Transport' },
  { id: 'stay', label: 'Stay' },
  { id: 'food', label: 'Food & drink' },
  { id: 'permits', label: 'Permits & fees' },
  { id: 'gear', label: 'Gear & rental' },
  { id: 'misc', label: 'Other' },
]

export interface Expense {
  id: string
  date: string
  amount: number
  cur: Currency
  cat: ExpCat
  note: string
}

export const toNpr = (amount: number, cur: Currency) => (cur === 'NPR' ? amount : amount * NPR_PER_INR)
export const toInr = (npr: number) => npr / NPR_PER_INR
export const fmtNpr = (n: number) => `NPR ${Math.round(n).toLocaleString('en-IN')}`
export const fmtInr = (n: number) => `₹${Math.round(n).toLocaleString('en-IN')}`

export interface EstLine {
  id: string
  label: string
  cat: ExpCat
  qty: number
  unit: number
  note?: string
  /** True if the user changed the unit price. */
  custom?: boolean
}

/** Price multiplier: everything costs more as you climb. */
const altMult = (alt: number) => (alt < 2500 ? 0.85 : alt <= 3300 ? 1 : 1.35)

export function estimate(trip: Trip, plan: Analysis, overrides: Record<string, number> = {}): EstLine[] {
  const p = PRICES[trip.tier]
  const ktmNights = plan.days.filter((d) => d.night === 'ktm').length
  const pkrNights = plan.days.filter((d) => d.night === 'pkr').length
  const trailDays = plan.days.filter((d) => (d.kind === 'trek' || d.kind === 'rest') && d.night && d.night !== 'pkr')
  const trailEquiv = trailDays.reduce((a, d) => a + altMult(PLACES[d.night!]?.alt ?? 2500), 0)
  const cityFoodDays = ktmNights + pkrNights + 1
  const kp = trip.toPokhara === 'bus' ? p.busOneWay : FLIGHT_ONE_WAY_NPR

  const base: EstLine[] = [
    { id: 'to_pkr', label: `Kathmandu → Pokhara (${trip.toPokhara})`, cat: 'transport', qty: 1, unit: kp },
    { id: 'from_pkr', label: `Pokhara → Kathmandu (${trip.toPokhara})`, cat: 'transport', qty: 1, unit: kp },
    { id: 'jeep', label: 'Jeep to/from trailhead (Pokhara ⇄ Jhinu Danda)', cat: 'transport', qty: 1, unit: p.jeepReturn, note: 'Shared jeep each way; private costs more.' },
    { id: 'local', label: 'Local taxis & airport transfers', cat: 'transport', qty: 1, unit: p.localTransport },
    { id: 'ktm_nights', label: 'Kathmandu hotel nights', cat: 'stay', qty: ktmNights, unit: p.cityNight.ktm },
    { id: 'pkr_nights', label: 'Pokhara hotel nights', cat: 'stay', qty: pkrNights, unit: p.cityNight.pkr },
    { id: 'trail', label: 'Trail days: lodge + meals + charging (altitude-weighted)', cat: 'food', qty: Math.round(trailEquiv * 10) / 10, unit: p.trailPerDay, note: 'Prices climb with altitude: ABC is the most expensive stop.' },
    { id: 'city_food', label: 'Food in Kathmandu / Pokhara', cat: 'food', qty: cityFoodDays, unit: p.cityFoodPerDay },
    { id: 'acap', label: 'ACAP permit (SAARC rate)', cat: 'permits', qty: 1, unit: ACAP_NPR, note: 'Confirm the rate at the counter.' },
    { id: 'tims', label: 'TIMS card (may not be required: ask)', cat: 'permits', qty: 1, unit: TIMS_NPR },
    { id: 'gear', label: 'Gear rental / last-minute purchases', cat: 'gear', qty: 1, unit: p.gear },
    { id: 'sim', label: 'SIM / data', cat: 'misc', qty: 1, unit: 1200 },
    { id: 'tips', label: 'Hot springs, tips & small extras', cat: 'misc', qty: 1, unit: 2000 },
  ]
  if (trip.guide) {
    base.push({ id: 'guide', label: 'Guide (per day, optional)', cat: 'misc', qty: trailDays.length || 1, unit: GUIDE_PER_DAY_NPR })
  }
  const lines = base.map((l) => (overrides[l.id] !== undefined ? { ...l, unit: overrides[l.id], custom: true } : l))
  const sub = lines.reduce((a, l) => a + l.qty * l.unit, 0)
  lines.push({ id: 'buffer', label: 'Contingency (10%)', cat: 'misc', qty: 1, unit: Math.round(sub * 0.1) })
  return lines
}

export const totalOf = (lines: EstLine[]) => lines.reduce((a, l) => a + l.qty * l.unit, 0)

export interface Summary {
  estimateNpr: number
  spentNpr: number
  byCat: Record<ExpCat, number>
  remainingNpr: number
  /** Average spend per day so far (days with any expense). */
  perDayNpr: number
}

export function summarize(lines: EstLine[], expenses: Expense[]): Summary {
  const byCat: Record<ExpCat, number> = { transport: 0, stay: 0, food: 0, permits: 0, gear: 0, misc: 0 }
  let spent = 0
  for (const e of expenses) {
    const n = toNpr(e.amount, e.cur)
    byCat[e.cat] += n
    spent += n
  }
  const est = totalOf(lines)
  const days = new Set(expenses.map((e) => e.date)).size
  return { estimateNpr: est, spentNpr: spent, byCat, remainingNpr: est - spent, perDayNpr: days ? spent / days : 0 }
}

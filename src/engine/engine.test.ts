import { describe, expect, it } from 'vitest'
import { addDays, diffDays, todayLocal } from './dates'
import { buildPlan, bufferMessage, DEFAULT_TRIP, phaseOf, whatIf } from './plan'
import { assess, NO_FLAGS } from './ams'
import { estimate, fmtInr, summarize, toInr, toNpr, totalOf, type Expense } from './budget'
import { ITEMS } from '../data/lists'
import { PLACES, VARIANTS } from '../data/trek'

describe('dates', () => {
  it('arithmetic & local today', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01')
    expect(diffDays('2026-11-02', '2026-11-10')).toBe(8)
    expect(todayLocal(new Date(2026, 10, 2, 23, 59))).toBe('2026-11-02')
  })
})

describe('plan: your dates (arrive 2 Nov, trek from 4 Nov, fly home 10 Nov)', () => {
  const a = buildPlan(DEFAULT_TRIP)
  it('lays out arrival, transfer, 6 trek days, then the flight home', () => {
    expect(a.days.map((d) => `${d.date}:${d.kind}`)).toEqual([
      '2026-11-02:arrive',
      '2026-11-03:travel',
      '2026-11-04:trek',
      '2026-11-05:trek',
      '2026-11-06:trek',
      '2026-11-07:trek',
      '2026-11-08:trek',
      '2026-11-09:trek',
      '2026-11-10:return',
    ])
    expect(a.lastTrekDate).toBe('2026-11-09')
  })
  it('flags zero buffer as tight', () => {
    expect(a.bufferDays).toBe(0)
    expect(a.status).toBe('tight')
    expect(bufferMessage(a).tone).toBe('warn')
  })
  it('the safer 7-day variant does not fit without moving the flight', () => {
    const s = whatIf(DEFAULT_TRIP, {}, { variant: 'safer' })
    expect(s.lastTrekDate).toBe('2026-11-10')
    expect(s.status).toBe('conflict')
    expect(whatIf(DEFAULT_TRIP, {}, { variant: 'safer', returnDate: '2026-11-12' }).status).toBe('comfortable')
  })
  it('an acclimatisation rest day shifts everything after it', () => {
    const r = buildPlan({ ...DEFAULT_TRIP, restDays: { deurali: 1 } })
    expect(r.days.find((d) => d.kind === 'rest')?.date).toBe('2026-11-07')
    expect(r.lastTrekDate).toBe('2026-11-10')
    expect(r.status).toBe('conflict')
  })
  it('actual progress re-plans the remaining days (one day behind)', () => {
    const r = buildPlan(DEFAULT_TRIP, { chhomrong: '2026-11-05' })
    const trek = r.days.filter((d) => d.kind === 'trek')
    expect(trek.map((d) => d.date)).toEqual(['2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08', '2026-11-09', '2026-11-10'])
  })
  it('later flight date creates spare days', () => {
    const r = buildPlan({ ...DEFAULT_TRIP, returnDate: '2026-11-12' })
    expect(r.bufferDays).toBe(2)
    expect(r.days.filter((d) => d.kind === 'buffer').map((d) => d.date)).toEqual(['2026-11-10', '2026-11-11'])
  })
  it('warns where sleeping altitude jumps more than 500 m above 3,000 m', () => {
    expect(a.sleepWarnings.map((x) => `${x.to}+${x.gain}`)).toEqual(['Deurali+630', 'Annapurna Base Camp (ABC)+900'])
    expect(buildPlan({ ...DEFAULT_TRIP, variant: 'safer' }).sleepWarnings.map((x) => x.to)).toEqual(['Deurali'])
  })
  it('works out which phase of the trip you are in', () => {
    expect(phaseOf(a, '2026-10-29')).toBe('before')
    expect(phaseOf(a, '2026-11-05')).toBe('during')
    expect(phaseOf(a, '2026-11-11')).toBe('after')
  })
  it('a start the day after arrival means flying to Pokhara on arrival day', () => {
    const t = buildPlan({ ...DEFAULT_TRIP, trekStart: '2026-11-03' })
    expect(t.days[0].title).toContain('Pokhara')
    expect(t.days.filter((d) => d.kind === 'trek')).toHaveLength(6)
  })
  it('an extra prep day in Pokhara is inserted when the trek starts later', () => {
    const t = buildPlan({ ...DEFAULT_TRIP, trekStart: '2026-11-05', returnDate: '2026-11-12' })
    expect(t.days.filter((d) => d.kind === 'prep')).toHaveLength(1)
  })
  it('data sanity: stages chain together and end in Pokhara', () => {
    for (const v of Object.values(VARIANTS)) {
      let at = 'pkr'
      for (const s of v.stages) {
        expect(s.from).toBe(at)
        expect(PLACES[s.to]).toBeDefined()
        at = s.to
      }
      expect(at).toBe('pkr')
    }
  })
})

describe('AMS assessment (Lake Louise)', () => {
  type S = 0 | 1 | 2 | 3
  const s = (headache: S, gi: S, fatigue: S, dizziness: S) => ({ headache, gi, fatigue, dizziness })
  it('no symptoms → continue', () => {
    const r = assess(s(0, 0, 0, 0))
    expect(r.level).toBe('none')
    expect(r.allowAscend).toBe(true)
  })
  it('score below 3 is not AMS', () => {
    expect(assess(s(1, 1, 0, 0)).level).toBe('none')
  })
  it('score ≥3 including headache = mild AMS: no ascent, rest', () => {
    const r = assess(s(1, 1, 1, 0))
    expect(r.level).toBe('mild')
    expect(r.allowAscend).toBe(false)
    expect(r.suggestRest).toBe(true)
  })
  it('high score without headache is not counted as AMS', () => {
    expect(assess(s(0, 2, 2, 2)).level).toBe('none')
  })
  it('score 6-9 = moderate: must descend', () => {
    const r = assess(s(2, 2, 1, 1))
    expect(r.level).toBe('moderate')
    expect(r.mustDescend).toBe(true)
  })
  it('score ≥10 or any red flag = emergency', () => {
    expect(assess(s(3, 3, 2, 2)).level).toBe('emergency')
    expect(assess(s(0, 0, 0, 0), { ...NO_FLAGS, ataxia: true }).level).toBe('emergency')
    expect(assess(s(0, 0, 0, 0), { ...NO_FLAGS, wetCough: true }).level).toBe('emergency')
  })
  it('a very low SpO2 at altitude adds a warning even with no symptoms', () => {
    expect(assess(s(0, 0, 0, 0), NO_FLAGS, 70, 4000).actions.join(' ')).toMatch(/SpO/)
    expect(assess(s(0, 0, 0, 0), NO_FLAGS, 85, 4000).actions.join(' ')).not.toMatch(/SpO/)
  })
})

describe('budget', () => {
  const plan = buildPlan(DEFAULT_TRIP)
  it('currency uses the fixed 1 INR = 1.6 NPR peg', () => {
    expect(toNpr(100, 'INR')).toBe(160)
    expect(toNpr(100, 'NPR')).toBe(100)
    expect(toInr(160)).toBe(100)
    expect(fmtInr(1234.4)).toBe('₹1,234')
  })
  it('estimate scales with tier and ends with a contingency line', () => {
    const b = totalOf(estimate({ ...DEFAULT_TRIP, tier: 'budget' }, plan))
    const l = totalOf(estimate({ ...DEFAULT_TRIP, tier: 'luxury' }, plan))
    expect(l).toBeGreaterThan(b * 2)
    expect(estimate(DEFAULT_TRIP, plan).at(-1)?.id).toBe('buffer')
  })
  it('counts nights from the plan: 1 Kathmandu, 2 Pokhara (before the trek and after it)', () => {
    const lines = estimate(DEFAULT_TRIP, plan)
    expect(lines.find((x) => x.id === 'ktm_nights')?.qty).toBe(1)
    expect(lines.find((x) => x.id === 'pkr_nights')?.qty).toBe(2)
  })
  it('weights trail days by altitude (higher = more expensive)', () => {
    const eq = estimate(DEFAULT_TRIP, plan).find((x) => x.id === 'trail')!.qty
    expect(eq).toBeGreaterThan(5)
    expect(eq).toBeLessThan(8)
  })
  it('overrides replace a unit price; guide adds a line', () => {
    const lines = estimate({ ...DEFAULT_TRIP, guide: true }, plan, { jeep: 9999 })
    expect(lines.find((x) => x.id === 'jeep')).toMatchObject({ unit: 9999, custom: true })
    expect(lines.some((x) => x.id === 'guide')).toBe(true)
  })
  it('summarises spend by category in NPR', () => {
    const lines = estimate(DEFAULT_TRIP, plan)
    const ex: Expense[] = [
      { id: '1', date: '2026-11-02', amount: 160, cur: 'INR', cat: 'food', note: '' },
      { id: '2', date: '2026-11-02', amount: 500, cur: 'NPR', cat: 'transport', note: '' },
      { id: '3', date: '2026-11-03', amount: 100, cur: 'NPR', cat: 'food', note: '' },
    ]
    const sm = summarize(lines, ex)
    expect(sm.byCat.food).toBe(356)
    expect(sm.spentNpr).toBe(856)
    expect(sm.perDayNpr).toBe(428)
    expect(sm.remainingNpr).toBe(totalOf(lines) - 856)
  })
})

describe('checklist data', () => {
  it('ids are unique and weights are sane', () => {
    const ids = ITEMS.map((i) => i.id)
    expect(new Set(ids).size).toBe(ids.length)
    const grams = ITEMS.reduce((a, i) => a + (i.grams ?? 0), 0)
    expect(grams).toBeGreaterThan(5000)
    expect(grams).toBeLessThan(12000)
  })
})
